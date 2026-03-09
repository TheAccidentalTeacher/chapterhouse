import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

// GET /api/threads — list all threads for a given owner (default: all)
export async function GET(request: NextRequest) {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const owner = request.nextUrl.searchParams.get("owner"); // optional: filter by owner

  let query = supabase
    .from("chat_threads")
    .select("id, title, owner, model, pinned, created_at, updated_at")
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (owner) {
    query = query.eq("owner", owner);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ threads: data ?? [] });
}

// POST /api/threads — create a new thread
export async function POST(request: NextRequest) {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const body = await request.json();
  const {
    title = "New chat",
    owner = "scott",
    messages = [],
    model = "gpt-5.4",
  } = body;

  const { data, error } = await supabase
    .from("chat_threads")
    .insert({ title, owner, messages, model })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ thread: data });
}
