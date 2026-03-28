/**
 * POST /api/course-assets/generate-character-scenes
 *
 * Phase 9B: Queue a batch scene generation job for a character + bundle.
 * Requires characterId (must have hero_image_url) and bundleId.
 * Creates a 'generate_character_scenes' job → QStash → Railway worker.
 *
 * Returns: { jobId, sceneCount, strategy }
 */

import { Client } from "@upstash/qstash";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { createCourseAdmin } from "@/lib/course-supabase";
import { z } from "zod";

const schema = z.object({
  bundleId: z.string().min(1, "bundleId is required"),
  characterId: z.string().uuid("characterId must be a valid UUID"),
  sceneCount: z.number().int().min(1).max(500).optional().default(112),
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

  const { bundleId, characterId, sceneCount } = parsed.data;

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return Response.json({ error: "Chapterhouse DB not available" }, { status: 503 });
  }

  // Validate character exists and has required asset
  const { data: character, error: charErr } = await supabase
    .from("characters")
    .select("id, name, hero_image_url, lora_model_id, generation_strategy")
    .eq("id", characterId)
    .single();

  if (charErr || !character) {
    return Response.json({ error: `Character not found: ${characterId}` }, { status: 404 });
  }

  const strategy = (character as { generation_strategy?: string }).generation_strategy ?? "kontext";

  // Validate strategy has required assets
  if (strategy === "kontext" && !(character as { hero_image_url?: string | null }).hero_image_url) {
    return Response.json(
      { error: `Character '${(character as { name: string }).name}' needs a hero image before generating scenes with Kontext strategy. Generate an image first, then come back.` },
      { status: 422 }
    );
  }

  if (strategy === "lora" && !(character as { lora_model_id?: string | null }).lora_model_id) {
    return Response.json(
      { error: `Character '${(character as { name: string }).name}' has LoRA strategy but no trained model. Complete LoRA training first or switch to Kontext strategy.` },
      { status: 422 }
    );
  }

  // Validate bundle exists in CoursePlatform
  let courseSupabase;
  try {
    courseSupabase = createCourseAdmin();
  } catch {
    return Response.json({ error: "CoursePlatform DB not configured" }, { status: 503 });
  }

  const { data: bundle, error: bundleErr } = await courseSupabase
    .from("bundles")
    .select("id, title, slides_count")
    .eq("id", bundleId)
    .single();

  if (bundleErr || !bundle) {
    return Response.json({ error: `Bundle not found: ${bundleId}` }, { status: 404 });
  }

  const resolvedCount = sceneCount ?? (bundle as { slides_count?: number }).slides_count ?? 112;

  // Create job in Chapterhouse Supabase
  const { data: job, error: jobErr } = await supabase
    .from("jobs")
    .insert({
      type: "generate_character_scenes",
      label: `Scenes: ${(character as { name: string }).name} × ${(bundle as { title?: string }).title ?? bundleId}`,
      input_payload: { characterId, bundleId, sceneCount: resolvedCount },
      status: "queued",
    })
    .select()
    .single();

  if (jobErr || !job) {
    console.error("[generate-character-scenes] DB insert error:", jobErr);
    return Response.json({ error: "Failed to create job" }, { status: 500 });
  }

  // Publish to QStash → Railway worker
  const workerUrl = process.env.RAILWAY_WORKER_URL;
  if (!workerUrl) {
    return Response.json({ error: "RAILWAY_WORKER_URL not configured" }, { status: 503 });
  }

  const qstashToken = process.env.QSTASH_TOKEN;
  if (!qstashToken) {
    return Response.json({ error: "QSTASH_TOKEN not configured" }, { status: 503 });
  }

  const qstash = new Client({ token: qstashToken });
  try {
    await qstash.publishJSON({
      url: `${workerUrl}/process-job`,
      body: {
        jobId: (job as { id: string }).id,
        type: "generate_character_scenes",
        payload: { characterId, bundleId, sceneCount: resolvedCount },
      },
      retries: 3,
    });
  } catch (e) {
    console.error("[generate-character-scenes] QStash publish error:", e);
    // Mark job as failed
    await supabase.from("jobs").update({ status: "failed", error: "QStash publish failed" }).eq("id", (job as { id: string }).id);
    return Response.json({ error: "Failed to queue job" }, { status: 500 });
  }

  return Response.json({
    jobId: (job as { id: string }).id,
    sceneCount: resolvedCount,
    strategy,
    characterName: (character as { name: string }).name,
    bundleTitle: (bundle as { title?: string }).title ?? bundleId,
    status: "queued",
  });
}
