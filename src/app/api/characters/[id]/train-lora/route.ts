import { Client } from "@upstash/qstash";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) {
      return Response.json({ error: "Database not configured" }, { status: 500 });
    }

    // Fetch character
    const { data: character, error: charErr } = await supabase
      .from("characters")
      .select("id, name, slug, reference_images, lora_training_status")
      .eq("id", id)
      .single();

    if (charErr || !character) {
      return Response.json({ error: "Character not found" }, { status: 404 });
    }

    // Must have at least 5 reference images for meaningful LoRA training
    const refImages = (character.reference_images ?? []) as string[];
    if (refImages.length < 5) {
      return Response.json(
        { error: `LoRA training requires at least 5 reference images. This character has ${refImages.length}.` },
        { status: 422 }
      );
    }

    // 409 if already training
    if (character.lora_training_status === "training") {
      return Response.json(
        { error: "LoRA training already in progress for this character" },
        { status: 409 }
      );
    }

    // Set lora_training_status = 'queued'
    const { error: updateErr } = await supabase
      .from("characters")
      .update({ lora_training_status: "queued", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateErr) throw updateErr;

    // Create job record
    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .insert({
        type: "train_character_lora",
        label: `Train LoRA: ${character.name}`,
        input_payload: { characterId: id },
        status: "queued",
      })
      .select()
      .single();

    if (jobErr || !job) {
      // Roll back the status change on failure
      await supabase
        .from("characters")
        .update({ lora_training_status: "none", updated_at: new Date().toISOString() })
        .eq("id", id);
      console.error("[train-lora] DB error creating job:", jobErr);
      return Response.json({ error: "Failed to create training job" }, { status: 500 });
    }

    // Publish to QStash → Railway worker
    const workerUrl = process.env.RAILWAY_WORKER_URL;
    const qstashToken = process.env.QSTASH_TOKEN;

    if (qstashToken && workerUrl) {
      try {
        const qstash = new Client({ token: qstashToken });
        await qstash.publishJSON({
          url: `${workerUrl}/process-job`,
          body: {
            jobId: job.id,
            type: "train_character_lora",
            payload: { characterId: id },
          },
          retries: 3,
        });
      } catch (qErr) {
        console.error("[train-lora] QStash publish error:", qErr);
        // Job is in DB — worker can be triggered manually if needed
      }
    }

    return Response.json({ jobId: job.id, status: "queued" }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to queue LoRA training";
    console.error("[train-lora] error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
