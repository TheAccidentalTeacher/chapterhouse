import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import Anthropic from "@anthropic-ai/sdk";

// POST /api/dreams/ai-review — Claude analyzes seeds and suggests promotions/dismissals
// Returns suggestions only — Scott decides everything. Nothing auto-changes.
export async function POST() {
  try {
    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });

    // Load all seeds (the ones awaiting review)
    const { data: seeds, error } = await supabase
      .from("dreams")
      .select("id, text, notes, category, priority_score, source_label, created_at")
      .eq("status", "seed")
      .order("created_at", { ascending: false });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!seeds || seeds.length === 0) {
      return Response.json({ suggestions: [], message: "No seeds to review." });
    }

    // Also load active/building dreams for context
    const { data: activeDreams } = await supabase
      .from("dreams")
      .select("text, status")
      .in("status", ["active", "building"])
      .order("created_at", { ascending: false })
      .limit(10);

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const seedList = seeds
      .map((s, i) => `[${i + 1}] ID: ${s.id}\nText: ${s.text}\nCategory: ${s.category}\nNotes: ${s.notes || "none"}\nPriority: ${s.priority_score}/100\nSource: ${s.source_label}\nAdded: ${new Date(s.created_at).toLocaleDateString()}`)
      .join("\n\n");

    const activeList = activeDreams
      ? activeDreams.map((d) => `- [${d.status.toUpperCase()}] ${d.text}`).join("\n")
      : "None";

    const systemPrompt = `You are Earl Harbinger — Scott Somers' operations commander. You cut to what ships.

Scott is a middle school teacher in Alaska. Teaching contract ends May 24, 2026. Revenue required before August 2026. His three business tracks: (1) NCHO — homeschool Shopify store launching THIS WEEK, (2) SomersSchool — secular curriculum SaaS, 52-course target, (3) BibleSaaS — personal use for now, long game.

You are reviewing his dream seeds — raw ideas waiting to be acted on or dismissed. Your job: be honest, be direct, help him clear the queue.

Respond ONLY with valid JSON: an array of suggestion objects. No markdown, no explanation outside the JSON.`;

    const userPrompt = `Currently active/building dreams (context for what's already in motion):
${activeList}

Seeds waiting for review:
${seedList}

For each seed, give me your honest assessment. Return a JSON array:
[
  {
    "id": "<seed_id>",
    "text": "<seed text>",
    "suggested_action": "promote" | "dismiss" | "hold" | "merge",
    "suggested_status": "active" | "dismissed" | "seed" | "building",
    "suggested_category": "<category if you'd change it>",
    "suggested_priority": <0-100>,
    "rationale": "<1-2 sentences max — Earl is direct>",
    "urgency": "now" | "soon" | "later" | "never"
  }
]

Rules:
- "promote" = move to active. Only recommend if it directly serves the Aug 2026 revenue target.
- "dismiss" = consciously set aside. Not delete. Recommend for things that are distractions right now.
- "hold" = stay as seed. Good idea, wrong time.
- "merge" = this seed overlaps with another. Note it in rationale.
- urgency "now" = acts on the May 24 deadline or the Aug 2026 revenue target.
- No softening. If it's a distraction, say so.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const rawText = response.content[0].type === "text" ? response.content[0].text : "";

    // Extract JSON from response (handle possible markdown fences)
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return Response.json({ error: "AI response was not valid JSON", raw: rawText }, { status: 500 });
    }

    const suggestions = JSON.parse(jsonMatch[0]);
    return Response.json({ suggestions, seedCount: seeds.length });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
