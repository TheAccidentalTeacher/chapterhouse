/**
 * POST /api/course-assets/generate-anchor
 *
 * Queues a generate_bundle_anchor job for a single bundle.
 * The worker generates ONE anchor image based on the bundle's grade-level animal theme
 * (G1=dogs, G2=dinosaurs, etc.) and the bundle title as the topic.
 *
 * The resulting image is stored in bundles.content.anchor_image_url and
 * slides_generated is set to 1 so the Images status dot turns green.
 */

import { Client } from "@upstash/qstash";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { createCourseAdmin } from "@/lib/course-supabase";
import { z } from "zod";

const schema = z.object({
  bundleId: z.string().min(1),
  forceRegen: z.boolean().optional(), // when true, regenerates even if anchor already exists
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

  const { bundleId, forceRegen } = parsed.data;

  // Validate bundle exists in CoursePlatform
  let courseSupabase;
  try {
    courseSupabase = createCourseAdmin();
  } catch {
    return Response.json({ error: "CoursePlatform DB not configured" }, { status: 503 });
  }

  const { data: bundle, error: bundleErr } = await courseSupabase
    .from("bundles")
    .select("id, title, grade")
    .eq("id", bundleId)
    .single();

  if (bundleErr || !bundle) {
    return Response.json({ error: `Bundle not found: ${bundleId}` }, { status: 404 });
  }

  // Create job in Chapterhouse Supabase
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return Response.json({ error: "Chapterhouse DB not available" }, { status: 503 });
  }

  const bundleTitle = (bundle as { title?: string }).title ?? bundleId;
  const grade = (bundle as { grade?: number }).grade ?? 1;

  const { data: job, error: jobErr } = await supabase
    .from("jobs")
    .insert({
      type: "generate_bundle_anchor",
      label: `Anchor G${grade}: ${bundleTitle}`,
      input_payload: {
        bundleId,
        ...(forceRegen ? { forceRegen: true } : {}),
      },
      status: "queued",
    })
    .select()
    .single();

  if (jobErr || !job) {
    console.error("[generate-anchor] DB insert error:", jobErr);
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
        body: { jobId: job.id, type: "generate_bundle_anchor", payload: job.input_payload },
        retries: 2,
      });
    } catch (e) {
      console.error("[generate-anchor] QStash publish error:", e);
      // Job is queued in DB — worker can still be triggered manually if QStash fails
    }
  } else {
    console.warn("[generate-anchor] QStash or worker URL not configured — job queued but not dispatched");
  }

  return Response.json({ jobId: job.id, bundleId, grade, status: "queued" });
}
