"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, History, HelpCircle, UploadCloud, Menu, X, Sparkles } from "lucide-react";
import { Button } from "../ui/button";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard", icon: UploadCloud },
    { href: "/history", label: "History", icon: History },
    { href: "/faq", label: "Limits & FAQ", icon: HelpCircle },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-zinc-950/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-neon-purple to-neon-cyan p-0.5 shadow-neon-cyan/20 shadow-lg">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-zinc-950 transition-colors group-hover:bg-zinc-900">
              <Box className="h-5 w-5 text-neon-cyan group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              CloudExtract <span className="text-xs px-1.5 py-0.5 rounded-full bg-neon-cyan/20 text-neon-cyan font-mono border border-neon-cyan/30">PRO</span>
            </span>
            <span className="text-[10px] text-zinc-400 font-medium">Serverless Streaming Extractor</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "text-white bg-white/10 shadow-inner border border-white/10"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {Icon && <Icon className={`h-4 w-4 ${isActive ? "text-neon-cyan" : "text-zinc-400"}`} />}
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="neon" size="sm" className="font-semibold gap-1.5">
              <Sparkles className="h-3.5 w-3.5 fill-black" />
              Upload Now
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <div className="flex md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-zinc-950/95 backdrop-blur-2xl px-4 py-4 space-y-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-base font-medium transition-colors ${
                  isActive ? "text-white bg-white/10" : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {Icon && <Icon className="h-5 w-5 text-neon-cyan" />}
                {link.label}
              </Link>
            );
          })}
          <div className="pt-2">
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="neon" size="md" className="w-full">
                Upload Now
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
