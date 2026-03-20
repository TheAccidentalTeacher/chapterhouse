import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-context";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

// GET /api/context/export
// Downloads the user's active context file as a plain text .md file.
// Use this to pull the latest context back into VS Code as copilot-instructions.md.
export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    const { data, error } = await supabase
      .from("context_files")
      .select("id, name, content")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "No active context file" }, { status: 404 });

    // Stamp last_exported_at
    await supabase
      .from("context_files")
      .update({ last_exported_at: new Date().toISOString() })
      .eq("id", data.id);

    const filename = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return new Response(data.content, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename || "chapterhouse-context"}.md"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "Unauthenticated") return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
