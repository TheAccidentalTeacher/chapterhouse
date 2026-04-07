import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { Client } from "@upstash/qstash";

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 503 });

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      type: "social_batch",
      label: `Weekly social batch — week of ${new Date().toLocaleDateString()}`,
      input_payload: {
        trigger: "weekly_cron",
        brands: ["ncho", "somersschool"],
        platforms: ["facebook", "instagram", "linkedin", "pinterest"],
        count_per_combo: 2,
      },
      status: "queued",
    })
    .select()
    .single();

  if (error || !job) return Response.json({ error: "Job creation failed" }, { status: 500 });

  const qstashToken = process.env.QSTASH_TOKEN;
  const workerUrl = process.env.RAILWAY_WORKER_URL;

  if (qstashToken && workerUrl) {
    const qstash = new Client({ token: qstashToken });
    await qstash.publishJSON({
      url: `${workerUrl}/process-job`,
      body: { jobId: job.id, type: "social_batch", payload: job.input_payload },
    });
  } else {
    console.warn("[cron/social-weekly] QStash/Railway env vars missing — job queued but not dispatched");
  }

  return Response.json({ jobId: job.id });
}
