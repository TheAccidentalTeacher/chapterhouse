import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

const DOCUMENT_TYPE = "scratch_note";

// GET /api/scratch-notes — return the current scratch note content
export async function GET() {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ content: "" });

  const { data } = await supabase
    .from("context_files")
    .select("content")
    .eq("document_type", DOCUMENT_TYPE)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return Response.json({ content: data?.content ?? "" });
}

// POST /api/scratch-notes — save scratch note content (upsert single row)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const content: string = body.content ?? "";

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

    // Check if a scratch note row already exists
    const { data: existing } = await supabase
      .from("context_files")
      .select("id")
      .eq("document_type", DOCUMENT_TYPE)
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      await supabase
        .from("context_files")
        .update({ content, description: `Scratch note — ${new Date().toISOString()}` })
        .eq("id", existing.id);
    } else {
      await supabase.from("context_files").insert({
        name: "Scratch Note",
        content,
        is_active: false, // never injected into AI context
        document_type: DOCUMENT_TYPE,
        inject_order: 99,
        description: `Scratch note — ${new Date().toISOString()}`,
      });
    }

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
