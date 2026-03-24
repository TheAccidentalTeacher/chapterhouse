import { Client } from "@upstash/qstash";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { createCourseAdmin } from "@/lib/course-supabase";
import { z } from "zod";

const schema = z.object({
  bundleId: z.string().min(1),
  characterId: z.string().optional(), // optional character UUID — used for Replicate LoRA/bridge reference injection
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { bundleId, characterId } = parsed.data;

  // Validate bundle exists in CoursePlatform
  let courseSupabase;
  try {
    courseSupabase = createCourseAdmin();
  } catch {
    return Response.json(
      { error: "CoursePlatform DB not configured" },
      { status: 503 }
    );
  }

  const { data: bundle, error: bundleErr } = await courseSupabase
    .from("bundles")
    .select("id, title, slides_count, slides_generated")
    .eq("id", bundleId)
    .single();

  if (bundleErr || !bundle) {
    return Response.json(
      { error: `Bundle not found: ${bundleId}` },
      { status: 404 }
    );
  }

  // Create job in Chapterhouse Supabase
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return Response.json({ error: "Chapterhouse DB not available" }, { status: 503 });
  }

  const { data: job, error: jobErr } = await supabase
    .from("jobs")
    .insert({
      type: "course_slide_images",
      label: `Slides: ${(bundle as { title?: string }).title ?? bundleId}`,
      input_payload: { bundleId, ...(characterId ? { characterId } : {}) },
      status: "queued",
    })
    .select()
    .single();

  if (jobErr || !job) {
    console.error("[generate-slides] DB error:", jobErr);
    return Response.json({ error: "Failed to create job" }, { status: 500 });
  }

  // Publish to QStash → Railway worker
  const workerUrl = process.env.RAILWAY_WORKER_URL;
  const qstashToken = process.env.QSTASH_TOKEN;

  if (qstashToken && workerUrl) {
    try {
      const qstash = new Client({ token: qstashToken });
      await qstash.publishJSON({
        url: `${workerUrl}/process-job`,
        body: {
          jobId: job.id,
          type: "course_slide_images",
          payload: job.input_payload,
        },
        retries: 3,
      });
    } catch (qErr) {
      console.error("[generate-slides] QStash publish error:", qErr);
      // Job is already queued in Supabase — don't fail the request
    }
  }

  return Response.json({
    jobId: job.id,
    bundleId,
    label: job.label as string,
  });
}
