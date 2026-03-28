import { createCourseAdmin } from "@/lib/course-supabase";

// All columns except `content` — too large to send on every list request.
// anchor_image_url is extracted directly from the content JSONB field.
const BUNDLE_COLUMNS = [
  "id", "subject", "subject_code", "grade",
  "unit", "lesson", "bundle_number", "title",
  "slides_count", "slides_generated",
  "audio_generated", "audio_url",
  "videos_count", "videos_generated",
  "worksheet_present",
  "content->>anchor_image_url",
].join(", ");

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const course = searchParams.get("course");
  const gradeStr = searchParams.get("grade");

  if (!course || !gradeStr) {
    return Response.json(
      { error: "course and grade query params are required" },
      { status: 400 }
    );
  }

  const grade = parseInt(gradeStr, 10);
  if (isNaN(grade)) {
    return Response.json({ error: "grade must be a number" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createCourseAdmin();
  } catch (error) {
    let courseUrlHost: string | null = null;
    try {
      const raw = process.env.COURSE_SUPABASE_URL;
      courseUrlHost = raw ? new URL(raw).host : null;
    } catch {
      courseUrlHost = "invalid-url";
    }

    return Response.json(
      {
        error: "CoursePlatform DB not configured — set COURSE_SUPABASE_URL and COURSE_SUPABASE_SERVICE_ROLE_KEY",
        diagnostics: {
          vercelEnv: process.env.VERCEL_ENV ?? null,
          nodeEnv: process.env.NODE_ENV ?? null,
          hasCourseSupabaseUrl: Boolean(process.env.COURSE_SUPABASE_URL),
          hasCourseServiceRoleKey: Boolean(
            process.env.COURSE_SUPABASE_SERVICE_ROLE_KEY
          ),
          courseSupabaseUrlHost: courseUrlHost,
          createCourseAdminError:
            error instanceof Error ? error.message : "unknown",
        },
      },
      { status: 503 }
    );
  }

  const { data, error } = await supabase
    .from("bundles")
    .select(BUNDLE_COLUMNS)
    .eq("subject_code", course)
    .eq("grade", grade)
    .order("bundle_number", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ bundles: data ?? [], course, grade });
}
