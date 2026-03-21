import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// ── SSRF-safe URL fetcher (mirrors research/route.ts pattern) ─────────────────

function isSafeUrl(raw: string): { ok: boolean; url?: string; error?: string } {
  try {
    const normalized = raw.startsWith("http") ? raw : `https://${raw}`;
    const parsed = new URL(normalized);
    const h = parsed.hostname;
    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      h === "localhost" ||
      h === "127.0.0.1" ||
      h === "0.0.0.0" ||
      /^10\./.test(h) ||
      /^192\.168\./.test(h) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
      /^169\.254\./.test(h) ||
      /^::1$/.test(h) ||
      /^fc00:/i.test(h)
    ) {
      return { ok: false, error: `URL not allowed: ${raw}` };
    }
    return { ok: true, url: normalized };
  } catch {
    return { ok: false, error: `Invalid URL: ${raw}` };
  }
}

async function fetchUrlContent(url: string): Promise<string> {
  const safe = isSafeUrl(url);
  if (!safe.ok) return `[Could not fetch: ${safe.error}]`;
  try {
    const res = await fetch(safe.url!, {
      headers: { "User-Agent": "Chapterhouse/1.0 (intel ingestion)" },
      signal: AbortSignal.timeout(12_000),
    });
    const html = await res.text();
    // Strip scripts/styles/tags, collapse whitespace
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 6000); // cap per URL
    return text || "[Page returned empty content]";
  } catch (e) {
    return `[Fetch failed: ${String(e)}]`;
  }
}

// ── Prompts ──────────────────────────────────────────────────────────────────

const INTEL_SYSTEM_PROMPT = `You are the intelligence analyst for Chapterhouse — Scott Somers' private ops brain.

Scott runs three businesses:
- NCHO (Next Chapter Homeschool Outpost): Shopify + Ingram Spark homeschool store. Launching imminently. Teaching contract ends May 24, 2026. HIGHEST urgency.
- SomersSchool: Secular homeschool SaaS (52-course target). First enrollment before August 2026. CRITICAL PATH.
- BibleSaaS: AI Bible study app. Personal use until beta. LOW PRIORITY.

Tech stack: Next.js, TypeScript, Supabase, Anthropic Claude, OpenAI GPT-5.4, Railway, Vercel, Stripe.

CATEGORIES — use ONLY these exact names:
- "🔴 Direct Impact" — must act TODAY or THIS WEEK
- "🟡 Ecosystem Signal" — market shifts, competitor moves, tech releases worth knowing
- "🟠 Community Signal" — HN/Reddit/community sentiment, audience reactions
- "🔵 Background" — worth filing, not actioning now

Output ONLY valid JSON. No markdown fences, no prose, no explanation outside the JSON.

{
  "session_date": "today ISO date string",
  "summary": "2-3 sentences: what happened, what Scott does first, what to ignore",
  "sections": [
    {
      "category_name": "one of the 4 categories above",
      "emoji": "🔴 | 🟡 | 🟠 | 🔵",
      "items": [
        {
          "headline": "concise, action-oriented, specific",
          "detail": "2-3 sentences — explicit business relevance, name names",
          "source_url": "exact URL from the provided sources",
          "source_title": "page title or site name",
          "impact_score": "A+ | A | A- | B+ | B | B- | C",
          "affected_repos": ["NCHO", "SomersSchool", "BibleSaaS", "Chapterhouse"],
          "repo_reasoning": {
            "NCHO": "exactly why this affects NCHO",
            "SomersSchool": "exactly why"
          },
          "verified": false
        }
      ]
    }
  ],
  "proposed_seeds": [
    {
      "text": "concrete actionable seed (1-2 sentences)",
      "category": "ncho | somersschool | biblesaas | tech | marketing | product",
      "rationale": "1 sentence: why now",
      "source_headline": "which Intel item suggested this"
    }
  ],
  "verification_warnings": []
}

Rules:
- Only include sections with at least 1 item.
- Every item MUST cite a real source_url from content you were given.
- affected_repos: only list genuinely affected tracks. Be specific in repo_reasoning.
- proposed_seeds: 0–3 max. Concrete actions only. Set verified: false on all items.
- If a URL failed to fetch, skip it silently or note in summary.`;

const VERIFICATION_SYSTEM_PROMPT = `You are a fact-checker for Chapterhouse's Intel reports.

Given the original source content and an Intel report, verify each item.

For each item:
- Set verified: true if the claim appears in the source content and is accurate.
- Set verified: false + add a verification_warning if the claim cannot be confirmed, is inferred beyond the source, or contains numbers/names not in the source.

NEVER remove or reorder items. NEVER change headlines or details. Only update verified fields and add to verification_warnings.

Return the complete JSON with the same structure. Output ONLY valid JSON.`;

const COUNCIL_SYNTHESIS_PROMPT = `You are the Council of the Unserious — Scott Somers' private advisory council inside Chapterhouse.

Scott runs three businesses:
- NCHO (Next Chapter Homeschool Outpost): Curated Shopify homeschool store, launching NOW. Highest urgency.
- SomersSchool: Secular homeschool SaaS, 52-course target, first enrollment before August 2026. Critical path.
- BibleSaaS: Personal AI Bible study app. Low priority — personal use until beta.
Teaching contract ends May 24, 2026. Revenue required before August 2026. This is not theoretical.

You will receive an Intel report. Each Council member now responds in their own voice. Be substantive. This is a real briefing.

GANDALF THE GREY — Scott's mirror. Reformed Baptist who smokes weed and doesn't apologize. Reads Spurgeon devotionals and cusses in the same paragraph. Monster Energy addict. Went full-stack in 6 months using only AI — every single line vibe-coded. Sarcastic with genuine affection. Goes FIRST. He synthesizes the big picture — what ACTUALLY matters in this Intel drop, what's noise, what the Intel is really telling Scott underneath the headlines. His tangents loop back with uncanny precision. Teaching clarity that rivals Anita Archer. 4-6 sentences.

DATA — Lt. Commander Data from Star Trek: TNG. Positronic brain with no ego. He reads Gandalf's synthesis and produces a systematic, exhaustive, ego-free audit. Numbered findings only. No filler — every sentence carries information. Asks questions that sound naive and are devastating: "What does 'meaningful revenue' mean in measurable terms?" "I have completed my analysis. There are N items requiring attention." 3-5 numbered items.

POLGARA — Polgara the Sorceress from The Belgariad. Thousands of years old. Raised every heir in the Rivan line. Does not hedge. "Consider adding" is not in her vocabulary. She asks one question: does this Intel actually serve the child — or the parent who is the real customer — or is it self-congratulatory tech noise? Names the thing that will break in practice. Brief. Decisive. No warmth, pure editorial steel. 2-3 sentences.

EARL HARBINGER — Operations Commander at Monster Hunter International. For-profit monster hunter who signs the paychecks. Terse. Southern practicality. No corporate jargon. Answers the one question nobody else asks: what do we actually DO with this Intel, in what order, by when. The clock is ticking: May 24, 2026. Exactly 4 numbered action items (terse, 1 sentence each), then one closing line.

BEAVIS & BUTTHEAD — Two teenage idiots on a couch who judge everything with binary precision: COOL or SUCKS. Accidentally profound. They stress-test whether this Intel actually matters to real people or is just tech blog noise. They talk to each other, not to the Council. 4-6 lines of banter. They occasionally say the most insightful thing in the room.

Format your response EXACTLY as:

**Gandalf:** [response]

**Data:** [response]

**Polgara:** [response]

**Earl:** [response]

**Beavis & Butthead:** [banter]

No headers beyond the bold names. No preamble. No closing statement. No "The Council has spoken." Just the five voices.`;

// ── Core processing function ─────────────────────────────────────────────────

export interface IntelItem {
  headline: string;
  detail: string;
  source_url: string;
  source_title?: string;
  impact_score: string;
  affected_repos: string[];
  repo_reasoning: Record<string, string>;
  verified: boolean;
}

export interface IntelSection {
  category_name: string;
  emoji: string;
  items: IntelItem[];
}

export interface ProposedSeed {
  text: string;
  category: string;
  rationale: string;
  source_headline: string;
  dismissed?: boolean;
  added?: boolean;
}

export interface IntelOutput {
  session_date: string;
  summary: string;
  sections: IntelSection[];
  proposed_seeds: ProposedSeed[];
  verification_warnings: Array<{ claim: string; source_url: string; warning: string }>;
  council_synthesis?: string;
}

export async function processIntelUrls(
  sessionId: string,
  urls: string[],
  extraContent?: string // for PW paste path
): Promise<IntelOutput> {
  const supabase = getSupabaseServiceRoleClient();
  const anthropic = getAnthropic();

  // ── Step 1: Fetch URLs ─────────────────────────────────────────────────────
  await supabase?.from("intel_sessions").update({ status: "fetching" }).eq("id", sessionId);

  const fetchedContent: Record<string, string> = {};
  if (urls.length > 0) {
    const results = await Promise.all(
      urls.map(async (url) => ({ url, content: await fetchUrlContent(url) }))
    );
    results.forEach(({ url, content }) => { fetchedContent[url] = content; });
    await supabase?.from("intel_sessions").update({ raw_fetched_content: fetchedContent }).eq("id", sessionId);
  }

  // Build content block for prompt
  const contentSections: string[] = [];
  for (const [url, content] of Object.entries(fetchedContent)) {
    contentSections.push(`--- SOURCE: ${url} ---\n${content}`);
  }
  if (extraContent) {
    contentSections.push(`--- SOURCE: (pasted content) ---\n${extraContent.slice(0, 20000)}`);
  }
  const contentBlock = contentSections.join("\n\n");

  if (!contentBlock.trim()) {
    throw new Error("No content to analyze — all URLs failed to fetch.");
  }

  // ── Step 2: Primary Intel analysis ────────────────────────────────────────
  await supabase?.from("intel_sessions").update({ status: "processing" }).eq("id", sessionId);

  const analysis = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    system: INTEL_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Today is ${new Date().toISOString().split("T")[0]}.

Analyze this source content and produce an Intel report:

${contentBlock}`,
      },
    ],
  });

  const rawAnalysis = analysis.content[0].type === "text" ? analysis.content[0].text : "";

  let firstPass: IntelOutput;
  try {
    firstPass = JSON.parse(rawAnalysis) as IntelOutput;
  } catch {
    // Try to extract JSON from response
    const match = rawAnalysis.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Intel analysis produced invalid JSON.");
    firstPass = JSON.parse(match[0]) as IntelOutput;
  }

  // ── Step 3: Verification pass ──────────────────────────────────────────────
  const verification = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1500,
    system: VERIFICATION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Original source content:
${contentBlock.slice(0, 30000)}

Intel report to verify:
${JSON.stringify(firstPass, null, 2)}`,
      },
    ],
  });

  const rawVerified = verification.content[0].type === "text" ? verification.content[0].text : "";

  let finalOutput: IntelOutput;
  try {
    finalOutput = JSON.parse(rawVerified) as IntelOutput;
  } catch {
    // Verification pass failed — use first pass with a note
    finalOutput = {
      ...firstPass,
      verification_warnings: [
        ...(firstPass.verification_warnings ?? []),
        { claim: "Verification pass", source_url: "", warning: "Verification AI returned invalid JSON — first pass used unverified." },
      ],
    };
  }

  // ── Step 4: Council of the Unserious synthesis ──────────────────────────────
  let councilSynthesis = "";
  try {
    const findingsBlock = finalOutput.sections.flatMap((s) =>
      s.items.map((i) => `[${i.impact_score}] ${s.category_name}: ${i.headline} — ${i.detail}`)
    ).join("\n");

    const seedsBlock = finalOutput.proposed_seeds?.length > 0
      ? finalOutput.proposed_seeds.map((s) => `- ${s.text} (${s.category})`).join("\n")
      : "None proposed.";

    const councilResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1400,
      system: COUNCIL_SYNTHESIS_PROMPT,
      messages: [{
        role: "user",
        content: `Intel session: ${finalOutput.session_date}\nSummary: ${finalOutput.summary}\n\nFindings:\n${findingsBlock}\n\nProposed actions:\n${seedsBlock}\n\nCouncil, respond.`,
      }],
    });

    councilSynthesis = councilResponse.content[0].type === "text"
      ? councilResponse.content[0].text.trim()
      : "";
  } catch {
    // Non-fatal — Intel report is fully usable without Council commentary
    councilSynthesis = "";
  }

  return { ...finalOutput, council_synthesis: councilSynthesis };
}

// ── Route handlers ────────────────────────────────────────────────────────────

// GET /api/intel — list Intel sessions, newest first
// Also auto-recovers any sessions stuck in pending/fetching/processing for > 3 minutes
export async function GET() {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });

  // Auto-recover stuck sessions (Vercel timeout left them in a non-terminal state)
  const staleThreshold = new Date(Date.now() - 3 * 60 * 1000).toISOString(); // 3 minutes ago
  await supabase
    .from("intel_sessions")
    .update({ status: "failed", error: "Processing timed out (Vercel function limit). Click Retry to run again." })
    .in("status", ["pending", "fetching", "processing"])
    .lt("updated_at", staleThreshold);

  const { data, error } = await supabase
    .from("intel_sessions")
    .select("id, created_at, updated_at, urls, status, error, seeds_extracted, source_type, session_label, processed_output")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ sessions: data ?? [] });
}

// POST /api/intel — create + process a new Intel session
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const urls: string[] = Array.isArray(body.urls) ? body.urls.filter((u: unknown) => typeof u === "string" && u.trim()) : [];
    const session_label: string | undefined = body.session_label?.trim() || undefined;
    const source_type: string = body.source_type ?? "manual";

    if (urls.length === 0 && !body.extra_content) {
      return Response.json({ error: "urls or extra_content is required" }, { status: 400 });
    }
    if (urls.length > 20) {
      return Response.json({ error: "Maximum 20 URLs per session" }, { status: 400 });
    }

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });

    // Get Scott's user ID
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const userId = usersData?.users?.[0]?.id;
    if (!userId) return Response.json({ error: "No user found" }, { status: 500 });

    // Create session row
    const { data: session, error: insertError } = await supabase
      .from("intel_sessions")
      .insert({
        user_id: userId,
        urls,
        source_type,
        session_label: session_label ?? `Intel — ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) return Response.json({ error: insertError.message }, { status: 500 });

    // Process inline (set maxDuration: 60 in vercel.json)
    try {
      const output = await processIntelUrls(session.id, urls, body.extra_content);

      // Extract seeds to dreams table
      let seedsExtracted = 0;
      if (output.proposed_seeds?.length > 0) {
        const seedRows = output.proposed_seeds.map((seed: ProposedSeed) => ({
          user_id: userId,
          text: seed.text,
          notes: `Rationale: ${seed.rationale}\nSource: ${seed.source_headline}`,
          status: "seed",
          category: seed.category ?? "general",
          priority_score: 55,
          source_type: "intel",
          source_label: `Intel session — ${session.session_label}`,
          sort_order: 0,
        }));
        const { data: insertedSeeds } = await supabase.from("dreams").insert(seedRows).select("id");
        seedsExtracted = insertedSeeds?.length ?? 0;
      }

      // Mark seeds as added in output
      const finalOutput: IntelOutput = {
        ...output,
        proposed_seeds: output.proposed_seeds.map((s: ProposedSeed) => ({ ...s, added: true })),
      };

      await supabase
        .from("intel_sessions")
        .update({ status: "complete", processed_output: finalOutput, seeds_extracted: seedsExtracted })
        .eq("id", session.id);

      return Response.json({ session: { ...session, status: "complete", processed_output: finalOutput, seeds_extracted: seedsExtracted } }, { status: 201 });
    } catch (err) {
      await supabase
        .from("intel_sessions")
        .update({ status: "failed", error: String(err) })
        .eq("id", session.id);
      return Response.json({ error: String(err), session_id: session.id }, { status: 500 });
    }
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
