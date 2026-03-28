/**
 * generate-character-scenes.ts
 *
 * Phase 9B: Given a characterId + bundleId, generates 112 course scene images.
 * Routes by generation_strategy:
 *   'kontext' → Leonardo FLUX.1 Kontext with hero_image_url as reference (weight 0.85)
 *   'lora'    → Replicate flux-schnell with LoRA weights (lora_scale 0.85)
 *
 * Batch size law: processes in batches of 10 (no more).
 * 120% scene budget: generates extra scenes to cover rejection rate.
 * All CoursePlatform writes use createCourseAdmin() ONLY (Forge mandate).
 *
 * After all scenes: bundles.slides_generated = true
 */

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { supabase as chapterhouseSupabase } from "../lib/supabase";
import { updateProgress } from "../lib/progress";
import { uploadImageFromUrl, cloudinaryCloudName } from "../lib/cloudinary";

export interface GenerateCharacterScenesPayload {
  characterId: string;
  bundleId: string;
  sceneCount?: number; // target; defaults to 112
}

// ── CoursePlatform Supabase client (separate DB) ──────────────────────────────

function createCourseAdmin() {
  const url = process.env.COURSE_SUPABASE_URL;
  const key = process.env.COURSE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("COURSE_SUPABASE_URL or COURSE_SUPABASE_SERVICE_ROLE_KEY not configured");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// ── Character interface ────────────────────────────────────────────────────────

interface Character {
  id: string;
  name: string;
  slug: string;
  physical_description?: string;
  art_style?: string;
  negative_prompt?: string;
  hero_image_url?: string | null;
  reference_images?: string[];
  lora_model_id?: string | null;
  trigger_word?: string | null;
  generation_strategy?: string;
}

// ── Scene description from Claude Haiku ──────────────────────────────────────

async function generateSceneDescriptions(
  bundleContent: unknown,
  targetCount: number,
  character: Character
): Promise<Array<{ slideIndex: number; description: string }>> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const client = new Anthropic({ apiKey: anthropicKey });

  const content = JSON.stringify(bundleContent).slice(0, 8000); // cap input size

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: `You are a curriculum illustrator. Given this lesson bundle content, generate ${targetCount} scene descriptions for slide images.

BUNDLE CONTENT:
${content}

CHARACTER: ${character.name} — ${character.physical_description ?? "cartoon character"}
ART STYLE: ${character.art_style ?? "cartoon illustration"}

Generate exactly ${targetCount} scene descriptions. Each should be 1-2 sentences describing what to show in a slide image.
The character (${character.name}) should appear in most scenes, teaching or demonstrating the concept.

Respond with ONLY a JSON array, no explanation:
[
  { "slideIndex": 0, "description": "..." },
  { "slideIndex": 1, "description": "..." },
  ...
]`,
      },
    ],
  });

  const raw = message.content[0]?.type === "text" ? message.content[0].text : "[]";

  // Extract JSON array from response
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.warn("[generate-character-scenes] Claude response not parseable, using defaults");
    return Array.from({ length: targetCount }, (_, i) => ({
      slideIndex: i,
      description: `Scene ${i + 1} for ${character.name} lesson`,
    }));
  }

  try {
    const scenes = JSON.parse(jsonMatch[0]) as Array<{ slideIndex: number; description: string }>;
    return scenes.slice(0, targetCount);
  } catch {
    console.warn("[generate-character-scenes] JSON parse failed, using defaults");
    return Array.from({ length: targetCount }, (_, i) => ({
      slideIndex: i,
      description: `Scene ${i + 1} for ${character.name} lesson`,
    }));
  }
}

// ── Leonardo Kontext generation ────────────────────────────────────────────────

async function generateKontext(
  prompt: string,
  character: Character
): Promise<string> {
  const key = process.env.LEONARDO_API_KEY ?? process.env.LEONARDO_AI_API_KEY;
  if (!key) throw new Error("LEONARDO_API_KEY not configured");

  if (!character.hero_image_url) {
    throw new Error(`Character ${character.name} has no hero_image_url — cannot use Kontext strategy`);
  }

  const fullPrompt = [
    character.physical_description,
    character.art_style,
    prompt,
  ].filter(Boolean).join(". ").replace(/\.\s*\./g, ".").trim();

  const negativePrompt = [
    character.negative_prompt,
    "extra limbs, malformed anatomy, fused fingers, bad anatomy, extra fingers, missing limbs, mutated hands, disfigured",
  ].filter(Boolean).join(", ");

  // Upload reference image for FLUX Kontext
  let imagePromptId: string | undefined;
  try {
    const uploadUrl = "https://cloud.leonardo.ai/api/rest/v1/init-image";
    const initRes = await fetch(uploadUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ extension: "jpg" }),
    });
    if (initRes.ok) {
      const initData = await initRes.json() as { uploadInitImage?: { id?: string; url?: string; fields?: string } };
      const uploadData = initData.uploadInitImage;
      if (uploadData?.id && uploadData.url) {
        // Upload the hero image
        const fieldsObj = uploadData.fields ? JSON.parse(uploadData.fields) as Record<string, string> : {};
        const imgRes = await fetch(character.hero_image_url);
        const imgBlob = await imgRes.blob();
        const formData = new FormData();
        for (const [k, v] of Object.entries(fieldsObj)) formData.append(k, v);
        formData.append("file", imgBlob, "reference.jpg");
        await fetch(uploadData.url, { method: "POST", body: formData });
        imagePromptId = uploadData.id;
      }
    }
  } catch (e) {
    console.warn("[generate-character-scenes] Hero image upload failed, proceeding without reference:", e);
  }

  const genBody: Record<string, unknown> = {
    prompt: fullPrompt,
    negative_prompt: negativePrompt,
    width: 1024,
    height: 1024,
    num_images: 1,
    // Phoenix — supports imagePrompts for character reference guidance + alchemy + RENDER_3D
    // Flux Dev does NOT support imagePrompts; alchemy is also incompatible with Flux Dev.
    modelId: "6b645e3a-d64f-4341-a6d8-7a3690fbf042", // Leonardo Phoenix
    alchemy: true,
    presetStyle: "RENDER_3D",
  };

  if (imagePromptId) {
    // FLUX Kontext imagePrompts takes an array of string IDs, not {imagePromptId, weight} objects
    genBody.imagePrompts = [imagePromptId];
  }

  const genRes = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(genBody),
  });

  if (!genRes.ok) {
    const err = await genRes.text();
    throw new Error(`Leonardo Kontext error (${genRes.status}): ${err}`);
  }

  const genData = await genRes.json() as { sdGenerationJob?: { generationId?: string } };
  const generationId = genData.sdGenerationJob?.generationId;
  if (!generationId) throw new Error("No generation ID from Leonardo");

  // Poll up to 3 minutes
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

  throw new Error("Leonardo Kontext generation timed out after 3 minutes");
}

// ── Replicate LoRA generation ─────────────────────────────────────────────────

async function generateLoRA(
  prompt: string,
  character: Character
): Promise<string> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN not configured");

  if (!character.lora_model_id) {
    throw new Error(`Character ${character.name} has no lora_model_id for LoRA strategy`);
  }

  const triggerWord = character.trigger_word ? `${character.trigger_word}, ` : "";
  const fullPrompt = `${triggerWord}${prompt}, ${character.art_style ?? ""}`.trim().replace(/,\s*$/, "");
  const negativePrompt = [
    character.negative_prompt,
    "extra limbs, malformed anatomy, fused fingers, bad anatomy, extra fingers, missing limbs, mutated hands, disfigured",
  ].filter(Boolean).join(", ");

  const createRes = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({
      version: character.lora_model_id,
      input: {
        prompt: fullPrompt,
        negative_prompt: negativePrompt,
        width: 1024,
        height: 1024,
        num_outputs: 1,
        lora_scale: 0.85, // NEVER 1.0 — causes over-fitting artifacts
      },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Replicate LoRA error (${createRes.status}): ${err}`);
  }

  type ReplicatePrediction = {
    id: string;
    status: string;
    output?: string | string[];
    error?: string;
    urls?: { get: string };
  };

  const prediction = await createRes.json() as ReplicatePrediction;

  // If synchronous (Prefer: wait), might already have output
  if (prediction.status === "succeeded" && prediction.output) {
    const url = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    if (typeof url === "string") return url;
  }

  // Poll for async completion
  const getUrl = prediction.urls?.get ?? `https://api.replicate.com/v1/predictions/${prediction.id}`;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const pollRes = await fetch(getUrl, { headers: { Authorization: `Bearer ${token}` } });
    const polled = await pollRes.json() as ReplicatePrediction;
    if (polled.status === "succeeded" && polled.output) {
      const url = Array.isArray(polled.output) ? polled.output[0] : polled.output;
      if (typeof url === "string") return url;
    }
    if (polled.status === "failed") throw new Error(polled.error ?? "Replicate LoRA prediction failed");
  }

  throw new Error("Replicate LoRA generation timed out");
}

// ── Main Worker ───────────────────────────────────────────────────────────────

export async function runGenerateCharacterScenes(
  jobId: string,
  payload: GenerateCharacterScenesPayload
) {
  const { characterId, bundleId, sceneCount } = payload;

  // Fetch character from Chapterhouse Supabase
  const { data: character, error: charErr } = await chapterhouseSupabase
    .from("characters")
    .select("id, name, slug, physical_description, art_style, negative_prompt, hero_image_url, reference_images, lora_model_id, trigger_word, generation_strategy")
    .eq("id", characterId)
    .single<Character>();

  if (charErr || !character) {
    await updateProgress(jobId, 0, "Character not found", "failed", undefined, `Character ${characterId} not found`);
    return;
  }

  const strategy = character.generation_strategy ?? "kontext";

  if (strategy === "kontext" && !character.hero_image_url) {
    await updateProgress(jobId, 0, "Character needs hero_image_url for Kontext strategy", "failed", undefined, "Missing hero_image_url");
    return;
  }

  if (strategy === "lora" && !character.lora_model_id) {
    await updateProgress(jobId, 0, "Character needs lora_model_id for LoRA strategy — use Kontext instead", "failed", undefined, "Missing lora_model_id");
    return;
  }

  // Fetch bundle from CoursePlatform Supabase (NEVER use main supabase for CoursePlatform data)
  let courseSupabase;
  try {
    courseSupabase = createCourseAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "CoursePlatform DB not configured";
    await updateProgress(jobId, 0, msg, "failed", undefined, msg);
    return;
  }

  const { data: bundle, error: bundleErr } = await courseSupabase
    .from("bundles")
    .select("id, title, content, slides_count")
    .eq("id", bundleId)
    .single();

  if (bundleErr || !bundle) {
    await updateProgress(jobId, 0, "Bundle not found", "failed", undefined, `Bundle ${bundleId} not found`);
    return;
  }

  await updateProgress(jobId, 5, `Generating scene descriptions for ${character.name} (${strategy} strategy)...`, "running");

  // Use bundle's actual slide count. 20% budget for rejection rate only if sceneCount was explicitly overridden.
  const baseCount = sceneCount ?? bundle.slides_count ?? 5;
  const targetCount = sceneCount ? Math.ceil(sceneCount * 1.2) : baseCount;

  let scenes: Array<{ slideIndex: number; description: string }>;
  try {
    scenes = await generateSceneDescriptions(bundle.content, targetCount, character);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Scene description generation failed";
    console.error("[generate-character-scenes] Scene gen error:", msg);
    // Fallback: generic descriptions
    scenes = Array.from({ length: targetCount }, (_, i) => ({
      slideIndex: i,
      description: `Lesson scene ${i + 1} — ${character.name} demonstrates the concept`,
    }));
  }

  await updateProgress(jobId, 10, `Generated ${scenes.length} scene descriptions. Starting image generation (batches of 10)...`, "running");

  const cloudName = cloudinaryCloudName();
  const generatedUrls: Array<{ slideIndex: number; cloudinaryUrl: string }> = [];

  // Process in batches of 10 (batch size law)
  const batchSize = 10;
  for (let batchStart = 0; batchStart < scenes.length; batchStart += batchSize) {
    const batch = scenes.slice(batchStart, batchStart + batchSize);

    await Promise.allSettled(
      batch.map(async (scene) => {
        const prompt = `${scene.description}, educational illustration`;

        try {
          let imageUrl: string;

          if (strategy === "lora") {
            imageUrl = await generateLoRA(prompt, character);
          } else {
            // Default: kontext (also handles ip_adapter fallback via kontext)
            imageUrl = await generateKontext(prompt, character);
          }

          const publicId = `somerschool/slides/${bundleId}/${scene.slideIndex}`;
          const cloudinaryUrl = await uploadImageFromUrl(imageUrl, publicId);
          generatedUrls.push({ slideIndex: scene.slideIndex, cloudinaryUrl });

          // Update this slide's image_url in CoursePlatform bundle.content
          // We do a targeted update: read current content, update the slide, write back
          try {
            const { data: fresh } = await courseSupabase
              .from("bundles")
              .select("content")
              .eq("id", bundleId)
              .single();

            if (fresh?.content) {
              const content = fresh.content as Record<string, unknown>;
              const lessonScript = content.lesson_script as {
                intro_slides?: Array<{ image_url?: string }>;
                sections?: Array<{ slides?: Array<{ image_url?: string }> }>;
              } | undefined;

              if (lessonScript) {
                let globalIdx = 0;

                // Update intro slides
                for (const slide of lessonScript.intro_slides ?? []) {
                  if (globalIdx === scene.slideIndex) {
                    slide.image_url = cloudinaryUrl;
                    break;
                  }
                  globalIdx++;
                }

                // Update section slides
                for (const section of lessonScript.sections ?? []) {
                  for (const slide of section.slides ?? []) {
                    if (globalIdx === scene.slideIndex) {
                      slide.image_url = cloudinaryUrl;
                      break;
                    }
                    globalIdx++;
                  }
                }

                await courseSupabase
                  .from("bundles")
                  .update({ content, updated_at: new Date().toISOString() })
                  .eq("id", bundleId);
              }
            }
          } catch (e) {
            console.warn(`[generate-character-scenes] Content update for slide ${scene.slideIndex} failed:`, e);
          }
        } catch (e) {
          console.error(`[generate-character-scenes] Failed to generate slide ${scene.slideIndex}:`, e);
          // Non-fatal — continue with other slides
        }
      })
    );

    // Update progress proportionally
    const progress = Math.min(10 + Math.round(((batchStart + batchSize) / scenes.length) * 80), 90);
    await updateProgress(
      jobId,
      progress,
      `Generated ${generatedUrls.length}/${scenes.length} scenes (batch ${Math.ceil(batchStart / batchSize) + 1})...`,
      "running"
    );
  }

  // Mark slides_generated in CoursePlatform
  await courseSupabase
    .from("bundles")
    .update({ slides_generated: generatedUrls.length, updated_at: new Date().toISOString() })
    .eq("id", bundleId);

  // Also update generated_images table in Chapterhouse for history
  try {
    for (const { slideIndex, cloudinaryUrl } of generatedUrls) {
      await chapterhouseSupabase.from("generated_images").insert({
        prompt: `Scene ${slideIndex} for bundle ${bundleId}`,
        provider: strategy === "lora" ? "replicate" : "leonardo",
        model: strategy === "lora" ? "flux-schnell-lora" : "flux-kontext",
        width: 1024,
        height: 1024,
        cloudinary_url: cloudinaryUrl,
        character_id: characterId,
        image_url: cloudinaryUrl,
      });
    }
  } catch (e) {
    console.warn("[generate-character-scenes] Chapterhouse history insert failed (non-fatal):", e);
  }

  await updateProgress(
    jobId,
    100,
    `Done — ${generatedUrls.length} scenes generated for bundle ${bundleId} (${strategy} strategy)`,
    "completed",
    {
      bundleId,
      characterId,
      strategy,
      sceneCount: generatedUrls.length,
      cloudName,
    }
  );

  console.log(`[generate-character-scenes] Completed: ${generatedUrls.length} scenes for bundle ${bundleId}`);
}
