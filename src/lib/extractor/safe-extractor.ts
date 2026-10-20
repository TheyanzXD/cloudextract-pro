import fs from "fs";
import path from "path";
import os from "os";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import { extractZipArchive } from "./zip-extractor";
import { extractTarArchive } from "./tar-extractor";
import { updateJob } from "../db/repository";
import { ExtractionProgressUpdate } from "../types/job";

export interface SafeExtractParams {
  jobId: string;
  blobUrl: string;
  fileName: string;
  fileSize: number;
  password?: string;
  onProgress?: (progress: ExtractionProgressUpdate) => Promise<void> | void;
}

export async function processArchiveExtraction(params: SafeExtractParams) {
  const { jobId, blobUrl, fileName, fileSize, password, onProgress } = params;
  const tmpDir = os.tmpdir();
  const tmpFilePath = path.join(tmpDir, `archive-${jobId}-${Date.now()}`);

  try {
    // 1. Mark job as extracting
    await updateJob(jobId, { status: "extracting", progress: 5 });

    // 2. Fetch archive stream from Blob storage to local temp disk
    const response = await fetch(blobUrl);
    if (!response.ok || !response.body) {
      throw new Error(`Failed to fetch archive from storage: ${response.statusText}`);
    }

    // Stream download directly to /tmp to avoid buffering large files into RAM
    const fileStream = fs.createWriteStream(tmpFilePath);
    // @ts-ignore - response.body is a Web ReadableStream
    await pipeline(Readable.fromWeb(response.body), fileStream);

    const lowerName = fileName.toLowerCase();
    let result: { totalFiles: number; totalExtractedBytes: number; requiresPassword?: boolean };

    // 3. Delegate to appropriate extractor
    if (lowerName.endsWith(".zip")) {
      result = await extractZipArchive({
        jobId,
        archivePath: tmpFilePath,
        archiveSize: fileSize,
        password,
        onProgress: async (p) => {
          await updateJob(jobId, {
            progress: p.percentage || 50,
            extracted_files_count: p.processedFiles,
            extracted_total_size: p.totalSize,
          });
          if (onProgress) await onProgress(p);
        },
      });
    } else if (lowerName.endsWith(".tar.gz") || lowerName.endsWith(".tgz")) {
      result = await extractTarArchive({
        jobId,
        archivePath: tmpFilePath,
        archiveSize: fileSize,
        isGzip: true,
        onProgress: async (p) => {
          await updateJob(jobId, {
            extracted_files_count: p.processedFiles,
            extracted_total_size: p.totalSize,
          });
          if (onProgress) await onProgress(p);
        },
      });
    } else if (lowerName.endsWith(".tar")) {
      result = await extractTarArchive({
        jobId,
        archivePath: tmpFilePath,
        archiveSize: fileSize,
        isGzip: false,
        onProgress: async (p) => {
          await updateJob(jobId, {
            extracted_files_count: p.processedFiles,
            extracted_total_size: p.totalSize,
          });
          if (onProgress) await onProgress(p);
        },
      });
    } else {
      throw new Error(`Unsupported archive format: ${fileName}. Supported: .zip, .tar, .tar.gz, .tgz`);
    }

    // 4. Handle password-protected archives
    if (result.requiresPassword) {
      await updateJob(jobId, {
        status: "needs_password",
        requires_password: true,
        progress: 0,
      });
      return { success: false, requiresPassword: true };
    }

    // 5. Extraction completed successfully
    await updateJob(jobId, {
      status: "done",
      progress: 100,
      extracted_files_count: result.totalFiles,
      extracted_total_size: result.totalExtractedBytes,
    });

    return {
      success: true,
      totalFiles: result.totalFiles,
      totalExtractedBytes: result.totalExtractedBytes,
    };
  } catch (error: any) {
    console.error(`[SafeExtractor] Extraction failed for job ${jobId}:`, error);
    await updateJob(jobId, {
      status: "failed",
      error_message: error.message || "Archive extraction failed due to an unexpected error.",
    });
    throw error;
  } finally {
    // Clean up temporary disk file
    try {
      if (fs.existsSync(tmpFilePath)) {
        await fs.promises.unlink(tmpFilePath);
      }
    } catch (cleanupErr) {
      console.warn(`[SafeExtractor] Temp file cleanup warning:`, cleanupErr);
    }
  }
}
