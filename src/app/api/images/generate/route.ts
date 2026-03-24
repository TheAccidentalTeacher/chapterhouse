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
  const key = process.env.STABILITY_AI_KEY;
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
): Promise<{ url: string; model: string }> {
  const token = process.env.REPLICATE_TOKEN;
  if (!token) throw new Error("REPLICATE_TOKEN not configured");

  const modelVersion =
    model || "black-forest-labs/flux-schnell";

  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelVersion,
      input: {
        prompt,
        width,
        height,
        num_outputs: 1,
      },
    }),
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
      return { url: imageUrl, model: modelVersion };
    }
    if (result.status === "failed") {
      throw new Error(result.error || "Replicate generation failed");
    }
  }

  throw new Error("Replicate generation timed out");
}

async function generateLeonardo(
  prompt: string,
  width: number,
  height: number,
): Promise<{ url: string; model: string }> {
  const key = process.env.LEONARDO_API_KEY;
  if (!key) throw new Error("LEONARDO_API_KEY not configured");

  const response = await fetch(
    "https://cloud.leonardo.ai/api/rest/v1/generations",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        width,
        height,
        num_images: 1,
        modelId: "6b645e3a-d64f-4341-a6d8-7a3690fbf042", // Leonardo Phoenix
      }),
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
        .select("slug, name, physical_description, art_style, negative_prompt, reference_images")
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

    // ── Character Consistency: img2img with reference image (Replicate only) ──
    let effectiveModel = body.model;
    let referenceImageUrl: string | null = null;

    if (
      character &&
      character.reference_images?.length > 0 &&
      provider === "replicate"
    ) {
      // Use first reference image as style anchor (Flux img2img)
      referenceImageUrl = character.reference_images[0];
      effectiveModel = effectiveModel || "black-forest-labs/flux-dev";
    }

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
        result = await generateLeonardo(finalPrompt, width, height);
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
          referenceImageUrl,
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
