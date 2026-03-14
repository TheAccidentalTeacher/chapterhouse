import { Client } from "@upstash/qstash";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { z } from "zod";

const jobSchema = z.object({
  type: z.enum(["curriculum_factory", "research_batch", "council_session"] as const),
  label: z.string().min(1).max(200),
  payload: z.record(z.string(), z.unknown()),
});

export async function POST(req: Request) {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = jobSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { type, label, payload } = parsed.data;

  // Insert job record into Supabase
  const { data: job, error: dbError } = await supabase
    .from("jobs")
    .insert({
      type,
      label,
      input_payload: payload,
      status: "queued",
    })
    .select()
    .single();

  if (dbError || !job) {
    console.error("[jobs/create] DB error:", dbError);
    return Response.json({ error: "Failed to create job" }, { status: 500 });
  }

  // Publish to QStash — Railway worker picks this up
  const workerUrl = process.env.RAILWAY_WORKER_URL;
  const qstashToken = process.env.QSTASH_TOKEN;

  if (workerUrl && qstashToken) {
    try {
      const qstash = new Client({ token: qstashToken });
      await qstash.publishJSON({
        url: `${workerUrl}/process-job`,
        body: { jobId: job.id, type: job.type, payload: job.input_payload },
        retries: 3,
      });
    } catch (qErr) {
      console.error("[jobs/create] QStash publish error:", qErr);
      // Job is already in Supabase — don't fail the request, but log it
      // The job will sit in 'queued' state until manually retried
    }
  } else {
    console.warn("[jobs/create] RAILWAY_WORKER_URL or QSTASH_TOKEN not set — job queued in DB only");
  }

  return Response.json({ jobId: job.id, status: "queued" }, { status: 201 });
}
