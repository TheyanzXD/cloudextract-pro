import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const LOCAL_BLOB_DIR = path.join(process.cwd(), ".local-blobs");

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const name = url.searchParams.get("name");
    if (!name) {
      return new Response("Missing name parameter", { status: 400 });
    }

    const safeName = path.basename(name);
    const filePath = path.join(LOCAL_BLOB_DIR, safeName);
    const data = await fs.readFile(filePath);

    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    return new Response("File not found", { status: 404 });
  }
}
