import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { updateProgress } from "../lib/progress";
import { supabase as chapterhouseSupabase } from "../lib/supabase";

export interface CourseSlideImagesPayload {
  bundleId: string;
  characterId?: string; // optional character UUID from Chapterhouse characters table (Phase 3+)
}

interface Slide {
  label: string;
  image_url?: string | null;
}

interface Section {
  title?: string;
  script?: string;
  slides: Slide[];
}

interface LessonScript {
  intro?: string;
  intro_slides: Slide[];
  sections: Section[];
  conclusion?: string;
}

interface BundleContent {
  lesson_script: LessonScript;
  [key: string]: unknown;
}

interface Bundle {
  id: string;
  content: BundleContent | null;
  slides_count: number;
  slides_generated: number;
}

// ── Character interface (Chapterhouse characters table — populated in Phase 3) ──

interface Character {
  id: string;
  name: string;
  physical_description?: string;  // used to seed the scene prompt (approximates enhancePrompt)
  art_style?: string;             // injected alongside physical_description
  lora_model_id?: string | null;   // Tier 1: LoRA model version hash on Replicate
  reference_images?: string[];     // Tier 2: URL(s) for flux-dev image reference
  preferred_provider?: string | null; // 'leonardo' | 'replicate' (from characters table)
}

// ── Replicate Image Generation (REST API — no extra package needed) ────────────
//
// Three-tier selection:
//   Tier 1 — LoRA (identity-level):  character.lora_model_id set
//   Tier 2 — Bridge (flux-dev):      character.reference_images set
//   Tier 3 — Free (flux-schnell):    no character, or character has neither
//
// Poll: 60 × 3s = 3 minute timeout

async function generateImageReplicate(
  prompt: string,
  character?: Character
): Promise<string> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN not configured");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Prefer: "wait", // ask Replicate to synchronously wait up to 60s before polling
  };

  let endpoint: string;
  let body: Record<string, unknown>;

  if (character?.lora_model_id) {
    // Tier 1: run a specific LoRA model version
    endpoint = "https://api.replicate.com/v1/predictions";
    body = {
      version: character.lora_model_id,
      input: { prompt, width: 1024, height: 1024, num_outputs: 1 },
    };
  } else if (character?.reference_images?.length) {
    // Tier 2: flux-dev image-to-image reference (strength 0.7 = ~70% character fidelity)
    endpoint = "https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions";
    body = {
      input: {
        prompt,
        image: character.reference_images[0],
        strength: 0.7,
        width: 1024,
        height: 1024,
        num_outputs: 1,
      },
    };
  } else {
    // Tier 3: flux-schnell — free-tier, fastest, no character consistency
    endpoint = "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions";
    body = { input: { prompt, width: 1024, height: 1024, num_outputs: 1 } };
  }

  // Create prediction
  const createRes = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Replicate create error (${createRes.status}): ${err}`);
  }

  const prediction = (await createRes.json()) as {
    id: string;
    status: string;
    output?: string[];
    error?: string;
    urls?: { get: string };
  };

  // If Prefer:wait succeeded and it's already done
  if (prediction.status === "succeeded" && prediction.output?.length) {
    return prediction.output[0];
  }

  // Poll until succeeded — 60 × 3s = 3 min max
  const pollUrl = prediction.urls?.get;
  if (!pollUrl) throw new Error("No poll URL returned from Replicate");

  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const pollRes = await fetch(pollUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const polled = (await pollRes.json()) as {
      status: string;
      output?: string[];
      error?: string;
    };
    if (polled.status === "succeeded" && polled.output?.length) {
      return polled.output[0];
    }
    if (polled.status === "failed") {
      throw new Error(`Replicate prediction failed: ${polled.error ?? "unknown error"}`);
    }
  }

  throw new Error("Replicate generation timed out after 3 minutes");
}

// ── Leonardo Image Generation ─────────────────────────────────────────────────
// Used when character.preferred_provider === 'leonardo'.
// RENDER_3D style preset gives the 3D cartoon look closest to ToonBee's art direction.
// Character reference images are uploaded as imagePrompts (weight 0.75) for identity lock.
// Physical description is prepended to the scene prompt — approximates enhancePrompt
// without requiring a Claude API call in the Railway worker.

async function uploadRefToLeonardo(imageUrl: string, apiKey: string): Promise<string | null> {
  try {
    const initRes = await fetch("https://cloud.leonardo.ai/api/rest/v1/init-images", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ extension: "png" }),
    });
    if (!initRes.ok) return null;
    const initData = await initRes.json() as { uploadInitImage?: { id: string; url: string; fields: string } };
    const { id, url, fields } = initData.uploadInitImage ?? {};
    if (!id || !url || !fields) return null;

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    const imgBlob = await imgRes.blob();

    const fieldsObj: Record<string, string> = JSON.parse(fields);
    const formData = new FormData();
    for (const [k, v] of Object.entries(fieldsObj)) formData.append(k, v);
    formData.append("file", imgBlob, "reference.png");
    await fetch(url, { method: "POST", body: formData });

    return id as string;
  } catch {
    return null; // Non-fatal — fall through to text-only generation
  }
}

async function generateImageLeonardo(prompt: string, character?: Character): Promise<string> {
  const key = process.env.LEONARDO_API_KEY ?? process.env.LEONARDO_AI_API_KEY;
  if (!key) throw new Error("LEONARDO_API_KEY not configured");

  // Prepend physical description to the scene prompt for character identity.
  // This approximates what prompt-enhancer.ts does via Claude Haiku in the Vercel route,
  // without needing a Claude API call in the Railway worker context.
  const fullPrompt = character?.physical_description
    ? `${character.physical_description}. ${character.art_style ?? ""}. ${prompt}`.replace(/\.\s*\./g, ".").trim()
    : prompt;

  let imagePrompts: { imagePromptId: string; weight: number }[] | undefined;
  if (character?.reference_images?.length) {
    const ids = await Promise.all(
      character.reference_images.slice(0, 3).map((u) => uploadRefToLeonardo(u, key))
    );
    const valid = ids.filter(Boolean) as string[];
    if (valid.length > 0) {
      imagePrompts = valid.map((imagePromptId) => ({ imagePromptId, weight: 0.75 }));
    }
  }

  const genBody: Record<string, unknown> = {
    prompt: fullPrompt,
    width: 1024,
    height: 1024,
    num_images: 1,
    modelId: character?.lora_model_id ?? "6b645e3a-d64f-4341-a6d8-7a3690fbf042", // LoRA model when trained, Phoenix base as fallback
    alchemy: true,
    presetStyle: "RENDER_3D", // 3D cartoon — consistent with ToonBee art direction
  };
  if (imagePrompts) genBody.imagePrompts = imagePrompts;

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
    const result = await poll.json() as { generations_by_pk?: { generated_images?: { url: string }[] } };
    const images = result.generations_by_pk?.generated_images;
    if (images && images.length > 0) return images[0].url as string;
  }

  throw new Error("Leonardo generation timed out after 3 minutes");
}

// ── Cloudinary Upload ─────────────────────────────────────────────────────────

async function uploadToCloudinary(
  imageUrl: string,
  publicId: string
): Promise<string> {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (!cloudinaryUrl) throw new Error("CLOUDINARY_URL not configured");

  const match = cloudinaryUrl.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
  if (!match) throw new Error("Invalid CLOUDINARY_URL format");

  const [, apiKey, apiSecret, cloudName] = match;

  const timestamp = Math.floor(Date.now() / 1000);
  // IMPORTANT: params must be sorted alphabetically for Cloudinary sig
  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
  const signature = createHash("sha1")
    .update(paramsToSign + apiSecret)
    .digest("hex");

  const form = new FormData();
  form.append("file", imageUrl);
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp.toString());
  form.append("signature", signature);
  form.append("public_id", publicId);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: form }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Cloudinary upload error: ${err}`);
  }

  const result = (await uploadRes.json()) as { public_id?: string };
  const finalPublicId = result.public_id ?? publicId;

  // Delivery URL with quality auto + WebP transform
  // ⚠️ KaraokePlayer uses onError → setHidden(true) silently — must be exact format
  return `https://res.cloudinary.com/${cloudName}/image/upload/q_auto/f_webp/${finalPublicId}`;
}

// ── Slide counting helper ─────────────────────────────────────────────────────

function countSlidesWithImages(ls: LessonScript): number {
  let count = 0;
  (ls.intro_slides ?? []).forEach((s) => {
    if (s.image_url) count++;
  });
  (ls.sections ?? []).forEach((section) => {
    (section.slides ?? []).forEach((s) => {
      if (s.image_url) count++;
    });
  });
  return count;
}

// ── Main Worker ───────────────────────────────────────────────────────────────

export async function runCourseSlideImages(
  jobId: string,
  payload: CourseSlideImagesPayload
) {
  const { bundleId, characterId } = payload;

  // ── Look up character from Chapterhouse Supabase (Phase 3+) ────────────────
  // Graceful fallback: if characterId not provided, or characters table doesn't
  // exist yet, or character not found — generation falls back to Tier 3 (flux-schnell)
  let character: Character | undefined;
  if (characterId) {
    try {
      const { data: charData } = await chapterhouseSupabase
        .from("characters")
        .select("id, name, physical_description, art_style, lora_model_id, reference_images, preferred_provider")
        .eq("id", characterId)
        .single<Character>();
      if (charData) character = charData;
    } catch {
      // characters table not yet created (Phase 3 not run) — continue without character
    }
  }

  // Connect to CoursePlatform Supabase (separate project from Chapterhouse)
  const courseUrl = process.env.COURSE_SUPABASE_URL;
  const courseKey = process.env.COURSE_SUPABASE_SERVICE_ROLE_KEY;
  if (!courseUrl || !courseKey) {
    await updateProgress(
      jobId,
      0,
      "COURSE_SUPABASE_URL / COURSE_SUPABASE_SERVICE_ROLE_KEY not set in worker env",
      "failed",
      undefined,
      "Missing env vars"
    );
    return;
  }

  const courseSupabase = createClient(courseUrl, courseKey);

  // Fetch bundle — select content (needed for slide list + write-back) + metadata
  await updateProgress(jobId, 5, `Fetching bundle ${bundleId}...`, "running");

  const { data: bundle, error: fetchErr } = await courseSupabase
    .from("bundles")
    .select("id, content, slides_count, slides_generated")
    .eq("id", bundleId)
    .single<Bundle>();

  if (fetchErr || !bundle) {
    await updateProgress(
      jobId,
      0,
      `Bundle not found: ${bundleId}`,
      "failed",
      undefined,
      fetchErr?.message ?? "Not found"
    );
    return;
  }

  const lessonScript = bundle.content?.lesson_script;
  if (!lessonScript) {
    await updateProgress(
      jobId,
      0,
      "Bundle content.lesson_script is missing",
      "failed",
      undefined,
      "Missing lesson_script"
    );
    return;
  }

  // ── Collect slides that need generation ──────────────────────────────────

  type SlideRef = {
    sectionKey: "intro" | number;
    idx: number;
    label: string;
  };

  const missing: SlideRef[] = [];

  (lessonScript.intro_slides ?? []).forEach((slide, idx) => {
    if (!slide.image_url) {
      missing.push({ sectionKey: "intro", idx, label: slide.label });
    }
  });

  (lessonScript.sections ?? []).forEach((section, sNum) => {
    (section.slides ?? []).forEach((slide, idx) => {
      if (!slide.image_url) {
        missing.push({ sectionKey: sNum, idx, label: slide.label });
      }
    });
  });

  if (missing.length === 0) {
    await updateProgress(
      jobId,
      100,
      "All slides already have images — nothing to do",
      "completed",
      { generated: 0, total: 0 }
    );
    return;
  }

  // Deep copy of content — we patch image_url values in-memory then write back
  const updatedContent: BundleContent = JSON.parse(
    JSON.stringify(bundle.content)
  );

  let generated = 0;

  for (const ref of missing) {
    // Progress: 10% start → 95% end, distributed across slides
    const pct = Math.round(10 + (generated / missing.length) * 85);
    await updateProgress(
      jobId,
      pct,
      `Generating slide ${generated + 1}/${missing.length}: ${ref.label}`
    );

    // Cloudinary public_id — no file extension in public_id
    const publicId =
      ref.sectionKey === "intro"
        ? `somerschool/slides/${bundleId}/intro-${ref.idx}`
        : `somerschool/slides/${bundleId}/section-${ref.sectionKey}-${ref.idx}`;

    try {
      // 1. Generate image — provider selected based on character.preferred_provider.
      // Leonardo + RENDER_3D gives consistent 3D cartoon style across all slides in a job.
      // Replicate (Tier 1 LoRA / Tier 2 Bridge / Tier 3 Free) used when character prefers it.
      const useProvider = character?.preferred_provider === "leonardo" ? "leonardo" : "replicate";
      const rawUrl = useProvider === "leonardo"
        ? await generateImageLeonardo(ref.label, character)
        : await generateImageReplicate(ref.label, character);

      // 2. Upload to Cloudinary — get permanent delivery URL
      const deliveryUrl = await uploadToCloudinary(rawUrl, publicId);

      // 3. Patch in-memory content
      if (ref.sectionKey === "intro") {
        updatedContent.lesson_script.intro_slides[ref.idx].image_url =
          deliveryUrl;
      } else {
        updatedContent.lesson_script.sections[
          ref.sectionKey as number
        ].slides[ref.idx].image_url = deliveryUrl;
      }

      generated++;

      // 4. Write back after every successful slide (so partial progress survives failures)
      const currentCount = countSlidesWithImages(updatedContent.lesson_script);
      await courseSupabase
        .from("bundles")
        .update({
          content: updatedContent,
          slides_generated: currentCount,
        })
        .eq("id", bundleId);
    } catch (slideErr) {
      console.error(
        `[course-slide-images] Slide failed: "${ref.label}"`,
        slideErr
      );
      // Continue to next slide — partial completion is better than aborting
    }
  }

  // Final write to ensure slides_generated is accurate
  const finalCount = countSlidesWithImages(updatedContent.lesson_script);
  await courseSupabase
    .from("bundles")
    .update({
      content: updatedContent,
      slides_generated: finalCount,
    })
    .eq("id", bundleId);

  await updateProgress(
    jobId,
    100,
    `Done — ${generated}/${missing.length} slides generated`,
    "completed",
    {
      bundleId,
      generated,
      total: missing.length,
      slidesGenerated: finalCount,
    }
  );
}
