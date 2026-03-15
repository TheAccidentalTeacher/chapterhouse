import { updateProgress } from "../lib/progress";

export interface SocialBatchPayload {
  trigger: string;
  brands: string[];
  platforms: string[];
  count_per_combo: number;
  topic_seed?: string;
}

export async function runSocialBatch(jobId: string, payload: SocialBatchPayload) {
  const baseUrl = process.env.CHAPTERHOUSE_URL ?? "https://chapterhouse.vercel.app";

  await updateProgress(jobId, 10, "Triggering social post generation...", "running");

  const res = await fetch(`${baseUrl}/api/social/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, job_id: jobId }),
  });

  if (!res.ok) {
    const detail = await res.text();
    await updateProgress(jobId, 0, `Generation API failed: ${res.status}`, "failed", undefined, detail);
    return;
  }

  const data = await res.json() as { count?: number };
  const count = data.count ?? 0;
  await updateProgress(jobId, 100, `Generated ${count} posts — pending review`, "completed", { count });
}
