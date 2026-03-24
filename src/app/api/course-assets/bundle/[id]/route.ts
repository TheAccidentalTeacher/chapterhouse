import { createCourseAdmin } from "@/lib/course-supabase";
import { z } from "zod";

// ── GET /api/course-assets/bundle/[id] ──────────────────────────────────────
// Returns full bundle record from CoursePlatform Supabase.
// Used by the Course Assets dashboard to preview content and slide status.

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return Response.json({ error: "Bundle ID required" }, { status: 400 });
  }

  let courseSupabase;
  try {
    courseSupabase = createCourseAdmin();
  } catch {
    return Response.json(
      { error: "CoursePlatform DB not configured" },
      { status: 503 }
    );
  }

  const { data, error } = await courseSupabase
    .from("bundles")
    .select(
      "id, title, subject, grade, slides_count, slides_generated, audio_generated, audio_url, content, created_at, updated_at"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return Response.json(
      { error: error?.message ?? "Bundle not found" },
      { status: 404 }
    );
  }

  return Response.json({ bundle: data });
}

// ── PATCH /api/course-assets/bundle/[id] ─────────────────────────────────────
// Updates asset status fields on a bundle.
// Called by Railway worker jobs on completion (slide generation, narration, etc.)
// and by the dashboard for manual corrections.

const patchSchema = z.object({
  slides_generated: z.number().int().min(0).optional(),
  audio_generated: z.boolean().optional(),
  audio_url: z.string().url().optional(),
  content: z.record(z.string(), z.unknown()).optional(), // full lesson_script update from worker write-back
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return Response.json({ error: "Bundle ID required" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (Object.keys(parsed.data).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  let courseSupabase;
  try {
    courseSupabase = createCourseAdmin();
  } catch {
    return Response.json(
      { error: "CoursePlatform DB not configured" },
      { status: 503 }
    );
  }

  const { data, error } = await courseSupabase
    .from("bundles")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, title, slides_generated, audio_generated, audio_url, updated_at")
    .single();

  if (error || !data) {
    return Response.json(
      { error: error?.message ?? "Update failed" },
      { status: 500 }
    );
  }

  return Response.json({ bundle: data });
}
