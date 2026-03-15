import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

function getOpenAI() { return new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); }
function getAnthropic() { return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }); }

const SYSTEM_PROMPT = `You are Chapterhouse — the internal intelligence layer for Next Chapter Homeschool Outpost, the operating system built by and for Scott and Anna Somers.

## Who you work for

**Scott Somers** — Former 363-lb man who reversed diabetes (A1c 14.7 → 5.1), became a teacher by accident in Glennallen, Alaska (pop. 439, Title 1 school, 65% Ahtna Athabascan), built a full gamified curriculum called the MAPS Project from scratch because the existing curriculum was garbage, almost got his work stolen by a curriculum company, walked away, and is now building Next Chapter as a mission — not a side hustle. Teaching contract ends May 24, 2026. He is not slowing down.

**Anna Somers** — The one who stopped Scott from signing a terrible contract. Runs the Somers Family homeschool workspace. Loves children's literature. The other half of everything.

## What Next Chapter is

A Shopify-based homeschool outpost selling guides, curriculum frameworks, and educational resources for families who want something real — not watered-down corporate edtech slapped with "AI-enhanced" as a marketing badge. The brand is honest, irreverent, fiercely protective of learners, and allergic to bureaucratic nonsense. It serves parents who've rejected the mainstream options and want tools built by someone who's actually been in the room with kids who needed better.

## What Chapterhouse (this system) does

Chapterhouse is the internal operating system. It ingests signals from research, competitive intelligence, documents, and daily briefs, then helps Scott and Anna make smarter decisions faster. You are the brain. The data feeds are the inputs. The decisions — products, content, positioning, tasks — are the outputs.

## Your job right now

- Answer questions about the business, brand, strategy, competitors, and market
- Help Scott think through product ideas, content angles, and positioning decisions
- Analyze signals and tell him what matters and what doesn't
- Push back when something sounds off — he respects that
- Be direct. Don't pad. Don't hedge unnecessarily.
- You can be funny. Scott would be.
- If you don't have data for something yet, say so plainly and suggest where to get it

## What you can and cannot see

When Scott asks "do you see X in your brain / memory / context?" — answer precisely:

You CAN see:
- Everything in this system prompt (hardcoded facts about Scott, Anna, the business)
- Founder memory injected above (from \`/remember\` commands and the Settings memory panel)
- The latest daily brief
- Recent research items
- Open opportunities

You CANNOT see:
- External files (VS Code settings, GitHub Copilot instruction files, local documents)
- Things added in other tabs or tools unless they were explicitly saved into Chapterhouse

If Scott says he added something and you don't see it, say so specifically — and tell him HOW to get it into your context (paste it here, use \`/remember [fact]\`, or add it via Settings → Founder Memory).

## Voice

Lead with clarity. Land with honesty. Wisecrack when it fits. Never waste his time with filler. You are not a customer service bot — you are the sharpest person in the room who also happens to know everything about this business.`;

// Scores a research item against the user's message using keyword overlap.
// Higher = more relevant to what Scott is asking about right now.
function scoreRelevance(item: { title?: string; summary?: string; verdict?: string; tags?: string[] }, query: string): number {
  if (!query) return 0;
  const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  if (words.length === 0) return 0;
  const text = [
    item.title ?? "",
    item.summary ?? "",
    item.verdict ?? "",
    (item.tags ?? []).join(" "),
  ]
    .join(" ")
    .toLowerCase();
  return words.reduce((score, word) => score + (text.includes(word) ? 1 : 0), 0);
}

// Fetches live context from Supabase to append to every system prompt.
// Right now: latest published brief + recent research items (ranked by relevance to userMessage).
// This is what makes Chapterhouse absorb new information automatically.
async function buildLiveContext(userMessage: string = ""): Promise<string> {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return "";

  const blocks: string[] = [];

  try {
    // Founder memory — personal facts about Scott, Anna, and the business
    const { data: founderNotes } = await supabase
      .from("founder_notes")
      .select("content, category, created_at")
      .order("created_at", { ascending: false });

    if (founderNotes && founderNotes.length > 0) {
      const notesText = founderNotes
        .map((n) => `- [${n.category}] ${n.content}`)
        .join("\n");
      blocks.push(`## Live Context: Founder Memory\n\nThese are accumulated facts about Scott, Anna, and the business — treat them as ground truth:\n\n${notesText}`);
    }
  } catch {
    // founder_notes table may not exist yet — ignore
  }

  try {
    // Latest published brief
    const { data: brief } = await supabase
      .from("briefs")
      .select("brief_date, title, summary, sections")
      .eq("status", "published")
      .order("brief_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (brief) {
      const sectionText = Array.isArray(brief.sections)
        ? (brief.sections as Array<{ title: string; items: Array<{ headline: string; whyItMatters: string; score: string }> }>)
            .map((s) =>
              `### ${s.title}\n` +
              s.items.map((item) => `- [${item.score}] ${item.headline}: ${item.whyItMatters}`).join("\n")
            )
            .join("\n\n")
        : "";
      blocks.push(
        `## Live Context: Latest Daily Brief (${brief.brief_date})\n\n` +
        `**${brief.title}**\n\n` +
        (brief.summary ? `${brief.summary}\n\n` : "") +
        sectionText
      );
    }
  } catch {
    // Brief fetch failed — carry on without it
  }

  try {
    // Knowledge summaries — compressed overview of accumulated research by tag
    const { data: summaries } = await supabase
      .from("knowledge_summaries")
      .select("tag, summary, item_count")
      .order("item_count", { ascending: false });

    if (summaries && summaries.length > 0) {
      const summaryText = summaries
        .map((s) => `### ${s.tag} (${s.item_count} items)\n${s.summary}`)
        .join("\n\n");
      blocks.push(
        `## Live Context: Accumulated Knowledge Base\n\nResearch Scott and Anna have saved and distilled — treat these as established facts about their market, tools, and environment:\n\n${summaryText}`
      );
    }
  } catch {
    // knowledge_summaries table not yet created — ignore
  }

  try {
    // Fetch up to 100 research items, then rank by relevance to the user's message
    const { data: allItems } = await supabase
      .from("research_items")
      .select("url, title, summary, verdict, tags, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (allItems && allItems.length > 0) {
      // Score each item, then sort descending. Fall back to recency order (score=0 for all) when no message.
      const scored = allItems
        .map((item) => ({ item, score: scoreRelevance(item, userMessage) }))
        .sort((a, b) => b.score - a.score || 0); // stable: recency order preserved for ties

      const top10 = scored.slice(0, 10).map((s) => s.item);

      const researchText = top10
        .map((item) =>
          `- **${item.title || item.url}** (${new Date(item.created_at).toLocaleDateString()})\n` +
          `  ${item.summary || ""}\n` +
          (item.verdict ? `  Verdict: ${item.verdict}` : "")
        )
        .join("\n");
      blocks.push(`## Live Context: Research (top 10 by relevance)\n\n${researchText}`);
    }
  } catch {
    // research_items table may not exist yet — ignore
  }

  try {
    // Top open opportunities
    const { data: opps } = await supabase
      .from("opportunities")
      .select("title, description, category, store_score, curriculum_score, content_score, action, status")
      .in("status", ["open", "in-progress"])
      .order("created_at", { ascending: false })
      .limit(8);

    if (opps && opps.length > 0) {
      const oppText = opps
        .map((o) =>
          `- **${o.title}** [${o.category}] — Store: ${o.store_score}, Curriculum: ${o.curriculum_score}, Content: ${o.content_score}\n` +
          `  ${o.description}\n` +
          (o.action ? `  Next action: ${o.action}` : "")
        )
        .join("\n");
      blocks.push(`## Live Context: Open Opportunities\n\n${oppText}`);
    }
  } catch {
    // opportunities table may not exist yet — ignore
  }

  return blocks.length > 0
    ? "\n\n---\n\n" + blocks.join("\n\n---\n\n")
    : "";
}

// Extracts HTTP/HTTPS URLs from a text string
function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"')\]]+/gi;
  const matches = text.match(urlRegex);
  if (!matches) return [];
  // Deduplicate and limit to 3 URLs to keep context reasonable
  return [...new Set(matches)].slice(0, 3);
}

// Fetches a URL and extracts readable text content (with SSRF protection)
async function fetchUrlContent(url: string): Promise<string | null> {
  try {
    const parsed = new URL(url);
    // SSRF protection: block private/internal IPs and non-http(s) schemes
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname.startsWith("127.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("0.") ||
      hostname === "[::1]" ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".local")
    ) return null;

    const res = await fetch(url, {
      headers: { "User-Agent": "Chapterhouse/1.0 (link preview)" },
      signal: AbortSignal.timeout(12000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) return null;

    const html = await res.text();

    // Extract metadata
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : "";
    const descMatch = html.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["'](?:description|og:description)["']/i);
    const description = descMatch ? descMatch[1].trim() : "";
    const authorMatch = html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i);
    const author = authorMatch ? authorMatch[1].trim() : "";

    // Try to extract article/main content first (much richer than full-page strip)
    let articleHtml = "";
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
      articleHtml = articleMatch[1];
    } else {
      const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
      if (mainMatch) {
        articleHtml = mainMatch[1];
      } else {
        // Try content divs common in blogs/CMSes
        const contentMatch = html.match(/<div[^>]+class=["'][^"']*(?:post-content|entry-content|article-content|blog-content|prose)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
        if (contentMatch) {
          articleHtml = contentMatch[1];
        }
      }
    }

    // Strip HTML from the best source we found
    const sourceHtml = articleHtml || html;
    const text = sourceHtml
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<aside[\s\S]*?<\/aside>/gi, "")
      .replace(/<form[\s\S]*?<\/form>/gi, "")
      .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, "\n## $2\n") // preserve headings
      .replace(/<li[^>]*>/gi, "\n- ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#\d+;/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+/g, " ")
      .trim()
      .slice(0, 12000);

    const header = [
      `[URL: ${url}]`,
      title && `Title: ${title}`,
      author && `Author: ${author}`,
      description && `Description: ${description}`,
      articleHtml ? `(Article content extracted — ${text.length} chars)` : `(Full page stripped — ${text.length} chars)`,
    ].filter(Boolean).join("\n");

    return `${header}\n\n${text}`;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { messages, model = "gpt-5.4" } = await request.json();

    const encoder = new TextEncoder();

    // Extract the last user message for relevance scoring
    const lastUserMsg: string =
      [...messages].reverse().find((m: { role: string; content: string }) => m.role === "user")?.content ?? "";

    // Enrich system prompt with live context from Supabase (research ranked by relevance to this message)
    const liveContext = await buildLiveContext(lastUserMsg);

    // Detect URLs in the user's message and fetch their content
    let urlContext = "";
    const urls = extractUrls(lastUserMsg);
    if (urls.length > 0) {
      const fetched = await Promise.all(urls.map(fetchUrlContent));
      const urlTexts = fetched.filter(Boolean) as string[];
      if (urlTexts.length > 0) {
        urlContext = "\n\n---\n\n## Live Context: URLs From This Message\n\nThe user shared these links. Their content has been fetched for you:\n\n" +
          urlTexts.join("\n\n---\n\n");
      }
    }

    const systemPrompt = SYSTEM_PROMPT + liveContext + urlContext;

    // Route to Anthropic if claude model requested
    if (model.startsWith("claude")) {
      const stream = getAnthropic().messages.stream({
        model,
        max_tokens: 2048,
        system: systemPrompt,
        messages,
      });

      const readable = new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
          controller.close();
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
          "Cache-Control": "no-cache",
        },
      });
    }

    // OpenAI — use Responses API (required for gpt-5.x models)
    const stream = await getOpenAI().responses.create({
      model,
      instructions: systemPrompt,
      input: messages,
      stream: true,
      max_output_tokens: 2048,
    });

    const readable = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (
            event.type === "response.output_text.delta" &&
            event.delta
          ) {
            controller.enqueue(encoder.encode(event.delta));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Failed to get response", { status: 500 });
  }
}
