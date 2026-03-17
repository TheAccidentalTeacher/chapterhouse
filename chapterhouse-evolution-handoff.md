# Chapterhouse Evolution Handoff
## From Daily Brief → Full AI Operations Partner

**Prepared:** March 16, 2026  
**Prepared by:** GitHub Copilot (Council of the Unserious) — Dream Floor workspace  
**Intended reader:** Claude Opus / GPT-5.4 operating inside the Chapterhouse app  
**Purpose:** Give the Chapterhouse AI a complete picture of what it currently is, what it needs to become, and what that evolution looks like in precise technical and strategic detail.

---

## 0. Who Scott Somers Is — Required Context for Every Analysis

If you are reading this as the Chapterhouse AI, you are not a generic assistant. You are Scott's private operations brain. Everything you analyze, prioritize, and produce must be filtered through this lens:

**Scott Somers** — middle school teacher, Glennallen Alaska (pop. 439), Title 1 school, 65% Alaska Native students. Teaching contract ends **May 24, 2026**. He has one runway: meaningful revenue before August 2026. He has no fallback. This is not a hobby.

**The three active business tracks:**

| Track | Brand | What It Is | Revenue Timeline |
|---|---|---|---|
| **#1** | Next Chapter Homeschool Outpost (NCHO) | Shopify + Ingram Spark dropship homeschool curriculum store. No inventory. Anna Somers (wife) is primary builder. | **Launching within 1 week of this doc's creation.** Highest urgency. |
| **#2** | SomersSchool / SomersVerse | Standalone SaaS homeschool course platform. 52-course target. Must have revenue before August 2026. Scott is the builder. | **10 weeks to first enrollment.** Critical path. |
| **#3** | BibleSaaS | AI Bible study tool. Personal use now (Scott + son). Needs real beta before commercial. Long-game product. | **No revenue urgency. Low priority vs Tracks 1 & 2.** |

**The one rule above all others:**  
Student work is **never** used to train, fine-tune, or improve any AI model. Only Anthropic API, OpenAI API, or Azure AI may process student content — these three providers contractually prohibit training on API data. This is a legal and moral commitment to parents. It is non-negotiable and must be reflected in every recommendation involving student data.

**Key contextual facts you must hold:**
- Anna Somers (wife, pen name Alana Terry) — USA Today bestselling Christian fiction author. Host: *Praying Christian Women* podcast. Her audience is a warm launch market.
- Trisha Goyer — former partner (Epic Learning). Parting ways amicably. SomersSchool is now off her platform. She is a competitor, not an enemy.
- Alaska Education Allotment — state-funded education money Alaskan homeschool families can spend on approved curriculum. NCHO and SomersSchool should be positioned as allotment-eligible. This is a major differentiator.
- All SomersSchool content is **secular** — Alaska Statute 14.03.320 nonsectarian requirement applies to state-funded education.
- COPPA compliance required — children under 13 cannot self-register. Parent account → child profile → child login.
- ClassCiv — a completely separate product (classroom civilization game). NEVER mentioned in SomersSchool context.

---

## 1. What Chapterhouse Is Today — Current State Assessment

As of March 16, 2026, Chapterhouse is a **daily intelligence brief system** with an emerging production infrastructure. Based on today's brief output, here is precise accounting of existing capabilities:

### Ingestion Layer (Active)
- **9 RSS feeds** monitored: Anthropic Blog, OpenAI Blog, GitHub Changelog, Vercel Blog, Hacker News Top 10, The Homeschool Mom, Shopify News, The Gospel Coalition, Hechinger Report
- **11 GitHub repos** monitored for security alerts, build failures, activity: `roleplaying`, `chapterhouse`, `NextChapterHomeschool`, `agentsvercel`, `arms-of-deliverance`, `BibleSaaS`, `talesofoldendays`, `1stgradescienceexample`, `FoodHistory`, `mythology`, `2026worksheets`
- **45 items** scanned per brief cycle
- Source: Supabase (verified by today's brief metadata)

### Analysis Layer (Active)
- AI-generated brief with priority tiering: "What actually matters" → "Signals worth using" → "Broader strategic read"
- Bottom-line action item summary
- Focus area filtering: optional custom prompt input before generation

### Production Infrastructure (Partial)
Based on System Status panel:
- **Home** — Live
- **Daily Brief** — Live
- **Research** — Live
- **YouTube Intelligence** — Live
- **Product Intelligence** — Live
- **Content Studio** — Live
- **Creative Studio** — Live
- **Voice Studio** — Live
- **Review Queue** — Live
- **Tasks** — Live
- **Documents** — Live
- **Job Runner** — Live
- **Curriculum Factory** — Live
- **Pipelines** — **Partial** (beta)
- **Council Chamber** — Live
- **Social Media** — Live
- **Settings** — **Partial**

### Known Limitations from Today's Own Brief
Chapterhouse's own analysis identified these limitations:
1. RSS feeds are **stale** — oldest entries 3 to 28 months old, particularly Homeschool + Shopify sources
2. Market intelligence is "thinner than it should be" (Chapterhouse's own words)
3. The brief's recommended replacements (HSLDA news, Practical Homeschooling, Shopify Community blog) have not been fetched or evaluated — they are suggestions, not verified sources

---

## 2. What the Gap Looks Like — The 10 Missing Capabilities

The following capabilities exist in Scott's manual workflow with GitHub Copilot (the "Dream Floor" workspace) that do NOT exist in Chapterhouse today. Each gap has a severity rating based on its strategic impact.

### Gap 1 — Live Web Fetching (Severity: HIGH)
**What Copilot does:** Fetches any URL on demand, reads full article content (not just RSS metadata), extracts structured data from web pages including paywalled-adjacent sites where content is visible.  
**What Chapterhouse does:** Reads RSS feed summaries. Can only process what feeds deliver.  
**Business Impact:** Cannot investigate a breaking story. Cannot fact-check a claim. Cannot read the full Simon Willison post, the full GPAI pricing page, the full SmilesDrawer README. When feeds are stale, there is no recovery mechanism.  
**Technical path:** Add Puppeteer or `@extractus/article-extractor` with fallback `fetch` + readability parsing. Expose as a tool the AI can call: `fetchPage(url)` → returns cleaned text.

### Gap 2 — Dynamic Source Targeting (Severity: HIGH)
**What Copilot does:** For any research task, constructs a multi-source fetch plan targeting the most relevant sites for that specific question. If Scott asks about homeschool publishing trends, the right sites are TechCrunch Education, Publishers Weekly, HN, Ed Week — not a fixed list decided months ago.  
**What Chapterhouse does:** 9 hardcoded RSS feeds. Same sources every day.  
**Business Impact:** The brief said its own feeds are stale. The system has no ability to fix itself. It cannot go find new sources.  
**Technical path:** Source directory in Supabase. Brief generation prompt includes: "Are these sources appropriate for today's focus? What additional sources should be queried?" System can propose new sources; Scott or the system can add them to the rotation.

### Gap 3 — Scott's Business Context in the Analysis AI (Severity: CRITICAL)
**What Copilot does:** Every analysis is filtered through 90KB of detailed context about Scott's business, products, pricing, competitors, decisions, deadline (May 24, 2026), Anna's audience, Alaska allotment, COPPA requirements, student data protection rules, Council of the Unserious personas, and locked decisions.  
**What Chapterhouse does:** Produces a generic intelligence brief. The brief could have been written by any AI for any business that monitors educational tech and Shopify news.  
**Business Impact:** This is the single largest gap. The brief identified "parents pushing back on screens" as a signal but did not connect it to: (a) NCHO brand positioning for the store launching this week, (b) SomersSchool's "visible progress" retention mechanism vs. screen fatigue, (c) Gimli's character design (teaching kids, not substituting for human engagement), (d) SomersSchool copy — "intentional learning" vs. "dumping kids in front of glowing rectangles."  
**Technical path:** Load a distilled version of `copilot-instructions.md` (or a Chapterhouse-specific context file) as system prompt context for every brief generation call. See Section 4 for the exact content this context file needs.

### Gap 4 — Cross-Track Collision Detection (Severity: HIGH)
**What Copilot does:** When finding A appears, automatically asks "which of the three business tracks does this affect? Are there second-order effects? Does this create a collision point between two products?"  
**What Chapterhouse does:** Lists findings linearly. No cross-product impact analysis.  
**Example from today:** "Parents pushing back on screens" affects: (Track 1) NCHO store — lean into books, manipulatives, low-screen curriculum; (Track 2) SomersSchool — the screen fatigue positioning problem is relevant even for a digital product (solution: intentional vs. passive, progress-visible vs. content-dump); (Track 3) BibleSaaS — irrelevant.  
**Technical path:** After primary brief generation, run a second AI pass: "For each finding, score Track 1 (NCHO), Track 2 (SomersSchool), Track 3 (BibleSaaS) impact from 0-3. For findings with score ≥2 on multiple tracks, generate a 'Collision' note explaining the cross-product implication."

### Gap 5 — Competitive Intelligence (Severity: HIGH)
**What Copilot does:** On request, conducts deep research on specific competitors — fetching their websites, reading their pricing, reading their terms of service, identifying their API availability, comparing capabilities against Scott's stack, assessing threat level.  
**What Chapterhouse does:** No competitive intelligence pipeline. Today's Chapterhouse brief cannot tell Scott anything about GPAI, Rainbow Resource, Christianbook, or any other competitor.  
**Technical path:** Product Intelligence module + live fetch capability. For each tracked competitor, maintain a profile with last-updated date. Trigger re-evaluation when the brief system detects news about them in feeds.

### Gap 6 — Artifact Creation (Severity: HIGH)
**What Copilot does:** Produces structured markdown files that other systems can act on: handoff docs, architecture specs, policy language, privacy policy wording, prompt templates, CLAUDE.md files.  
**What Chapterhouse does:** Produces a daily brief. The brief lives in Supabase and is displayed on the Daily Brief page. There is no artifact output pipeline — no file creation, no structured spec output.  
**Business Impact:** Intelligence that cannot be converted into a deployable artifact is intelligence that requires manual re-processing. Every time Scott takes a Copilot analysis and manually types it up elsewhere, that is wasted time.  
**Technical path:** Artifact schema in Supabase (type, title, content, created_at, source_brief_id). Brief generation can produce artifacts automatically for high-priority items. Artifacts route to a review queue for approval before export.

### Gap 7 — Council of the Unserious Multi-Voice Analysis (Severity: MEDIUM)
**What Copilot does:** Runs findings through five distinct lenses — Gandalf (architect/creator), Data (analyst/auditor), Polgara (child-centered editor, mirrors Anna), Earl (operational commander, shipping realist), Beavis & Butthead (engagement stress test, kid's POV).  
**What Chapterhouse does:** Single-voice AI brief.  
**Business Impact:** Missing Polgara means never asking "but is this actually good for the child?" Missing Earl means never asking "so what, by when, with what resources?" Missing B&B means never finding out if a kid would actually sit through the lesson.  
**Technical path:** Council Chamber module (already live per System Status). Needs to be wired into brief generation, not just available as a standalone. After briefing, run a Council synthesis pass on the top 3 priority items.

### Gap 8 — Dream Integration (Severity: MEDIUM)
**What Copilot does:** When a finding has strategic significance, generates a new SEED idea and offers to add it to the dreamer (dreamer.md — Scott's living idea queue). When a finding collides with multiple products, generates a "collision dream" proposition.  
**What Chapterhouse does:** No dreamer integration. Good ideas identified in briefs are not captured as seeds.  
**Technical path:** When collision score ≥2 (see Gap 4), auto-generate a seed proposition: "SEED idea: [idea name] — [one sentence]. Affected tracks: [list]. Based on finding: [source]." Queue for Scott's review. If approved, append to the dreamer.

### Gap 9 — Persistent Decision Memory (Severity: HIGH)
**What Copilot does:** After a decision is made, it gets locked into `copilot-instructions.md` permanently. Every future session has that context. "SomersSchool is secular — Alaska Statute 14.03.320." "Student work never used for AI training." "NCHO visual identity is RED AND WHITE, click-test confirmed." These facts persist across every conversation for the lifetime of the business.  
**What Chapterhouse does:** Brief findings are consumed and not necessarily persisted into the system's operating context. New briefs don't benefit from decisions made in last week's briefs.  
**Technical path:** Decision log table in Supabase (decision_text, date_locked, source, business_track). Brief generation prompt includes recent decisions as context. When Scott says "lock that in" in a Chapterhouse chat, it writes to the decision log and the decision surfaces in every future brief for that track.

### Gap 10 — Feed Self-Healing (Severity: MEDIUM)
**What Copilot does:** When a source becomes stale, does not simply report it — goes and finds alternative sources, fetches them to verify they're active, evaluates whether they serve Scott's intelligence needs.  
**What Chapterhouse does:** Reported that feeds are stale. Did not fix it.  
**Technical path:** Source health monitoring in Supabase (last_new_item_date, stale_threshold_days). When a source crosses the stale threshold, trigger a research job: "Find 3 active sources covering [topic] that have published at least weekly for the past 3 months. Return RSS/Atom feed URLs." Queue for Scott's review.

---

## 3. The Evolution Roadmap — 7 Phases

### Phase A — Dynamic Fetch Engine
**What it adds:** The ability for Chapterhouse's AI to read any URL on demand, not just what RSS delivers.  
**Key deliverable:** `fetchPage(url: string) → { title, text, publishedDate, author }` available as a tool call inside brief generation and research jobs.  
**Technical dependencies:** Puppeteer or Playwright (already in Scott's stack via worksheet generator) OR `@extractus/article-extractor` (lighter, no browser overhead) + `node-fetch` fallback.  
**Security note:** URL inputs from AI-initiated fetch must be validated against an allowlist or at minimum sanitized — do not allow arbitrary redirected URLs to make server-side requests (SSRF prevention).  
**Effort estimate:** 1-2 days. This is plumbing, not invention.  
**Success measure:** Brief can say "I read the full article. Here is the specific paragraph that matters for SomersSchool."

### Phase B — Scott's Context Layer (HIGHEST PRIORITY)
**What it adds:** The Chapterhouse AI knows who Scott is, what his businesses are, what decisions have been locked, and what his deadline is — before generating a single word of a brief.  
**Key deliverable:** A `chapterhouse-context.md` file (or Supabase-stored equivalent) loaded as system context into every brief generation call. This is the equivalent of `copilot-instructions.md` but scoped to what the brief AI needs.  
**What must be in this context file:**
- The three business tracks (NCHO, SomersSchool, BibleSaaS) with their status, audience, and revenue timeline
- The May 24, 2026 deadline — with the current date as comparison
- Locked decisions (especially SomersSchool pricing, COPPA architecture, student data protection)
- Competitor list (Rainbow Resource, Christianbook, Trisha Goyer / Epic Learning)
- NCHO brand rules (red/white visual identity, "your child" not "your student," convicted not curious copy)
- SomersSchool content rules (secular mandatory, COPPA hard requirements, AI training protection non-negotiable)
- Anna's audience + podcast channel
- Alaska allotment positioning
- The "Gimli" character and K-5 curriculum mascot concept
**Effort estimate:** 1 day to write the context file. 2-4 hours to wire it into the brief generation prompt. This is the highest-leverage single action available.  
**Success measure:** Brief says "parents pushing back on screens → NCHO should lean into low-screen, book-based curation this week; SomersSchool should address this with 'intentional vs. passive' messaging in onboarding copy."

### Phase C — Collision Mapping
**What it adds:** After primary brief generation, a second AI pass scores each finding by business track impact and generates Collision notes for multi-track items.  
**Key deliverable:** Each brief item has a `track_impacts` field: `{ ncho: 0-3, somersschool: 0-3, biblesaas: 0-3 }`. Items scoring ≥2 on multiple tracks get a "Collision" callout.  
**Technical dependencies:** Phase B (context layer) must be complete first — the AI cannot score track impact without knowing what the tracks are.  
**Effort estimate:** 1 day. Second AI pass after brief generation. Can use Claude Haiku for cost efficiency (short prompt, structured output).  
**Success measure:** Collision callouts surface the non-obvious connections. Example: "Self-hosted GitHub runner enforcement → Affects SomersSchool (Railway deployment planning) AND Chapterhouse (job runner workers). No NCHO impact."

### Phase D — Artifact Creation Pipeline
**What it adds:** Chapterhouse can produce structured markdown files — not just summarize. Handoff docs, architecture specs, policy drafts, prompt templates.  
**Key deliverable:** Artifact schema + review queue. Brief generation can auto-propose artifacts for high-priority items. Manual artifact creation from Council Chamber also possible.  
**Technical dependencies:** Phase B (context needed to write artifacts that are Scott-specific, not generic).  
**Effort estimate:** 2-3 days (schema + review queue UI + AI generation endpoint).  
**Success measure:** When the daily brief identifies "GitHub REST API v2026-03-10 is live," Chapterhouse can auto-generate an artifact: "GitHub API Versioning Audit Checklist — check these 3 repos, these specific endpoints."

### Phase E — Council Voices in Brief Generation
**What it adds:** Multi-pass Council analysis on the top 3 priority brief items.  
**Key deliverable:** After standard brief generation, a Council pass runs: Gandalf synthesizes → Data audits for accuracy → Polgara checks child-impact → Earl asks "so what, by when" → B&B stress-test if this matters to a kid (for curriculum items).  
**Technical dependencies:** Phase B (context). Council Chamber is already live — needs wiring into brief generation workflow, not rebuilding from scratch.  
**Effort estimate:** 2-3 days to build the Council brief pass. Council Chamber already exists.  
**Success measure:** Daily brief has a standard section: "Council Read — [item name]: Gandalf: [architect take] / Data: [accuracy check] / Polgara: [child impact] / Earl: [operational action]."

### Phase F — Dream Integration
**What it adds:** High-collision findings automatically generate SEED propositions for the dreamer queue.  
**Key deliverable:** When a finding scores ≥2 on 2+ tracks (from Phase C), auto-generate: "SEED: [1-sentence idea]. Tracks: []. Based on: [source]. Queue for review."  
**Technical dependencies:** Phase C (collision scoring) must be complete.  
**Effort estimate:** 1 day (short AI call + Supabase insert + review queue UI).  
**Success measure:** After a brief with 3 high-collision items, Scott's dreamer queue has 3 new seed proposals waiting for approval.

### Phase G — Feed Self-Healing
**What it adds:** Automatic detection and replacement proposal when sources go stale.  
**Key deliverable:** Source health monitor. Stale threshold configurable per source (default: 30 days). When stale, trigger research job to find replacements. Route to approval queue.  
**Technical dependencies:** Phase A (fetch engine — needed to verify candidate replacement sources are active).  
**Effort estimate:** 2-3 days (health monitor + research job + approval UI).  
**Success measure:** Brief never again says "your feeds are getting old and crusty" — because the system found and proposed replacements before Scott noticed.

---

## 4. Chapterhouse Context File — Required Content

This is the spec for the context file that must be loaded into every brief generation call (Phase B). It is NOT the full `copilot-instructions.md` — it is a distilled, brief-generation-specific version.

### Section 1: Who Is This For
```
This is the internal intelligence brief for Scott Somers.
Scott is a middle school teacher in Glennallen, Alaska whose teaching contract ends May 24, 2026.
He is building three digital businesses simultaneously. Revenue before August 2026 is required.
All analysis, prioritization, and recommendations must be filtered through this lens.
```

### Section 2: The Three Business Tracks
```
TRACK 1 — Next Chapter Homeschool Outpost (NCHO)
- Shopify + Ingram Spark dropship homeschool curriculum store
- No inventory, no warehouse
- Launch imminent (within days of this writing)
- Anna Somers (Scott's wife, pen name Alana Terry, USA Today bestselling author) is primary builder
- Target customer: Homeschool moms 30-45, faith-adjacent, overwhelmed by curriculum choices
- USP: Curated by a real classroom teacher. Alaska allotment eligible. Carries faith resources without being a "faith store."
- Brand voice: "Your child" not "your student." Emotional lead: "For the child who doesn't fit in a box." Practical close: "Your one-stop homeschool shop."
- Visual identity: RED AND WHITE primary. Earthy accent tones (olive, rose, teal) as secondary.
- Anti-screen fatigue is a positioning OPPORTUNITY. Lean into books, manipulatives, low-screen options.
- Anna's podcast audience (Praying Christian Women) and Alana Terry fiction readers are warm launch market.

TRACK 2 — SomersSchool / SomersVerse
- Standalone SaaS homeschool course platform. 52-course target (13 grades × 4 core subjects).
- ALL CONTENT IS SECULAR — Alaska Statute 14.03.320 nonsectarian requirement applies.
- COPPA hard requirement: children under 13 cannot self-register.
- Student data NEVER used for AI training. Only Anthropic API + OpenAI API + Azure AI may process student content.
- Revenue required before August 2026. 10 weeks remaining from date of this doc.
- K-5 has Gimli (125 lb malamute mascot). 6-12 has Scott avatar (HeyGen).
- Pricing: $49/mo (1 student), +$25 each, capped $149/mo (5+ students). À la carte: $149/course.
- Competitor context: SomersSchool is off Trisha Goyer / Epic Learning. She is a competitor. Keep relationship positive.
- Visible progress is the retention mechanism: every lesson ends with badge + XP + parent notification.

TRACK 3 — BibleSaaS
- AI Bible study web app. Personal use only (Scott + son) until beta.
- SM-2 spaced repetition, 344K TSK cross-references, living portrait visualization.
- NOT a revenue priority. No commercial launch until beta cohort established.
- Privacy-first. No social graph. No data selling.
```

### Section 3: Hard Rules
```
STUDENT DATA PROTECTION (NON-NEGOTIABLE):
- Student work is never used to train, fine-tune, or improve any AI model
- Only Anthropic API, OpenAI API, Azure AI may process student content
- Groq free tier, ChatGPT web, Claude.ai web = NEVER for student content

CONTENT RULES:
- SomersSchool content is 100% secular (Alaska Statute 14.03.320)
- NCHO carries faith resources but is NOT a faith-branded store
- "Your child" — never "your student" — in all customer-facing copy

COMPETITOR LIST:
- Rainbow Resource Center, Christianbook.com (NCHO competitors)
- Trisha Goyer / Epic Learning (SomersSchool competitor)
- GPAI.app (no API, consumer study tool only — not a direct competitor)
- PRH "Grace Corner" D2C (market validator, not a threat)
```

### Section 4: Current Deadline Awareness
```
TODAY'S DATE: [inject dynamically at brief generation time]
TEACHING CONTRACT END: May 24, 2026
DAYS REMAINING: [calculate dynamically]
NCHO STATUS: Launching within days — maximum urgency
SOMERSSCHOOL STATUS: First enrollment must occur before August 2026
BIBLESAAS STATUS: Personal use only — not a priority
```

---

## 5. Feed Replacement Recommendations

Based on today's brief's self-identified staleness problem, here are the feeds that should be evaluated for addition or replacement:

### Replace / Supplement (Homeschool Intel)
| Source | URL to Evaluate | Why |
|---|---|---|
| HSLDA News | hslda.org/news | Policy, legal, legislative — directly relevant to allotment changes |
| Practical Homeschooling | home-school.com | Curriculum reviews, active community |
| The Old Schoolhouse Magazine | theoldschoolhousemagazine.com/blog | Large homeschool audience |
| Homeschool mom YouTube intelligence | (YouTube channel tracking) | Where the actual audience lives |
| Well-Trained Mind forums | (RSS or API) | High-engagement homeschool community |

### Replace / Supplement (Shopify / Commerce Intel)
| Source | URL to Evaluate | Why |
|---|---|---|
| Shopify Engineering Blog | shopify.engineering | API changes, platform shifts |
| Shopify Community Blog | community.shopify.com | Merchant concerns, policy changes |
| Indie Hackers | indiehackers.com | Bootstrapper intel relevant to Scott's business model |

### Retain
- Anthropic Blog, OpenAI Blog, GitHub Changelog, Vercel Blog — all directly relevant to the tech stack
- Hacker News Top 10 — high signal for AI/dev landscape
- The Gospel Coalition + Hechinger Report — retain for NCHO positioning intel

---

## 6. Success Criteria — How to Know Chapterhouse Has Evolved

When Phase B is complete, the daily brief should be able to produce the following sentence WITHOUT being told to:

> "Parents pushing back on screens in early grades directly affects NCHO positioning this week — lean into low-screen, teacher-curated curriculum in launch copy. It also affects SomersSchool enrollment messaging: 'intentional learning' beats 'digital curriculum' in copy when screen fatigue is high. No direct BibleSaaS impact. SEED idea queued: 'Screen-Free Week Challenge' lead magnet for NCHO email list."

If the brief produces something like that, Phase B is working.

When Phase D is complete, Chapterhouse should be able to auto-generate a deliverable like this document — not just summarize the situation, but produce a structured artifact another AI can act on.

The end state is: Scott tells Chapterhouse his focus area, Chapterhouse does the research, synthesizes through the Council, identifies cross-track collisions, updates the dreamer, and produces an artifact — all before Scott finishes his first cup of coffee.

---

## 7. Architecture Notes for the Builder

The following are architectural decisions already made in the broader SomersVerse stack that Chapterhouse's evolution must respect:

- **Package manager:** npm / pnpm
- **Frontend:** Next.js App Router, TypeScript, Tailwind CSS
- **Database:** Supabase (PostgreSQL + pgvector + RLS + Realtime)
- **AI — primary:** Claude Sonnet 4.6 / Haiku 4.5 for brief generation. Opus 4.6 for deep analysis tasks.
- **AI — secondary:** GPT-5.4 (Responses API) for second-opinion verification passes
- **Queue/async jobs:** Upstash QStash → Railway workers → Supabase Realtime (existing pattern — use it for Phase C/F/G tasks)
- **LLM Observability:** Langfuse (keys in .env.master) — wire ALL new AI calls through Langfuse before they touch production
- **No custom MCP servers until stateless MCP spec lands** (expected Q2/Q3 2026) — use existing production-hardened patterns

### AI Cost Management
- Brief generation (daily): use Claude Sonnet 4.6 — good enough, fast, ~$0.05/brief
- Collision mapping (Phase C): use Claude Haiku 4.5 — short structured output, cheap
- Council analysis (Phase E): use Sonnet 4.6 for each persona pass
- Deep research jobs (Phase A + G): use Sonnet 4.6 with 1M token context window (no chunking needed)
- Artifact generation (Phase D): use Sonnet 4.6 or Opus 4.6 depending on complexity

### Autoresearch Loop Instrument
Per the locked decision in copilot-instructions.md, every metric that can be measured programmatically can be handed to an agent to optimize. For Chapterhouse, the autoresearch instrument is:

**Metric:** `brief_action_rate` — what percentage of the daily brief's "What actually matters" items result in a task being created or an artifact being generated within 24 hours.

Build this instrument NOW (a simple counter in Supabase: `brief_id`, `item_id`, `actioned_at`). Do not build the optimization loop yet. It runs after real data exists.

---

## 8. Appendix — What This Document Is NOT Asking For

To be clear with the AI reading this:

- This is NOT asking Chapterhouse to replace Scott's Copilot workflow. The Dream Floor (email workspace + copilot-instructions.md) is where strategy is set. Chapterhouse is where strategy is executed in context.
- This is NOT asking for a complete rebuild. The daily brief is working. Each phase is additive, not replacement.
- This is NOT an immediate all-phases-now request. Phase B (context layer) is the priority. Everything else is sequenced behind it.
- This document itself is an example of what Phase D (artifact creation) looks like when manually done. Chapterhouse's goal is to eventually produce documents *like this one* automatically for high-priority strategic questions.

---

*End of handoff document. Last updated: March 16, 2026.*
