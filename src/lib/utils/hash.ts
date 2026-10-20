import crypto from "crypto";
import { Readable } from "stream";

export async function calculateSha256(
  streamOrBuffer: Readable | Buffer
): Promise<string> {
  const hash = crypto.createHash("sha256");

  if (Buffer.isBuffer(streamOrBuffer)) {
    hash.update(streamOrBuffer);
    return hash.digest("hex");
  }

  return new Promise((resolve, reject) => {
    streamOrBuffer.on("data", (chunk) => hash.update(chunk));
    streamOrBuffer.on("end", () => resolve(hash.digest("hex")));
    streamOrBuffer.on("error", reject);
  });
}
