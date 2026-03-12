/**
 * GET /api/debug/context
 * Returns the full live context payload injected into every chat session.
 * Authenticated via Supabase session (no CRON_SECRET needed).
 */
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }

  const result: Record<string, unknown> = {
    fetchedAt: new Date().toISOString(),
    sections: [],
  };

  const sections: { label: string; rowCount: number; preview: unknown }[] = [];

  // 1 — Founder notes
  try {
    const { data } = await supabase
      .from("founder_notes")
      .select("content, category, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    sections.push({
      label: "Founder Memory",
      rowCount: data?.length ?? 0,
      preview: data?.map((n) => `[${n.category}] ${n.content.slice(0, 120)}`),
    });
  } catch { sections.push({ label: "Founder Memory", rowCount: 0, preview: "(table missing)" }); }

  // 2 — Latest brief
  try {
    const { data } = await supabase
      .from("briefs")
      .select("brief_date, title, summary, sections")
      .eq("status", "published")
      .order("brief_date", { ascending: false })
      .limit(1)
      .single();
    sections.push({
      label: "Latest Daily Brief",
      rowCount: data ? 1 : 0,
      preview: data ? { date: data.brief_date, title: data.title, summary: data.summary } : null,
    });
  } catch { sections.push({ label: "Latest Daily Brief", rowCount: 0, preview: "(none found)" }); }

  // 3 — Knowledge summaries
  try {
    const { data } = await supabase
      .from("knowledge_summaries")
      .select("tag, summary, item_count, updated_at")
      .order("item_count", { ascending: false });
    sections.push({
      label: "Knowledge Summaries (what the brain knows)",
      rowCount: data?.length ?? 0,
      preview: data?.map((s) => ({
        tag: s.tag,
        itemCount: s.item_count,
        updatedAt: s.updated_at,
        facts: s.summary,
      })),
    });
  } catch { sections.push({ label: "Knowledge Summaries", rowCount: 0, preview: "(table missing)" }); }

  // 4 — Saved research items
  try {
    const { data, count } = await supabase
      .from("research_items")
      .select("title, tags, summary, status, created_at", { count: "exact" })
      .eq("status", "saved")
      .order("created_at", { ascending: false })
      .limit(10);
    sections.push({
      label: `Saved Research (top 10 of ${count ?? "?"})`,
      rowCount: count ?? 0,
      preview: data?.map((i) => `[${(i.tags ?? []).join(", ")}] ${i.title}`),
    });
  } catch { sections.push({ label: "Saved Research", rowCount: 0, preview: "(error)" }); }

  // 5 — Open opportunities
  try {
    const { data, count } = await supabase
      .from("opportunities")
      .select("title, category, store_score, created_at", { count: "exact" })
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(10);
    sections.push({
      label: `Open Opportunities (top 10 of ${count ?? "?"})`,
      rowCount: count ?? 0,
      preview: data?.map((o) => `[${o.category}] ${o.title}`),
    });
  } catch { sections.push({ label: "Open Opportunities", rowCount: 0, preview: "(error)" }); }

  result.sections = sections;
  result.totalContextSections = sections.filter((s) => s.rowCount > 0).length;

  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
