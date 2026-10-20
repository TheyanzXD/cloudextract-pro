import { ExtractedFileRecord, FileTreeNode } from "../types/job";

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function formatRelativeTime(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);

  if (diffInSeconds <= 0) return "Expired";

  const days = Math.floor(diffInSeconds / (3600 * 24));
  const hours = Math.floor((diffInSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((diffInSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export function getFileCategory(mimeType: string, filename: string): "image" | "video" | "audio" | "code" | "pdf" | "archive" | "document" | "other" {
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  if (mimeType.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "avif"].includes(ext)) {
    return "image";
  }
  if (mimeType.startsWith("video/") || ["mp4", "webm", "mkv", "avi", "mov", "wmv", "flv"].includes(ext)) {
    return "video";
  }
  if (mimeType.startsWith("audio/") || ["mp3", "wav", "ogg", "flac", "m4a", "aac"].includes(ext)) {
    return "audio";
  }
  if (mimeType === "application/pdf" || ext === "pdf") {
    return "pdf";
  }
  if (
    ["zip", "tar", "gz", "tgz", "rar", "7z", "bz2"].includes(ext) ||
    mimeType.includes("zip") ||
    mimeType.includes("tar") ||
    mimeType.includes("compressed")
  ) {
    return "archive";
  }
  if (
    [
      "js", "jsx", "ts", "tsx", "json", "html", "css", "scss", "py", "rs", "go",
      "c", "cpp", "h", "java", "php", "sh", "yaml", "yml", "xml", "sql", "md", "txt"
    ].includes(ext) ||
    mimeType.startsWith("text/")
  ) {
    return "code";
  }
  if (["doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp"].includes(ext)) {
    return "document";
  }

  return "other";
}

/**
 * Builds a hierarchical tree structure from a flat list of extracted files
 */
export function buildFileTree(files: ExtractedFileRecord[]): FileTreeNode[] {
  const root: { [key: string]: any } = {};

  for (const file of files) {
    const parts = file.path.split("/").filter(Boolean);
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (!current[part]) {
        current[part] = {
          id: isLast ? file.id : `dir-${parts.slice(0, i + 1).join("/")}`,
          name: part,
          path: parts.slice(0, i + 1).join("/"),
          size: isLast ? file.size : 0,
          mimeType: isLast ? file.mime_type : "inode/directory",
          blobUrl: isLast ? file.blob_url : "",
          isDirectory: isLast ? file.is_directory : true,
          childrenMap: {},
        };
      } else if (isLast) {
        current[part].size = file.size;
        current[part].mimeType = file.mime_type;
        current[part].blobUrl = file.blob_url;
        current[part].isDirectory = file.is_directory;
      }

      current = current[part].childrenMap;
    }
  }

  function mapToArray(map: { [key: string]: any }): FileTreeNode[] {
    const result: FileTreeNode[] = [];
    for (const key of Object.keys(map)) {
      const node = map[key];
      const children = mapToArray(node.childrenMap);
      result.push({
        id: node.id,
        name: node.name,
        path: node.path,
        size: node.size,
        mimeType: node.mimeType,
        blobUrl: node.blobUrl,
        isDirectory: node.isDirectory || children.length > 0,
        children: children.length > 0 ? children : undefined,
      });
    }
    // Sort directories first, then alphabetically
    return result.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  return mapToArray(root);
}
