import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { z } from "zod";

// POST /api/dismiss-signal
// Stores a dismissed topic in founder_notes (category: "dismissed").
// Called by the /dismiss chat command or any direct POST.
//
// GET /api/dismiss-signal
// Returns all active dismissed signals.
//
// DELETE /api/dismiss-signal?id=<uuid>
// Removes a dismissed signal (un-dismiss).

const dismissSchema = z.object({
  signal: z.string().min(2).max(500),
  reason: z.string().max(500).optional(),
  source: z.string().max(50).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = dismissSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "signal is required (2–500 chars)" }, { status: 400 });
    }

    const { signal, reason, source = "chat" } = parsed.data;
    const content = reason
      ? `DISMISSED: ${signal} — ${reason}`
      : `DISMISSED: ${signal}`;

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "db unavailable" }, { status: 503 });

    const { data, error } = await supabase
      .from("founder_notes")
      .insert({ content, category: "dismissed", source })
      .select("id, content, created_at")
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ ok: true, id: data.id, content: data.content });
  } catch (e) {
    console.error("dismiss-signal POST error:", e);
    return Response.json({ error: "internal error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ signals: [] });

    const { data, error } = await supabase
      .from("founder_notes")
      .select("id, content, created_at, source")
      .eq("category", "dismissed")
      .order("created_at", { ascending: false });

    if (error) return Response.json({ error: error.message }, { status: 500 });

    // Strip the "DISMISSED: " prefix for clean display
    const signals = (data ?? []).map((row) => ({
      id: row.id,
      signal: (row.content as string).replace(/^DISMISSED:\s*/i, ""),
      created_at: row.created_at,
      source: row.source,
    }));

    return Response.json({ signals });
  } catch (e) {
    console.error("dismiss-signal GET error:", e);
    return Response.json({ signals: [] });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ error: "id required" }, { status: 400 });

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "db unavailable" }, { status: 503 });

    const { error } = await supabase
      .from("founder_notes")
      .delete()
      .eq("id", id)
      .eq("category", "dismissed"); // safety: only delete dismissed rows

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ ok: true });
  } catch (e) {
    console.error("dismiss-signal DELETE error:", e);
    return Response.json({ error: "internal error" }, { status: 500 });
  }
}
