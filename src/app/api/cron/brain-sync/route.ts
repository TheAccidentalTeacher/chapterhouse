import { NextResponse } from "next/server";

/**
 * GET /api/cron/brain-sync
 * Vercel cron — runs daily at noon UTC (4am Alaska).
 * Calls /api/brain/sync to pull latest from scott-brain GitHub repo.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const brainSyncKey = process.env.BRAIN_SYNC_KEY;
  if (!brainSyncKey) {
    return NextResponse.json(
      { error: "BRAIN_SYNC_KEY not configured" },
      { status: 503 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://chapterhouse.vercel.app";

  const res = await fetch(`${appUrl}/api/brain/sync`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${brainSyncKey}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  return NextResponse.json(data);
}
