import { getJobById } from "@/lib/db/repository";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout;

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      let lastStatus = "";
      let lastProgress = -1;

      const checkStatus = async () => {
        try {
          const job = await getJobById(params.id);
          if (!job) {
            sendEvent("error", { message: "Job not found" });
            clearInterval(intervalId);
            controller.close();
            return;
          }

          if (job.status !== lastStatus || job.progress !== lastProgress) {
            lastStatus = job.status;
            lastProgress = job.progress;
            sendEvent("job_update", job);
          }

          if (job.status === "done" || job.status === "failed") {
            clearInterval(intervalId);
            controller.close();
          }
        } catch (err: any) {
          sendEvent("error", { message: err.message });
          clearInterval(intervalId);
          controller.close();
        }
      };

      // Initial check
      await checkStatus();

      // Poll DB status every 1.5 seconds for real-time SSE updates
      intervalId = setInterval(checkStatus, 1500);

      // Heartbeat comment every 15s to prevent proxy/Vercel timeouts
      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(": keep-alive\n\n"));
      }, 15000);

      request.signal.addEventListener("abort", () => {
        clearInterval(intervalId);
        clearInterval(keepAlive);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
