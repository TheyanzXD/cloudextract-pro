export type JobStatus =
  | "queued"
  | "uploading"
  | "extracting"
  | "done"
  | "failed"
  | "needs_password";

export interface JobRecord {
  id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  blob_url: string;
  blob_pathname: string;
  status: JobStatus;
  progress: number;
  error_message?: string | null;
  is_archive: boolean;
  extracted_files_count: number;
  extracted_total_size: number;
  sha256_hash?: string | null;
  ip_address?: string | null;
  requires_password: boolean;
  expires_at: string | Date;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface ExtractedFileRecord {
  id: string;
  job_id: string;
  path: string;
  file_name: string;
  size: number;
  mime_type: string;
  blob_url: string;
  is_directory: boolean;
  created_at: string | Date;
}

export interface ShareRecord {
  id: string;
  job_id: string;
  share_token: string;
  password_hash?: string | null;
  expires_at: string | Date;
  views_count: number;
  created_at: string | Date;
}

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  blobUrl: string;
  isDirectory: boolean;
  children?: FileTreeNode[];
}

export interface ExtractionProgressUpdate {
  processedFiles: number;
  totalSize: number;
  currentFile?: string;
  percentage?: number;
}
