"use client";

import React, { useState, useEffect, useMemo } from "react";
import { JobRecord } from "@/lib/types/job";
import { formatBytes } from "@/lib/utils/format";
import { CountdownBadge } from "@/components/shared/countdown-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  History,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  CheckSquare,
  Square,
  Download,
  Archive,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
  const { success, error } = useToast();
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/jobs?limit=100");
      if (!res.ok) throw new Error("Failed to load history");
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err: any) {
      error("History error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchSearch = job.file_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "all" || job.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [jobs, searchQuery, statusFilter]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredJobs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredJobs.map((j) => j.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} selected jobs?`)) return;

    try {
      for (const id of Array.from(selectedIds)) {
        await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      }
      success("Batch deletion complete", `Deleted ${selectedIds.size} jobs and their files.`);
      setSelectedIds(new Set());
      fetchJobs();
    } catch (err: any) {
      error("Batch delete error", err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "done":
        return <Badge variant="success">Completed</Badge>;
      case "extracting":
        return <Badge variant="warning">Extracting</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "needs_password":
        return <Badge variant="warning">Needs Password</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <History className="h-7 w-7 text-neon-cyan" />
            Job & Extraction History
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Search, filter, inspect, and manage all your serverless uploads and extraction jobs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBatchDelete}
              className="gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected ({selectedIds.size})
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchJobs}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Toolbar: Search, Filter, Multi-select toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by archive or file name..."
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-neon-cyan"
          />
        </div>

        {/* Filter & Select all */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 text-xs text-zinc-400">
            <Filter className="h-3.5 w-3.5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-white focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="done">Completed</option>
              <option value="extracting">Extracting</option>
              <option value="failed">Failed</option>
              <option value="needs_password">Needs Password</option>
            </select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            className="text-xs text-zinc-300"
          >
            {selectedIds.size === filteredJobs.length && filteredJobs.length > 0 ? (
              <CheckSquare className="h-4 w-4 mr-1 text-neon-cyan" />
            ) : (
              <Square className="h-4 w-4 mr-1 text-zinc-500" />
            )}
            Select All
          </Button>
        </div>
      </div>

      {/* Table / List View */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-16 rounded-3xl bg-zinc-900/40 border border-white/10 text-zinc-400 space-y-3">
          <Archive className="h-10 w-10 text-zinc-600 mx-auto" />
          <p className="text-sm">No jobs match your search or filter criteria.</p>
          <Link href="/dashboard">
            <Button variant="neon" size="sm">Upload New Archive</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => {
            const isSelected = selectedIds.has(job.id);
            return (
              <div
                key={job.id}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  isSelected
                    ? "bg-neon-cyan/5 border-neon-cyan/40 shadow-neon-cyan"
                    : "bg-zinc-900/60 border-white/10 hover:border-white/20"
                } backdrop-blur-xl`}
              >
                {/* Left check & info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => toggleSelect(job.id)}
                    className="p-1 rounded text-zinc-400 hover:text-white"
                  >
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 text-neon-cyan" />
                    ) : (
                      <Square className="h-4 w-4 text-zinc-600" />
                    )}
                  </button>

                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
                    <Archive className="h-5 w-5 text-neon-cyan" />
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="text-sm font-semibold text-white hover:text-neon-cyan truncate"
                      >
                        {job.file_name}
                      </Link>
                      {getStatusBadge(job.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                      <span>{formatBytes(job.file_size)}</span>
                      <span>•</span>
                      <span>{job.extracted_files_count} extracted files</span>
                      <span>•</span>
                      <span>{new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Right Countdown & actions */}
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <CountdownBadge expiresAt={job.expires_at} className="hidden md:inline-flex" />

                  <Link href={`/jobs/${job.id}`}>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      <span>View</span>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </Link>

                  {job.status === "done" && (
                    <a href={`/api/download-zip?jobId=${job.id}`}>
                      <Button variant="ghost" size="icon" title="Download ZIP">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
