import tar from "tar-stream";
import zlib from "zlib";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { sanitizeAndValidatePath, validatePathDepth, checkZipBombLimits, ExtractionState, SecurityGuardError } from "./guards";
import { uploadToStorage } from "../storage/blob-service";
import { saveExtractedFiles } from "../db/repository";
import { ExtractionProgressUpdate } from "../types/job";

export interface TarExtractOptions {
  jobId: string;
  archivePath: string; // local temp file path
  archiveSize: number;
  isGzip?: boolean;
  onProgress?: (progress: ExtractionProgressUpdate) => Promise<void> | void;
}

export interface TarExtractResult {
  totalFiles: number;
  totalExtractedBytes: number;
}

export function extractTarArchive(options: TarExtractOptions): Promise<TarExtractResult> {
  return new Promise((resolve, reject) => {
    const { jobId, archivePath, archiveSize, isGzip, onProgress } = options;

    const state: ExtractionState = {
      totalFiles: 0,
      totalExtractedBytes: 0,
      archiveSizeBytes: archiveSize,
    };

    const extractedBatch: Array<{
      path: string;
      fileName: string;
      size: number;
      mimeType: string;
      blobUrl: string;
      isDirectory: boolean;
    }> = [];

    const extract = tar.extract();

    let fileStream: Readable = fs.createReadStream(archivePath);
    if (isGzip) {
      const gunzip = zlib.createGunzip();
      gunzip.on("error", (err) => reject(new Error(`Gzip decompression error: ${err.message}`)));
      fileStream = fileStream.pipe(gunzip);
    }

    extract.on("entry", async (header, stream, next) => {
      try {
        // Block dangerous symlinks and hardlinks
        if (header.type === "symlink" || header.type === "link") {
          console.warn(`[TarExtractor] Skipped unsafe link entry: ${header.name} -> ${header.linkname}`);
          stream.resume();
          return next();
        }

        const safePath = sanitizeAndValidatePath(header.name);
        validatePathDepth(safePath);

        const isDir = header.type === "directory" || safePath.endsWith("/");
        const fileName = path.posix.basename(safePath) || safePath;

        if (isDir) {
          extractedBatch.push({
            path: safePath,
            fileName,
            size: 0,
            mimeType: "inode/directory",
            blobUrl: "",
            isDirectory: true,
          });
          stream.resume();
          return next();
        }

        // Validate Zip-bomb constraints
        checkZipBombLimits(state, header.size || 0);

        const ext = path.extname(safePath).toLowerCase().replace(".", "");
        const contentType = getMimeTypeFromExt(ext);
        const storagePath = `extracted/${jobId}/${safePath}`;

        const uploadResult = await uploadToStorage(storagePath, stream as unknown as Readable, contentType);

        state.totalFiles += 1;
        state.totalExtractedBytes += header.size || 0;

        extractedBatch.push({
          path: safePath,
          fileName,
          size: header.size || 0,
          mimeType: contentType,
          blobUrl: uploadResult.url,
          isDirectory: false,
        });

        // Batch save
        if (extractedBatch.length >= 25) {
          await saveExtractedFiles(jobId, [...extractedBatch]);
          extractedBatch.length = 0;
        }

        if (onProgress) {
          await onProgress({
            processedFiles: state.totalFiles,
            totalSize: state.totalExtractedBytes,
            currentFile: safePath,
          });
        }

        next();
      } catch (err) {
        stream.resume();
        reject(err);
      }
    });

    extract.on("finish", async () => {
      try {
        if (extractedBatch.length > 0) {
          await saveExtractedFiles(jobId, extractedBatch);
        }
        resolve({
          totalFiles: state.totalFiles,
          totalExtractedBytes: state.totalExtractedBytes,
        });
      } catch (saveErr) {
        reject(saveErr);
      }
    });

    extract.on("error", (err) => {
      reject(err);
    });

    fileStream.pipe(extract);
  });
}

function getMimeTypeFromExt(ext: string): string {
  const map: Record<string, string> = {
    txt: "text/plain",
    html: "text/html",
    css: "text/css",
    js: "application/javascript",
    json: "application/json",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    webp: "image/webp",
    pdf: "application/pdf",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    mp4: "video/mp4",
    webm: "video/webm",
    md: "text/markdown",
    ts: "text/typescript",
    tsx: "text/typescript",
    jsx: "text/javascript",
  };
  return map[ext] || "application/octet-stream";
}
