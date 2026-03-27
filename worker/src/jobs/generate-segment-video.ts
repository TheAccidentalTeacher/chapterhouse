/**
 * generate-segment-video.ts
 *
 * Railway worker job: animate a lesson segment into an MP4 using FFmpeg.
 * This replaces ToonBee ($77/month) with a free self-hosted pipeline.
 *
 * What it produces:
 *   - 1920 × 1080 H.264 MP4
 *   - Ken Burns effect (gentle zoom-in) on each slide image
 *   - Cross-dissolve transitions between slides
 *   - Segment audio muxed in
 *   - Uploaded to Cloudinary: somerschool/videos/{bundleId}/{segment}
 *
 * Segment types handled:
 *   WITH SLIDES  — intro + section-1 through section-5
 *     Each has 4 slides with `at` fractions (0.0–1.0) marking when each slide appears
 *     relative to the audio duration. AT fractions → slide display durations.
 *
 *   WITHOUT SLIDES — conclusion
 *     lesson_script.conclusion is a plain narration string with no slides array.
 *     Falls back to the last slide of section-5 (visual continuity).
 *     If no fallback image is available, a solid dark background is used.
 *
 * Prerequisites:
 *   segment_assets.{segment}.audio_url must be set (run generate-segment-audio first).
 *   All slide image_url fields should resolve to accessible Cloudinary URLs.
 *
 * Pipeline:
 *   1. Load bundle + segment_assets from CoursePlatform Supabase
 *   2. Confirm audio_url is present for this segment
 *   3. Download audio + all images to temp dir
 *   4. Run FFmpeg:
 *        a. For each slide: loop the image, apply Ken Burns zoompan × audio slice duration
 *        b. Build filter_complex: scale → zoompan per slide, xfade transitions, amix with audio
 *        c. Encode H.264 + AAC, 1920×1080, 30 fps
 *   5. Upload output.mp4 to Cloudinary
 *   6. Patch segment_assets.{segment}.video_url + increment bundles.videos_generated
 */

import { createClient } from "@supabase/supabase-js";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import ffmpegFn from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import { updateProgress } from "../lib/progress";
import { uploadVideoFile } from "../lib/cloudinary";

// Point fluent-ffmpeg at the bundled static binary
if (ffmpegStatic) ffmpegFn.setFfmpegPath(ffmpegStatic);

// ── Job payload ───────────────────────────────────────────────────────────────

export interface GenerateSegmentVideoPayload {
  bundleId: string;
  segment: "intro" | "section-1" | "section-2" | "section-3" | "section-4" | "section-5" | "conclusion";
  motionPreset?: "zoom_in" | "zoom_out" | "pan_right" | "pan_left" | "static";
}

// ── CoursePlatform types ──────────────────────────────────────────────────────

interface Slide {
  at: number;
  image_url?: string | null;
}

interface Section {
  slides: Slide[];
  script?: string;
}

interface LessonScript {
  intro_slides: Slide[];
  sections: Section[];
}

interface SegmentAssets {
  audio_url?: string;
  video_url?: string;
}

interface Bundle {
  id: string;
  content: { lesson_script: LessonScript } | null;
  videos_generated: number;
  segment_assets: Record<string, SegmentAssets>;
}

// ── Slide resolution ──────────────────────────────────────────────────────────

/**
 * Get the slides array for a given segment.
 * Conclusion has no slides — falls back to last slide of section-5,
 * which gives visual continuity ("we're wrapping up what we just learned").
 */
function getSlidesForSegment(
  ls: LessonScript,
  segment: GenerateSegmentVideoPayload["segment"]
): Slide[] {
  switch (segment) {
    case "intro":
      return ls.intro_slides ?? [];
    case "section-1":
      return ls.sections[0]?.slides ?? [];
    case "section-2":
      return ls.sections[1]?.slides ?? [];
    case "section-3":
      return ls.sections[2]?.slides ?? [];
    case "section-4":
      return ls.sections[3]?.slides ?? [];
    case "section-5":
      return ls.sections[4]?.slides ?? [];
    case "conclusion": {
      // No dedicated slides — use last slide of section-5 for the full duration
      const lastSection = ls.sections[ls.sections.length - 1];
      const lastSlide = lastSection?.slides?.at(-1);
      if (lastSlide?.image_url) return [{ at: 0, image_url: lastSlide.image_url }];
      return []; // triggers solid-background fallback
    }
  }
}

// ── Duration calculation from AT fractions ───────────────────────────────────

/**
 * Convert AT fractions + total audio duration → per-slide display durations (seconds).
 *
 * AT fractions are 0.0–1.0 values marking WHEN EACH SLIDE APPEARS relative to
 * the audio duration. Example: [0.0, 0.28, 0.55, 0.78] with 30s audio →
 *   slide 0: 0s–8.4s  (8.4s)
 *   slide 1: 8.4s–16.5s (8.1s)
 *   slide 2: 16.5s–23.4s (6.9s)
 *   slide 3: 23.4s–30s  (6.6s)
 */
function slideDisplayDurations(slides: Slide[], totalDurationSec: number): number[] {
  if (slides.length === 0) return [totalDurationSec];
  const ats = slides.map((s) => s.at ?? 0);
  return ats.map((at, i) => {
    const next = ats[i + 1] ?? 1.0;
    return Math.max(0.5, (next - at) * totalDurationSec);
  });
}

// ── MP3 duration probe via ffprobe ────────────────────────────────────────────

function probeDuration(audioPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpegFn.ffprobe(audioPath, (err, metadata) => {
      if (err) return reject(err);
      const dur = metadata.format.duration;
      if (!dur) return reject(new Error("Could not determine audio duration"));
      resolve(dur);
    });
  });
}

// ── FFmpeg promise wrapper ────────────────────────────────────────────────────

function runFfmpeg(cmd: ffmpegFn.FfmpegCommand): Promise<void> {
  return new Promise((resolve, reject) => {
    cmd
      .on("start", (cmdLine) => console.log("[ffmpeg] spawn:", cmdLine))
      .on("error", (err) => reject(err))
      .on("end", () => resolve());
  });
}

// ── zoompan expression for Ken Burns effect ───────────────────────────────────
// Produces a gentle zoom-in from 1.0x → 1.08x over the slide's total frame count.
// The expression runs once per frame with `on` = output frame number (0-based).

function zoompanExpr(totalFrames: number, preset: string): string {
  const fps = 30;
  const frames = Math.max(2, totalFrames);

  switch (preset) {
    case "zoom_out":
      // Start zoomed in at 1.08x, slowly pull back to 1.0x
      return `z='max(1.001,1.08-0.08*on/${frames})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'`;
    case "pan_right":
      // Slow rightward pan at constant 1.05x zoom
      return `z='1.05':x='iw*0.025*on/${frames}':y='ih/2-(ih/zoom/2)'`;
    case "pan_left":
      // Slow leftward pan at constant 1.05x zoom
      return `z='1.05':x='iw*0.025*(1-on/${frames})':y='ih/2-(ih/zoom/2)'`;
    case "static":
      return `z='1.0':x='iw/2-(iw/2)':y='ih/2-(ih/2)'`;
    case "zoom_in":
    default:
      // Gentle zoom-in from 1.0x to 1.08x — default Ken Burns
      return `z='min(1+0.08*on/${frames},1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'`;
  }

  void fps; // suppress unused warning — fps used via frames calculation above
}

// ── Single-image Ken Burns clip builder ──────────────────────────────────────

async function buildSlideClip(
  imagePath: string,
  durationSec: number,
  outputPath: string,
  preset: string
): Promise<void> {
  const fps = 30;
  const totalFrames = Math.ceil(durationSec * fps);
  const zpExpr = zoompanExpr(totalFrames, preset);

  await runFfmpeg(
    ffmpegFn()
      .input(imagePath)
      .inputOptions(["-loop", "1"])
      .videoFilter([
        `scale=1920:1080:force_original_aspect_ratio=decrease`,
        `pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black`,
        `setsar=1`,
        `fps=${fps}`,
        `zoompan=${zpExpr}:s=1920x1080:fps=${fps}:d=${totalFrames}`,
      ])
      .duration(durationSec)
      .videoCodec("libx264")
      .addOutputOptions(["-preset", "ultrafast", "-pix_fmt", "yuv420p", "-an"])
      .output(outputPath)
  );
}

// ── Concat clips with cross-dissolve + mux audio ──────────────────────────────

async function concatClipsWithAudio(
  clipPaths: string[],
  durations: number[],
  audioPath: string,
  outputPath: string
): Promise<void> {
  const FADE_DUR = 0.4; // seconds for the xfade dissolve transition

  const cmd = ffmpegFn();
  clipPaths.forEach((p) => cmd.input(p));
  cmd.input(audioPath);

  if (clipPaths.length === 1) {
    // No transition needed — just mux audio
    cmd
      .complexFilter(`[0:v]copy[vout]`)
      .map("[vout]")
      .map(`${clipPaths.length}:a`);
  } else {
    // Build chained xfade filter
    const filters: ffmpegFn.FilterSpecification[] = [];
    let prevLabel = "[0:v]";
    let accOffset = 0;

    for (let i = 0; i < clipPaths.length - 1; i++) {
      accOffset += durations[i] - FADE_DUR / 2;
      const outLabel = i === clipPaths.length - 2 ? "[vout]" : `[xf${i}]`;
      filters.push({
        filter: "xfade",
        options: {
          transition: "dissolve",
          duration: FADE_DUR,
          offset: Math.max(0, accOffset - FADE_DUR / 2),
        },
        inputs: [prevLabel, `[${i + 1}:v]`],
        outputs: [outLabel],
      });
      prevLabel = outLabel;
    }

    cmd
      .complexFilter(filters)
      .map("[vout]")
      .map(`${clipPaths.length}:a`);
  }

  await runFfmpeg(
    cmd
      .videoCodec("libx264")
      .addOutputOptions(["-preset", "medium", "-crf", "23", "-pix_fmt", "yuv420p"])
      .audioCodec("aac")
      .addOutputOptions(["-b:a", "192k", "-shortest"])
      .output(outputPath)
  );
}

// ── Fallback: solid background + audio (conclusion with no images) ────────────

async function solidBackgroundWithAudio(
  audioPath: string,
  durationSec: number,
  outputPath: string
): Promise<void> {
  await runFfmpeg(
    ffmpegFn()
      .input(`color=c=#1a1a2e:s=1920x1080:r=30`)
      .inputOptions(["-f", "lavfi"])
      .input(audioPath)
      .videoCodec("libx264")
      .addOutputOptions(["-preset", "ultrafast", "-pix_fmt", "yuv420p", "-t", String(durationSec)])
      .audioCodec("aac")
      .addOutputOptions(["-b:a", "192k", "-shortest"])
      .output(outputPath)
  );
}

// ── Image download helper ─────────────────────────────────────────────────────

async function downloadToFile(url: string, filePath: string): Promise<void> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(filePath, buf);
}

// ── Main worker ───────────────────────────────────────────────────────────────

export async function runGenerateSegmentVideo(
  jobId: string,
  payload: GenerateSegmentVideoPayload
): Promise<void> {
  const {
    bundleId,
    segment,
    motionPreset = "zoom_in",
  } = payload;

  await updateProgress(jobId, 5, `Loading bundle ${bundleId}…`);

  const courseUrl = process.env.COURSE_SUPABASE_URL;
  const courseKey = process.env.COURSE_SUPABASE_SERVICE_ROLE_KEY;
  if (!courseUrl || !courseKey) {
    await updateProgress(jobId, 0, "Missing CoursePlatform Supabase credentials", "failed", undefined, "COURSE_SUPABASE_URL not set");
    return;
  }

  const courseSupabase = createClient(courseUrl, courseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: bundle, error: bundleErr } = await courseSupabase
    .from("bundles")
    .select("id, content, videos_generated, segment_assets")
    .eq("id", bundleId)
    .single<Bundle>();

  if (bundleErr || !bundle) {
    await updateProgress(jobId, 0, `Bundle not found: ${bundleId}`, "failed", undefined, bundleErr?.message ?? "Not found");
    return;
  }

  // Confirm audio is ready
  const segAssets = bundle.segment_assets ?? {};
  const audioUrl = segAssets[segment]?.audio_url;
  if (!audioUrl) {
    await updateProgress(
      jobId, 0,
      `No audio URL for segment "${segment}" — run generate-segment-audio first`,
      "failed",
      undefined,
      "Missing audio prerequisite"
    );
    return;
  }

  const ls = bundle.content?.lesson_script;
  if (!ls) {
    await updateProgress(jobId, 0, "Bundle has no lesson_script", "failed", undefined, "Invalid content");
    return;
  }

  const slides = getSlidesForSegment(ls, segment).filter((s) => s.image_url);

  // Create isolated temp directory for this job
  const tmpDir = join(tmpdir(), `seg-video-${randomUUID()}`);
  await mkdir(tmpDir, { recursive: true });

  try {
    // Download audio
    await updateProgress(jobId, 15, `Downloading audio…`);
    const audioPath = join(tmpDir, "audio.mp3");
    await downloadToFile(audioUrl, audioPath);

    const totalDuration = await probeDuration(audioPath);
    await updateProgress(jobId, 25, `Audio duration: ${totalDuration.toFixed(1)}s. Downloading ${slides.length} images…`);

    const outputPath = join(tmpDir, "output.mp4");

    if (slides.length === 0) {
      // No images — solid background with audio (conclusion fallback)
      await updateProgress(jobId, 40, `No images for "${segment}" — using background…`);
      await solidBackgroundWithAudio(audioPath, totalDuration, outputPath);
    } else {
      // Download all slide images
      const imagePaths: string[] = [];
      for (let i = 0; i < slides.length; i++) {
        const imgPath = join(tmpDir, `slide-${i}.jpg`);
        await downloadToFile(slides[i].image_url!, imgPath);
        imagePaths.push(imgPath);
      }

      await updateProgress(jobId, 40, `Building Ken Burns clips for ${slides.length} slides…`);

      // Calculate per-slide display durations
      const durations = slideDisplayDurations(slides, totalDuration);

      // Build per-slide Ken Burns MP4 clips
      const clipPaths: string[] = [];
      for (let i = 0; i < imagePaths.length; i++) {
        const clipPath = join(tmpDir, `clip-${i}.mp4`);
        await buildSlideClip(imagePaths[i], durations[i], clipPath, motionPreset);
        clipPaths.push(clipPath);
        const pct = 40 + Math.round((i + 1) / imagePaths.length * 30);
        await updateProgress(jobId, pct, `Rendered slide ${i + 1}/${imagePaths.length}…`);
      }

      await updateProgress(jobId, 72, `Merging clips + audio…`);
      await concatClipsWithAudio(clipPaths, durations, audioPath, outputPath);
    }

    await updateProgress(jobId, 85, `Uploading to Cloudinary…`);

    const publicId = `somerschool/videos/${bundleId}/${segment}`;
    const videoUrl = await uploadVideoFile(outputPath, publicId);

    await updateProgress(jobId, 95, `Updating CoursePlatform DB…`);

    const updatedAssets: Record<string, SegmentAssets> = {
      ...segAssets,
      [segment]: {
        ...(segAssets[segment] ?? {}),
        video_url: videoUrl,
      },
    };

    const { error: updateErr } = await courseSupabase
      .from("bundles")
      .update({
        segment_assets: updatedAssets,
        videos_generated: (bundle.videos_generated ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bundleId);

    if (updateErr) throw new Error(`DB update failed: ${updateErr.message}`);

    await updateProgress(
      jobId, 100,
      `✅ Video ready — ${segment} → ${videoUrl}`,
      "completed",
      { segment, videoUrl, motionPreset }
    );

    console.log(`[generate-segment-video] Done: ${bundleId}/${segment} → ${videoUrl}`);
  } finally {
    // Remove temp directory
    await rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
