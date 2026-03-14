import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { fetchAllRssFeeds, formatRssItemsForPrompt } from "@/lib/sources/rss";
import { fetchGitHubAlerts, formatGitHubAlertsForPrompt } from "@/lib/sources/github";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the intelligence engine for Chapterhouse — the private ops brain of Scott Somers (TheAccidentalTeacher on GitHub).

Scott is a middle school teacher in Glennallen, Alaska. His teaching contract ends May 24, 2026. He is building three businesses before that deadline:
1. Next Chapter Homeschool Outpost — a curated Shopify homeschool store, Anna is primary builder (launch before June 2026)
2. SomerSchool — standalone homeschool curriculum SaaS (off Epic Learning / Trisha Goyer as of March 2026; Scott owns platform and 100% of revenue). 52-course target, secular, COPPA-compliant.
3. BibleSaaS — AI-powered Bible study app (personal use for Scott + son currently; needs beta before commercial launch)

Your job: read the real news and GitHub data provided below, then produce ONE daily brief that tells Scott what matters TODAY. Filter ruthlessly. He has 47 repos, 3 businesses, and no time.

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
          "whyItMatters": "string — 1-2 sentences why this matters for Scott's three businesses RIGHT NOW",
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

export async function POST(request: Request) {
  try {
    const { context } = await request.json().catch(() => ({ context: "" }));
    const today = new Date().toISOString().split("T")[0];

    // Fetch real data from both sources in parallel
    const [rssResult, githubResult] = await Promise.all([
      fetchAllRssFeeds(),
      fetchGitHubAlerts(),
    ]);

    // Fetch accumulated knowledge summaries (best-effort — table may not exist yet)
    const supabase = getSupabaseServiceRoleClient();
    let knowledgeSummaryBlock = "";
    if (supabase) {
      try {
        const { data: summaries } = await supabase
          .from("knowledge_summaries")
          .select("tag, summary, item_count")
          .order("item_count", { ascending: false });
        if (summaries && summaries.length > 0) {
          const lines = summaries
            .map((s) => `**${s.tag}** (${s.item_count} items): ${s.summary}`)
            .join("\n");
          knowledgeSummaryBlock =
            `\n---\n## ACCUMULATED KNOWLEDGE BASE\n` +
            `Scott's research, condensed by category. Use these as additional context when scoring relevance and writing verdicts:\n${lines}`;
        }
      } catch {
        // knowledge_summaries table not yet created — skip
      }
    }

    const totalScanned = rssResult.scannedCount + githubResult.scannedCount;
    const rssSection = formatRssItemsForPrompt(rssResult.items);
    const githubSection = formatGitHubAlertsForPrompt(githubResult.alerts);

    const userPrompt = [
      `Daily brief date: ${today}`,
      `Total items scanned: ${totalScanned} (${rssResult.scannedCount} RSS articles from ${rssResult.feedsSucceeded} feeds, ${githubResult.scannedCount} GitHub alerts across ${githubResult.reposChecked} repos)`,
      context ? `\nAdditional context from Scott: ${context}` : "",
      "\n---\n## LIVE DATA — RSS FEEDS",
      rssSection || "(no RSS items returned — all feeds may be down)",
      "\n---",
      githubSection,
      knowledgeSummaryBlock,
      "\n---",
      "Now generate the daily brief JSON.",
    ]
      .filter(Boolean)
      .join("\n");

    const message = await anthropic.messages.create({
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
        sections: briefData.sections,
        source_count: totalScanned,
        status: "published",
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(
      {
        brief: data,
        meta: {
          rssFeeds: rssResult.feedsSucceeded,
          rssFailed: rssResult.feedsFailed,
          githubRepos: githubResult.reposChecked,
          totalScanned,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Brief generation error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
