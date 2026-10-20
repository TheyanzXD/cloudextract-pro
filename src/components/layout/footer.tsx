import React from "react";
import Link from "next/link";
import { Shield, Zap, Server, Lock, Github, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-zinc-950/80 backdrop-blur-xl mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              CloudExtract <span className="text-xs px-1.5 py-0.5 rounded-full bg-neon-cyan/20 text-neon-cyan font-mono border border-neon-cyan/30">PRO</span>
            </span>
            <p className="text-sm text-zinc-400 leading-relaxed">
              High-performance, secure serverless archive extraction and cloud file manager built for Vercel. Zero client compute overhead.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Vercel Fluid Compute
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Navigation</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><Link href="/" className="hover:text-neon-cyan transition-colors">Home Landing</Link></li>
              <li><Link href="/dashboard" className="hover:text-neon-cyan transition-colors">Upload Dashboard</Link></li>
              <li><Link href="/history" className="hover:text-neon-cyan transition-colors">Job History</Link></li>
              <li><Link href="/faq" className="hover:text-neon-cyan transition-colors">Architecture & Limits</Link></li>
            </ul>
          </div>

          {/* Security Features */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Security & Guard</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li className="flex items-center gap-2"><Shield className="h-4 w-4 text-emerald-400" /> Zip-Slip Path Traversal Protection</li>
              <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-neon-cyan" /> Zip-Bomb Size & Ratio Limiting</li>
              <li className="flex items-center gap-2"><Lock className="h-4 w-4 text-neon-purple" /> Encrypted Archive Detection</li>
              <li className="flex items-center gap-2"><Server className="h-4 w-4 text-amber-400" /> Auto-Purge Cron Retention</li>
            </ul>
          </div>

          {/* Tech Specs */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Stack Specs</h4>
            <div className="flex flex-wrap gap-1.5">
              {["Next.js App Router", "TypeScript", "Tailwind CSS", "Vercel Blob", "Vercel Postgres", "yauzl-streaming", "tar-stream", "Framer Motion"].map((tag) => (
                <span key={tag} className="text-[11px] font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded text-zinc-300">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} CloudExtract Pro. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> for high scalability on Vercel
          </p>
        </div>
      </div>
    </footer>
  );
}
