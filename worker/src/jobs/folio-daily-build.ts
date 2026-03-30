import { updateProgress } from "../lib/progress";

export async function runFolioDailyBuild(jobId: string, payload: Record<string, unknown>) {
  await updateProgress(jobId, 10, "Starting Folio daily build...", "running");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://chapterhouse.vercel.app";
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    throw new Error("CRON_SECRET env var is required for Folio build worker");
  }

  const date = typeof payload.date === "string" ? payload.date : undefined;

  await updateProgress(jobId, 30, "Calling Folio build endpoint...", "running");

  const res = await fetch(`${baseUrl}/api/folio/trigger`, {
    method: "POST",
    headers: {
      "authorization": `Bearer ${cronSecret}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(date ? { date } : {}),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(`Folio build endpoint returned ${res.status}: ${errText}`);
  }

  const data = await res.json() as { entry_date?: string; summary?: string; tokens_used?: number };

  await updateProgress(
    jobId,
    100,
    `Folio built for ${data.entry_date ?? "unknown date"} — ${data.tokens_used ?? 0} tokens used`,
    "completed",
    data,
  );
}
