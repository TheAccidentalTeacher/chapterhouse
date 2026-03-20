import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-context";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { z } from "zod";

// GET /api/context
// Returns the user's active context file (id, name, content, word_count, updated_at).
// Returns null if none exists yet.
export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    const { data, error } = await supabase
      .from("context_files")
      .select("id, name, description, content, is_active, updated_at, last_exported_at")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ contextFile: data ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "Unauthenticated") return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const upsertSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  content: z.string().min(1),
});

// POST /api/context
// Creates or replaces the user's active context file.
// If one already exists, deactivates it and inserts a new one (preserves history).
export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    const body = await request.json();
    const parsed = upsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { name = "Primary Context", description, content } = parsed.data;

    // Deactivate any existing active context files for this user
    await supabase
      .from("context_files")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("is_active", true);

    // Insert the new one as active
    const { data, error } = await supabase
      .from("context_files")
      .insert({ user_id: userId, name, description, content, is_active: true })
      .select("id, name, description, is_active, updated_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ contextFile: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "Unauthenticated") return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  content: z.string().min(1).optional(),
  is_active: z.boolean().optional(),
});

// PATCH /api/context?id=[uuid]
// Updates a specific context file in place.
export async function PATCH(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("context_files")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)  // scope to owner — prevents cross-user edits
      .select("id, name, description, is_active, updated_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ contextFile: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "Unauthenticated") return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
