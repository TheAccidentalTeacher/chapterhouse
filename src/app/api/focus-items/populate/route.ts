import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

const MAX_ITEMS = 10;

export async function POST() {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

  // Get the first user (Scott-only app)
  const { data: users } = await supabase.auth.admin.listUsers();
  const userId = users?.users?.[0]?.id;
  if (!userId) return Response.json({ error: "No user found" }, { status: 500 });

  // Check current count — only fill empty slots
  const { count: existingCount } = await supabase
    .from("focus_items")
    .select("id", { count: "exact", head: true });

  const slotsAvailable = MAX_ITEMS - (existingCount ?? 0);
  if (slotsAvailable <= 0) {
    return Response.json({ populated: 0, reason: "Board is full" });
  }

  // Gather context from three sources
  const [folioRes, briefRes, dreamsRes] = await Promise.all([
    supabase
      .from("folio_entries")
      .select("top_action, track_signals, summary")
      .order("entry_date", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("briefs")
      .select("sections")
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("dreams")
      .select("title, status")
      .in("status", ["active", "building"])
      .limit(5),
  ]);

  const folioBlock = folioRes.data
    ? `TODAY'S FOLIO:\nTop action: ${folioRes.data.top_action ?? "none"}\nTrack signals: ${JSON.stringify(folioRes.data.track_signals ?? {})}\nSummary: ${folioRes.data.summary ?? ""}`
    : "";

  const briefBlock = briefRes.data?.sections
    ? `TODAY'S BRIEF TOP ITEMS:\n${JSON.stringify(briefRes.data.sections).slice(0, 2000)}`
    : "";

  const dreamsBlock = dreamsRes.data?.length
    ? `ACTIVE DREAMS:\n${dreamsRes.data.map((d: { title: string; status: string }) => `- [${d.status}] ${d.title}`).join("\n")}`
    : "";

  const contextText = [folioBlock, briefBlock, dreamsBlock].filter(Boolean).join("\n\n---\n\n");

  if (!contextText.trim()) {
    return Response.json({ populated: 0, reason: "No context sources available yet" });
  }

  // Call Claude Haiku
  const anthropic = new Anthropic();
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Based on these inputs about Scott Somers' current work, generate up to ${slotsAvailable} specific, actionable working items for today. Be concrete — no vague goals. Each item should be something that can be done in one sitting.

Tag each item with its primary source: folio, brief, or dream.

Format: one item per line, starting with the source tag in brackets.
Example:
[folio] Build SomersSchool pricing page
[brief] Write "Robot Teacher" blog post
[dream] Set up Gimli reference illustration pipeline

${contextText}`,
      },
    ],
  });

  // Parse response
  const text =
    msg.content[0].type === "text" ? msg.content[0].text : "";
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const sourceMap: Record<string, string> = {
    folio: "folio",
    brief: "brief",
    dream: "dream",
  };

  const items: { content: string; source: string; sort_order: number }[] = [];
  for (const line of lines) {
    if (items.length >= slotsAvailable) break;

    const match = line.match(/^\[(\w+)]\s*(.+)/);
    if (match) {
      const source = sourceMap[match[1].toLowerCase()] ?? "manual";
      items.push({
        content: match[2].trim(),
        source,
        sort_order: (existingCount ?? 0) + items.length,
      });
    }
  }

  if (items.length === 0) {
    return Response.json({ populated: 0, reason: "AI returned no parseable items" });
  }

  // Insert items
  const { error } = await supabase.from("focus_items").insert(
    items.map((item) => ({
      ...item,
      user_id: userId,
    }))
  );

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const sources = [...new Set(items.map((i) => i.source))];
  return Response.json({ populated: items.length, sources });
}
