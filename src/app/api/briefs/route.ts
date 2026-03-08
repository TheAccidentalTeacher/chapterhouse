import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const { title, summary, sections, brief_date } = await request.json();

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) {
      return Response.json({ error: "Database not available" }, { status: 503 });
    }

    const date = brief_date || new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("briefs")
      .insert({
        brief_date: date,
        title: title || `Daily Brief — ${date}`,
        summary: summary || null,
        sections: sections || [],
        source_count: 0,
        status: "published",
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ brief: data }, { status: 201 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
