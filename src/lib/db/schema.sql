-- ==============================================================================
-- CloudExtract Pro - PostgreSQL DDL Schema
-- Compatible with Vercel Postgres, Neon, Supabase, and AWS RDS
-- ==============================================================================

-- 1. Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
    id VARCHAR(64) PRIMARY KEY,
    file_name VARCHAR(512) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(128) NOT NULL,
    blob_url TEXT NOT NULL,
    blob_pathname TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'queued', -- 'queued' | 'uploading' | 'extracting' | 'done' | 'failed' | 'needs_password'
    progress INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    is_archive BOOLEAN NOT NULL DEFAULT FALSE,
    extracted_files_count INTEGER NOT NULL DEFAULT 0,
    extracted_total_size BIGINT NOT NULL DEFAULT 0,
    sha256_hash VARCHAR(64),
    ip_address VARCHAR(64),
    requires_password BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Extracted Files Table
CREATE TABLE IF NOT EXISTS extracted_files (
    id VARCHAR(64) PRIMARY KEY,
    job_id VARCHAR(64) NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    file_name VARCHAR(512) NOT NULL,
    size BIGINT NOT NULL,
    mime_type VARCHAR(128) NOT NULL,
    blob_url TEXT NOT NULL,
    is_directory BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Public Shares Table
CREATE TABLE IF NOT EXISTS shares (
    id VARCHAR(64) PRIMARY KEY,
    job_id VARCHAR(64) NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    share_token VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    expires_at TIMESTAMPTZ NOT NULL,
    views_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_expires_at ON jobs(expires_at);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_extracted_files_job_id ON extracted_files(job_id);
CREATE INDEX IF NOT EXISTS idx_shares_share_token ON shares(share_token);
CREATE INDEX IF NOT EXISTS idx_shares_expires_at ON shares(expires_at);
