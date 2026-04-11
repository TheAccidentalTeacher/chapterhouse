import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

// GET  /api/knowledge?folder=ai&active_only=true
// POST /api/knowledge  { folder, subfolder?, title, body, source_type?, source_ref?, tags?, inject_order? }
// PATCH /api/knowledge { id, ...fields }
// DELETE /api/knowledge?id=<uuid>

export async function GET(req: NextRequest) {
  const supabase = getSupabaseServiceRoleClient();
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder");
  const activeOnly = searchParams.get("active_only") === "true";

  let query = supabase
    .from("knowledge_nodes")
    .select("id, created_at, updated_at, folder, subfolder, title, body, source_type, source_ref, is_active, inject_order, tags")
    .order("inject_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (folder) query = query.eq("folder", folder);
  if (activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return distinct folder list alongside nodes for sidebar
  const { data: folderRows } = await supabase
    .from("knowledge_nodes")
    .select("folder");
  const folders = folderRows
    ? [...new Set(folderRows.map((r) => r.folder as string))].sort()
    : [];

  return NextResponse.json({ nodes: data ?? [], folders });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseServiceRoleClient();
  const body = await req.json();

  const { folder, subfolder, title, body: nodeBody, source_type, source_ref, tags, inject_order } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("knowledge_nodes")
    .insert({
      folder: folder?.trim() || "general",
      subfolder: subfolder?.trim() || null,
      title: title.trim(),
      body: nodeBody?.trim() ?? "",
      source_type: source_type ?? "manual",
      source_ref: source_ref ?? null,
      is_active: false,
      inject_order: inject_order ?? 100,
      tags: tags ?? [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ node: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const supabase = getSupabaseServiceRoleClient();
  const body = await req.json();

  const { id, ...rest } = body;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const allowed = ["folder", "subfolder", "title", "body", "is_active", "inject_order", "tags", "source_ref", "source_type"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in rest) updates[key] = rest[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "no valid fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("knowledge_nodes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ node: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = getSupabaseServiceRoleClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { error } = await supabase
    .from("knowledge_nodes")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
