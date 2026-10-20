import path from "path";

export interface ExtractionSafetyLimits {
  maxTotalSize: number; // in bytes (e.g. 1024 * 1024 * 1024 = 1GB)
  maxFilesCount: number; // e.g. 5000
  maxCompressionRatio: number; // e.g. 100
  maxDepth: number; // e.g. 15
}

export const DEFAULT_LIMITS: ExtractionSafetyLimits = {
  maxTotalSize: parseInt(process.env.MAX_EXTRACT_SIZE_MB || "1024", 10) * 1024 * 1024,
  maxFilesCount: parseInt(process.env.MAX_EXTRACT_FILE_COUNT || "5000", 10),
  maxCompressionRatio: parseInt(process.env.MAX_COMPRESSION_RATIO || "100", 10),
  maxDepth: parseInt(process.env.MAX_EXTRACT_DEPTH || "15", 10),
};

export class SecurityGuardError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "SecurityGuardError";
    this.code = code;
  }
}

/**
 * Validates path against Zip-Slip vulnerabilities.
 * Prevents directory traversal attacks (../, absolute paths, null bytes).
 * Returns safe normalized relative path.
 */
export function sanitizeAndValidatePath(rawPath: string): string {
  // Disallow null bytes
  if (rawPath.indexOf("\0") !== -1) {
    throw new SecurityGuardError("Malicious path detected: null byte", "ZIP_SLIP_NULL_BYTE");
  }

  // Normalize forward and back slashes
  let cleanPath = rawPath.replace(/\\/g, "/");

  // Remove leading slashes and drive letters (e.g., C:/ or /etc)
  cleanPath = cleanPath.replace(/^([a-zA-Z]:)?\/+/, "");

  // Resolve normalized path
  const normalized = path.posix.normalize(cleanPath);

  // Check if path attempts to escape root
  if (
    normalized === ".." ||
    normalized.startsWith("../") ||
    normalized.includes("/../") ||
    path.isAbsolute(normalized)
  ) {
    throw new SecurityGuardError(
      `Malicious path detected (Zip-Slip attempt): ${rawPath}`,
      "ZIP_SLIP_TRAVERSAL"
    );
  }

  return normalized;
}

/**
 * Validates directory nesting depth.
 */
export function validatePathDepth(cleanPath: string, maxDepth: number = DEFAULT_LIMITS.maxDepth): void {
  const depth = cleanPath.split("/").filter(Boolean).length;
  if (depth > maxDepth) {
    throw new SecurityGuardError(
      `Directory depth limit exceeded (${depth} > ${maxDepth})`,
      "ZIP_BOMB_MAX_DEPTH"
    );
  }
}

export interface ExtractionState {
  totalFiles: number;
  totalExtractedBytes: number;
  archiveSizeBytes: number;
}

/**
 * Validates Zip-Bomb constraints (files count, cumulative size, compression ratio).
 */
export function checkZipBombLimits(
  state: ExtractionState,
  newFileSize: number,
  limits: ExtractionSafetyLimits = DEFAULT_LIMITS
): void {
  // Check total file count
  if (state.totalFiles + 1 > limits.maxFilesCount) {
    throw new SecurityGuardError(
      `File count limit exceeded (maximum ${limits.maxFilesCount} files allowed)`,
      "ZIP_BOMB_MAX_FILES"
    );
  }

  // Check total decompressed size
  const projectedSize = state.totalExtractedBytes + newFileSize;
  if (projectedSize > limits.maxTotalSize) {
    const maxMb = (limits.maxTotalSize / (1024 * 1024)).toFixed(0);
    throw new SecurityGuardError(
      `Total uncompressed size limit exceeded (maximum ${maxMb} MB allowed)`,
      "ZIP_BOMB_MAX_SIZE"
    );
  }

  // Check compression ratio if archive size is known
  if (state.archiveSizeBytes > 0 && projectedSize > 10 * 1024 * 1024) {
    const ratio = projectedSize / state.archiveSizeBytes;
    if (ratio > limits.maxCompressionRatio) {
      throw new SecurityGuardError(
        `Abnormal compression ratio detected (${ratio.toFixed(1)}:1 exceeds limit ${limits.maxCompressionRatio}:1)`,
        "ZIP_BOMB_RATIO"
      );
    }
  }
}
