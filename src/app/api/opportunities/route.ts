import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

// GET /api/opportunities — list saved opportunities
export async function GET() {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ opportunities: data ?? [] });
}

// POST /api/opportunities — save a single opportunity
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) {
      return Response.json({ error: "Database not available" }, { status: 503 });
    }

    const { data, error } = await supabase
      .from("opportunities")
      .insert(body)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ opportunity: data }, { status: 201 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
