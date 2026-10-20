"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeroVideoBackground } from "@/components/layout/hero-video";
import { Dropzone } from "@/components/uploader/dropzone";
import { globalUploadManager } from "@/lib/uploader/client-uploader";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ShieldCheck,
  Zap,
  FolderTree,
  Share2,
  Lock,
  ArrowRight,
  Server,
  HardDrive,
  Cpu,
  Layers,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  const router = useRouter();

  const handleFilesSelected = (files: File[], retentionHours: number) => {
    globalUploadManager.addFiles(files, retentionHours);
    router.push("/dashboard");
  };

  const steps = [
    {
      step: "01",
      title: "Direct Client Streaming",
      desc: "Upload files, folders, or archives (.zip, .tar, .tgz) directly to Vercel Blob with multipart chunking. Your browser never freezes, buffers, or compresses.",
      icon: Zap,
      color: "text-neon-cyan",
      border: "border-neon-cyan/30",
    },
    {
      step: "02",
      title: "Serverless Fluid Compute",
      desc: "Vercel Serverless Functions immediately stream each archive entry through memory-safe guards without exceeding the 4.5MB payload limit.",
      icon: Cpu,
      color: "text-neon-purple",
      border: "border-neon-purple/30",
    },
    {
      step: "03",
      title: "Active Security Hardening",
      desc: "Automated defense against Zip-Slip path traversals, Zip-Bomb exponential decompression, and dangerous symbolic links.",
      icon: ShieldCheck,
      color: "text-neon-emerald",
      border: "border-neon-emerald/30",
    },
    {
      step: "04",
      title: "Interactive Tree & Stream ZIP",
      desc: "Explore files in a rich collapsible tree, preview code/media in-browser, stream zip subfolders, and generate auto-expiring password links.",
      icon: FolderTree,
      color: "text-pink-400",
      border: "border-pink-500/30",
    },
  ];

  return (
    <div className="relative overflow-hidden flex flex-col items-center">
      {/* Background Video & Ambient Glow */}
      <HeroVideoBackground />

      {/* Hero Section */}
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16 flex flex-col items-center text-center">
        {/* Release Tag */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 backdrop-blur-xl mb-6 shadow-lg shadow-black/40"
        >
          <span className="flex h-2 w-2 rounded-full bg-neon-cyan animate-ping" />
          <span className="text-white font-medium">CloudExtract Pro 2.0</span>
          <span className="text-zinc-500">|</span>
          <span className="text-neon-cyan">Production Serverless Architecture</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl"
        >
          Effortless Uploads.{" "}
          <span className="bg-gradient-to-r from-neon-cyan via-blue-400 to-neon-purple bg-clip-text text-transparent">
            Instant Serverless
          </span>{" "}
          Extraction.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 text-base sm:text-xl text-zinc-400 max-w-2xl leading-relaxed"
        >
          Bypass browser memory constraints and Vercel's 4.5MB payload limit. Upload gigabytes of files, entire directory trees, and archives with streaming auto-extraction in the cloud.
        </motion.p>

        {/* Interactive Dropzone Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-3xl mt-10"
        >
          <div className="glass-panel p-4 sm:p-6 rounded-3xl shadow-2xl relative">
            <Dropzone onFilesSelected={handleFilesSelected} />
          </div>
        </motion.div>

        {/* Hero Quick Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mt-12 text-left">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="text-xs text-zinc-400 block">Client Load</span>
            <span className="text-xl font-bold text-neon-cyan font-mono">0% CPU</span>
            <p className="text-[11px] text-zinc-500 mt-1">Zero compression in browser</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="text-xs text-zinc-400 block">Payload Limit</span>
            <span className="text-xl font-bold text-neon-purple font-mono">Bypassed</span>
            <p className="text-[11px] text-zinc-500 mt-1">Direct client blob token</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="text-xs text-zinc-400 block">Security Guard</span>
            <span className="text-xl font-bold text-emerald-400 font-mono">Hardened</span>
            <p className="text-[11px] text-zinc-500 mt-1">Zip-slip & bomb defended</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="text-xs text-zinc-400 block">Auto-Purge</span>
            <span className="text-xl font-bold text-pink-400 font-mono">Cron Active</span>
            <p className="text-[11px] text-zinc-500 mt-1">Hourly cleanup worker</p>
          </div>
        </div>
      </section>

      {/* "Cara Kerja" (How It Works) Section */}
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-white/10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs uppercase tracking-widest text-neon-cyan font-bold mb-2">
            Architecture & Workflow
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How CloudExtract Pro Works
          </h3>
          <p className="mt-3 text-sm text-zinc-400">
            A battle-tested serverless pipeline engineered for speed, low memory usage, and military-grade extraction safety.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className={`relative flex flex-col justify-between p-6 rounded-2xl bg-zinc-900/40 border ${s.border} backdrop-blur-xl shadow-xl hover:bg-zinc-900/60 transition-colors`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black font-mono text-white/20">{s.step}</span>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <Icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">{s.title}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Video Demo & Architecture Showcase Box */}
        <div className="mt-16 rounded-3xl bg-zinc-900/50 border border-white/10 p-6 sm:p-10 backdrop-blur-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 text-left">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
                Interactive File Tree & Zip Streaming
              </span>
              <h4 className="text-2xl sm:text-3xl font-bold text-white">
                Inspect, Preview, and Stream Downloads with Zero Lag
              </h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                When an archive finishes extraction, explore the results via an interactive expandable tree. Download individual files, stream full directories on-the-fly as ZIPs, or generate time-expiring public share links protected with custom passwords.
              </p>
              <div className="pt-2">
                <Link href="/dashboard">
                  <Button variant="neon" size="md" className="gap-2">
                    <span>Try Uploader Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mock Visual File Tree Preview */}
            <div className="rounded-2xl bg-zinc-950 border border-white/15 p-4 shadow-2xl font-mono text-xs text-zinc-300 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[11px] text-zinc-500">
                <span>archive-release-v1.zip</span>
                <span className="text-emerald-400">● 100% Extracted</span>
              </div>
              <div className="space-y-1.5 pl-2">
                <div className="flex items-center gap-2 text-neon-purple font-semibold">
                  <FolderTree className="h-4 w-4" /> /src/components/
                </div>
                <div className="flex items-center justify-between pl-6 text-zinc-400 py-1 hover:bg-white/5 rounded px-2">
                  <span>├── Navbar.tsx</span>
                  <span className="text-zinc-600">4.2 KB</span>
                </div>
                <div className="flex items-center justify-between pl-6 text-zinc-400 py-1 hover:bg-white/5 rounded px-2">
                  <span>├── Dropzone.tsx</span>
                  <span className="text-zinc-600">8.9 KB</span>
                </div>
                <div className="flex items-center justify-between pl-6 text-zinc-400 py-1 hover:bg-white/5 rounded px-2">
                  <span>└── HeroVideo.tsx</span>
                  <span className="text-zinc-600">3.1 KB</span>
                </div>
                <div className="flex items-center gap-2 text-neon-purple font-semibold pt-1">
                  <FolderTree className="h-4 w-4" /> /public/assets/
                </div>
                <div className="flex items-center justify-between pl-6 text-zinc-400 py-1 hover:bg-white/5 rounded px-2">
                  <span>└── hero-poster.svg</span>
                  <span className="text-zinc-600">12.4 KB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
