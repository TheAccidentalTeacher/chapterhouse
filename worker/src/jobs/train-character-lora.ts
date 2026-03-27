import { supabase } from "../lib/supabase";
import { updateProgress } from "../lib/progress";

export interface TrainCharacterLoraPayload {
  characterId: string;
}

interface ReplicateTraining {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: { weights?: string };
  error?: string;
}

export async function runTrainCharacterLora(
  jobId: string,
  payload: TrainCharacterLoraPayload
) {
  const { characterId } = payload;
  const token = process.env.REPLICATE_API_TOKEN;

  if (!token) {
    await updateProgress(jobId, 0, "REPLICATE_API_TOKEN not configured", "failed", undefined, "Missing env var");
    return;
  }

  // Fetch character with reference images
  const { data: character, error: charErr } = await supabase
    .from("characters")
    .select("id, name, slug, reference_images")
    .eq("id", characterId)
    .single();

  if (charErr || !character) {
    await updateProgress(jobId, 0, "Character not found", "failed", undefined, `Character ID ${characterId} not found`);
    return;
  }

  const refImages = (character.reference_images ?? []) as string[];
  if (refImages.length < 5) {
    await updateProgress(
      jobId,
      0,
      "Insufficient reference images",
      "failed",
      undefined,
      `Need at least 5 reference images, have ${refImages.length}`
    );
    // Roll back lora_training_status
    await supabase
      .from("characters")
      .update({ lora_training_status: "none", updated_at: new Date().toISOString() })
      .eq("id", characterId);
    return;
  }

  await updateProgress(jobId, 5, "Starting LoRA training on Replicate...", "running");

  // Set lora_training_status = 'training'
  await supabase
    .from("characters")
    .update({ lora_training_status: "training", updated_at: new Date().toISOString() })
    .eq("id", characterId);

  const replicateUsername = process.env.REPLICATE_USERNAME ?? "scottsom";
  const destination = `${replicateUsername}/${character.slug}-lora`;
  const triggerWord = character.slug.toUpperCase().replace(/-/g, "_");

  // POST to Replicate /v1/trainings
  const trainingRes = await fetch("https://api.replicate.com/v1/trainings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      destination,
      input: {
        input_images: refImages,
        trigger_word: triggerWord,
        steps: 1000,
        lora_rank: 16,
        learning_rate: 0.0004,
      },
    }),
  });

  if (!trainingRes.ok) {
    const errText = await trainingRes.text();
    const msg = `Replicate training start failed (${trainingRes.status}): ${errText}`;
    console.error(`[train-character-lora] ${msg}`);
    await updateProgress(jobId, 0, msg, "failed", undefined, msg);
    await supabase
      .from("characters")
      .update({ lora_training_status: "failed", lora_training_error: msg, updated_at: new Date().toISOString() })
      .eq("id", characterId);
    return;
  }

  const training = (await trainingRes.json()) as ReplicateTraining;
  const trainingId = training.id;

  await updateProgress(jobId, 10, `Training started — ID: ${trainingId}. Polling every 30s...`, "running");

  // Update job with the training ID so it's visible in the jobs dashboard
  await supabase
    .from("jobs")
    .update({ output: { trainingId } })
    .eq("id", jobId);

  // POLLING LOOP — max 60 attempts (30 min)
  const maxAttempts = 60;
  const pollIntervalMs = 30_000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise((r) => setTimeout(r, pollIntervalMs));

    const pollRes = await fetch(`https://api.replicate.com/v1/trainings/${trainingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!pollRes.ok) {
      console.warn(`[train-character-lora] Poll ${attempt}/${maxAttempts} failed (${pollRes.status})`);
      continue;
    }

    const status = (await pollRes.json()) as ReplicateTraining;

    // Progress increments from 10% to 90% over polling iterations
    const progress = Math.min(10 + Math.round((attempt / maxAttempts) * 80), 90);
    await updateProgress(jobId, progress, `Training in progress... attempt ${attempt}/${maxAttempts} (status: ${status.status})`, "running");

    if (status.status === "succeeded") {
      // Extract version ID from output.weights URL
      // Replicate weights URL format: https://replicate.delivery/pbxt/xxx/trained_model.tar
      // The version ID is returned in the training response's `output` in some cases,
      // or we fall back to using the destination model reference.
      const weightsUrl = status.output?.weights ?? "";
      // The trained version ID — use the destination path as the lora_model_id for Replicate
      // When using custom trained models: `destination` = "{user}/{model}"
      const versionId = destination;

      await supabase
        .from("characters")
        .update({
          lora_model_id: versionId,
          lora_training_status: "succeeded",
          lora_training_job_id: trainingId,
          generation_strategy: "lora",
          updated_at: new Date().toISOString(),
        })
        .eq("id", characterId);

      await updateProgress(
        jobId,
        100,
        `LoRA training complete — model: ${versionId}`,
        "completed",
        { trainingId, versionId, weightsUrl }
      );
      console.log(`[train-character-lora] Training succeeded for ${character.name}: ${versionId}`);
      return;
    }

    if (status.status === "failed" || status.status === "canceled") {
      const errMsg = status.error ?? `Training ${status.status}`;
      console.error(`[train-character-lora] Training ${status.status} for ${character.name}: ${errMsg}`);
      await supabase
        .from("characters")
        .update({
          lora_training_status: "failed",
          lora_training_error: errMsg,
          lora_training_job_id: trainingId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", characterId);
      await updateProgress(jobId, 0, errMsg, "failed", undefined, errMsg);
      return;
    }
    // status = 'starting' | 'processing' — keep polling
  }

  // Timeout — 30 min elapsed without succeeded/failed
  const timeoutMsg = `Training timed out after ${maxAttempts * (pollIntervalMs / 1000 / 60)} minutes`;
  console.error(`[train-character-lora] ${timeoutMsg} for ${character.name}`);
  await supabase
    .from("characters")
    .update({
      lora_training_status: "failed",
      lora_training_error: timeoutMsg,
      lora_training_job_id: trainingId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", characterId);
  await updateProgress(jobId, 0, timeoutMsg, "failed", undefined, timeoutMsg);
}
