/**
 * POST /api/lessons/pipeline
 *
 * Triggers the full audio + video generation pipeline for a lesson bundle.
 * Creates a Chapterhouse Jobs record, publishes to QStash → Railway worker
 * which runs runLessonVideoPipeline() (7 audio segments + 7 video segments).
 *
 * Required: CoursePlatform Supabase must have `segment_assets JSONB DEFAULT '{}'`
 * on the bundles table. Run this migration if not already applied:
 *
 *   ALTER TABLE bundles ADD COLUMN IF NOT EXISTS segment_assets JSONB NOT NULL DEFAULT '{}';
 *   ALTER TABLE bundles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
 *
 * Body:
 *   bundleId     string   — CoursePlatform bundles.id (required)
 *   engine       string   — "azure" | "elevenlabs" (default: "azure")
 *   voice        string?  — TTS voice name (default: en-US-AriaNeural for Azure)
 *   speed        number?  — TTS rate 0.5–2.0 (default: 1.05)
 *   motionPreset string?  — "zoom_in" | "zoom_out" | "pan_left" | "pan_right" | "static"
 *   segments     string[] — subset of segments to process (default: all 7)
 */

import { Client } from "@upstash/qstash";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { createCourseAdmin } from "@/lib/course-supabase";
import { z } from "zod";

const VALID_SEGMENTS = [
  "intro",
  "section-1",
  "section-2",
  "section-3",
  "section-4",
  "section-5",
  "conclusion",
] as const;

const schema = z.object({
  bundleId: z.string().min(1),
  engine: z.enum(["azure", "elevenlabs"]).default("azure"),
  voice: z.string().optional(),
  speed: z.number().min(0.5).max(2.0).default(1.05),
  motionPreset: z
    .enum(["zoom_in", "zoom_out", "pan_left", "pan_right", "static"])
    .default("zoom_in"),
  segments: z
    .array(z.enum(VALID_SEGMENTS))
    .optional()
    .default([...VALID_SEGMENTS]),
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

  const { bundleId, engine, voice, speed, motionPreset, segments } = parsed.data;

  // Validate bundle exists in CoursePlatform
  let courseSupabase;
  try {
    courseSupabase = createCourseAdmin();
  } catch {
    return Response.json(
      { error: "CoursePlatform DB not configured (COURSE_SUPABASE_URL missing)" },
      { status: 503 }
    );
  }

  const { data: bundle, error: bundleErr } = await courseSupabase
    .from("bundles")
    .select("id, title")
    .eq("id", bundleId)
    .single<{ id: string; title?: string }>();

  if (bundleErr || !bundle) {
    return Response.json({ error: `Bundle not found: ${bundleId}` }, { status: 404 });
  }

  // Create job in Chapterhouse
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return Response.json({ error: "Chapterhouse DB not available" }, { status: 503 });
  }

  const jobLabel = `Pipeline: ${bundle.title ?? bundleId} (${segments.length} segments)`;

  const { data: job, error: jobErr } = await supabase
    .from("jobs")
    .insert({
      type: "lesson_video_pipeline",
      label: jobLabel,
      status: "queued",
      progress: 0,
      input_payload: {
        bundleId,
        engine,
        ...(voice ? { voice } : {}),
        speed,
        motionPreset,
        segments,
      },
    })
    .select()
    .single<{ id: string }>();

  if (jobErr || !job) {
    console.error("[lessons/pipeline] Failed to create job:", jobErr);
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
          type: "lesson_video_pipeline",
          payload: {
            bundleId,
            engine,
            ...(voice ? { voice } : {}),
            speed,
            motionPreset,
            segments,
          },
        },
        retries: 1, // Video jobs are long — don't auto-retry on timeout
      });
    } catch (err) {
      console.error("[lessons/pipeline] QStash publish failed:", err);
      // Job is created but not queued — mark as failed
      await supabase
        .from("jobs")
        .update({ status: "failed", error: "QStash publish failed" })
        .eq("id", job.id);
      return Response.json({ error: "Failed to queue job" }, { status: 500 });
    }
  } else {
    console.warn("[lessons/pipeline] QStash not configured — job created but not queued");
  }

  return Response.json({
    jobId: job.id,
    bundleId,
    label: jobLabel,
    segments,
    engine,
    motionPreset,
    status: "queued",
  });
}
