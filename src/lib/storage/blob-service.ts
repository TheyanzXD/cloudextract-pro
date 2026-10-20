import { put, del, head } from "@vercel/blob";
import { Readable } from "stream";
import fs from "fs/promises";
import path from "path";

const LOCAL_BLOB_DIR = path.join(process.cwd(), ".local-blobs");
const hasVercelBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/**
 * Uploads a readable stream or buffer to storage (Vercel Blob or local dev fallback)
 */
export async function uploadToStorage(
  pathname: string,
  body: Buffer | ReadableStream | Readable,
  contentType: string = "application/octet-stream"
): Promise<{ url: string; pathname: string; size?: number }> {
  if (hasVercelBlob) {
    const blob = await put(pathname, body, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });
    return {
      url: blob.url,
      pathname: blob.pathname,
    };
  }

  // Local filesystem fallback for dev without Vercel Blob configured
  await fs.mkdir(LOCAL_BLOB_DIR, { recursive: true });
  const safeFilename = pathname.replace(/\//g, "___");
  const filePath = path.join(LOCAL_BLOB_DIR, safeFilename);

  let buffer: Buffer;
  if (Buffer.isBuffer(body)) {
    buffer = body;
  } else if (body instanceof Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    buffer = Buffer.concat(chunks);
  } else {
    const reader = (body as ReadableStream).getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    buffer = Buffer.concat(chunks);
  }

  await fs.writeFile(filePath, buffer);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    url: `${appUrl}/api/blob-local?name=${encodeURIComponent(safeFilename)}`,
    pathname,
    size: buffer.length,
  };
}

/**
 * Deletes a single blob from storage
 */
export async function deleteFromStorage(urlOrPathname: string): Promise<void> {
  if (hasVercelBlob) {
    try {
      await del(urlOrPathname);
    } catch (err) {
      console.warn("Failed to delete Vercel Blob:", err);
    }
    return;
  }

  try {
    const url = new URL(urlOrPathname, "http://localhost");
    const name = url.searchParams.get("name") || path.basename(urlOrPathname);
    const filePath = path.join(LOCAL_BLOB_DIR, name);
    await fs.unlink(filePath);
  } catch (err) {
    // Ignore error if file doesn't exist
  }
}

/**
 * Batch delete multiple blobs
 */
export async function deleteMultipleFromStorage(urls: string[]): Promise<void> {
  if (urls.length === 0) return;
  if (hasVercelBlob) {
    try {
      await del(urls);
    } catch (err) {
      console.warn("Failed batch delete from Vercel Blob:", err);
    }
    return;
  }

  for (const u of urls) {
    await deleteFromStorage(u);
  }
}
