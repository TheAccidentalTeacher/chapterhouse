/**
 * lesson-video-pipeline.ts
 *
 * Railway worker job: orchestrate the full 7-segment audio + video pipeline
 * for a single lesson bundle.
 *
 * The pipeline runs segments sequentially (audio first for all, then video for all)
 * to avoid saturating Railway memory with concurrent FFmpeg processes.
 *
 * Segments: intro → section-1 → section-2 → section-3 → section-4 → section-5 → conclusion
 *   Phase 1: Generate all 7 audio segments (Azure TTS → Cloudinary)
 *   Phase 2: Generate all 7 video segments (FFmpeg → Cloudinary)
 *
 * Total time estimate (Railway 8 vCPU):
 *   TTS: ~1-2s per segment × 7 = ~15s
 *   Video encode: ~60-90s per segment × 7 = ~10 minutes
 *   → Full lesson: ~12-15 minutes per lesson
 *   24 lessons: could be batched in parallel (separate orchestrator job per bundle)
 *
 * Payload:
 *   bundleId     — CoursePlatform bundles.id
 *   engine       — "azure" | "elevenlabs" (default: "azure")
 *   voice        — TTS voice name (default: "en-US-AriaNeural" for Azure)
 *   speed        — TTS speech rate 0.5–2.0 (default: 1.05)
 *   motionPreset — "zoom_in" | "zoom_out" | "pan_left" | "pan_right" | "static" (default: "zoom_in")
 *   segments     — optional subset list (default: all 7)
 */

import {
  runGenerateSegmentAudio,
  type GenerateSegmentAudioPayload,
} from "./generate-segment-audio";
import {
  runGenerateSegmentVideo,
  type GenerateSegmentVideoPayload,
} from "./generate-segment-video";
import { updateProgress } from "../lib/progress";
import { supabase as chapterhouseSupabase } from "../lib/supabase";

// ── Job payload ───────────────────────────────────────────────────────────────

type SegmentName = "intro" | "section-1" | "section-2" | "section-3" | "section-4" | "section-5" | "conclusion";

export interface LessonVideoPipelinePayload {
  bundleId: string;
  engine?: "azure" | "elevenlabs";
  voice?: string;
  speed?: number;
  motionPreset?: "zoom_in" | "zoom_out" | "pan_left" | "pan_right" | "static";
  segments?: SegmentName[];
}

const ALL_SEGMENTS: SegmentName[] = [
  "intro",
  "section-1",
  "section-2",
  "section-3",
  "section-4",
  "section-5",
  "conclusion",
];

// ── Sub-job helpers ───────────────────────────────────────────────────────────
// These create ephemeral Chapterhouse job records to track each sub-step,
// then run the job inline (not via QStash — we're already inside a worker process).

async function createSubJob(label: string, type: string): Promise<string> {
  const { data, error } = await chapterhouseSupabase
    .from("jobs")
    .insert({
      type,
      label,
      status: "queued",
      progress: 0,
      input_payload: {},
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    throw new Error(`Failed to create sub-job: ${error?.message ?? "Unknown"}`);
  }
  return data.id;
}

// ── Main orchestrator ─────────────────────────────────────────────────────────

export async function runLessonVideoPipeline(
  jobId: string,
  payload: LessonVideoPipelinePayload
): Promise<void> {
  const {
    bundleId,
    engine = "azure",
    voice,
    speed = 1.05,
    motionPreset = "zoom_in",
    segments = ALL_SEGMENTS,
  } = payload;

  const total = segments.length * 2; // audio + video per segment
  let completed = 0;

  const pct = () => Math.round((completed / total) * 90) + 5; // 5–95% range

  await updateProgress(
    jobId,
    5,
    `Starting pipeline for ${bundleId} — ${segments.length} segments × audio + video`
  );

  // ── Phase 1: Generate all audio segments ─────────────────────────────────

  await updateProgress(jobId, 6, `Phase 1: Generating ${segments.length} audio segments (Azure TTS)…`);

  for (const segment of segments) {
    const label = `Audio: ${bundleId}/${segment}`;
    let subJobId: string;

    try {
      subJobId = await createSubJob(label, "generate_segment_audio");
    } catch (err) {
      console.warn(`[pipeline] Could not create sub-job for ${segment} audio — running without tracking`);
      subJobId = `inline-${Date.now()}`;
    }

    try {
      const audioPayload: GenerateSegmentAudioPayload = {
        bundleId,
        segment,
        engine,
        voice,
        speed,
      };
      await runGenerateSegmentAudio(subJobId, audioPayload);
      completed++;
      await updateProgress(
        jobId,
        pct(),
        `✅ Audio done: ${segment} (${completed}/${total})`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[pipeline] Audio failed for ${segment}: ${msg}`);
      await updateProgress(
        jobId,
        pct(),
        `⚠️ Audio failed for "${segment}": ${msg} — continuing…`
      );
      completed++; // count it so progress keeps moving
    }
  }

  // ── Phase 2: Generate all video segments ─────────────────────────────────

  await updateProgress(jobId, pct(), `Phase 2: Generating ${segments.length} video segments (FFmpeg)…`);

  for (const segment of segments) {
    const label = `Video: ${bundleId}/${segment}`;
    let subJobId: string;

    try {
      subJobId = await createSubJob(label, "generate_segment_video");
    } catch {
      subJobId = `inline-${Date.now()}`;
    }

    try {
      const videoPayload: GenerateSegmentVideoPayload = {
        bundleId,
        segment,
        motionPreset,
      };
      await runGenerateSegmentVideo(subJobId, videoPayload);
      completed++;
      await updateProgress(
        jobId,
        pct(),
        `✅ Video done: ${segment} (${completed}/${total})`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[pipeline] Video failed for ${segment}: ${msg}`);
      await updateProgress(
        jobId,
        pct(),
        `⚠️ Video failed for "${segment}": ${msg} — continuing…`
      );
      completed++;
    }
  }

  await updateProgress(
    jobId,
    100,
    `✅ Pipeline complete — ${bundleId} (${segments.length} segments processed)`,
    "completed",
    {
      bundleId,
      segments,
      engine,
      motionPreset,
      completedAt: new Date().toISOString(),
    }
  );

  console.log(`[lesson-video-pipeline] Complete: ${bundleId}`);
}
