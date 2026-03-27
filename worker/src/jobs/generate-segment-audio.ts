/**
 * generate-segment-audio.ts
 *
 * Railway worker job: generate a per-segment voiceover MP3 for a lesson bundle.
 *
 * Flow:
 *   1. Load bundle JSON from CoursePlatform Supabase
 *   2. Extract the script text for the requested segment
 *   3. Call Azure Speech TTS REST API → raw MP3 bytes
 *   4. Upload MP3 to Cloudinary (video resource type)
 *   5. Patch segment_assets.{segment}.audio_url in CoursePlatform bundles table
 *   6. Increment bundles.audio_generated counter
 *
 * Segments: "intro" | "section-1" | "section-2" | "section-3" | "section-4" | "section-5" | "conclusion"
 *
 * Voice defaults:
 *   engine : "azure"  (free tier: 500 K chars/month — effectively $0 for 24-lesson batch)
 *   voice  : "en-US-AriaNeural"  (warm, clear, K-5 appropriate)
 *   speed  : +5%  (slightly faster reads better in narration)
 *
 * ElevenLabs is available as an alternative engine but is NOT recommended for bulk generation.
 * The first-month batch burned 110 K credits and failed — Azure is the default.
 */

import { createClient } from "@supabase/supabase-js";
import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { updateProgress } from "../lib/progress";
import { uploadAudioFile } from "../lib/cloudinary";

// ── Job payload ───────────────────────────────────────────────────────────────

export interface GenerateSegmentAudioPayload {
  bundleId: string;
  segment: "intro" | "section-1" | "section-2" | "section-3" | "section-4" | "section-5" | "conclusion";
  engine?: "azure" | "elevenlabs";
  voice?: string;
  speed?: number; // 0.5 – 2.0, default 1.05
}

// ── CoursePlatform types ──────────────────────────────────────────────────────

interface Slide {
  at: number;
  image_url?: string | null;
  label?: string;
  emoji?: string;
  bg?: string;
}

interface Section {
  heading?: string;
  title?: string;
  script: string;
  slides: Slide[];
  section_activity?: unknown;
}

interface LessonScript {
  intro: string;
  intro_slides: Slide[];
  sections: Section[];
  conclusion: string;
}

interface BundleContent {
  lesson_script: LessonScript;
  [key: string]: unknown;
}

interface SegmentAssets {
  audio_url?: string;
  audio_duration?: number;
  video_url?: string;
}

interface Bundle {
  id: string;
  content: BundleContent | null;
  audio_generated: number;
  segment_assets: Record<string, SegmentAssets>;
}

// ── Script extraction ─────────────────────────────────────────────────────────

function extractScript(
  ls: LessonScript,
  segment: GenerateSegmentAudioPayload["segment"]
): string {
  switch (segment) {
    case "intro":
      return ls.intro ?? "";
    case "section-1":
      return ls.sections[0]?.script ?? "";
    case "section-2":
      return ls.sections[1]?.script ?? "";
    case "section-3":
      return ls.sections[2]?.script ?? "";
    case "section-4":
      return ls.sections[3]?.script ?? "";
    case "section-5":
      return ls.sections[4]?.script ?? "";
    case "conclusion":
      return ls.conclusion ?? "";
  }
}

// ── Azure TTS (REST API) ──────────────────────────────────────────────────────
// Mirrors the approach in src/app/api/voice/synthesize/route.ts.
// Azure free tier (F0): 500 K characters/month neural voices.
// A 24-lesson batch of 7 segments × ~120 words × 6 chars/word ≈ 120 K chars — well within free tier.

async function synthesizeAzure(
  text: string,
  voice: string,
  speed: number
): Promise<ArrayBuffer> {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION ?? "westus";
  if (!key) throw new Error("AZURE_SPEECH_KEY not configured");

  const ratePercent = `${Math.round((speed - 1) * 100)}%`;
  const ssml = `<?xml version="1.0" encoding="UTF-8"?>
<speak version="1.0" xml:lang="en-US">
  <voice xml:lang="en-US" name="${voice}">
    <prosody rate="${ratePercent}">${escapeXml(text)}</prosody>
  </voice>
</speak>`;

  const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-160kbitrate-mono-mp3",
    },
    body: ssml,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Azure TTS error (${res.status}): ${err}`);
  }

  return res.arrayBuffer();
}

// ── ElevenLabs TTS ── (available but NOT recommended for bulk — expensive) ───

async function synthesizeElevenLabs(
  text: string,
  voice: string
): Promise<ArrayBuffer> {
  const apiKey =
    process.env.ELEVENLABS_CURRICULUM_KEY ?? process.env.ELEVENLABS_GENERAL_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_CURRICULUM_KEY not configured");

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs TTS error (${res.status}): ${err}`);
  }

  return res.arrayBuffer();
}

// ── XML escape for SSML ───────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ── Main worker ───────────────────────────────────────────────────────────────

export async function runGenerateSegmentAudio(
  jobId: string,
  payload: GenerateSegmentAudioPayload
): Promise<void> {
  const {
    bundleId,
    segment,
    engine = "azure",
    voice,
    speed = 1.05,
  } = payload;

  const resolvedVoice =
    voice ??
    (engine === "azure" ? "en-US-AriaNeural" : "21m00Tcm4TlvDq8ikWAM");

  await updateProgress(jobId, 5, `Loading bundle ${bundleId}…`);

  // Connect to CoursePlatform Supabase (separate from Chapterhouse)
  const courseUrl = process.env.COURSE_SUPABASE_URL;
  const courseKey = process.env.COURSE_SUPABASE_SERVICE_ROLE_KEY;
  if (!courseUrl || !courseKey) {
    await updateProgress(
      jobId, 0,
      "COURSE_SUPABASE_URL / COURSE_SUPABASE_SERVICE_ROLE_KEY not configured",
      "failed",
      undefined,
      "Missing CoursePlatform Supabase credentials"
    );
    return;
  }

  const courseSupabase = createClient(courseUrl, courseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: bundle, error: bundleErr } = await courseSupabase
    .from("bundles")
    .select("id, content, audio_generated, segment_assets")
    .eq("id", bundleId)
    .single<Bundle>();

  if (bundleErr || !bundle) {
    await updateProgress(jobId, 0, `Bundle not found: ${bundleId}`, "failed", undefined, bundleErr?.message ?? "Not found");
    return;
  }

  const ls = bundle.content?.lesson_script;
  if (!ls) {
    await updateProgress(jobId, 0, "Bundle has no lesson_script", "failed", undefined, "Invalid content structure");
    return;
  }

  const scriptText = extractScript(ls, segment).trim();
  if (!scriptText) {
    await updateProgress(jobId, 0, `No script text for segment "${segment}"`, "failed", undefined, "Empty script");
    return;
  }

  await updateProgress(jobId, 20, `Generating ${engine.toUpperCase()} audio for "${segment}" (${scriptText.length} chars)…`);

  // Synthesize audio
  let audioBuffer: ArrayBuffer;
  try {
    if (engine === "elevenlabs") {
      audioBuffer = await synthesizeElevenLabs(scriptText, resolvedVoice);
    } else {
      audioBuffer = await synthesizeAzure(scriptText, resolvedVoice, Math.max(0.5, Math.min(2.0, speed)));
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await updateProgress(jobId, 0, `TTS failed: ${msg}`, "failed", undefined, msg);
    return;
  }

  await updateProgress(jobId, 60, `Uploading MP3 to Cloudinary…`);

  // Write buffer to temp file
  const tempPath = join(tmpdir(), `seg-audio-${randomUUID()}.mp3`);
  try {
    await writeFile(tempPath, Buffer.from(audioBuffer));

    // Cloudinary public_id: somerschool/audio-segments/{bundleId}/{segment}
    const publicId = `somerschool/audio-segments/${bundleId}/${segment}`;
    const audioUrl = await uploadAudioFile(tempPath, publicId);

    await updateProgress(jobId, 85, `Updating CoursePlatform DB…`);

    // Merge into existing segment_assets JSONB
    const existingAssets: Record<string, SegmentAssets> = bundle.segment_assets ?? {};
    const updatedAssets: Record<string, SegmentAssets> = {
      ...existingAssets,
      [segment]: {
        ...(existingAssets[segment] ?? {}),
        audio_url: audioUrl,
      },
    };

    const { error: updateErr } = await courseSupabase
      .from("bundles")
      .update({
        segment_assets: updatedAssets,
        audio_generated: (bundle.audio_generated ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bundleId);

    if (updateErr) {
      throw new Error(`DB update failed: ${updateErr.message}`);
    }

    await updateProgress(
      jobId,
      100,
      `✅ Audio ready — ${segment} → ${audioUrl}`,
      "completed",
      { segment, audioUrl, engine, voice: resolvedVoice }
    );

    console.log(`[generate-segment-audio] Done: ${bundleId}/${segment} → ${audioUrl}`);
  } finally {
    // Clean up temp file
    await unlink(tempPath).catch(() => undefined);
  }
}
