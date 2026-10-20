"use client";

import React, { useState, useEffect } from "react";
import { Dropzone } from "@/components/uploader/dropzone";
import { UploadQueueItemCard } from "@/components/uploader/upload-queue-item";
import {
  globalUploadManager,
  UploadQueueItem,
} from "@/lib/uploader/client-uploader";
import { Button } from "@/components/ui/button";
import { PasswordPromptModal } from "@/components/extractor/password-prompt-modal";
import {
  UploadCloud,
  CheckCircle2,
  Trash2,
  Layers,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [passwordModalState, setPasswordModalState] = useState<{
    isOpen: boolean;
    jobId: string;
    fileName: string;
  }>({
    isOpen: false,
    jobId: "",
    fileName: "",
  });

  useEffect(() => {
    const unsubscribe = globalUploadManager.subscribe((items) => {
      setQueue(items);
    });
    return () => unsubscribe();
  }, []);

  const handleFilesSelected = (files: File[], retentionHours: number) => {
    globalUploadManager.addFiles(files, retentionHours);
  };

  const completedCount = queue.filter((i) => i.status === "completed").length;
  const activeCount = queue.filter(
    (i) => i.status === "uploading" || i.status === "extracting"
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <UploadCloud className="h-7 w-7 text-neon-cyan" />
            Upload & Auto-Extraction Dashboard
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Stream uploads directly to storage with concurrency limit (max 3) and server-side archive extraction.
          </p>
        </div>

        {/* Quick batch actions */}
        {queue.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => globalUploadManager.clearCompleted()}
              className="text-xs"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Clear Completed ({completedCount})
            </Button>
          </div>
        )}
      </div>

      {/* Main Upload Dropzone */}
      <div className="glass-panel p-6 rounded-3xl shadow-xl">
        <Dropzone onFilesSelected={handleFilesSelected} />
      </div>

      {/* Upload Queue Section */}
      {queue.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-neon-purple" />
              <h2 className="text-lg font-bold text-white">Active Queue</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-mono">
                {activeCount} active / {queue.length} total
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {queue.map((item) => (
                <UploadQueueItemCard
                  key={item.id}
                  item={item}
                  onPause={(id) => globalUploadManager.pause(id)}
                  onResume={(id) => globalUploadManager.resume(id)}
                  onCancel={(id) => globalUploadManager.cancel(id)}
                  onRetry={(id) => globalUploadManager.retry(id)}
                  onOpenPasswordPrompt={(jobId) =>
                    setPasswordModalState({
                      isOpen: true,
                      jobId,
                      fileName: item.file.name,
                    })
                  }
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Password Prompt Modal */}
      <PasswordPromptModal
        isOpen={passwordModalState.isOpen}
        jobId={passwordModalState.jobId}
        fileName={passwordModalState.fileName}
        onClose={() =>
          setPasswordModalState({ isOpen: false, jobId: "", fileName: "" })
        }
        onSuccess={() => {
          // Trigger queue refresh
        }}
      />
    </div>
  );
}
