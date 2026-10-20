import { NextResponse } from "next/server";
import { getShareByToken, getJobById, getExtractedFilesByJobId } from "@/lib/db/repository";
import { buildFileTree } from "@/lib/utils/format";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { shareId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get("password");

    const share = await getShareByToken(params.shareId);
    if (!share) {
      return NextResponse.json({ error: "Share link not found or expired" }, { status: 404 });
    }

    // Check if password protected
    if (share.password_hash) {
      if (!password) {
        return NextResponse.json({
          isPasswordProtected: true,
          expiresAt: share.expires_at,
        });
      }

      const isMatch = await bcrypt.compare(password, share.password_hash);
      if (!isMatch) {
        return NextResponse.json(
          { error: "Incorrect password", isPasswordProtected: true },
          { status: 401 }
        );
      }
    }

    const job = await getJobById(share.job_id);
    if (!job) {
      return NextResponse.json({ error: "Associated job not found" }, { status: 404 });
    }

    const files = await getExtractedFilesByJobId(share.job_id);
    const fileTree = buildFileTree(files);

    return NextResponse.json({
      share: {
        id: share.id,
        expiresAt: share.expires_at,
        viewsCount: share.views_count,
        isPasswordProtected: Boolean(share.password_hash),
      },
      job: {
        id: job.id,
        fileName: job.file_name,
        fileSize: job.file_size,
        mimeType: job.mime_type,
        blobUrl: job.blob_url,
        status: job.status,
        isArchive: job.is_archive,
        extractedFilesCount: job.extracted_files_count,
        extractedTotalSize: job.extracted_total_size,
        createdAt: job.created_at,
      },
      files,
      fileTree,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve shared content" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { shareId: string } }
) {
  try {
    const body = await request.json();
    const { password } = body;

    const share = await getShareByToken(params.shareId);
    if (!share) {
      return NextResponse.json({ error: "Share link not found or expired" }, { status: 404 });
    }

    if (!share.password_hash) {
      return NextResponse.json({ success: true, verified: true });
    }

    if (!password) {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(password, share.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    return NextResponse.json({ success: true, verified: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to verify share password" },
      { status: 500 }
    );
  }
}
