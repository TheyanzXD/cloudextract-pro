"use client";

import React, { useState, useRef, useCallback } from "react";
import { UploadCloud, FolderUp, Archive, FileText, Sparkles, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DropzoneProps {
  onFilesSelected: (files: File[], retentionHours: number) => void;
  isUploading?: boolean;
}

export function Dropzone({ onFilesSelected, isUploading }: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadMode, setUploadMode] = useState<"files" | "folder" | "archive">("files");
  const [retentionHours, setRetentionHours] = useState<number>(24);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const archiveInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const items = e.dataTransfer.items;
      const files: File[] = [];

      if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind === "file") {
            const file = item.getAsFile();
            if (file) files.push(file);
          }
        }
      } else if (e.dataTransfer.files) {
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          files.push(e.dataTransfer.files[i]);
        }
      }

      if (files.length > 0) {
        onFilesSelected(files, retentionHours);
      }
    },
    [onFilesSelected, retentionHours]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(filesArray, retentionHours);
      // Reset input value to allow selecting same files again if needed
      e.target.value = "";
    }
  };

  const triggerPicker = () => {
    if (uploadMode === "folder") {
      folderInputRef.current?.click();
    } else if (uploadMode === "archive") {
      archiveInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Hidden native inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={archiveInputRef}
        type="file"
        accept=".zip,.tar,.tar.gz,.tgz,.rar,.7z"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Top Toolbar: Mode Switcher & Retention Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/60 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
        {/* Upload Mode Tabs */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setUploadMode("files")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              uploadMode === "files"
                ? "bg-white/15 text-white shadow-sm border border-white/10"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-neon-cyan" />
            Files
          </button>
          <button
            type="button"
            onClick={() => setUploadMode("folder")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              uploadMode === "folder"
                ? "bg-white/15 text-white shadow-sm border border-white/10"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <FolderUp className="h-3.5 w-3.5 text-neon-purple" />
            Folder
          </button>
          <button
            type="button"
            onClick={() => setUploadMode("archive")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              uploadMode === "archive"
                ? "bg-white/15 text-white shadow-sm border border-white/10"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Archive className="h-3.5 w-3.5 text-neon-emerald" />
            Archive (.zip, .tar)
          </button>
        </div>

        {/* Retention Period Selector */}
        <div className="flex items-center gap-2 px-2 text-xs text-zinc-400">
          <Clock className="h-3.5 w-3.5 text-zinc-400" />
          <span>Auto-purge retention:</span>
          <select
            value={retentionHours}
            onChange={(e) => setRetentionHours(Number(e.target.value))}
            className="bg-black/60 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-neon-cyan"
          >
            <option value={24}>24 Hours</option>
            <option value={72}>3 Days</option>
            <option value={168}>7 Days</option>
          </select>
        </div>
      </div>

      {/* Main Interactive Dropzone Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerPicker}
        className={`relative group cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-300 ${
          isDragOver
            ? "border-neon-cyan bg-neon-cyan/5 shadow-neon-cyan scale-[1.01]"
            : "border-white/15 bg-glass-gradient hover:border-white/30 hover:bg-glass-gradient-hover"
        }`}
      >
        {/* Glow ambient background on drag */}
        {isDragOver && (
          <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/10 via-neon-purple/10 to-transparent blur-2xl pointer-events-none" />
        )}

        <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
          {/* Animated Icon Circle */}
          <motion.div
            animate={isDragOver ? { scale: 1.15, y: -5 } : { scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-900/90 border border-white/15 shadow-2xl transition-all duration-300 ${
              isDragOver ? "border-neon-cyan shadow-neon-cyan" : "group-hover:border-white/40"
            }`}
          >
            {uploadMode === "folder" ? (
              <FolderUp className="h-10 w-10 text-neon-purple" />
            ) : uploadMode === "archive" ? (
              <Archive className="h-10 w-10 text-neon-emerald" />
            ) : (
              <UploadCloud className="h-10 w-10 text-neon-cyan" />
            )}
          </motion.div>

          <div className="space-y-1.5 max-w-md">
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              {isDragOver ? (
                <span className="text-neon-cyan">Drop files to upload instantly</span>
              ) : (
                <>
                  <span>
                    {uploadMode === "folder"
                      ? "Drop a folder or click to browse"
                      : uploadMode === "archive"
                      ? "Drop an archive (.zip, .tar, .tgz) to auto-extract"
                      : "Drag & drop files or click to browse"}
                  </span>
                </>
              )}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400">
              {uploadMode === "folder"
                ? "Full folder structure and nested relative paths will be preserved."
                : uploadMode === "archive"
                ? "Archives are automatically unpacked on high-speed Vercel serverless functions."
                : "Supports multiple files simultaneously with streaming multipart uploads."}
            </p>
          </div>

          {/* Quick Specs Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300">
              Direct Blob Multipart
            </span>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300">
              Concurrency: 3 max
            </span>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300">
              Max: 500 MB per file
            </span>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 flex items-center gap-1 font-mono">
              <Sparkles className="h-3 w-3" /> Auto Serverless Extract
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
