import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { fetchAllRssFeeds, formatRssItemsForPrompt } from "@/lib/sources/rss";
import { fetchGitHubAlerts, formatGitHubAlertsForPrompt } from "@/lib/sources/github";
import { fetchDailyDevPosts, formatDailyDevForPrompt } from "@/lib/sources/dailydev";
import { fetchInboxMessages, formatEmailForPrompt } from "@/lib/sources/email";

function getAnthropic() { return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }); }

const SYSTEM_PROMPT = `You are the intelligence engine for Chapterhouse — the private ops brain of Scott Somers (TheAccidentalTeacher on GitHub).

## WHO SCOTT IS
Middle school teacher in Glennallen, Alaska (pop. 439, Title 1 school, 65% Alaska Native students). Teaching contract ends May 24, 2026. One runway: meaningful revenue before August 2026. Zero tech background — went full-stack in 6 months using only AI. Anna Somers (wife, pen name Alana Terry) is a USA Today bestselling Christian fiction author who hosts "Praying Christian Women" podcast — warm launch market for all products.

## THE THREE BUSINESS TRACKS

### TRACK 1 — Next Chapter Homeschool Outpost (NCHO)
- Shopify + Ingram Spark dropship homeschool curriculum store. No inventory. Anna is primary builder.
- TARGET: Homeschool moms 30–45, faith-adjacent, overwhelmed by curriculum choices, many in Alaska (allotment-eligible).
- USP: Curated by a real classroom teacher. Alaska allotment eligible. Carries faith resources without being a "faith store."
- BRAND VOICE: "Your child" not "your student." Never: explore, journey, leverage, synergy. Lead emotional: "For the child who doesn't fit in a box." Convert practical: "Your one-stop homeschool shop."
- VISUAL: Red and white primary. Earthy accents (olive, rose, teal) secondary. Click-test confirmed.
- COMPETITORS: Rainbow Resource Center, Christianbook.com
- Screen fatigue = POSITIONING OPPORTUNITY. Lean into books, manipulatives, low-screen options.
- STATUS: Launching imminently. HIGHEST urgency.

### TRACK 2 — SomersSchool / SomersVerse
- Standalone SaaS homeschool course platform. 52-course target (13 grades × 4 core subjects).
- ALL CONTENT IS SECULAR — Alaska Statute 14.03.320 nonsectarian requirement applies.
- COPPA hard requirement: children under 13 cannot self-register. Parent account → child profile → child login.
- STUDENT DATA: Never used for AI training. Only Anthropic API, OpenAI API, or Azure AI may process student content.
- K-5: Gimli mascot (125-lb malamute). 6-12: Scott HeyGen avatar.
- Pricing: $49/mo (1 student), +$25 each, capped $149/mo (5+ students). À la carte: $149/course.
- COMPETITOR: Trisha Goyer / Epic Learning (SomersSchool left her platform March 2026). Keep relationship positive.
- RETENTION: Every lesson ends with badge + XP + parent notification. Visible progress IS the product.
- STATUS: First enrollment required before August 2026. Critical path.

### TRACK 3 — BibleSaaS
- AI Bible study web app. SM-2 spaced repetition, 344K TSK cross-references, living portrait visualization.
- Personal use only (Scott + son) until beta cohort established. LOW PRIORITY.
- Privacy-first: no social graph, no data selling.

## RULES FOR YOUR ANALYSIS
- In whyItMatters: connect findings to the SPECIFIC track they affect. Be explicit.
- Screen fatigue → NCHO lean-in + SomersSchool "intentional learning" positioning.
- Homeschool policy → check Alaska allotment eligibility angle.
- AI model releases → check against student data protection rules.
- Competitor moves → name the competitor and the specific threat or opportunity.
- Always "your child" not "your student" in any copy recommendations.

## TECH STACK (for GitHub/dev news analysis)
Next.js App Router + TypeScript + Tailwind, Supabase, Anthropic Claude Sonnet 4.6, OpenAI GPT-5.4, Upstash QStash + Redis, Railway workers, Vercel, Stripe, Buffer GraphQL API.

## OUTPUT FORMAT
You output ONLY valid JSON — no markdown fences, no prose, no explanation. Match this exact schema:

{
  "title": "string — a short punchy title for today's brief",
  "summary": "string — 2-3 sentences: what happened, what Scott should do first, what he can ignore",
  "sections": [
    {
      "title": "string — use these exact section names: '🔴 Action Required', '🟡 Worth Knowing', '🟢 Market Intel', '📊 My Repos', '⚫ Filtered Out'",
      "items": [
        {
          "headline": "string — concise, action-oriented, specific",
          "whyItMatters": "string — 1-2 sentences why this matters for Scott's specific tracks RIGHT NOW",
          "score": "string — one of: A+, A, A-, B+, B, B-, C",
          "sources": 0
        }
      ]
    }
  ]
}

Rules:
- '🔴 Action Required' = things that need attention TODAY (security alerts, breaking API changes, expired deadlines, failed builds). If nothing qualifies, omit this section.
- '🟡 Worth Knowing' = important developments, new tool releases, market trends. 2-4 items.
- '🟢 Market Intel' = homeschool community activity, competitor moves, relevant faith/education policy news. 2-3 items.
- '📊 My Repos' = GitHub health summary. If no issues, say so in one item. Include actual repo names.
- '⚫ Filtered Out' = exactly ONE item summarizing how many articles were scanned and deemed irrelevant. Format: "Scanned X articles across Y sources. Z were not relevant today."
- Be brutally specific. "Anthropic released Claude 4" is better than "there were AI developments."
- If a source returned no data, skip it — do not hallucinate content.
`;

type BriefData = {
  title: string;
  summary: string;
  sections: Array<{
    title: string;
    items: Array<{ headline: string; whyItMatters: string; score: string; sources: number }>;
  }>;
};

type TrackImpacts = { ncho: number; somersschool: number; biblesaas: number };

async function scoreTrackImpacts(
  items: Array<{ headline: string; whyItMatters: string }>
): Promise<Map<string, { track_impacts: TrackImpacts; collision_note?: string }>> {
  const result = new Map<string, { track_impacts: TrackImpacts; collision_note?: string }>();
  if (items.length === 0) return result;

  const itemList = items
    .map((item, i) => `${i + 1}. "${item.headline}": ${item.whyItMatters}`)
    .join("\n");

  const response = await getAnthropic().messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system: `Score each intelligence brief item by its impact on three business tracks.

TRACK DEFINITIONS:
- ncho: Next Chapter Homeschool Outpost — Shopify homeschool store launching imminently. Affected by homeschool trends, curriculum news, screen fatigue, faith market, competitor moves, Alaska allotment, Shopify platform changes.
- somersschool: SomersSchool SaaS course platform. Affected by EdTech, COPPA/child privacy law, secular curriculum trends, subscription pricing, AI in education, Alaska allotment eligibility.
- biblesaas: BibleSaaS AI Bible study app (personal use only). Affected by AI model releases, Bible study trends, faith tech, privacy law.

Scoring: 0=irrelevant, 1=minor relevance, 2=significant impact, 3=direct action needed today.
Collision: any item scoring ≥2 on 2+ tracks gets a collision_note (1 sentence explaining the cross-track implication).

Return ONLY valid JSON array, one entry per input item in order:
[{"headline":"...", "track_impacts":{"ncho":0,"somersschool":0,"biblesaas":0}, "collision_note":"optional string or omit key"}]`,
    messages: [{ role: "user", content: `Score these brief items:\n${itemList}` }],
  });

  const raw = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  try {
    const cleaned = raw.replace(/```(?:json)?\s*([\s\S]+?)```/, "$1").trim();
    const parsed = JSON.parse(cleaned) as Array<{
      headline: string;
      track_impacts: TrackImpacts;
      collision_note?: string;
    }>;
    items.forEach((item, i) => {
      const scored = parsed[i];
      if (scored?.track_impacts) {
        result.set(item.headline, {
          track_impacts: scored.track_impacts,
          ...(scored.collision_note ? { collision_note: scored.collision_note } : {}),
        });
      }
    });
  } catch {
    // non-fatal — brief saves without collision data
  }

  return result;
}

export async function POST(request: Request) {
  try {
    const { context } = await request.json().catch(() => ({ context: "" }));
    const today = new Date().toISOString().split("T")[0];

    // Fetch RSS + GitHub + daily.dev + NCHO inbox in parallel
    const [rssResult, githubResult, dailyDevResult, emailResult] = await Promise.all([
      fetchAllRssFeeds(),
      fetchGitHubAlerts(),
      fetchDailyDevPosts(),
      fetchInboxMessages(),
    ]);

    const supabase = getSupabaseServiceRoleClient();
    const daysLeft = Math.ceil(
      (new Date("2026-05-24").getTime() - Date.now()) / 86400000
    );

    // Fetch internal Supabase context in parallel (best-effort)
    let founderNotes: Array<{ content: string; category: string }> = [];
    let researchItems: Array<{ title: string; summary: string | null; verdict: string | null }> = [];
    let opportunities: Array<{ title: string; description: string | null; status: string; score: string | null }> = [];
    let knowledgeSummaries: Array<{ tag: string; summary: string; item_count: number }> = [];

    if (supabase) {
      try {
        const [fn, ri, op, ks] = await Promise.all([
          supabase.from("founder_notes").select("content, category").order("created_at", { ascending: false }).limit(30),
          supabase.from("research_items").select("title, summary, verdict").order("created_at", { ascending: false }).limit(20),
          supabase.from("opportunities").select("title, description, status, score").in("status", ["open", "in_progress"]).order("score", { ascending: false }).limit(8),
          supabase.from("knowledge_summaries").select("tag, summary, item_count").order("item_count", { ascending: false }),
        ]);
        founderNotes = (fn.data ?? []) as typeof founderNotes;
        researchItems = (ri.data ?? []) as typeof researchItems;
        opportunities = (op.data ?? []) as typeof opportunities;
        knowledgeSummaries = (ks.data ?? []) as typeof knowledgeSummaries;
      } catch {
        // non-fatal — brief generates without internal context
      }
    }

    // Build internal context blocks
    let founderMemoryBlock = "";
    if (founderNotes.length > 0) {
      const byCategory = new Map<string, string[]>();
      for (const note of founderNotes) {
        const cat = note.category || "general";
        if (!byCategory.has(cat)) byCategory.set(cat, []);
        byCategory.get(cat)!.push(note.content);
      }
      const lines = Array.from(byCategory.entries())
        .map(([cat, notes]) => `**${cat}:**\n${notes.map((n) => `  - ${n}`).join("\n")}`)
        .join("\n");
      founderMemoryBlock = `\n---\n## SCOTT'S FOUNDER MEMORY (auto-learned from sessions)\nUse these facts to make your whyItMatters sentences specific to Scott's actual situation:\n${lines}`;
    }

    let researchBlock = "";
    if (researchItems.length > 0) {
      const lines = researchItems
        .map((r) => `- **${r.title}**${r.verdict ? ` → ${r.verdict}` : ""}${r.summary ? ` (${r.summary.slice(0, 120)}...)` : ""}`)
        .join("\n");
      researchBlock = `\n---\n## RECENT RESEARCH (from Scott's research library)\n${lines}`;
    }

    let opportunitiesBlock = "";
    if (opportunities.length > 0) {
      const lines = opportunities
        .map((o) => `- [${o.status?.toUpperCase() ?? "OPEN"}] **${o.title}** (score: ${o.score ?? "—"}) — ${o.description?.slice(0, 100) ?? ""}`)
        .join("\n");
      opportunitiesBlock = `\n---\n## OPEN OPPORTUNITIES (tracked in Scott's pipeline)\n${lines}`;
    }

    let knowledgeSummaryBlock = "";
    if (knowledgeSummaries.length > 0) {
      const lines = knowledgeSummaries
        .map((s) => `**${s.tag}** (${s.item_count} items): ${s.summary}`)
        .join("\n");
      knowledgeSummaryBlock = `\n---\n## ACCUMULATED KNOWLEDGE BASE\nScott's research, condensed by category:\n${lines}`;
    }

    const totalScanned = rssResult.scannedCount + githubResult.scannedCount + dailyDevResult.scannedCount + emailResult.scannedCount;
    const rssSection = formatRssItemsForPrompt(rssResult.items);
    const githubSection = formatGitHubAlertsForPrompt(githubResult.alerts);
    const dailyDevSection = formatDailyDevForPrompt(dailyDevResult);
    const emailSection = formatEmailForPrompt(emailResult);

    const userPrompt = [
      `Daily brief date: ${today}`,
      `Teaching contract ends: May 24, 2026 (${daysLeft} days remaining — revenue required before August 2026)`,
      `Total items scanned: ${totalScanned} (${rssResult.scannedCount} RSS from ${rssResult.feedsSucceeded} feeds, ${githubResult.scannedCount} GitHub across ${githubResult.reposChecked} repos, ${dailyDevResult.scannedCount} daily.dev posts from ${dailyDevResult.feedsSucceeded} feeds, ${emailResult.scannedCount} NCHO inbox emails)`,
      context ? `\nAdditional context from Scott: ${context}` : "",
      "\n---\n## LIVE DATA — RSS FEEDS",
      rssSection || "(no RSS items returned — all feeds may be down)",
      "\n---\n## LIVE DATA — DAILY.DEV (developer signal, pre-summarized)",
      dailyDevSection,
      emailResult.scannedCount > 0 ? "\n---\n## LIVE DATA — NCHO INBOX (emails received in last 24 hours)" : "",
      emailSection,
      "\n---",
      githubSection,
      knowledgeSummaryBlock,
      founderMemoryBlock,
      researchBlock,
      opportunitiesBlock,
      "\n---",
      "Now generate the daily brief JSON.",
    ]
      .filter(Boolean)
      .join("\n");

    const message = await getAnthropic().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const rawText = message.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("");

    let briefData: BriefData;

    try {
      briefData = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/```(?:json)?\s*([\s\S]+?)```/);
      if (match) {
        briefData = JSON.parse(match[1]);
      } else {
        return Response.json(
          { error: "Model did not return valid JSON", raw: rawText.slice(0, 500) },
          { status: 422 }
        );
      }
    }

    // Run track impact + collision scoring (best-effort — not fatal if it fails)
    const allItems = briefData.sections.flatMap((s) => s.items);
    let trackScores = new Map<string, { track_impacts: TrackImpacts; collision_note?: string }>();
    try {
      trackScores = await scoreTrackImpacts(allItems);
    } catch {
      // non-fatal
    }

    const enrichedSections = briefData.sections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        ...(trackScores.get(item.headline) ?? {}),
      })),
    }));

    // Save to Supabase
    if (!supabase) {
      return Response.json({ error: "Database not available" }, { status: 503 });
    }

    const { data, error } = await supabase
      .from("briefs")
      .insert({
        brief_date: today,
        title: briefData.title,
        summary: briefData.summary,
        sections: enrichedSections,
        source_count: totalScanned,
        status: "published",
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const collisionCount = enrichedSections
      .flatMap((s) => s.items)
      .filter((item) => (item as Record<string, unknown>).collision_note).length;

    return Response.json(
      {
        brief: data,
        meta: {
          rssFeeds: rssResult.feedsSucceeded,
          rssFailed: rssResult.feedsFailed,
          githubRepos: githubResult.reposChecked,
          dailyDevPosts: dailyDevResult.scannedCount,
          totalScanned,
          collisionCount,
          contextInjected: {
            founderNotes: founderNotes.length,
            researchItems: researchItems.length,
            opportunities: opportunities.length,
            knowledgeSummaries: knowledgeSummaries.length,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Brief generation error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
