"use client";

import React from "react";
import { UploadQueueItem } from "@/lib/uploader/client-uploader";
import { formatBytes } from "@/lib/utils/format";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import {
  FileText,
  Archive,
  Folder,
  Pause,
  Play,
  RotateCcw,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface UploadQueueItemProps {
  item: UploadQueueItem;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onOpenPasswordPrompt?: (jobId: string) => void;
}

export function UploadQueueItemCard({
  item,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onOpenPasswordPrompt,
}: UploadQueueItemProps) {
  const isArchive =
    item.file.name.endsWith(".zip") ||
    item.file.name.endsWith(".tar") ||
    item.file.name.endsWith(".tar.gz") ||
    item.file.name.endsWith(".tgz");

  const getStatusBadge = () => {
    switch (item.status) {
      case "uploading":
        return <Badge variant="neon">Uploading ({item.progress}%)</Badge>;
      case "extracting":
        return (
          <Badge variant="warning" className="animate-pulse flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Extracting on Server...
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Ready
          </Badge>
        );
      case "paused":
        return <Badge variant="warning">Paused</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "canceled":
        return <Badge variant="outline">Canceled</Badge>;
      default:
        return <Badge variant="default">Queued</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative overflow-hidden rounded-2xl bg-zinc-900/60 border border-white/10 p-4 backdrop-blur-xl shadow-lg transition-all hover:border-white/20"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Icon and File Info */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10">
            {isArchive ? (
              <Archive className="h-5 w-5 text-neon-emerald" />
            ) : item.relativePath.includes("/") ? (
              <Folder className="h-5 w-5 text-neon-purple" />
            ) : (
              <FileText className="h-5 w-5 text-neon-cyan" />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white truncate" title={item.relativePath}>
                {item.relativePath}
              </p>
              {getStatusBadge()}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
              <span>{formatBytes(item.file.size)}</span>
              {item.status === "uploading" && (
                <>
                  <span>•</span>
                  <span>{formatBytes(item.speed)}/s</span>
                  {item.eta > 0 && (
                    <>
                      <span>•</span>
                      <span>~{item.eta}s left</span>
                    </>
                  )}
                </>
              )}
              {item.errorMessage && (
                <span className="text-red-400 font-medium truncate max-w-xs">
                  {item.errorMessage}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {item.status === "uploading" && (
            <button
              onClick={() => onPause(item.id)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Pause"
            >
              <Pause className="h-4 w-4" />
            </button>
          )}

          {item.status === "paused" && (
            <button
              onClick={() => onResume(item.id)}
              className="p-2 rounded-xl text-neon-cyan hover:text-white hover:bg-white/10 transition-colors"
              title="Resume"
            >
              <Play className="h-4 w-4" />
            </button>
          )}

          {(item.status === "failed" || item.status === "canceled") && (
            <button
              onClick={() => onRetry(item.id)}
              className="p-2 rounded-xl text-amber-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Retry"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}

          {item.status !== "completed" && (
            <button
              onClick={() => onCancel(item.id)}
              className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-white/10 transition-colors"
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {item.status === "completed" && item.jobId && (
            <Link
              href={`/jobs/${item.jobId}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/30 text-xs font-semibold transition-colors"
            >
              <span>View Tree</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {(item.status === "uploading" || item.status === "extracting") && (
        <div className="mt-3">
          <Progress
            value={item.status === "extracting" ? 100 : item.progress}
            variant={item.status === "extracting" ? "neon" : "gradient"}
            className="h-1.5"
          />
        </div>
      )}
    </motion.div>
  );
}
