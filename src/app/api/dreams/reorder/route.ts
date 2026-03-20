import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

// POST /api/dreams/reorder — update sort_order for a set of dreams
// Body: { items: Array<{ id: string, sort_order: number }> }
export async function POST(request: Request) {
  try {
    const { items } = await request.json();

    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ error: "items array is required" }, { status: 400 });
    }

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });

    // Update each item individually (Supabase doesn't support batch upsert by id easily for different values)
    const updates = await Promise.all(
      items.map(({ id, sort_order }: { id: string; sort_order: number }) =>
        supabase.from("dreams").update({ sort_order }).eq("id", id)
      )
    );

    const errors = updates.filter((r) => r.error).map((r) => r.error?.message);
    if (errors.length > 0) {
      return Response.json({ error: "Some updates failed", details: errors }, { status: 500 });
    }

    return Response.json({ reordered: items.length });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
