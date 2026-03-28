/**
 * generate-bundle-anchor
 *
 * Generates ONE anchor image per bundle using a grade-level animal theme.
 * This single image becomes the visual base for all lesson videos in the bundle.
 *
 * Architecture:
 *   - Grade determines animal theme (G1=dog, G2=dinosaur, etc.) — no character library needed
 *   - Prompt = animal + bundle title (topic) — consistency by grade, not per-character LoRA
 *   - Stores URL in bundles.content.anchor_image_url (CoursePlatform DB)
 *   - Sets slides_generated = 1 so the Images status dot turns green
 *
 * Provider priority:
 *   1. Leonardo Phoenix (alchemy: false — fast tokens only, no API credit pool needed)
 *   2. Replicate flux-schnell (free tier fallback)
 */

import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { updateProgress } from "../lib/progress";

export interface GenerateBundleAnchorPayload {
  bundleId: string;
  forceRegen?: boolean; // when true, regenerates even if anchor_image_url already set
}

// ── Grade → Animal Theme Config ───────────────────────────────────────────────
// G1=dogs, G2=dinosaurs confirmed by Scott. G3-G12 = sensible defaults.
// Each entry is a short description that gets injected into the image prompt.

const GRADE_ANIMAL_THEMES: Record<number, string> = {
  1:  "a friendly golden retriever puppy wearing a tiny school backpack",
  2:  "a friendly cartoon triceratops dinosaur with big expressive eyes",
  3:  "an adventurous cartoon bear cub carrying a magnifying glass",
  4:  "a curious cartoon owl wearing round glasses",
  5:  "a cheerful cartoon lion cub holding a small pencil",
  6:  "a determined cartoon wolf pup with a compass",
  7:  "a thoughtful cartoon eagle perched on an open book",
  8:  "a clever cartoon dolphin with a pencil tucked behind one fin",
  9:  "a resourceful cartoon fox wearing a small backpack",
  10: "a wise cartoon hawk sitting on top of a globe",
  11: "an ambitious cartoon raven writing with a quill pen",
  12: "a confident cartoon deer in graduation attire",
};

function getAnimalTheme(grade: number): string {
  return GRADE_ANIMAL_THEMES[grade] ?? GRADE_ANIMAL_THEMES[1];
}

function buildAnchorPrompt(grade: number, topic: string): string {
  const animal = getAnimalTheme(grade);
  return (
    `A children's educational illustration featuring ${animal}, ` +
    `exploring the concept of "${topic}". ` +
    `3D cartoon render style, RENDER_3D preset. ` +
    `Warm bright colors, clean simple composition, single main subject in frame. ` +
    `Cheerful and child-friendly. Soft studio lighting. ` +
    `No text, words, numbers, or labels anywhere in the image.`
  );
}

// ── Cloudinary Upload ─────────────────────────────────────────────────────────

async function uploadToCloudinary(imageUrl: string, publicId: string): Promise<string> {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (!cloudinaryUrl) throw new Error("CLOUDINARY_URL not configured");

  const match = cloudinaryUrl.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
  if (!match) throw new Error("Invalid CLOUDINARY_URL format");
  const [, apiKey, apiSecret, cloudName] = match;

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = `invalidate=1&overwrite=1&public_id=${publicId}&timestamp=${timestamp}`;
  const signature = createHash("sha1").update(paramsToSign + apiSecret).digest("hex");

  const form = new FormData();
  form.append("file", imageUrl);
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp.toString());
  form.append("signature", signature);
  form.append("public_id", publicId);
  form.append("overwrite", "true");
  form.append("invalidate", "true");

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: form }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Cloudinary upload error: ${err}`);
  }

  const result = await uploadRes.json() as { public_id?: string; version?: number };
  const finalPublicId = result.public_id ?? publicId;
  const versionSegment = result.version ? `v${result.version}/` : "";
  return `https://res.cloudinary.com/${cloudName}/image/upload/q_auto/f_webp/${versionSegment}${finalPublicId}`;
}

// ── Leonardo Phoenix (fast tokens, no alchemy) ────────────────────────────────

async function generateWithLeonardo(prompt: string): Promise<string> {
  const key = process.env.LEONARDO_API_KEY ?? process.env.LEONARDO_AI_API_KEY;
  if (!key) throw new Error("LEONARDO_API_KEY not configured");

  const genBody = {
    prompt,
    width: 1024,
    height: 1024,
    num_images: 1,
    modelId: "6b645e3a-d64f-4341-a6d8-7a3690fbf042", // Leonardo Phoenix
    alchemy: false,      // fast tokens only — alchemy pool is separate and may be empty
    presetStyle: "RENDER_3D",
  };

  const genRes = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(genBody),
  });

  if (!genRes.ok) {
    const err = await genRes.text();
    throw new Error(`Leonardo error (${genRes.status}): ${err}`);
  }

  const genData = await genRes.json() as { sdGenerationJob?: { generationId?: string } };
  const generationId = genData.sdGenerationJob?.generationId;
  if (!generationId) throw new Error("No generation ID from Leonardo");

  // Poll up to 3 minutes (60 × 3 s)
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const poll = await fetch(
      `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
      { headers: { Authorization: `Bearer ${key}` } }
    );
    const pollData = await poll.json() as { generations_by_pk?: { generated_images?: { url: string }[] } };
    const images = pollData.generations_by_pk?.generated_images;
    if (images && images.length > 0) return images[0].url;
  }

  throw new Error("Leonardo generation timed out after 3 minutes");
}

// ── Replicate flux-schnell (free tier fallback) ───────────────────────────────

async function generateWithReplicate(prompt: string): Promise<string> {
  const token = process.env.REPLICATE_API_TOKEN ?? process.env.REPLICATE_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN not configured — cannot fall back from Leonardo");

  const createRes = await fetch(
    "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "wait" },
      body: JSON.stringify({
        input: { prompt, width: 1024, height: 1024, num_outputs: 1, num_inference_steps: 4 },
      }),
    }
  );

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Replicate error (${createRes.status}): ${err}`);
  }

  type P = { id: string; status: string; output?: string[]; error?: string; urls?: { get: string } };
  const prediction = await createRes.json() as P;

  if (prediction.status === "succeeded" && prediction.output?.[0]) {
    return prediction.output[0];
  }

  const pollUrl = prediction.urls?.get;
  if (!pollUrl) throw new Error("No poll URL returned from Replicate");

  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const polled = await fetch(pollUrl, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()) as P;
    if (polled.status === "succeeded" && polled.output?.[0]) return polled.output[0];
    if (polled.status === "failed") throw new Error(polled.error ?? "Replicate prediction failed");
  }

  throw new Error("Replicate generation timed out after 60 seconds");
}

// ── Main Worker ───────────────────────────────────────────────────────────────

export async function runGenerateBundleAnchor(
  jobId: string,
  payload: GenerateBundleAnchorPayload
) {
  const { bundleId, forceRegen } = payload;

  const courseUrl = process.env.COURSE_SUPABASE_URL;
  const courseKey = process.env.COURSE_SUPABASE_SERVICE_ROLE_KEY;
  if (!courseUrl || !courseKey) {
    await updateProgress(
      jobId, 0,
      "COURSE_SUPABASE_URL / COURSE_SUPABASE_SERVICE_ROLE_KEY not set in Railway env",
      "failed", undefined, "Missing env vars"
    );
    return;
  }

  const courseSupabase = createClient(courseUrl, courseKey);

  interface BundleRow {
    id: string;
    title: string | null;
    grade: number | null;
    subject_code: string | null;
    content: Record<string, unknown> | null;
    slides_generated: number;
    slides_count: number;
  }

  await updateProgress(jobId, 5, `Fetching bundle ${bundleId}...`, "running");

  const { data: bundle, error: fetchErr } = await courseSupabase
    .from("bundles")
    .select("id, title, grade, subject_code, content, slides_generated, slides_count")
    .eq("id", bundleId)
    .single<BundleRow>();

  if (fetchErr || !bundle) {
    await updateProgress(
      jobId, 0,
      `Bundle not found: ${bundleId}`,
      "failed", undefined, fetchErr?.message ?? "Not found"
    );
    return;
  }

  // Skip if already has anchor image and forceRegen not requested
  const existingAnchor = bundle.content?.anchor_image_url as string | undefined;
  if (existingAnchor && !forceRegen) {
    console.log(`[generate-bundle-anchor] Bundle ${bundleId} already has anchor image — skipping (use forceRegen to regenerate)`);
    await updateProgress(
      jobId, 100,
      "Bundle already has anchor image — done",
      "completed",
      { bundleId, anchorImageUrl: existingAnchor, skipped: true }
    );
    return;
  }

  const grade = bundle.grade ?? 1;
  const topic = bundle.title ?? bundleId;
  const animal = getAnimalTheme(grade);

  console.log(`[generate-bundle-anchor] Bundle ${bundleId} | G${grade} | Animal: ${animal.slice(0, 40)} | Topic: "${topic}"`);
  await updateProgress(jobId, 15, `Generating G${grade} anchor image — "${topic}"...`, "running");

  const prompt = buildAnchorPrompt(grade, topic);
  console.log(`[generate-bundle-anchor] Prompt: ${prompt}`);

  // Try Leonardo first, fall back to Replicate on token exhaustion or timeout
  let rawImageUrl: string;
  try {
    rawImageUrl = await generateWithLeonardo(prompt);
    console.log(`[generate-bundle-anchor] Leonardo OK: ${rawImageUrl.slice(0, 80)}...`);
  } catch (leoErr) {
    const leoMsg = leoErr instanceof Error ? leoErr.message : String(leoErr);
    const isTokenError = leoMsg.toLowerCase().includes("not enough api tokens");
    const isTimeout = leoMsg.includes("timed out");

    if (isTokenError || isTimeout) {
      console.warn(`[generate-bundle-anchor] Leonardo failed (${leoMsg.slice(0, 80)}) — falling back to Replicate flux-schnell`);
      await updateProgress(jobId, 25, "Leonardo tokens exhausted — using Replicate fallback...", "running");
      try {
        rawImageUrl = await generateWithReplicate(prompt);
        console.log(`[generate-bundle-anchor] Replicate OK: ${rawImageUrl.slice(0, 80)}...`);
      } catch (repErr) {
        const repMsg = repErr instanceof Error ? repErr.message : String(repErr);
        await updateProgress(jobId, 0, `Both Leonardo and Replicate failed: ${repMsg}`, "failed", undefined, repMsg);
        return;
      }
    } else {
      await updateProgress(jobId, 0, `Leonardo error: ${leoMsg}`, "failed", undefined, leoMsg);
      return;
    }
  }

  await updateProgress(jobId, 70, "Uploading anchor image to Cloudinary...", "running");

  let cloudinaryUrl: string;
  try {
    cloudinaryUrl = await uploadToCloudinary(
      rawImageUrl,
      `somerschool/anchor/${bundleId}`
    );
    console.log(`[generate-bundle-anchor] Cloudinary OK: ${cloudinaryUrl.slice(0, 100)}...`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await updateProgress(jobId, 0, `Cloudinary upload failed: ${msg}`, "failed", undefined, msg);
    return;
  }

  await updateProgress(jobId, 85, "Saving anchor URL to bundle...", "running");

  // Write back to CoursePlatform:
  // - Inject anchor_image_url into content JSON (preserves all existing content fields)
  // - Set slides_generated = 1 so the Images status dot shows green in Chapterhouse
  const updatedContent: Record<string, unknown> = {
    ...(bundle.content ?? {}),
    anchor_image_url: cloudinaryUrl,
  };

  const { error: updateErr } = await courseSupabase
    .from("bundles")
    .update({
      content: updatedContent,
      slides_generated: 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bundleId);

  if (updateErr) {
    console.error(`[generate-bundle-anchor] Write-back failed: ${updateErr.message}`);
    await updateProgress(
      jobId, 0,
      `Write-back to CoursePlatform failed: ${updateErr.message}`,
      "failed", undefined, updateErr.message
    );
    return;
  }

  console.log(`[generate-bundle-anchor] ✓ Done — bundle ${bundleId} | grade ${grade} | ${cloudinaryUrl}`);

  await updateProgress(
    jobId, 100,
    `Anchor image ready — G${grade} "${topic}"`,
    "completed",
    {
      bundleId,
      anchorImageUrl: cloudinaryUrl,
      grade,
      topic,
      animal,
      prompt,
    }
  );
}
