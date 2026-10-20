import React from "react";
import {
  HelpCircle,
  ShieldAlert,
  Server,
  Zap,
  HardDrive,
  FileArchive,
  Layers,
  Clock,
  Lock,
} from "lucide-react";

export default function FAQPage() {
  const faqs = [
    {
      q: "How does CloudExtract Pro bypass Vercel's 4.5MB Serverless Function payload limit?",
      a: "Traditional upload forms post the file directly to a serverless function endpoint, hitting Vercel's strict 4.5MB request body limit. CloudExtract Pro uses client-side signed upload tokens via `@vercel/blob/client`. The browser streams the file chunks directly to Vercel Blob (S3-compatible distributed storage), completely bypassing the serverless function execution body.",
    },
    {
      q: "How does serverless extraction avoid out-of-memory (OOM) crashes?",
      a: "Instead of reading entire archives into memory (which easily exhausts the 1024MB RAM limit), our serverless extraction engine streams each entry one-by-one using `yauzl` for zip and `tar-stream` for tar/tar.gz. Each file entry is piped straight from the archive stream into Vercel Blob without caching uncompressed contents in memory.",
    },
    {
      q: "What protections are implemented against Zip-Slip and Zip-Bomb attacks?",
      a: "Every path is sanitized using POSIX normalization, stripping null bytes, absolute paths, and any `../` directory traversal sequences (Zip-Slip defense). Decompression enforces a strict budget: maximum cumulative decompressed size (default 1GB), maximum file count (5,000 files), maximum folder depth (15 levels), and a 100:1 compression ratio limit (Zip-Bomb defense).",
    },
    {
      q: "What are the runtime differences between Vercel Hobby and Pro plans?",
      a: "On Vercel Hobby, Serverless Function execution is capped at 60 seconds (or up to 300 seconds under Fluid Compute beta). On Vercel Pro, functions can run up to 300 seconds (5 minutes). For archives that contain thousands of files, CloudExtract Pro batches database operations and streams uploads directly to finish well within the time allowance.",
    },
    {
      q: "How does automated retention and file cleanup work?",
      a: "Every job has an `expires_at` timestamp based on user selection (24 hours, 3 days, or 7 days). A Vercel Cron job (`/api/cron/cleanup`) triggers automatically every hour to delete expired jobs and batch purge all their associated blobs from Vercel Blob storage, keeping your storage quota tidy.",
    },
    {
      q: "Does folder upload preserve my exact directory tree?",
      a: "Yes! When you drag and drop a folder or choose 'Folder' mode, the browser populates `webkitRelativePath` on every file. Our client uploader maintains this relative path so the server reconstructs the exact hierarchical tree on Vercel Blob and displays it accurately in the interactive file explorer.",
    },
    {
      q: "How are password-protected archives handled?",
      a: "When yauzl detects an encrypted entry header in a ZIP archive, the server updates the job status to `needs_password` and alerts the user interface. You are prompted for the password, which is then passed to decrypt and resume extraction seamlessly.",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-12">
      {/* Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-xs font-mono">
          <HelpCircle className="h-3.5 w-3.5" /> Technical Documentation & Limits
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Frequently Asked Questions & Architecture
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto">
          Understand how CloudExtract Pro achieves zero client-side load, robust security hardening, and high-performance serverless decompression on Vercel.
        </p>
      </div>

      {/* Plan Limits Comparison Card */}
      <div className="rounded-3xl bg-zinc-900/60 border border-white/10 p-6 sm:p-8 backdrop-blur-xl space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Server className="h-5 w-5 text-neon-purple" />
          Vercel Deployment Limits & Optimization
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-zinc-300">
              Vercel Hobby Plan
            </span>
            <ul className="text-xs text-zinc-400 space-y-2">
              <li>• Max Duration: <strong>60s</strong> (standard) or fluid compute</li>
              <li>• Serverless Memory: <strong>1024 MB</strong></li>
              <li>• Vercel Cron: <strong>1 invocation per day</strong> on free tier (or use external webhook/trigger)</li>
              <li>• Payload Body Limit: <strong>4.5 MB</strong> (bypassed by Blob client tokens)</li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-black/40 border border-neon-cyan/30 shadow-neon-cyan space-y-3">
            <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-neon-cyan/20 text-neon-cyan">
              Vercel Pro Plan (Recommended)
            </span>
            <ul className="text-xs text-zinc-400 space-y-2">
              <li>• Max Duration: <strong>Up to 300s (5 minutes)</strong></li>
              <li>• Serverless Memory: <strong>Up to 3008 MB</strong></li>
              <li>• Vercel Cron: <strong>Hourly cron jobs supported</strong></li>
              <li>• Concurrency: <strong>Up to 1000 concurrent executions</strong></li>
            </ul>
          </div>
        </div>
      </div>

      {/* FAQs List */}
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-zinc-900/50 border border-white/10 backdrop-blur-md space-y-2"
          >
            <h3 className="text-base sm:text-lg font-bold text-white flex items-start gap-2">
              <span className="text-neon-cyan font-mono text-sm mt-0.5">Q{i + 1}.</span>
              <span>{faq.q}</span>
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed pl-6">
              {faq.a}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
