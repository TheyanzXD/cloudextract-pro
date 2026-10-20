import { upload } from "@vercel/blob/client";
import { nanoid } from "nanoid";

export type UploadItemStatus =
  | "pending"
  | "uploading"
  | "extracting"
  | "paused"
  | "completed"
  | "failed"
  | "canceled";

export interface UploadQueueItem {
  id: string;
  file: File;
  relativePath: string;
  status: UploadItemStatus;
  progress: number;
  speed: number;
  eta: number;
  jobId?: string;
  blobUrl?: string;
  errorMessage?: string;
  retryCount: number;
  controller?: AbortController;
  retentionHours: number;
}

export type QueueSubscriber = (items: UploadQueueItem[]) => void;

export class ClientUploadManager {
  private queue: UploadQueueItem[] = [];
  private activeCount = 0;
  private maxConcurrency: number;
  private subscribers: Set<QueueSubscriber> = new Set();
  private isProcessing = false;

  constructor(maxConcurrency: number = 3) {
    this.maxConcurrency = maxConcurrency;
  }

  public subscribe(cb: QueueSubscriber): () => void {
    this.subscribers.add(cb);
    cb([...this.queue]);
    return () => this.subscribers.delete(cb);
  }

  private notify() {
    const copy = [...this.queue];
    this.subscribers.forEach((cb) => cb(copy));
  }

  public addFiles(files: File[], retentionHours: number = 24) {
    const newItems: UploadQueueItem[] = files.map((file) => {
      // webkitRelativePath is populated when folder upload is selected
      const relativePath = (file as any).webkitRelativePath || file.name;
      return {
        id: nanoid(12),
        file,
        relativePath,
        status: "pending",
        progress: 0,
        speed: 0,
        eta: 0,
        retryCount: 0,
        retentionHours,
      };
    });

    this.queue = [...this.queue, ...newItems];
    this.notify();
    this.processQueue();
  }

  public pause(id: string) {
    const item = this.queue.find((i) => i.id === id);
    if (item && item.status === "uploading") {
      item.controller?.abort();
      item.status = "paused";
      this.activeCount = Math.max(0, this.activeCount - 1);
      this.notify();
      this.processQueue();
    }
  }

  public resume(id: string) {
    const item = this.queue.find((i) => i.id === id);
    if (item && item.status === "paused") {
      item.status = "pending";
      this.notify();
      this.processQueue();
    }
  }

  public cancel(id: string) {
    const item = this.queue.find((i) => i.id === id);
    if (item) {
      if (item.status === "uploading") {
        item.controller?.abort();
        this.activeCount = Math.max(0, this.activeCount - 1);
      }
      item.status = "canceled";
      this.notify();
      this.processQueue();
    }
  }

  public retry(id: string) {
    const item = this.queue.find((i) => i.id === id);
    if (item && (item.status === "failed" || item.status === "canceled")) {
      item.status = "pending";
      item.errorMessage = undefined;
      item.progress = 0;
      item.retryCount = 0;
      this.notify();
      this.processQueue();
    }
  }

  public clearCompleted() {
    this.queue = this.queue.filter((i) => i.status !== "completed" && i.status !== "canceled");
    this.notify();
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.activeCount < this.maxConcurrency) {
      const nextItem = this.queue.find((i) => i.status === "pending");
      if (!nextItem) break;

      this.activeCount++;
      nextItem.status = "uploading";
      nextItem.controller = new AbortController();
      this.notify();

      this.uploadFile(nextItem)
        .catch((err) => {
          console.error(`Upload error for ${nextItem.file.name}:`, err);
        })
        .finally(() => {
          this.activeCount = Math.max(0, this.activeCount - 1);
          this.notify();
          this.processQueue();
        });
    }

    this.isProcessing = false;
  }

  private async uploadFile(item: UploadQueueItem) {
    const isArchive = this.checkIsArchive(item.file.name);
    let lastLoaded = 0;
    let lastTime = Date.now();

    try {
      // Direct client-to-blob multipart streaming upload
      const uploadOptions: any = {
        access: "public",
        handleUploadUrl: "/api/upload/token",
        clientPayload: JSON.stringify({
          fileName: item.relativePath,
          fileSize: item.file.size,
          mimeType: item.file.type || "application/octet-stream",
          isArchive,
          retentionHours: item.retentionHours,
        }),
        abortSignal: item.controller?.signal,
        multipart: true,
        onUploadProgress: (progress: { loaded: number; total: number; percentage: number }) => {
          const now = Date.now();
          const timeDelta = (now - lastTime) / 1000;
          if (timeDelta > 0.5) {
            const bytesDelta = progress.loaded - lastLoaded;
            item.speed = Math.round(bytesDelta / timeDelta);
            const remaining = Math.max(0, progress.total - progress.loaded);
            item.eta = item.speed > 0 ? Math.round(remaining / item.speed) : 0;
            lastLoaded = progress.loaded;
            lastTime = now;
          }

          item.progress = progress.percentage;
          this.notify();
        },
      };

      const newBlob = await upload(item.relativePath, item.file, uploadOptions);

      item.blobUrl = newBlob.url;
      item.progress = 100;
      item.status = isArchive ? "extracting" : "completed";
      this.notify();

      // Save to localStorage upload history
      this.saveToLocalHistory({
        fileName: item.relativePath,
        fileSize: item.file.size,
        blobUrl: newBlob.url,
        isArchive,
        uploadedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      if (item.controller?.signal.aborted) {
        return;
      }

      if (item.retryCount < 3) {
        item.retryCount++;
        item.status = "pending";
        // Exponential backoff
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, item.retryCount)));
        return;
      }

      item.status = "failed";
      item.errorMessage = error.message || "Upload failed";
    }
  }

  private checkIsArchive(fileName: string): boolean {
    const ext = fileName.toLowerCase();
    return (
      ext.endsWith(".zip") ||
      ext.endsWith(".tar") ||
      ext.endsWith(".tar.gz") ||
      ext.endsWith(".tgz") ||
      ext.endsWith(".rar") ||
      ext.endsWith(".7z")
    );
  }

  private saveToLocalHistory(entry: any) {
    try {
      if (typeof window === "undefined") return;
      const historyKey = "cloudextract_upload_history";
      const existing = JSON.parse(localStorage.getItem(historyKey) || "[]");
      existing.unshift(entry);
      // Keep last 100
      localStorage.setItem(historyKey, JSON.stringify(existing.slice(0, 100)));
    } catch (e) {
      // Ignore storage quota error
    }
  }
}

export const globalUploadManager = new ClientUploadManager(
  parseInt(process.env.NEXT_PUBLIC_CLIENT_CONCURRENCY || "3", 10)
);
