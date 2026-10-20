"use client";

import React, { useState } from "react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { Lock, KeyRound, AlertCircle } from "lucide-react";
import { useToast } from "../ui/toast";

interface PasswordPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  fileName: string;
  onSuccess: () => void;
}

export function PasswordPromptModal({
  isOpen,
  onClose,
  jobId,
  fileName,
  onSuccess,
}: PasswordPromptModalProps) {
  const { success, error } = useToast();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Incorrect password or extraction error");
      }

      success("Archive unlocked!", "Server extraction is now continuing.");
      setPassword("");
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to extract with provided password");
      error("Unlock failed", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-amber-400">
          <Lock className="h-5 w-5" />
          <span>Password Protected Archive</span>
        </div>
      }
      description={`The archive "${fileName}" contains encrypted entries. Please enter the password to extract.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5 text-amber-400" />
            Archive Password
          </label>
          <input
            type="password"
            autoFocus
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter zip/archive password..."
            className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="neon"
            isLoading={isSubmitting}
            disabled={!password}
          >
            Decrypt & Extract
          </Button>
        </div>
      </form>
    </Modal>
  );
}
