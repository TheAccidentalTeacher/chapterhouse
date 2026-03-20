import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-context";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

// GET /api/context/export?type=<document_type>
// Downloads the active document of the given type as a plain .md file.
// Omit ?type to export ALL active docs concatenated.
export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let query = supabase
      .from("context_files")
      .select("id, name, content, document_type")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("inject_order", { ascending: true });

    if (type) {
      query = query.eq("document_type", type).limit(1);
    }

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "No active context document found" }, { status: 404 });
    }

    // Stamp last_exported_at on all returned docs
    await Promise.all(
      data.map((doc) =>
        supabase
          .from("context_files")
          .update({ last_exported_at: new Date().toISOString() })
          .eq("id", doc.id)
      )
    );

    // Build combined content
    const combined = data.map((doc) => doc.content).join("\n\n---\n\n");

    const filenameBase = type
      ? type.replace(/_/g, "-")
      : "chapterhouse-brain";

    return new Response(combined, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filenameBase}.md"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "Unauthenticated") return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
