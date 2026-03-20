import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

// POST /api/dreams/bulk — update status on multiple dreams at once
// Body: { ids: string[], status: string }
export async function POST(request: Request) {
  try {
    const { ids, status } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json({ error: "ids array is required and must not be empty" }, { status: 400 });
    }
    if (!status) return Response.json({ error: "status is required" }, { status: 400 });

    const validStatuses = ["seed", "active", "building", "shipped", "archived", "dismissed"];
    if (!validStatuses.includes(status)) {
      return Response.json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
    }

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });

    const updates: Record<string, unknown> = { status };
    if (status === "archived" || status === "dismissed") {
      updates.archived_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("dreams")
      .update(updates)
      .in("id", ids)
      .select("id, status");

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ updated: data?.length ?? 0, dreams: data });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
