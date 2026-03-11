import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type RawItem = {
  id: string;
  title: string | null;
  summary: string | null;
  verdict: string | null;
  tags: string[];
};

// POST /api/summarize
// Groups all non-archived research items by primary tag, calls Claude to compress
// each group into 2-3 sentences, and upserts the result into knowledge_summaries.
export async function POST() {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }

  const { data: items, error: fetchError } = await supabase
    .from("research_items")
    .select("id, title, summary, verdict, tags")
    .neq("status", "archived");

  if (fetchError) {
    return Response.json({ error: fetchError.message }, { status: 500 });
  }

  if (!items || items.length === 0) {
    return Response.json({ summaries: 0, message: "No research items to summarize" });
  }

  // Group by primary tag (first tag, or "untagged")
  const groups = new Map<string, RawItem[]>();
  for (const item of items as RawItem[]) {
    const tag = item.tags?.[0] ?? "untagged";
    if (!groups.has(tag)) groups.set(tag, []);
    groups.get(tag)!.push(item);
  }

  const results: { tag: string; itemCount: number }[] = [];

  for (const [tag, groupItems] of groups) {
    if (groupItems.length < 2) continue; // single items not worth summarizing

    const itemText = groupItems
      .map(
        (item, i) =>
          `${i + 1}. ${item.title ?? "untitled"}\n   Summary: ${item.summary ?? "(none)"}\n   Verdict: ${item.verdict ?? "(none)"}`
      )
      .join("\n\n");

    try {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content:
              `You are compressing research notes for Scott Somers, who builds homeschool and edtech products ` +
              `(Next Chapter Homeschool Outpost, SomerSchool, BibleSaaS). ` +
              `Summarize these ${groupItems.length} research items tagged "${tag}" into 2-3 tight sentences. ` +
              `What's the pattern? What's the business signal? What should Scott remember or act on?\n\n` +
              `${itemText}\n\n` +
              `Respond with ONLY the summary sentences. No intro, no labels, no metadata.`,
          },
        ],
      });

      const summary = message.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { type: "text"; text: string }).text)
        .join("")
        .trim();

      const { error: upsertError } = await supabase.from("knowledge_summaries").upsert(
        {
          tag,
          summary,
          item_count: groupItems.length,
          item_ids: groupItems.map((i) => i.id),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tag" }
      );

      if (!upsertError) {
        results.push({ tag, itemCount: groupItems.length });
      }
    } catch {
      // If one tag group fails, continue with the rest
    }
  }

  return Response.json({
    summaries: results.length,
    tags: results.map((r) => r.tag),
    message:
      results.length === 0
        ? "Nothing to condense yet — add more research items first"
        : `Condensed ${results.length} knowledge categor${results.length === 1 ? "y" : "ies"} from ${items.length} research items`,
  });
}

// GET /api/summarize — returns current knowledge summaries
export async function GET() {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("knowledge_summaries")
    .select("tag, summary, item_count, updated_at")
    .order("item_count", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ summaries: data ?? [] });
}
