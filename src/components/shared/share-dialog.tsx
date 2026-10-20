"use client";

import React, { useState } from "react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { Share2, Lock, Copy, Check, Clock, Globe } from "lucide-react";
import { useToast } from "../ui/toast";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobFileName: string;
}

export function ShareDialog({ isOpen, onClose, jobId, jobFileName }: ShareDialogProps) {
  const { success, error } = useToast();
  const [expiresInHours, setExpiresInHours] = useState<number>(24);
  const [enablePassword, setEnablePassword] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedShareUrl, setGeneratedShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleGenerateShare = async () => {
    try {
      setIsGenerating(true);
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          expiresInHours,
          password: enablePassword ? password : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create share link");
      }

      setGeneratedShareUrl(data.shareUrl);
      success("Share link created!", "Anyone with the link can now access the files.");
    } catch (err: any) {
      error("Share failed", err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedShareUrl) return;
    navigator.clipboard.writeText(generatedShareUrl);
    setCopied(true);
    success("Copied to clipboard!", "Share URL ready to send.");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClose = () => {
    setGeneratedShareUrl(null);
    setPassword("");
    setEnablePassword(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-neon-cyan" />
          <span>Share Files & Results</span>
        </div>
      }
      description={`Generate a secure public access link for "${jobFileName}"`}
      maxWidth="md"
    >
      <div className="space-y-5">
        {!generatedShareUrl ? (
          <>
            {/* Expiration Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-neon-cyan" /> Link Expiration
              </label>
              <select
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-neon-cyan/50"
              >
                <option value={1}>1 Hour</option>
                <option value={24}>24 Hours (Standard)</option>
                <option value={72}>3 Days</option>
                <option value={168}>7 Days (Maximum)</option>
              </select>
            </div>

            {/* Password Protection Toggle */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-white">
                <input
                  type="checkbox"
                  checked={enablePassword}
                  onChange={(e) => setEnablePassword(e.target.checked)}
                  className="rounded border-white/20 bg-zinc-900 text-neon-cyan focus:ring-neon-cyan h-4 w-4"
                />
                <span className="flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-neon-purple" />
                  Protect with Password
                </span>
              </label>

              {enablePassword && (
                <div className="space-y-1.5">
                  <input
                    type="password"
                    placeholder="Enter link password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-neon-purple/50"
                  />
                  <p className="text-[11px] text-zinc-400">
                    Visitors will be prompted to enter this password before accessing the file tree or downloading.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="neon"
                onClick={handleGenerateShare}
                isLoading={isGenerating}
                disabled={enablePassword && !password}
              >
                Generate Link
              </Button>
            </div>
          </>
        ) : (
          /* Link Generated View */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <Globe className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Link generated! It will automatically expire in {expiresInHours} hours.</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={generatedShareUrl}
                className="w-full bg-zinc-900 border border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none"
              />
              <Button
                variant={copied ? "primary" : "neon"}
                size="md"
                onClick={copyToClipboard}
                className="shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </Button>
            </div>

            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={handleClose} className="w-full">
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
