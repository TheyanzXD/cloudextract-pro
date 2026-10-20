import { NextResponse } from "next/server";
import { getJobById, updateJob } from "@/lib/db/repository";
import { processArchiveExtraction } from "@/lib/extractor/safe-extractor";

// Configure maximum allowed runtime for Vercel Serverless Function
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jobId, password } = body;

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status === "done") {
      return NextResponse.json({
        message: "Job already extracted",
        job,
      });
    }

    if (job.status === "extracting") {
      return NextResponse.json({
        message: "Extraction is already in progress",
        job,
      });
    }

    // Run extraction with safe guards
    const result = await processArchiveExtraction({
      jobId: job.id,
      blobUrl: job.blob_url,
      fileName: job.file_name,
      fileSize: job.file_size,
      password,
    });

    if (result.requiresPassword) {
      return NextResponse.json(
        {
          requiresPassword: true,
          message: "This archive is password-protected. Please provide password to extract.",
        },
        { status: 401 }
      );
    }

    const updatedJob = await getJobById(jobId);
    return NextResponse.json({
      success: true,
      job: updatedJob,
      extractedCount: result.totalFiles,
      extractedBytes: result.totalExtractedBytes,
    });
  } catch (error: any) {
    console.error("[ExtractRoute] Error extracting archive:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to extract archive",
        code: error.code || "EXTRACTION_FAILED",
      },
      { status: 500 }
    );
  }
}
