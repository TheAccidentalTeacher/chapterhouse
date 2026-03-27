import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Client as QStashClient } from "@upstash/qstash";
import { getSupabaseServerClient, getSupabaseServiceRoleClient } from "@/lib/supabase-server";

const bodySchema = z.object({
  bundleId: z.string().uuid(),
  sectionKey: z.union([z.literal("intro"), z.number().int().min(0)]),
  idx: z.number().int().min(0),
  model: z
    .enum(["replicate-schnell", "replicate-dev", "leonardo", "gpt-image"])
    .default("replicate-schnell"),
  customPrompt: z.string().max(1000).optional(),
  characterId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "DB not available" }, { status: 503 });
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { bundleId, sectionKey, idx, model, customPrompt, characterId } = parsed.data;

  // Create a job record in Chapterhouse Supabase (use service role to bypass RLS for writes)
  const serviceClient = getSupabaseServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "DB not available" }, { status: 503 });
  }

  const { data: job, error: jobErr } = await serviceClient
    .from("jobs")
    .insert({
      type: "course_slide_images",
      label: `Regenerate slide: ${sectionKey === "intro" ? "intro" : `section ${sectionKey}`}[${idx}] — ${model}`,
      status: "queued",
      progress: 0,
      input_payload: {
        bundleId,
        characterId,
        singleSlide: { sectionKey, idx },
        model,
        customPrompt,
      },
    })
    .select("id")
    .single();

  if (jobErr || !job) {
    console.error("[regenerate-slide] Failed to create job:", jobErr);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }

  // Publish to QStash → Railway worker
  const qstash = new QStashClient({ token: process.env.QSTASH_TOKEN! });
  await qstash.publishJSON({
    url: `${process.env.RAILWAY_WORKER_URL}/process-job`,
    body: {
      jobId: job.id,
      type: "course_slide_images",
      payload: {
        bundleId,
        characterId,
        singleSlide: { sectionKey, idx },
        model,
        customPrompt,
      },
    },
    retries: 2,
  });

  return NextResponse.json({ jobId: job.id });
}
