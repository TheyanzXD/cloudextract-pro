import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit/ip-limiter";
import { createJob, updateJob } from "@/lib/db/repository";

export async function POST(request: Request): Promise<NextResponse> {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip);

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait a moment before uploading again." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": rateLimit.limit.toString(),
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          "X-RateLimit-Reset": rateLimit.reset.toString(),
        },
      }
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let payloadData: any = {};
        if (clientPayload) {
          try {
            payloadData = JSON.parse(clientPayload);
          } catch (e) {
            // Ignore parse error
          }
        }

        const fileName = payloadData.fileName || pathname;
        const fileSize = payloadData.fileSize || 0;
        const mimeType = payloadData.mimeType || "application/octet-stream";
        const isArchive = payloadData.isArchive || false;
        const sha256 = payloadData.sha256 || undefined;
        const retentionHours = payloadData.retentionHours || 24;

        // Max upload size validation (e.g. 500MB)
        const maxSizeBytes = parseInt(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB || "500", 10) * 1024 * 1024;
        if (fileSize > maxSizeBytes) {
          throw new Error(`File size exceeds maximum allowed upload size of ${process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB || "500"}MB`);
        }

        // Create pre-upload Job record
        const job = await createJob({
          fileName,
          fileSize,
          mimeType,
          blobUrl: "", // Populated in onUploadCompleted
          blobPathname: pathname,
          isArchive,
          sha256Hash: sha256,
          ipAddress: ip,
          retentionHours,
        });

        return {
          allowedContentTypes: ["*/*"],
          tokenPayload: JSON.stringify({
            jobId: job.id,
            isArchive,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          if (!tokenPayload) return;
          const { jobId, isArchive } = JSON.parse(tokenPayload);

          await updateJob(jobId, {
            blob_url: blob.url,
            status: isArchive ? "queued" : "done",
            progress: isArchive ? 0 : 100,
          });

          // If it's an archive, trigger serverless extraction asynchronously
          if (isArchive) {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
            // Fire-and-forget extraction request to the fluid compute route
            fetch(`${appUrl}/api/extract`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ jobId }),
            }).catch((err) => {
              console.error(`Failed to auto-trigger extraction for job ${jobId}:`, err);
            });
          }
        } catch (error) {
          console.error("Error in onUploadCompleted:", error);
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process upload token" },
      { status: 400 }
    );
  }
}
