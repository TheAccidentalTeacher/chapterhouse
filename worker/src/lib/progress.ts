import { supabase } from "./supabase";

export type JobStatus = "running" | "completed" | "failed" | "cancelled";

export async function updateProgress(
  jobId: string,
  progress: number,
  message: string,
  status: JobStatus = "running",
  output?: unknown,
  error?: string
) {
  const update: Record<string, unknown> = {
    progress,
    progress_message: message,
    status,
    updated_at: new Date().toISOString(),
  };

  // Only set started_at on the first transition to running
  if (progress <= 1 && status === "running") {
    update.started_at = new Date().toISOString();
  }

  if (status === "completed" || status === "failed") {
    update.completed_at = new Date().toISOString();
  }

  if (output !== undefined) {
    update.output = output;
  }

  if (error !== undefined) {
    update.error = error;
  }

  const { error: dbError } = await supabase
    .from("jobs")
    .update(update)
    .eq("id", jobId);

  if (dbError) {
    console.error(`[progress] Failed to update job ${jobId}:`, dbError);
  }
}
