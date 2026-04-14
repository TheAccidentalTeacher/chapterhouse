import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

interface SearchResult {
  id: string;
  type: "task" | "research" | "opportunity" | "thread" | "brief" | "document";
  title: string;
  snippet: string;
  status?: string;
  url?: string;
  date: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return Response.json({ error: "Query must be at least 2 characters" }, { status: 400 });
  }

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }

  const pattern = `%${q}%`;
  const results: SearchResult[] = [];

  // Search tasks
  try {
    const { data } = await supabase
      .from("tasks")
      .select("id, title, description, status, created_at")
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) {
      for (const t of data) {
        results.push({
          id: t.id,
          type: "task",
          title: t.title,
          snippet: t.description?.slice(0, 120) ?? "",
          status: t.status,
          date: t.created_at,
        });
      }
    }
  } catch { /* table may not exist */ }

  // Search research items
  try {
    const { data } = await supabase
      .from("research_items")
      .select("id, url, title, summary, status, created_at")
      .or(`title.ilike.${pattern},summary.ilike.${pattern}`)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) {
      for (const r of data) {
        results.push({
          id: r.id,
          type: "research",
          title: r.title ?? r.url,
          snippet: r.summary?.slice(0, 120) ?? "",
          status: r.status,
          url: r.url,
          date: r.created_at,
        });
      }
    }
  } catch { /* table may not exist */ }

  // Search opportunities
  try {
    const { data } = await supabase
      .from("opportunities")
      .select("id, title, description, status, created_at")
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) {
      for (const o of data) {
        results.push({
          id: o.id,
          type: "opportunity",
          title: o.title,
          snippet: o.description?.slice(0, 120) ?? "",
          status: o.status,
          date: o.created_at,
        });
      }
    }
  } catch { /* table may not exist */ }

  // Search chat threads
  try {
    const { data } = await supabase
      .from("chat_threads")
      .select("id, title, created_at")
      .ilike("title", pattern)
      .order("updated_at", { ascending: false })
      .limit(10);
    if (data) {
      for (const t of data) {
        results.push({
          id: t.id,
          type: "thread",
          title: t.title,
          snippet: "",
          date: t.created_at,
        });
      }
    }
  } catch { /* table may not exist */ }

  // Search briefs
  try {
    const { data } = await supabase
      .from("briefs")
      .select("id, title, summary, brief_date")
      .or(`title.ilike.${pattern},summary.ilike.${pattern}`)
      .order("brief_date", { ascending: false })
      .limit(5);
    if (data) {
      for (const b of data) {
        results.push({
          id: b.id,
          type: "brief",
          title: b.title ?? `Brief ${b.brief_date}`,
          snippet: b.summary?.slice(0, 120) ?? "",
          date: b.brief_date,
        });
      }
    }
  } catch { /* table may not exist */ }

  // Search documents (Phase 22B)
  try {
    const { data } = await supabase
      .from("documents")
      .select("id, title, doc_type, content, created_at")
      .or(`title.ilike.${pattern},content.ilike.${pattern}`)
      .order("created_at", { ascending: false })
      .limit(5);
    if (data) {
      for (const d of data) {
        results.push({
          id: d.id,
          type: "document",
          title: d.title ?? `${d.doc_type} document`,
          snippet: d.content?.slice(0, 120) ?? "",
          date: d.created_at,
        });
      }
    }
  } catch { /* table may not exist */ }

  // Sort all results by date descending
  results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return Response.json({ query: q, results: results.slice(0, 30), count: results.length });
}
