import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import OpenAI from "openai";
import { enhancePrompt } from "@/lib/prompt-enhancer";

// ── Types ──────────────────────────────────────────────────────────────────────

type Provider = "openai" | "stability" | "replicate" | "leonardo";

interface GenerateRequest {
  prompt: string;
  provider: Provider;
  model?: string;
  width?: number;
  height?: number;
  style?: string;
  negativePrompt?: string;
  // Character support
  characterId?: string;   // UUID from characters table
  context?: string;       // e.g. "explaining photosynthesis for 2nd graders"
}

// ── Provider Implementations ───────────────────────────────────────────────────

async function generateOpenAI(
  prompt: string,
  width: number,
  height: number,
): Promise<{ url: string; model: string }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  // GPT Image 1 supports specific sizes
  const size =
    width >= 1792
      ? ("1792x1024" as const)
      : height >= 1792
        ? ("1024x1792" as const)
        : ("1024x1024" as const);

  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    n: 1,
    size,
  });

  const b64 = response.data?.[0]?.b64_json;
  if (b64) {
    return {
      url: `data:image/png;base64,${b64}`,
      model: "gpt-image-1",
    };
  }

  const url = response.data?.[0]?.url;
  if (!url) throw new Error("No image URL returned from OpenAI");
  return { url, model: "gpt-image-1" };
}

async function generateStability(
  prompt: string,
  width: number,
  height: number,
  negativePrompt?: string,
): Promise<{ url: string; model: string }> {
  const key = process.env.STABILITY_API_KEY ?? process.env.STABILITY_AI_KEY;
  if (!key) throw new Error("STABILITY_AI_KEY not configured");

  // Stable Diffusion XL requires dimensions divisible by 64
  const w = Math.round(width / 64) * 64;
  const h = Math.round(height / 64) * 64;

  const response = await fetch(
    "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        text_prompts: [
          { text: prompt, weight: 1 },
          ...(negativePrompt
            ? [{ text: negativePrompt, weight: -1 }]
            : []),
        ],
        cfg_scale: 7,
        steps: 30,
        width: w,
        height: h,
        samples: 1,
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Stability AI error: ${err}`);
  }

  const data = await response.json();
  const base64 = data.artifacts?.[0]?.base64;
  if (!base64) throw new Error("No image returned from Stability AI");

  return {
    url: `data:image/png;base64,${base64}`,
    model: "stable-diffusion-xl-1024-v1-0",
  };
}

async function generateReplicate(
  prompt: string,
  width: number,
  height: number,
  model?: string,
  referenceImageUrl?: string,
): Promise<{ url: string; model: string }> {
  const token = process.env.REPLICATE_API_TOKEN ?? process.env.REPLICATE_TOKEN;
  if (!token) throw new Error("REPLICATE_TOKEN not configured");

  // When a reference image is provided, use Flux Dev (supports img2img).
  // Flux Schnell does not support the `image` input parameter.
  const modelSlug = referenceImageUrl
    ? (model || "black-forest-labs/flux-dev")
    : (model || "black-forest-labs/flux-schnell");

  // Use the model-specific endpoint — /v1/predictions requires a version hash,
  // /v1/models/{owner}/{name}/predictions accepts just { input: {...} }
  const [owner, name] = modelSlug.split("/");
  const endpoint = `https://api.replicate.com/v1/models/${owner}/${name}/predictions`;

  // Build input — img2img when reference image provided.
  // prompt_strength: 0 = exact copy of reference image, 1 = pure text generation.
  // At 0.45 the character's visual identity dominates while the scene still changes.
  const input: Record<string, unknown> = referenceImageUrl
    ? {
        prompt,
        image: referenceImageUrl,
        prompt_strength: 0.45,
        num_outputs: 1,
      }
    : {
        prompt,
        width,
        height,
        num_outputs: 1,
      };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({ input }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Replicate error: ${err}`);
  }

  const prediction = await response.json();

  // Poll for result (Replicate is async)
  const getUrl = prediction.urls?.get;
  if (!getUrl) throw new Error("No polling URL from Replicate");

  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const poll = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await poll.json();

    if (result.status === "succeeded") {
      const imageUrl = Array.isArray(result.output)
        ? result.output[0]
        : result.output;
      if (!imageUrl) throw new Error("No output from Replicate");
      return { url: imageUrl, model: modelSlug };
    }
    if (result.status === "failed") {
      throw new Error(result.error || "Replicate generation failed");
    }
  }

  throw new Error("Replicate generation timed out");
}

// Upload a public image URL to Leonardo's init-images endpoint.
// Returns the imagePromptId to use in the generation request.
async function uploadRefImageToLeonardo(
  imageUrl: string,
  apiKey: string,
): Promise<string | null> {
  try {
    // Step 1 — get a presigned upload slot
    const initRes = await fetch(
      "https://cloud.leonardo.ai/api/rest/v1/init-images",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ extension: "png" }),
      },
    );
    if (!initRes.ok) return null;
    const initData = await initRes.json();
    const { id, url, fields } = initData.uploadInitImage ?? {};
    if (!id || !url || !fields) return null;

    // Step 2 — fetch the reference image
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    const imgBlob = await imgRes.blob();

    // Step 3 — upload to Leonardo's presigned S3 URL
    const fieldsObj: Record<string, string> = JSON.parse(fields);
    const formData = new FormData();
    for (const [k, v] of Object.entries(fieldsObj)) formData.append(k, v);
    formData.append("file", imgBlob, "reference.png");
    await fetch(url, { method: "POST", body: formData });

    return id as string;
  } catch {
    return null; // Non-fatal — fall back to text-only generation
  }
}

async function generateLeonardo(
  prompt: string,
  width: number,
  height: number,
  referenceImages?: string[],
  stylePreset?: string, // e.g. "RENDER_3D", "ILLUSTRATION", "CINEMATIC" — defaults to RENDER_3D when refs present
  loraModelId?: string, // Element akUUID when character LoRA is trained; goes in elements[] not modelId
): Promise<{ url: string; model: string }> {
  const key = process.env.LEONARDO_API_KEY ?? process.env.LEONARDO_AI_API_KEY;
  if (!key) throw new Error("LEONARDO_API_KEY not configured");

  // Upload all reference images in parallel for maximum character consistency.
  // Leonardo supports multiple imagePrompts — more references = better identity lock.
  let imagePrompts: { imagePromptId: string; weight: number }[] | undefined;
  if (referenceImages && referenceImages.length > 0) {
    const uploadResults = await Promise.all(
      referenceImages.slice(0, 3).map((url) => uploadRefImageToLeonardo(url, key)),
    );
    const validIds = uploadResults.filter(Boolean) as string[];
    if (validIds.length > 0) {
      // Weight 1.0 — maximum character identity lock, same approach as ToonBee's
      // "choose this picture as model" feature (IP-Adapter reference at inference time).
      // Multiple reference images compound the consistency effect.
      imagePrompts = validIds.map((imagePromptId) => ({ imagePromptId, weight: 1.0 }));
    }
  }

  // When character reference images are present, let the images drive the style rather
  // than forcing a preset that fights the character reference.
  // ToonBee equivalent: no style preset — the reference image IS the style anchor.
  const resolvedStyle = stylePreset ?? undefined;

  // Leonardo Elements (LoRA fine-tunes) are NOT modelIds — they go in a separate elements[] array.
  // When an Element is present: use Flux Dev as the base (same model the Element was trained on).
  // When no Element: fall back to Phoenix base for general generations.
  // Flux Dev model ID in Leonardo: b2614463-296c-462a-b22d-e6bb4fc6b92b
  // Phoenix model ID in Leonardo:  6b645e3a-d64f-4341-a6d8-7a3690fbf042
  // NOTE: Alchemy is incompatible with Flux Dev — only enable for Phoenix generations.
  const isValidUUID = (s: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
  const effectiveLoraId = loraModelId && isValidUUID(loraModelId) ? loraModelId : undefined;
  const useFluxDev = !!effectiveLoraId;

  const genBody: Record<string, unknown> = {
    prompt,
    width,
    height,
    num_images: 1,
    modelId: useFluxDev
      ? "b2614463-296c-462a-b22d-e6bb4fc6b92b"  // Flux Dev — matches Element training base
      : "6b645e3a-d64f-4341-a6d8-7a3690fbf042", // Phoenix — default for non-character generations
    alchemy: !useFluxDev,  // Alchemy only works with Phoenix; Flux Dev ignores/rejects it
  };
  // Inject Element (LoRA) — akUUID references the trained character Element, not a model ID
  if (effectiveLoraId) genBody.elements = [{ akUUID: effectiveLoraId, weight: 0.75 }];
  if (imagePrompts) genBody.imagePrompts = imagePrompts;
  if (resolvedStyle) genBody.presetStyle = resolvedStyle;

  const response = await fetch(
    "https://cloud.leonardo.ai/api/rest/v1/generations",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(genBody),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Leonardo AI error: ${err}`);
  }

  const data = await response.json();
  const generationId = data.sdGenerationJob?.generationId;
  if (!generationId) throw new Error("No generation ID from Leonardo");

  // Poll for result
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const poll = await fetch(
      `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
      { headers: { Authorization: `Bearer ${key}` } },
    );
    const result = await poll.json();
    const images = result.generations_by_pk?.generated_images;
    if (images?.length > 0) {
      return { url: images[0].url, model: "leonardo-phoenix" };
    }
  }

  throw new Error("Leonardo generation timed out");
}

// ── Route Handler ──────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerateRequest;

    if (!body.prompt || body.prompt.length < 5 || body.prompt.length > 2000) {
      return Response.json(
        { error: "Prompt must be 5-2000 characters" },
        { status: 400 },
      );
    }

    const provider = body.provider || "openai";
    const validProviders: Provider[] = [
      "openai",
      "stability",
      "replicate",
      "leonardo",
    ];
    if (!validProviders.includes(provider)) {
      return Response.json({ error: "Invalid provider" }, { status: 400 });
    }

    const width = body.width || 1024;
    const height = body.height || 1024;

    // ── Character & Prompt Enhancement ──────────────────────────────────────
    const supabase = getSupabaseServiceRoleClient();
    let character = null;

    if (body.characterId && supabase) {
      const { data } = await supabase
        .from("characters")
        .select("slug, name, physical_description, art_style, negative_prompt, reference_images, preferred_provider, lora_model_id, trigger_word")
        .eq("id", body.characterId)
        .eq("is_active", true)
        .single();
      character = data;
    }

    const enhanced = await enhancePrompt(
      body.prompt,
      character ?? undefined,
      body.context,
    );

    // Use enhanced prompt; merge negative prompts
    const finalPrompt = enhanced.enhanced;
    const finalNegative = [
      enhanced.negative,
      body.negativePrompt,
    ].filter(Boolean).join(", ");

    // Replicate uses text-only generation — the enhanced prompt front-loads the character's
    // physical description verbatim, which is sufficient for text-to-image consistency.
    // Flux Dev img2img was tested and found to copy the reference image composition rather
    // than treating it as style guidance. Leonardo is the recommended provider for
    // character-consistent generation (imagePrompts + RENDER_3D style preset).
    const effectiveModel = body.model;

    let result: { url: string; model: string };

    switch (provider) {
      case "openai":
        result = await generateOpenAI(finalPrompt, width, height);
        break;
      case "stability":
        result = await generateStability(
          finalPrompt,
          width,
          height,
          finalNegative || undefined,
        );
        break;
      case "replicate":
        result = await generateReplicate(
          finalPrompt,
          width,
          height,
          effectiveModel,
        );
        break;
      case "leonardo":
        result = await generateLeonardo(
          finalPrompt,
          width,
          height,
          character?.reference_images ?? undefined,
          undefined, // stylePreset — auto-detected from presence of refs
          character?.lora_model_id ?? undefined, // use trained LoRA model when available
        );
        break;
    }

    // ── Save to database ─────────────────────────────────────────────────────
    if (supabase) {
      await supabase.from("generated_images").insert({
        prompt: enhanced.original,
        prompt_original: enhanced.original,
        prompt_enhanced: enhanced.enhanced,
        enhancement_notes: enhanced.notes,
        character_id: body.characterId ?? null,
        provider,
        model: result.model,
        width,
        height,
        image_url: result.url,
        metadata: {
          style: body.style,
          negativePrompt: finalNegative,
          context: body.context,
        },
      });
    }

    return Response.json({
      url: result.url,
      provider,
      model: result.model,
      width,
      height,
      enhanced: enhanced.enhanced !== body.prompt,  // true if prompt was changed
      enhancementNotes: enhanced.notes,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    console.error("[images/generate]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
