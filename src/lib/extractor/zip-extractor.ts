import yauzl from "yauzl";
import fs from "fs";
import path from "path";
import { Readable, pipeline } from "stream";
import { promisify } from "util";
import { sanitizeAndValidatePath, validatePathDepth, checkZipBombLimits, ExtractionState, SecurityGuardError } from "./guards";
import { uploadToStorage } from "../storage/blob-service";
import { saveExtractedFiles } from "../db/repository";
import { ExtractionProgressUpdate } from "../types/job";

const streamPipeline = promisify(pipeline);

export interface ZipExtractOptions {
  jobId: string;
  archivePath: string; // local temp file path or remote stream
  archiveSize: number;
  password?: string;
  onProgress?: (progress: ExtractionProgressUpdate) => Promise<void> | void;
}

export interface ZipExtractResult {
  totalFiles: number;
  totalExtractedBytes: number;
  requiresPassword?: boolean;
}

export function extractZipArchive(options: ZipExtractOptions): Promise<ZipExtractResult> {
  return new Promise((resolve, reject) => {
    const { jobId, archivePath, archiveSize, password, onProgress } = options;

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

    yauzl.open(
      archivePath,
      { lazyEntries: true, autoClose: true },
      (err, zipfile) => {
        if (err) {
          return reject(err);
        }

        if (!zipfile) {
          return reject(new Error("Unable to open zip archive"));
        }

        const totalEntries = zipfile.entryCount;
        let processedCount = 0;

        zipfile.on("error", (zipErr) => {
          reject(zipErr);
        });

        zipfile.on("close", async () => {
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

        zipfile.readEntry();

        zipfile.on("entry", async (entry: yauzl.Entry) => {
          processedCount++;
          try {
            // Check for password protection
            if (entry.isEncrypted()) {
              if (!password) {
                zipfile.close();
                return resolve({
                  totalFiles: state.totalFiles,
                  totalExtractedBytes: state.totalExtractedBytes,
                  requiresPassword: true,
                });
              }
            }

            // 1. Sanitize path & prevent zip-slip
            const safePath = sanitizeAndValidatePath(entry.fileName);
            validatePathDepth(safePath);

            const isDir = /\/$/.test(entry.fileName);
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
              zipfile.readEntry();
              return;
            }

            // 2. Validate Zip-bomb protection
            checkZipBombLimits(state, entry.uncompressedSize);

            // 3. Open entry stream
            zipfile.openReadStream(entry, async (streamErr, readStream) => {
              if (streamErr) {
                zipfile.close();
                return reject(streamErr);
              }

              if (!readStream) {
                zipfile.readEntry();
                return;
              }

              try {
                // Determine mime-type based on extension
                const ext = path.extname(safePath).toLowerCase().replace(".", "");
                const contentType = getMimeTypeFromExt(ext);

                // Stream directly to Vercel Blob / Storage
                const storagePath = `extracted/${jobId}/${safePath}`;
                const uploadResult = await uploadToStorage(storagePath, readStream, contentType);

                state.totalFiles += 1;
                state.totalExtractedBytes += entry.uncompressedSize;

                extractedBatch.push({
                  path: safePath,
                  fileName,
                  size: entry.uncompressedSize,
                  mimeType: contentType,
                  blobUrl: uploadResult.url,
                  isDirectory: false,
                });

                // Batch flush to DB every 25 files
                if (extractedBatch.length >= 25) {
                  await saveExtractedFiles(jobId, [...extractedBatch]);
                  extractedBatch.length = 0;
                }

                // Progress reporting
                if (onProgress) {
                  const percentage = Math.min(100, Math.round((processedCount / totalEntries) * 100));
                  await onProgress({
                    processedFiles: state.totalFiles,
                    totalSize: state.totalExtractedBytes,
                    currentFile: safePath,
                    percentage,
                  });
                }

                zipfile.readEntry();
              } catch (uploadErr) {
                zipfile.close();
                reject(uploadErr);
              }
            });
          } catch (entryErr) {
            zipfile.close();
            reject(entryErr);
          }
        });
      }
    );
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
