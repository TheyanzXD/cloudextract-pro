import { NextResponse } from "next/server";
import { getExpiredJobs, getExtractedFilesByJobId, deleteJob } from "@/lib/db/repository";
import { deleteMultipleFromStorage } from "@/lib/storage/blob-service";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // 1. Verify Vercel Cron authorization header
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    // 2. Fetch all expired jobs
    const expiredJobs = await getExpiredJobs();

    if (expiredJobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No expired jobs found to clean up.",
        deletedCount: 0,
      });
    }

    let deletedBlobsCount = 0;
    const deletedJobIds: string[] = [];

    // 3. Process cleanup per expired job
    for (const job of expiredJobs) {
      try {
        const files = await getExtractedFilesByJobId(job.id);
        const blobUrls = files.map((f) => f.blob_url).filter(Boolean);

        if (job.blob_url) {
          blobUrls.push(job.blob_url);
        }

        // Delete blobs in storage
        if (blobUrls.length > 0) {
          await deleteMultipleFromStorage(blobUrls);
          deletedBlobsCount += blobUrls.length;
        }

        // Delete from database
        await deleteJob(job.id);
        deletedJobIds.push(job.id);
      } catch (jobErr) {
        console.error(`Failed to clean up expired job ${job.id}:`, jobErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedJobIds.length} expired jobs and ${deletedBlobsCount} associated blobs.`,
      deletedJobsCount: deletedJobIds.length,
      deletedBlobsCount,
      deletedJobIds,
    });
  } catch (error: any) {
    console.error("Cron cleanup error:", error);
    return NextResponse.json(
      { error: error.message || "Cron cleanup failed" },
      { status: 500 }
    );
  }
}
