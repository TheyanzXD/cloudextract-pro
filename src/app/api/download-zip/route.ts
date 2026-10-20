import { getJobById, getExtractedFilesByJobId } from "@/lib/db/repository";
import archiver from "archiver";
import { PassThrough, Readable } from "stream";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const subFolder = searchParams.get("folder") || "";

    if (!jobId) {
      return new Response("Missing jobId parameter", { status: 400 });
    }

    const job = await getJobById(jobId);
    if (!job) {
      return new Response("Job not found", { status: 404 });
    }

    let files = await getExtractedFilesByJobId(jobId);

    // If subfolder filter requested
    if (subFolder) {
      const prefix = subFolder.endsWith("/") ? subFolder : `${subFolder}/`;
      files = files.filter((f) => f.path.startsWith(prefix));
    }

    // Filter out directories (only include files with valid blob_url)
    const fileEntries = files.filter((f) => !f.is_directory && f.blob_url);

    if (fileEntries.length === 0) {
      return new Response("No files found to download", { status: 404 });
    }

    const archive = archiver("zip", {
      zlib: { level: 5 }, // Balanced compression speed vs CPU
    });

    const passThrough = new PassThrough();
    archive.pipe(passThrough);

    // Stream download files asynchronously into zip
    (async () => {
      try {
        for (const file of fileEntries) {
          try {
            const resp = await fetch(file.blob_url);
            if (resp.ok && resp.body) {
              let relativeEntryPath = file.path;
              if (subFolder && relativeEntryPath.startsWith(subFolder)) {
                relativeEntryPath = relativeEntryPath.substring(subFolder.length).replace(/^\/+/, "");
              }

              // @ts-ignore Web ReadableStream conversion to Node Readable
              const nodeStream = Readable.fromWeb(resp.body);
              archive.append(nodeStream, { name: relativeEntryPath });
            }
          } catch (fetchErr) {
            console.warn(`Failed to include file in zip stream: ${file.path}`, fetchErr);
          }
        }
        await archive.finalize();
      } catch (err) {
        console.error("Error finalizing archive stream:", err);
        archive.abort();
      }
    })();

    const zipFilename = subFolder
      ? `${subFolder.replace(/[^a-zA-Z0-9_-]/g, "_")}.zip`
      : `${job.file_name.replace(/\.[^/.]+$/, "")}_extracted.zip`;

    // Convert PassThrough to Web ReadableStream
    // @ts-ignore
    const webStream = Readable.toWeb(passThrough);

    return new Response(webStream as any, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(zipFilename)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Error generating zip stream:", error);
    return new Response(error.message || "Failed to generate zip stream", { status: 500 });
  }
}
