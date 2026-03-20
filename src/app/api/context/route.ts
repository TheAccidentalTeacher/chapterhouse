import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-context";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { z } from "zod";

// Human-readable labels for each document type (used as default name when saving)
export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  copilot_instructions: "Copilot Instructions",
  dreamer: "Dreamer",
  extended_context: "Extended Context",
  intel: "Intel",
  custom: "Custom",
};

// GET /api/context
// Returns ALL active context documents for the user, ordered by inject_order.
// Optional ?type=<document_type> to fetch a single named document.
export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let query = supabase
      .from("context_files")
      .select("id, name, description, content, is_active, document_type, inject_order, updated_at, last_exported_at")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("inject_order", { ascending: true });

    if (type) {
      query = query.eq("document_type", type);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // If a specific type was requested, return the single doc (or null)
    if (type) {
      return NextResponse.json({ contextFile: data?.[0] ?? null });
    }

    return NextResponse.json({ contextFiles: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "Unauthenticated") return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Default inject_order per document type (lower = assembled earlier in system prompt)
const INJECT_ORDER_DEFAULTS: Record<string, number> = {
  copilot_instructions: 1,
  dreamer: 2,
  extended_context: 3,
  intel: 4,
  custom: 5,
};

const upsertSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  content: z.string().min(1),
  document_type: z.string().min(1).max(100).optional(),
  inject_order: z.number().int().min(1).max(99).optional(),
});

// POST /api/context
// Creates or replaces the active document of the given document_type.
// Deactivates only same-type docs (preserves other types). Preserves history.
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

    const document_type = parsed.data.document_type ?? "copilot_instructions";
    const inject_order = parsed.data.inject_order ?? INJECT_ORDER_DEFAULTS[document_type] ?? 5;
    const name = parsed.data.name ?? DOCUMENT_TYPE_LABELS[document_type] ?? "Context Document";
    const { description, content } = parsed.data;

    // Deactivate only existing active docs of THE SAME type (other types stay active)
    await supabase
      .from("context_files")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("document_type", document_type)
      .eq("is_active", true);

    // Insert the new version as active
    const { data, error } = await supabase
      .from("context_files")
      .insert({ user_id: userId, name, description, content, is_active: true, document_type, inject_order })
      .select("id, name, description, is_active, document_type, inject_order, updated_at")
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
