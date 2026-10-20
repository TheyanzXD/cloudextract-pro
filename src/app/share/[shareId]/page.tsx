"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FileTreeNode } from "@/lib/types/job";
import { formatBytes } from "@/lib/utils/format";
import { FileTreeView } from "@/components/extractor/file-tree";
import { FilePreviewModal } from "@/components/extractor/file-preview-modal";
import { CountdownBadge } from "@/components/shared/countdown-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  Lock,
  Download,
  AlertTriangle,
  FileBox,
  Eye,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

export default function PublicSharePage() {
  const params = useParams();
  const { error } = useToast();
  const shareId = params?.shareId as string;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPasswordProtected, setIsPasswordProtected] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const [shareData, setShareData] = useState<{
    share: any;
    job: any;
    fileTree: FileTreeNode[];
  } | null>(null);

  const [previewNode, setPreviewNode] = useState<FileTreeNode | null>(null);

  const fetchShareData = async (pwd?: string) => {
    try {
      setIsLoading(true);
      const url = pwd
        ? `/api/share/${shareId}?password=${encodeURIComponent(pwd)}`
        : `/api/share/${shareId}`;

      const res = await fetch(url);
      const data = await res.json();

      if (res.status === 401 || data.isPasswordProtected) {
        setIsPasswordProtected(true);
        if (pwd) setUnlockError("Incorrect password");
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Share link expired or not found");
      }

      setShareData(data);
      setIsPasswordProtected(false);
      setUnlockError(null);
    } catch (err: any) {
      error("Share Link Error", err.message);
    } finally {
      setIsLoading(false);
      setIsUnlocking(false);
    }
  };

  useEffect(() => {
    if (shareId) fetchShareData();
  }, [shareId]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setIsUnlocking(true);
    fetchShareData(password);
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  // Password Unlock Screen
  if (isPasswordProtected) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 flex flex-col items-center">
        <div className="w-full rounded-3xl bg-zinc-900/80 border border-white/10 p-8 backdrop-blur-2xl shadow-2xl space-y-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neon-purple/10 border border-neon-purple/20 text-neon-purple">
            <Lock className="h-7 w-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-white">Protected File Link</h2>
            <p className="text-xs text-zinc-400">
              The owner has password-protected this share. Enter the password below to access the files.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4 text-left">
            {unlockError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                {unlockError}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-neon-purple" />
                Password
              </label>
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-neon-purple/50"
              />
            </div>

            <Button
              type="submit"
              variant="neon"
              size="md"
              className="w-full"
              isLoading={isUnlocking}
            >
              Unlock Files
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Not found or Expired Screen
  if (!shareData) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Link Expired or Invalid</h2>
        <p className="text-xs text-zinc-400">
          This shared link has expired according to its retention policy, or the files have been purged by the owner.
        </p>
      </div>
    );
  }

  const { job, fileTree, share } = shareData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <FileBox className="h-5 w-5 text-neon-cyan" />
          <span className="text-sm font-semibold text-white">Public Shared View</span>
        </div>
        <CountdownBadge expiresAt={share.expiresAt} />
      </div>

      {/* Main Info Card */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-900/60 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white truncate max-w-xl">
              {job.fileName}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
              <span>Size: <strong className="text-zinc-200">{formatBytes(job.fileSize)}</strong></span>
              <span>•</span>
              <span>Total Files: <strong className="text-neon-cyan">{job.extractedFilesCount}</strong></span>
              <span>•</span>
              <span>Views: {share.viewsCount}</span>
            </div>
          </div>

          <a href={`/api/download-zip?jobId=${job.id}`}>
            <Button variant="neon" size="md" className="gap-2">
              <Download className="h-4 w-4 fill-black" />
              Download All as ZIP
            </Button>
          </a>
        </div>
      </div>

      {/* File Tree Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Files in this Archive</h2>
        <FileTreeView
          tree={fileTree}
          jobId={job.id}
          onPreviewFile={(node) => setPreviewNode(node)}
        />
      </div>

      {/* Preview Modal */}
      <FilePreviewModal
        node={previewNode}
        onClose={() => setPreviewNode(null)}
      />
    </div>
  );
}
