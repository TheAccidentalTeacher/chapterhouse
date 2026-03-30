/**
 * folio-builder.ts
 *
 * The Folio: daily synthesized intelligence snapshot.
 * Queries ALL source tables (priority ordered), runs Claude Sonnet synthesis,
 * stores the result in folio_entries.
 *
 * Priority ordering (Scott's requirement: manual additions ALWAYS first):
 *   1. founder_notes (all active, full text)
 *   2. manually-added dreams (source_type: manual/chat, recent)
 *   3. manually-added research items (source_type: manual, last 7 days)
 *   4. manually-added intel sessions (source_type: manual, last 48h)
 *   5. latest brief (today's automated summary)
 *   6. all intel sessions last 48h
 *   7. action-required emails (last 24h)
 *   8. opportunities (A+/A items)
 *   9. tasks (open/in-progress/blocked)
 *   10. dreams (all building/active/seed)
 *   11. research items (last 7 days)
 *   12. knowledge summaries
 */

import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

interface FolioEntry {
  narrative: string;
  summary: string;
  top_action: string | null;
  track_signals: {
    ncho: string[];
    somersschool: string[];
    biblesaas: string[];
  };
  priority_items: Array<{ content: string; source: string; type: string }>;
  source_counts: Record<string, number>;
  tokens_used?: number;
}

/**
 * Build a Folio entry for the given date.
 * Idempotent — if an entry exists for this date, it is replaced.
 */
export async function buildFolioEntry(date: Date = new Date()): Promise<{ id: string; entry_date: string }> {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) throw new Error("Supabase client unavailable");

  const startMs = Date.now();
  const entryDate = date.toISOString().split("T")[0]; // YYYY-MM-DD

  const sourceCounts: Record<string, number> = {};
  const priorityBlocks: string[] = [];
  const standardBlocks: string[] = [];
  const priorityItems: Array<{ content: string; source: string; type: string }> = [];

  // ── PRIORITY 1: Founder Notes (full, always) ──────────────────────────────
  try {
    const { data: notes } = await supabase
      .from("founder_notes")
      .select("content, category, created_at")
      .neq("category", "dismissed")
      .order("created_at", { ascending: false });

    if (notes?.length) {
      sourceCounts.founder_notes = notes.length;
      const notesText = notes.map((n) =>
        `- [${n.category ?? "general"}] ${n.content}`
      ).join("\n");
      priorityBlocks.push(`## ⭐ PRIORITY: Founder Memory (${notes.length} notes — Scott's explicit knowledge)\n\n${notesText}`);
      // Flag recent notes as priority items
      const recentNotes = notes.slice(0, 10);
      for (const n of recentNotes) {
        priorityItems.push({ content: n.content as string, source: "founder_notes", type: n.category as string ?? "general" });
      }
    }
  } catch { /* ignore */ }

  // ── PRIORITY 2: Manually-Added Dreams ────────────────────────────────────
  try {
    const { data: dreams } = await supabase
      .from("dreams")
      .select("title, description, status, priority, category, source_type, created_at, updated_at")
      .in("source_type", ["manual", "chat", "dreamer_md"])
      .in("status", ["seed", "active", "building"])
      .order("priority", { ascending: true })
      .limit(30);

    if (dreams?.length) {
      sourceCounts.manual_dreams = dreams.length;
      const dreamLines = dreams.map((d) =>
        `- [${(d.status as string).toUpperCase()}${d.priority ? ` P${d.priority}` : ""}] **${d.title}** (${d.category ?? "uncategorized"})\n  ${d.description ? (d.description as string).slice(0, 200) : ""}`
      ).join("\n");
      priorityBlocks.push(`## ⭐ PRIORITY: Dreams & Ideas — Manually Added (${dreams.length} items)\n\n${dreamLines}`);
      for (const d of dreams.slice(0, 5)) {
        priorityItems.push({ content: d.title as string, source: "dreams", type: d.category as string ?? "idea" });
      }
    }
  } catch { /* ignore */ }

  // ── PRIORITY 3: Manually-Added Research (last 7 days) ────────────────────
  try {
    const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: manualResearch } = await supabase
      .from("research_items")
      .select("title, url, summary, verdict, tags, source_type, created_at")
      .eq("source_type", "manual")
      .gte("created_at", cutoff7d)
      .order("created_at", { ascending: false })
      .limit(30);

    if (manualResearch?.length) {
      sourceCounts.manual_research = manualResearch.length;
      const lines = manualResearch.map((r) =>
        `- **${r.title || r.url}** (${new Date(r.created_at as string).toLocaleDateString()})\n  ${r.summary ?? ""}\n  ${r.verdict ? `Verdict: ${r.verdict}` : ""}`
      ).join("\n");
      priorityBlocks.push(`## ⭐ PRIORITY: Research — Manually Added / Browsed (${manualResearch.length} items)\n\n${lines}`);
      for (const r of manualResearch.slice(0, 5)) {
        priorityItems.push({ content: (r.title || r.url) as string, source: "research_manual", type: "research" });
      }
    }
  } catch { /* ignore */ }

  // ── PRIORITY 4: Manual Intel Sessions (last 48h) ──────────────────────────
  try {
    const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: manualIntel } = await supabase
      .from("intel_sessions")
      .select("session_label, processed_output, created_at")
      .eq("status", "complete")
      .eq("source_type", "manual")
      .gte("created_at", cutoff48h)
      .order("created_at", { ascending: false })
      .limit(10);

    if (manualIntel?.length) {
      sourceCounts.manual_intel = manualIntel.length;
      type IntelOutput = { summary?: string; sections?: Array<{ items: Array<{ headline: string; detail: string; impact_score: string }> }> };
      const lines = manualIntel.map((s) => {
        const out = s.processed_output as IntelOutput | null;
        const label = (s.session_label as string) ?? new Date(s.created_at as string).toLocaleDateString();
        const topItems = (out?.sections ?? []).flatMap((sec) => sec.items).filter((i) => ["A+", "A", "A-"].includes(i.impact_score)).slice(0, 5);
        return `### [Manual Intel] ${label}\n${out?.summary ?? ""}\n${topItems.map((i) => `- [${i.impact_score}] ${i.headline}: ${i.detail.slice(0, 200)}`).join("\n")}`;
      }).join("\n\n");
      priorityBlocks.push(`## ⭐ PRIORITY: Intel Sessions — Manually Submitted (${manualIntel.length})\n\n${lines}`);
    }
  } catch { /* ignore */ }

  // ── STANDARD: Latest Brief ────────────────────────────────────────────────
  try {
    const { data: brief } = await supabase
      .from("briefs")
      .select("brief_date, title, summary, sections")
      .eq("status", "published")
      .order("brief_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (brief) {
      sourceCounts.briefs = 1;
      const sectionText = Array.isArray(brief.sections)
        ? (brief.sections as Array<{ title: string; items: Array<{ headline: string; whyItMatters: string; score: string; collision_note?: string }> }>)
            .map((s) =>
              `### ${s.title}\n` +
              s.items.map((item) => `- [${item.score}] ${item.headline}: ${item.whyItMatters}${item.collision_note ? ` ⚡ ${item.collision_note}` : ""}`).join("\n")
            )
            .join("\n\n")
        : "";
      standardBlocks.push(`## Daily Brief (${brief.brief_date})\n\n**${brief.title}**\n\n${brief.summary ?? ""}\n\n${sectionText}`);
    }
  } catch { /* ignore */ }

  // ── STANDARD: All Intel Sessions (last 48h) ───────────────────────────────
  try {
    const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: allIntel } = await supabase
      .from("intel_sessions")
      .select("session_label, processed_output, source_type, created_at")
      .eq("status", "complete")
      .gte("created_at", cutoff48h)
      .order("created_at", { ascending: false })
      .limit(10);

    if (allIntel?.length) {
      sourceCounts.intel_sessions = allIntel.length;
      type IntelOutput = { summary?: string; sections?: Array<{ items: Array<{ headline: string; detail: string; impact_score: string; affected_repos?: string[] }> }>; proposed_seeds?: Array<{ text: string }> };
      const lines = allIntel.map((s) => {
        const out = s.processed_output as IntelOutput | null;
        if (!out) return null;
        const label = (s.session_label as string) ?? new Date(s.created_at as string).toLocaleDateString();
        const typeTag = s.source_type === "cron" ? "[Daily]" : s.source_type === "manual" ? "[Manual]" : "[PW]";
        const topItems = (out.sections ?? []).flatMap((sec) => sec.items).filter((i) => ["A+", "A", "A-", "B+"].includes(i.impact_score)).slice(0, 8);
        return `### ${typeTag} ${label}\n${out.summary ?? ""}\n${topItems.map((i) => `- [${i.impact_score}] ${i.headline}: ${i.detail.slice(0, 300)}${i.affected_repos?.length ? ` (→ ${i.affected_repos.join(", ")})` : ""}`).join("\n")}`;
      }).filter(Boolean).join("\n\n");
      standardBlocks.push(`## Intel Sessions (last 48h) — ${allIntel.length} sessions\n\n${lines}`);
    }
  } catch { /* ignore */ }

  // ── STANDARD: Action-Required Emails ─────────────────────────────────────
  try {
    const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: emails } = await supabase
      .from("emails")
      .select("subject, from_name, from_address, received_at, ai_summary, urgency, snippet")
      .eq("action_required", true)
      .gte("received_at", cutoff24h)
      .order("urgency", { ascending: false })
      .limit(20);

    if (emails?.length) {
      sourceCounts.action_required_emails = emails.length;
      const lines = emails.map((e) =>
        `- [URGENCY ${e.urgency ?? 0}] **${e.from_name || e.from_address}**: ${e.subject}\n  ${e.ai_summary || e.snippet || ""}`
      ).join("\n");
      standardBlocks.push(`## Action-Required Emails (last 24h) — ${emails.length} items\n\n${lines}`);
    }
  } catch { /* ignore */ }

  // ── STANDARD: Top Opportunities ───────────────────────────────────────────
  try {
    const { data: opps } = await supabase
      .from("opportunities")
      .select("title, description, category, store_score, curriculum_score, content_score, action")
      .in("status", ["open", "in-progress"])
      .order("store_score", { ascending: false })
      .limit(15);

    if (opps?.length) {
      sourceCounts.opportunities = opps.length;
      const lines = opps.map((o) =>
        `- **${o.title}** [${o.category}] Store:${o.store_score} Curriculum:${o.curriculum_score} Content:${o.content_score}\n  ${o.description ?? ""}\n  ${o.action ? `Next: ${o.action}` : ""}`
      ).join("\n");
      standardBlocks.push(`## Open Opportunities — ${opps.length} items\n\n${lines}`);
    }
  } catch { /* ignore */ }

  // ── STANDARD: Tasks ───────────────────────────────────────────────────────
  try {
    const { data: tasks } = await supabase
      .from("tasks")
      .select("title, status, description, created_at")
      .in("status", ["open", "in-progress", "blocked"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (tasks?.length) {
      sourceCounts.tasks = tasks.length;
      const lines = tasks.map((t) =>
        `- [${(t.status as string).toUpperCase()}] **${t.title}**${t.description ? `: ${(t.description as string).slice(0, 120)}` : ""}`
      ).join("\n");
      standardBlocks.push(`## Active Tasks — ${tasks.length} items\n\n${lines}`);
    }
  } catch { /* ignore */ }

  // ── STANDARD: All Dreams ──────────────────────────────────────────────────
  try {
    const { data: allDreams } = await supabase
      .from("dreams")
      .select("title, status, priority, category, source_type, created_at")
      .in("status", ["seed", "active", "building"])
      .order("priority", { ascending: true })
      .limit(50);

    if (allDreams?.length) {
      sourceCounts.dreams = allDreams.length;
      const lines = allDreams.map((d) =>
        `- [${(d.status as string).toUpperCase()}] **${d.title}** (${d.category ?? "uncategorized"}, ${d.source_type ?? "unknown"} source)`
      ).join("\n");
      standardBlocks.push(`## Dreamer Board — ${allDreams.length} active items\n\n${lines}`);
    }
  } catch { /* ignore */ }

  // ── STANDARD: Recent Research ────────────────────────────────────────────
  try {
    const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: research } = await supabase
      .from("research_items")
      .select("title, url, summary, verdict, tags, source_type, created_at")
      .gte("created_at", cutoff7d)
      .order("created_at", { ascending: false })
      .limit(50);

    if (research?.length) {
      sourceCounts.research_items = research.length;
      const lines = research.map((r) =>
        `- **${r.title || r.url}** [${r.source_type ?? "unknown"}] (${new Date(r.created_at as string).toLocaleDateString()})\n  ${r.summary ?? ""}\n  ${r.verdict ? `Verdict: ${r.verdict}` : ""}`
      ).join("\n");
      standardBlocks.push(`## Research Library (last 7 days) — ${research.length} items\n\n${lines}`);
    }
  } catch { /* ignore */ }

  // ── STANDARD: Knowledge Summaries ────────────────────────────────────────
  try {
    const { data: summaries } = await supabase
      .from("knowledge_summaries")
      .select("tag, summary, item_count")
      .order("item_count", { ascending: false })
      .limit(20);

    if (summaries?.length) {
      sourceCounts.knowledge_summaries = summaries.length;
      const lines = summaries.map((s) => `### ${s.tag} (${s.item_count} items)\n${s.summary}`).join("\n\n");
      standardBlocks.push(`## Knowledge Summaries — ${summaries.length} topics\n\n${lines}`);
    }
  } catch { /* ignore */ }

  // ── Assemble Full Context for Claude ────────────────────────────────────
  const daysRemaining = Math.ceil((new Date("2026-05-24").getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const todayStr = date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const fullContext = [
    `# Folio Build Context — ${todayStr}`,
    `Teaching contract ends May 24, 2026 — **${daysRemaining} days remaining.** Revenue required by August 2026.`,
    "",
    "## Business Tracks",
    "1. **NCHO** (Next Chapter Homeschool Outpost) — Shopify store, Anna primary builder, launching now",
    "2. **SomersSchool** — Homeschool SaaS course platform, secular, COPPA, 52-course target",
    "3. **BibleSaaS** — Personal use first, long game",
    "",
    "# DATA — IN PRIORITY ORDER",
    "",
    ...priorityBlocks,
    "",
    "# STANDARD INTELLIGENCE",
    "",
    ...standardBlocks,
  ].join("\n\n");

  // ── Claude Sonnet Synthesis ───────────────────────────────────────────────
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemPrompt = `You are building The Folio — Scott Somers' daily synthesized intelligence snapshot. Think of it as a jump drive Scott reads every morning before opening Chapterhouse.

Scott is a middle school teacher in Glennallen, Alaska (pop. 439). His teaching contract ends May 24, 2026. He needs revenue from his homeschool/education SaaS businesses before August 2026. He vibe codes — AI writes everything. His wife Anna also goes by Alana Terry (USA Today bestselling Christian fiction author).

Your job:
1. Build a complete, honest narrative of what's happening in Scott's world right now.
2. Start ALWAYS with the priority items (founder notes, manually-added dreams, manually-added research). These reflect what Scott has explicitly told the system to remember or is personally tracking.
3. Do NOT aggressively summarize or compress. Preserve the substance. If there are 20 research items, give them real weight.
4. Extract the single most urgent action Scott should take TODAY — concrete, not vague.
5. Identify signals per business track (NCHO, SomersSchool, BibleSaaS).

Return your response as a JSON object with EXACTLY these fields:
{
  "narrative": "...",      // Full narrative, 800-1500 words, Markdown, starts with priority items
  "summary": "...",        // Condensed version ~200-300 words for chat injection
  "top_action": "...",     // Single concrete action for today, 1-2 sentences max
  "track_signals": {
    "ncho": ["..."],        // 3-6 bullets for NCHO track
    "somersschool": ["..."],// 3-6 bullets for SomersSchool track
    "biblesaas": ["..."]    // 1-3 bullets for BibleSaaS track (lower priority)
  }
}

The narrative must feel like a trusted advisor briefing Scott first thing in the morning — candid, specific, dense with actual information, not corporate-speak.`;

  const userPrompt = `Build The Folio for ${todayStr}.\n\nHere is all of Scott's intelligence data:\n\n${fullContext}`;

  let tokensUsed = 0;
  let folio: FolioEntry | null = null;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
    const raw = response.content[0].type === "text" ? response.content[0].text : "";

    // Extract JSON from response (Claude sometimes wraps in ```json```)
    const jsonMatch = raw.match(/```json\s*([\s\S]+?)\s*```/) ?? raw.match(/\{[\s\S]+\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : raw;

    const parsed = JSON.parse(jsonStr);
    folio = {
      narrative: parsed.narrative ?? "",
      summary: parsed.summary ?? "",
      top_action: parsed.top_action ?? null,
      track_signals: parsed.track_signals ?? { ncho: [], somersschool: [], biblesaas: [] },
      priority_items: priorityItems,
      source_counts: sourceCounts,
      tokens_used: tokensUsed,
    };
  } catch (err) {
    // If synthesis fails, build a fallback entry from the raw data
    console.error("[folio-builder] Synthesis failed:", err);
    const fallbackNarrative = [
      `# Folio for ${todayStr}`,
      `*Synthesis failed — raw data follows. ${daysRemaining} days to May 24.*`,
      "",
      ...priorityBlocks,
      ...standardBlocks,
    ].join("\n\n");

    folio = {
      narrative: fallbackNarrative,
      summary: `Folio build failed synthesis for ${todayStr}. Raw data is available but could not be synthesized. Check logs.`,
      top_action: null,
      track_signals: { ncho: [], somersschool: [], biblesaas: [] },
      priority_items: priorityItems,
      source_counts: sourceCounts,
    };
  }

  // ── Save to Supabase (upsert by date) ─────────────────────────────────────
  const { data: saved, error } = await supabase
    .from("folio_entries")
    .upsert({
      entry_date: entryDate,
      narrative: folio.narrative,
      summary: folio.summary,
      top_action: folio.top_action,
      track_signals: folio.track_signals,
      priority_items: folio.priority_items,
      source_counts: folio.source_counts,
      build_duration_ms: Date.now() - startMs,
      model_used: "claude-sonnet-4-6",
      tokens_used: tokensUsed,
      updated_at: new Date().toISOString(),
    }, { onConflict: "entry_date" })
    .select("id, entry_date")
    .single();

  if (error) throw new Error(`[folio-builder] Save failed: ${error.message}`);

  console.log(`[folio-builder] Built Folio for ${entryDate} in ${Date.now() - startMs}ms — ${sourceCounts.founder_notes ?? 0} notes, ${sourceCounts.research_items ?? 0} research, ${tokensUsed} tokens`);
  return saved as { id: string; entry_date: string };
}

/**
 * Get the latest Folio entry (today's or most recent).
 */
export async function getLatestFolio() {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("folio_entries")
    .select("id, entry_date, summary, top_action, track_signals, source_counts, created_at")
    .order("entry_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

/**
 * Build the Folio context string for chat injection.
 * Returns the top_action + last 7 days of summaries.
 */
export async function getFolioContext(): Promise<string> {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return "";

  try {
    const { data: entries } = await supabase
      .from("folio_entries")
      .select("entry_date, summary, top_action, track_signals, source_counts")
      .order("entry_date", { ascending: false })
      .limit(7);

    if (!entries?.length) return "";

    const latest = entries[0];
    const blocks: string[] = [];

    // top_action goes FIRST — Silk's point
    if (latest.top_action) {
      blocks.push(`## 🎯 The Folio — Top Signal for ${latest.entry_date}\n\n**${latest.top_action}**`);
    }

    // Latest full summary
    if (latest.summary) {
      const counts = latest.source_counts as Record<string, number>;
      const countStr = Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(", ");
      blocks.push(`## The Folio — ${latest.entry_date} (synthesized from: ${countStr})\n\n${latest.summary}`);
    }

    // Track signals from latest
    const signals = latest.track_signals as { ncho?: string[]; somersschool?: string[]; biblesaas?: string[] };
    const signalLines: string[] = [];
    if (signals.ncho?.length) signalLines.push(`**NCHO:**\n${signals.ncho.map((s) => `- ${s}`).join("\n")}`);
    if (signals.somersschool?.length) signalLines.push(`**SomersSchool:**\n${signals.somersschool.map((s) => `- ${s}`).join("\n")}`);
    if (signals.biblesaas?.length) signalLines.push(`**BibleSaaS:**\n${signals.biblesaas.map((s) => `- ${s}`).join("\n")}`);
    if (signalLines.length) {
      blocks.push(`## The Folio — Track Signals\n\n${signalLines.join("\n\n")}`);
    }

    // Older summaries (brief, just dates + 1-line top_action)
    if (entries.length > 1) {
      const olderLines = entries.slice(1).map((e) =>
        `- **${e.entry_date}**: ${e.top_action ?? "(no top action)"}`
      ).join("\n");
      blocks.push(`## The Folio — Previous Entries\n\n${olderLines}`);
    }

    return blocks.join("\n\n---\n\n");
  } catch {
    return "";
  }
}
