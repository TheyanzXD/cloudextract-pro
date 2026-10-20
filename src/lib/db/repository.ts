import { pool, query } from "./index";
import { JobRecord, ExtractedFileRecord, ShareRecord, JobStatus } from "../types/job";
import { nanoid } from "nanoid";

// In-memory fallback cache for development/demo mode when PostgreSQL connection string is not provided
const fallbackJobs = new Map<string, JobRecord>();
const fallbackExtractedFiles = new Map<string, ExtractedFileRecord[]>();
const fallbackShares = new Map<string, ShareRecord>();

export async function createJob(params: {
  id?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  blobUrl: string;
  blobPathname: string;
  isArchive: boolean;
  sha256Hash?: string;
  ipAddress?: string;
  retentionHours?: number;
}): Promise<JobRecord> {
  const id = params.id || nanoid(16);
  const retentionHours = params.retentionHours || 24;
  const expiresAt = new Date(Date.now() + retentionHours * 3600 * 1000);
  const now = new Date();

  const job: JobRecord = {
    id,
    file_name: params.fileName,
    file_size: params.fileSize,
    mime_type: params.mimeType,
    blob_url: params.blobUrl,
    blob_pathname: params.blobPathname,
    status: "queued",
    progress: 0,
    error_message: null,
    is_archive: params.isArchive,
    extracted_files_count: 0,
    extracted_total_size: 0,
    sha256_hash: params.sha256Hash || null,
    ip_address: params.ipAddress || null,
    requires_password: false,
    expires_at: expiresAt,
    created_at: now,
    updated_at: now,
  };

  if (pool) {
    await query(
      `INSERT INTO jobs (
        id, file_name, file_size, mime_type, blob_url, blob_pathname,
        status, progress, is_archive, extracted_files_count, extracted_total_size,
        sha256_hash, ip_address, requires_password, expires_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        job.id,
        job.file_name,
        job.file_size,
        job.mime_type,
        job.blob_url,
        job.blob_pathname,
        job.status,
        job.progress,
        job.is_archive,
        job.extracted_files_count,
        job.extracted_total_size,
        job.sha256_hash,
        job.ip_address,
        job.requires_password,
        job.expires_at,
        job.created_at,
        job.updated_at,
      ]
    );
  } else {
    fallbackJobs.set(id, job);
  }

  return job;
}

export async function getJobById(id: string): Promise<JobRecord | null> {
  if (pool) {
    const rows = await query<JobRecord>("SELECT * FROM jobs WHERE id = $1 LIMIT 1", [id]);
    return rows[0] || null;
  }
  return fallbackJobs.get(id) || null;
}

export async function updateJob(
  id: string,
  updates: Partial<Omit<JobRecord, "id" | "created_at">>
): Promise<JobRecord | null> {
  const now = new Date();

  if (pool) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }

    fields.push(`updated_at = $${idx}`);
    values.push(now);
    idx++;

    values.push(id);
    const sql = `UPDATE jobs SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`;
    const rows = await query<JobRecord>(sql, values);
    return rows[0] || null;
  }

  const existing = fallbackJobs.get(id);
  if (!existing) return null;

  const updated: JobRecord = {
    ...existing,
    ...updates,
    updated_at: now,
  };
  fallbackJobs.set(id, updated);
  return updated;
}

export async function listJobs(options?: {
  limit?: number;
  offset?: number;
  status?: JobStatus;
  search?: string;
}): Promise<{ jobs: JobRecord[]; total: number }> {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  if (pool) {
    let whereClause = "WHERE 1=1";
    const params: any[] = [];
    let pIdx = 1;

    if (options?.status) {
      whereClause += ` AND status = $${pIdx}`;
      params.push(options.status);
      pIdx++;
    }

    if (options?.search) {
      whereClause += ` AND file_name ILIKE $${pIdx}`;
      params.push(`%${options.search}%`);
      pIdx++;
    }

    const countRows = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM jobs ${whereClause}`,
      params
    );
    const total = parseInt(countRows[0]?.count || "0", 10);

    const jobs = await query<JobRecord>(
      `SELECT * FROM jobs ${whereClause} ORDER BY created_at DESC LIMIT $${pIdx} OFFSET $${pIdx + 1}`,
      [...params, limit, offset]
    );

    return { jobs, total };
  }

  let list = Array.from(fallbackJobs.values());
  if (options?.status) {
    list = list.filter((j) => j.status === options.status);
  }
  if (options?.search) {
    const q = options.search.toLowerCase();
    list = list.filter((j) => j.file_name.toLowerCase().includes(q));
  }

  list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const total = list.length;
  const paged = list.slice(offset, offset + limit);

  return { jobs: paged, total };
}

export async function deleteJob(id: string): Promise<boolean> {
  if (pool) {
    await query("DELETE FROM jobs WHERE id = $1", [id]);
    return true;
  }
  fallbackJobs.delete(id);
  fallbackExtractedFiles.delete(id);
  return true;
}

export async function saveExtractedFiles(
  jobId: string,
  files: Array<{
    path: string;
    fileName: string;
    size: number;
    mimeType: string;
    blobUrl: string;
    isDirectory: boolean;
  }>
): Promise<void> {
  const now = new Date();
  const records: ExtractedFileRecord[] = files.map((f) => ({
    id: nanoid(16),
    job_id: jobId,
    path: f.path,
    file_name: f.fileName,
    size: f.size,
    mime_type: f.mimeType,
    blob_url: f.blobUrl,
    is_directory: f.isDirectory,
    created_at: now,
  }));

  if (pool) {
    // Batch insert
    for (const r of records) {
      await query(
        `INSERT INTO extracted_files (
          id, job_id, path, file_name, size, mime_type, blob_url, is_directory, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [r.id, r.job_id, r.path, r.file_name, r.size, r.mime_type, r.blob_url, r.is_directory, r.created_at]
      );
    }
  } else {
    const list = fallbackExtractedFiles.get(jobId) || [];
    fallbackExtractedFiles.set(jobId, [...list, ...records]);
  }
}

export async function getExtractedFilesByJobId(jobId: string): Promise<ExtractedFileRecord[]> {
  if (pool) {
    return await query<ExtractedFileRecord>(
      "SELECT * FROM extracted_files WHERE job_id = $1 ORDER BY path ASC",
      [jobId]
    );
  }
  return fallbackExtractedFiles.get(jobId) || [];
}

export async function createShare(params: {
  jobId: string;
  passwordHash?: string | null;
  expiresInHours?: number;
}): Promise<ShareRecord> {
  const id = nanoid(16);
  const shareToken = nanoid(24);
  const hours = params.expiresInHours || 24;
  const expiresAt = new Date(Date.now() + hours * 3600 * 1000);
  const now = new Date();

  const share: ShareRecord = {
    id,
    job_id: params.jobId,
    share_token: shareToken,
    password_hash: params.passwordHash || null,
    expires_at: expiresAt,
    views_count: 0,
    created_at: now,
  };

  if (pool) {
    await query(
      `INSERT INTO shares (id, job_id, share_token, password_hash, expires_at, views_count, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [share.id, share.job_id, share.share_token, share.password_hash, share.expires_at, share.views_count, share.created_at]
    );
  } else {
    fallbackShares.set(shareToken, share);
  }

  return share;
}

export async function getShareByToken(token: string): Promise<ShareRecord | null> {
  if (pool) {
    const rows = await query<ShareRecord>(
      "SELECT * FROM shares WHERE share_token = $1 AND expires_at > NOW() LIMIT 1",
      [token]
    );
    if (rows[0]) {
      // Increment views count asynchronously
      query("UPDATE shares SET views_count = views_count + 1 WHERE id = $1", [rows[0].id]).catch(() => {});
      return rows[0];
    }
    return null;
  }

  const s = fallbackShares.get(token);
  if (!s) return null;
  if (new Date(s.expires_at).getTime() <= Date.now()) {
    fallbackShares.delete(token);
    return null;
  }
  s.views_count++;
  return s;
}

export async function getExpiredJobs(): Promise<JobRecord[]> {
  if (pool) {
    return await query<JobRecord>("SELECT * FROM jobs WHERE expires_at <= NOW()");
  }
  const now = Date.now();
  const expired: JobRecord[] = [];
  for (const [, job] of fallbackJobs.entries()) {
    if (new Date(job.expires_at).getTime() <= now) {
      expired.push(job);
    }
  }
  return expired;
}
