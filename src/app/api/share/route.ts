import { NextResponse } from "next/server";
import { createShare, getJobById } from "@/lib/db/repository";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jobId, password, expiresInHours = 24 } = body;

    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    let passwordHash: string | null = null;
    if (password && password.trim().length > 0) {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const share = await createShare({
      jobId,
      passwordHash,
      expiresInHours: Number(expiresInHours),
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const shareUrl = `${appUrl}/share/${share.share_token}`;

    return NextResponse.json({
      success: true,
      shareUrl,
      token: share.share_token,
      expiresAt: share.expires_at,
      hasPassword: Boolean(passwordHash),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create share link" },
      { status: 500 }
    );
  }
}
