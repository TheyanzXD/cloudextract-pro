"use client";

import React, { useState, useMemo } from "react";
import { FileTreeNode } from "@/lib/types/job";
import { formatBytes, getFileCategory } from "@/lib/utils/format";
import {
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  ChevronRight,
  ChevronDown,
  Download,
  Eye,
  Search,
  Maximize2,
  Minimize2,
  FolderArchive,
} from "lucide-react";
import { Button } from "../ui/button";

interface FileTreeProps {
  tree: FileTreeNode[];
  jobId: string;
  onPreviewFile: (node: FileTreeNode) => void;
}

export function FileTreeView({ tree, jobId, onPreviewFile }: FileTreeProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  // Collect all folder paths for Expand All
  const allFolderPaths = useMemo(() => {
    const paths = new Set<string>();
    function traverse(nodes: FileTreeNode[]) {
      for (const n of nodes) {
        if (n.isDirectory) {
          paths.add(n.path);
          if (n.children) traverse(n.children);
        }
      }
    }
    traverse(tree);
    return paths;
  }, [tree]);

  const toggleExpand = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedPaths(new Set(allFolderPaths));
  };

  const handleCollapseAll = () => {
    setExpandedPaths(new Set());
  };

  // Filter nodes matching search query
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return tree;

    const q = searchQuery.toLowerCase();

    function filterNodes(nodes: FileTreeNode[]): FileTreeNode[] {
      const result: FileTreeNode[] = [];

      for (const node of nodes) {
        if (node.isDirectory) {
          const matchingChildren = node.children ? filterNodes(node.children) : [];
          if (matchingChildren.length > 0 || node.name.toLowerCase().includes(q)) {
            result.push({
              ...node,
              children: matchingChildren,
            });
          }
        } else if (node.name.toLowerCase().includes(q) || node.path.toLowerCase().includes(q)) {
          result.push(node);
        }
      }

      return result;
    }

    return filterNodes(tree);
  }, [tree, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Search & Tree Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files and folders..."
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-neon-cyan"
          />
        </div>

        {/* Tree controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExpandAll}
            className="text-xs text-zinc-400 hover:text-white"
          >
            <Maximize2 className="h-3.5 w-3.5 mr-1" />
            Expand All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCollapseAll}
            className="text-xs text-zinc-400 hover:text-white"
          >
            <Minimize2 className="h-3.5 w-3.5 mr-1" />
            Collapse All
          </Button>
        </div>
      </div>

      {/* Tree Content Container */}
      <div className="overflow-x-auto rounded-2xl bg-zinc-950/80 border border-white/10 p-2 sm:p-4 backdrop-blur-xl">
        {filteredTree.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-sm">
            No files found matching "{searchQuery}".
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredTree.map((node) => (
              <TreeNodeItem
                key={node.id}
                node={node}
                level={0}
                jobId={jobId}
                expandedPaths={expandedPaths}
                toggleExpand={toggleExpand}
                onPreviewFile={onPreviewFile}
                isSearchActive={Boolean(searchQuery.trim())}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface TreeNodeItemProps {
  node: FileTreeNode;
  level: number;
  jobId: string;
  expandedPaths: Set<string>;
  toggleExpand: (path: string) => void;
  onPreviewFile: (node: FileTreeNode) => void;
  isSearchActive: boolean;
}

function TreeNodeItem({
  node,
  level,
  jobId,
  expandedPaths,
  toggleExpand,
  onPreviewFile,
  isSearchActive,
}: TreeNodeItemProps) {
  // If search is active, automatically expand matched branches
  const isExpanded = isSearchActive || expandedPaths.has(node.path);

  const getFileIcon = () => {
    if (node.isDirectory) {
      return isExpanded ? (
        <FolderOpen className="h-4 w-4 text-neon-purple shrink-0" />
      ) : (
        <Folder className="h-4 w-4 text-neon-purple shrink-0" />
      );
    }

    const category = getFileCategory(node.mimeType, node.name);
    switch (category) {
      case "code":
        return <FileCode className="h-4 w-4 text-neon-cyan shrink-0" />;
      case "image":
        return <FileImage className="h-4 w-4 text-pink-400 shrink-0" />;
      case "video":
        return <FileVideo className="h-4 w-4 text-amber-400 shrink-0" />;
      case "audio":
        return <FileAudio className="h-4 w-4 text-emerald-400 shrink-0" />;
      case "archive":
        return <FileArchive className="h-4 w-4 text-purple-400 shrink-0" />;
      default:
        return <FileText className="h-4 w-4 text-zinc-400 shrink-0" />;
    }
  };

  return (
    <div>
      <div
        className={`group flex items-center justify-between py-1.5 px-2 rounded-xl transition-all hover:bg-white/5 ${
          node.isDirectory ? "cursor-pointer font-medium" : ""
        }`}
        style={{ paddingLeft: `${Math.max(8, level * 20)}px` }}
        onClick={() => {
          if (node.isDirectory) {
            toggleExpand(node.path);
          } else {
            onPreviewFile(node);
          }
        }}
      >
        {/* Left: Node Info */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {node.isDirectory ? (
            <button
              type="button"
              className="p-0.5 rounded hover:bg-white/10 text-zinc-400"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.path);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <span className="w-3.5 shrink-0" />
          )}

          {getFileIcon()}

          <span
            className={`text-sm truncate select-none ${
              node.isDirectory ? "text-zinc-200" : "text-zinc-300 group-hover:text-white"
            }`}
          >
            {node.name}
          </span>
        </div>

        {/* Right: Actions & Metadata */}
        <div className="flex items-center gap-3 shrink-0 opacity-80 group-hover:opacity-100">
          {!node.isDirectory && (
            <span className="text-xs text-zinc-500 font-mono">
              {formatBytes(node.size)}
            </span>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {!node.isDirectory ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreviewFile(node);
                  }}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Preview File"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <a
                  href={node.blobUrl}
                  download={node.name}
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-neon-cyan hover:bg-white/10 transition-colors"
                  title="Download File"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
              </>
            ) : (
              /* Download Folder as streaming ZIP */
              <a
                href={`/api/download-zip?jobId=${jobId}&folder=${encodeURIComponent(node.path)}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-neon-cyan px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
                title="Download folder as ZIP stream"
              >
                <FolderArchive className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Zip Folder</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Recursive Children */}
      {node.isDirectory && isExpanded && node.children && (
        <div className="space-y-0.5">
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              level={level + 1}
              jobId={jobId}
              expandedPaths={expandedPaths}
              toggleExpand={toggleExpand}
              onPreviewFile={onPreviewFile}
              isSearchActive={isSearchActive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
