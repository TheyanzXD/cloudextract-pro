import { NextResponse } from "next/server";
import { getJobById, deleteJob, getExtractedFilesByJobId } from "@/lib/db/repository";
import { deleteFromStorage, deleteMultipleFromStorage } from "@/lib/storage/blob-service";
import { buildFileTree } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const job = await getJobById(params.id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const files = await getExtractedFilesByJobId(params.id);
    const fileTree = buildFileTree(files);

    return NextResponse.json({
      job,
      files,
      fileTree,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve job" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const job = await getJobById(params.id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // 1. Fetch extracted files to delete their blobs
    const files = await getExtractedFilesByJobId(params.id);
    const blobUrls = files.map((f) => f.blob_url).filter(Boolean);

    // Add main job blob url
    if (job.blob_url) {
      blobUrls.push(job.blob_url);
    }

    // 2. Delete blobs from Vercel storage
    await deleteMultipleFromStorage(blobUrls);

    // 3. Delete from DB
    await deleteJob(params.id);

    return NextResponse.json({ success: true, message: "Job and all assets deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete job" },
      { status: 500 }
    );
  }
}
