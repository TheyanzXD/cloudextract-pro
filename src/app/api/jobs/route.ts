import { NextResponse } from "next/server";
import { listJobs, createJob } from "@/lib/db/repository";
import { JobStatus } from "@/lib/types/job";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit/ip-limiter";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);
    const status = (searchParams.get("status") as JobStatus) || undefined;
    const search = searchParams.get("search") || undefined;

    const result = await listJobs({ limit, offset, status, search });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to list jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await request.json();
    const { fileName, fileSize, mimeType, blobUrl, blobPathname, isArchive, sha256Hash, retentionHours } = body;

    if (!fileName || !blobUrl) {
      return NextResponse.json({ error: "fileName and blobUrl are required" }, { status: 400 });
    }

    const job = await createJob({
      fileName,
      fileSize: fileSize || 0,
      mimeType: mimeType || "application/octet-stream",
      blobUrl,
      blobPathname: blobPathname || fileName,
      isArchive: Boolean(isArchive),
      sha256Hash,
      ipAddress: ip,
      retentionHours: retentionHours || 24,
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create job" },
      { status: 500 }
    );
  }
}
