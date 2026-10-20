"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { JobRecord, FileTreeNode } from "@/lib/types/job";
import { formatBytes } from "@/lib/utils/format";
import { FileTreeView } from "@/components/extractor/file-tree";
import { FilePreviewModal } from "@/components/extractor/file-preview-modal";
import { CountdownBadge } from "@/components/shared/countdown-badge";
import { ShareDialog } from "@/components/shared/share-dialog";
import { PasswordPromptModal } from "@/components/extractor/password-prompt-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  Archive,
  Download,
  Share2,
  Trash2,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { success, error } = useToast();
  const jobId = params?.id as string;

  const [job, setJob] = useState<JobRecord | null>(null);
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [previewNode, setPreviewNode] = useState<FileTreeNode | null>(null);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Fetch Job details
  const fetchJobData = async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) throw new Error("Job not found");
      const data = await res.json();
      setJob(data.job);
      setFileTree(data.fileTree || []);
    } catch (err: any) {
      error("Error loading job", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!jobId) return;
    fetchJobData();

    // Setup Realtime SSE event listener for progress updates
    const eventSource = new EventSource(`/api/jobs/${jobId}/events`);

    eventSource.addEventListener("job_update", (e: MessageEvent) => {
      try {
        const updated = JSON.parse(e.data);
        setJob((prev) => (prev ? { ...prev, ...updated } : updated));
        // If state changed to done or needs_password, re-fetch file tree
        if (updated.status === "done" || updated.status === "needs_password") {
          fetchJobData();
        }
      } catch (err) {
        // Ignore parse error
      }
    });

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [jobId]);

  const handleDeleteJob = async () => {
    if (!confirm("Are you sure you want to delete this job and all associated files from storage?")) {
      return;
    }

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete job");
      success("Job deleted", "All cloud blobs and database records have been purged.");
      router.push("/dashboard");
    } catch (err: any) {
      error("Deletion failed", err.message);
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Job Not Found</h2>
        <p className="text-sm text-zinc-400">
          This archive job does not exist or may have already expired and been cleaned up by retention policies.
        </p>
        <Link href="/dashboard">
          <Button variant="neon">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>
        <CountdownBadge expiresAt={job.expires_at} />
      </div>

      {/* Main Job Metadata Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-900/60 border border-white/10 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left info */}
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20">
                <Archive className="h-6 w-6 text-neon-cyan" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate" title={job.file_name}>
                {job.file_name}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
              <span>Archive Size: <strong className="text-zinc-200">{formatBytes(job.file_size)}</strong></span>
              <span>•</span>
              <span>Total Extracted: <strong className="text-neon-cyan">{formatBytes(job.extracted_total_size)}</strong></span>
              <span>•</span>
              <span>Files Count: <strong className="text-neon-purple">{job.extracted_files_count} files</strong></span>
              <span>•</span>
              <span>Uploaded: {new Date(job.created_at).toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {job.status === "needs_password" && (
              <Button
                variant="neon"
                size="md"
                onClick={() => setIsPasswordModalOpen(true)}
                className="gap-2"
              >
                <Lock className="h-4 w-4" />
                Unlock with Password
              </Button>
            )}

            {job.status === "done" && (
              <>
                <a href={`/api/download-zip?jobId=${job.id}`}>
                  <Button variant="neon" size="md" className="gap-2">
                    <Download className="h-4 w-4 fill-black" />
                    Download All (ZIP)
                  </Button>
                </a>

                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setIsShareOpen(true)}
                  className="gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share Link
                </Button>
              </>
            )}

            <Button
              variant="destructive"
              size="md"
              onClick={handleDeleteJob}
              isLoading={isDeleting}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Live Extraction Progress State */}
        {(job.status === "extracting" || job.status === "queued") && (
          <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span className="flex items-center gap-2 font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-neon-cyan" />
                Serverless streaming extraction in progress...
              </span>
              <span className="font-mono text-neon-cyan">{job.progress}%</span>
            </div>
            <Progress value={job.progress} variant="gradient" className="h-2" />
          </div>
        )}

        {job.status === "failed" && (
          <div className="mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <div>
              <p className="font-semibold">Extraction Failed</p>
              <p className="mt-0.5 text-red-400/90">{job.error_message || "An unexpected error occurred during decompression."}</p>
            </div>
          </div>
        )}
      </div>

      {/* Extracted File Tree View */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Extracted File Tree</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-mono">
              {job.extracted_files_count} items
            </span>
          </div>
        </div>

        {fileTree.length > 0 ? (
          <FileTreeView
            tree={fileTree}
            jobId={job.id}
            onPreviewFile={(node) => setPreviewNode(node)}
          />
        ) : job.status === "done" ? (
          <div className="text-center py-12 rounded-2xl bg-zinc-900/40 border border-white/10 text-zinc-400 text-sm">
            This archive was empty or contained no readable files.
          </div>
        ) : null}
      </div>

      {/* File Preview Modal */}
      <FilePreviewModal
        node={previewNode}
        onClose={() => setPreviewNode(null)}
      />

      {/* Share Dialog */}
      <ShareDialog
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        jobId={job.id}
        jobFileName={job.file_name}
      />

      {/* Password Prompt Modal */}
      <PasswordPromptModal
        isOpen={isPasswordModalOpen}
        jobId={job.id}
        fileName={job.file_name}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={() => fetchJobData()}
      />
    </div>
  );
}
