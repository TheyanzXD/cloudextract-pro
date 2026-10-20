"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { FileTreeNode } from "@/lib/types/job";
import { getFileCategory, formatBytes } from "@/lib/utils/format";
import { Download, Copy, Check, ExternalLink, FileText } from "lucide-react";

interface FilePreviewModalProps {
  node: FileTreeNode | null;
  onClose: () => void;
}

export function FilePreviewModal({ node, onClose }: FilePreviewModalProps) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!node || node.isDirectory) return;

    const category = getFileCategory(node.mimeType, node.name);
    if (category === "code") {
      setIsLoadingText(true);
      fetch(node.blobUrl)
        .then((r) => r.text())
        .then((text) => {
          setTextContent(text);
          setIsLoadingText(false);
        })
        .catch(() => {
          setTextContent("Error loading text file preview.");
          setIsLoadingText(false);
        });
    } else {
      setTextContent(null);
    }
  }, [node]);

  if (!node) return null;

  const category = getFileCategory(node.mimeType, node.name);

  const handleCopyCode = () => {
    if (textContent) {
      navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal
      isOpen={Boolean(node)}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 truncate">
          <FileText className="h-5 w-5 text-neon-cyan shrink-0" />
          <span className="truncate">{node.name}</span>
          <span className="text-xs text-zinc-400 font-normal">({formatBytes(node.size)})</span>
        </div>
      }
      description={`Path: /${node.path}`}
      maxWidth={category === "code" || category === "pdf" ? "4xl" : "2xl"}
    >
      <div className="space-y-4">
        {/* Preview Container */}
        <div className="overflow-hidden rounded-xl bg-black/60 border border-white/10 p-2 min-h-[250px] max-h-[65vh] flex items-center justify-center">
          {category === "image" && (
            <img
              src={node.blobUrl}
              alt={node.name}
              className="max-h-[60vh] max-w-full object-contain rounded-lg"
            />
          )}

          {category === "video" && (
            <video
              src={node.blobUrl}
              controls
              playsInline
              className="max-h-[60vh] w-full rounded-lg"
            />
          )}

          {category === "audio" && (
            <div className="w-full p-6 flex flex-col items-center justify-center space-y-4">
              <audio src={node.blobUrl} controls className="w-full max-w-md" />
              <p className="text-xs text-zinc-400">Audio playback: {node.name}</p>
            </div>
          )}

          {category === "pdf" && (
            <iframe
              src={node.blobUrl}
              className="w-full h-[60vh] rounded-lg border-0"
              title={node.name}
            />
          )}

          {category === "code" && (
            <div className="w-full h-[55vh] flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 px-2 text-xs text-zinc-400">
                <span>Syntax Preview</span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copied" : "Copy Content"}</span>
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-zinc-200 whitespace-pre">
                {isLoadingText ? "Loading file preview..." : textContent}
              </div>
            </div>
          )}

          {category === "other" && (
            <div className="text-center p-8 space-y-2">
              <FileText className="h-12 w-12 text-zinc-500 mx-auto" />
              <p className="text-sm text-zinc-300">Preview not available for this file type.</p>
              <p className="text-xs text-zinc-500">MIME: {node.mimeType}</p>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>

          <div className="flex items-center gap-2">
            <a href={node.blobUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                Open Direct
              </Button>
            </a>
            <a href={node.blobUrl} download={node.name}>
              <Button variant="neon" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5 fill-black" />
                Download File
              </Button>
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
}
