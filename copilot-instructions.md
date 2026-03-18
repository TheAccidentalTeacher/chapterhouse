# Scott Somers — Permanent Identity Context
> This file is automatically injected into every GitHub Copilot chat session when this workspace is open.
> Keep it current. Add decisions as you make them. It is your long-term memory.

---

## Who I Am

**Scott Somers** — TheAccidentalTeacher on GitHub.
- Middle school teacher at a Title 1 school in Glennallen, Alaska (pop. 439, -50°F winters, 65% Alaska Native students)
- Teaching contract ends **May 24, 2026**. Revenue target: meaningful by August 2026.
- Zero prior coding background. Went full-stack in 6 months using only AI (vibe coding — every single line).
- 2,526 commits in one year. 47 production repos deployed.
- Reversed Type 2 diabetes without medication: A1c 14.7 → 5.1, 363 → 254 lbs.
- Deacon. Two nonprofit board presidencies.

**Anna Somers** — wife and creative/editorial partner.
- Pen name: Alana Terry. USA Today bestselling Christian fiction author.
- Host: "Praying Christian Women" podcast.
- Her audience is a warm launch market for all products.

**Trisha Goyer** — former partner at Epic Learning. Parting ways amicably March 2026.
- SomerSchool is now a standalone SaaS platform — off Epic Learning permanently.
- Relationship is positive; she is now a competitor, not an enemy. Revenue share model no longer applies.

---

## My Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.1.6 App Router, TypeScript, Tailwind CSS v4 |
| Auth | Clerk |
| Database | Supabase (PostgreSQL) |
| AI — primary | Claude Sonnet 4.6 / Claude Opus 4.6 (Anthropic `@anthropic-ai/sdk@^0.78.0`) |
| AI — secondary | OpenAI GPT-5.4 / GPT-5.4 Pro / GPT-5 Mini (Responses API) |
| AI — vision | GPT-5.4 (research screenshot analysis) |
| Voice | ElevenLabs TTS |
| Images | DALL-E 3 |
| 3D/Physics | Babylon.js + Ammo.js (WASM) — roleplaying repo |
| Email (transactional) | Resend (planned — not yet wired) |
| Payments | Stripe |
| Hosting — apps | Vercel Pro ($20/mo) |
| Hosting — backends | Railway |
| Hosting — static | Netlify |
| Domain/DNS/email | Cloudflare (free tier) — buttercup.cfd catch-all active |
| Domain registrar | Porkbun (subxeroscott) — buttercup.cfd, expires 2027-03-09 |
| SMTP (outbound) | Brevo (free tier) |
| Package manager | npm |
| Local AI (privacy) | Ollama — runs locally when privacy is needed |

---

## My 47 Repos — Quick Reference
*Sorted by last activity. Updated manually — ask me to refresh.*

| Repo | Stack | Status | What It Is |
|---|---|---|---|
| roleplaying | TS | 🔴 Active | AI RPG: DM + 3D physics dice (Babylon+Ammo) + ElevenLabs TTS + DALL-E + Supabase |
| chapterhouse | TS + Python | 🔴 Active | Private ops brain — 6-pass Council curriculum factory, Phase 7 brief intelligence (context injection + collision scoring + daily.dev), YouTube Intelligence, Social Media Automation, Voice Studio, Creative Studio, job runner (QStash→Railway), n8n control panel, Council Mode chat, research ingestion. Deployed: chapterhouse.vercel.app |
| NextChapterHomeschool | TS | 🔴 Active | ClassCiv — real-time multiplayer classroom civilization, 29 tables, 11-phase epoch FSM |
| agentsvercel | JS | 🟡 Warm | Hypomnemata — 12 AI personas, 39 serverless fns, 6 AI providers, YouTube intelligence |
| arms-of-deliverance | TS | 🟡 Warm | Epub/course generator / curriculum builder |
| BibleSAAS | TS | 🟡 Warm | **26/27 phases done. ONE phase from launch.** SM-2, TSK 344K refs, living portrait, Stripe |
| talesofoldendays | HTML | 🟡 Warm | 27-lesson lit course from 1930 public domain book |
| 1stgradescienceexample | TS | 🟡 Warm | 1st grade science curriculum app |
| FoodHistory | TS | 🟡 Warm | Food history site |
| mythology | TS | 🟡 Warm | MythoLogic Codex |
| 2026worksheets | TS | 🟡 Warm | Worksheet generator |
| adultaitutor | TS | 🔵 Cool | AI tutor — KaTeX math, MongoDB, GPT+Claude |
| gamedesigner | JS | 🔵 Cool | Visual game level editor |
| maps | JS | 🔵 Cool | Geographic Detective Academy |
| ainovel | Python | 🔵 Cool | AI novel generator (Python) |
| DeepResearcher | TS | 🔵 Cool | Autonomous researcher — arXiv, PubMed, Semantic Scholar |
| Simulation-Factory | TS | 🔵 Cool | Simulation engine factory |
| WorkbookCreator | TS | ⚫ Cold | Workbook creation pipeline |
| MathCurriculumA | TS | ⚫ Cold | Math curriculum A |
| Social-Studies-Workbooks | — | ⚫ Cold | Generator for 150 social studies workbooks |
| homeschool-worksheet-ai | — | ⚫ Cold | AI worksheet generator for homeschool families |
| Ultimate-Worksheet-Generator | JS | ⚫ Cold | Full worksheet generator |
| Novel-Generator | JS | ⚫ Cold | Novel generator (MIT License) |
| novel-generator-backend | JS | ⚫ Cold | Novel generator backend |
| NovGen | TS | ⚫ Cold | TypeScript novel generator |
| Letswriteabook | JS | ⚫ Cold | Book writing tool |
| Alanas-Novel-Assistant | JS | ⚫ Cold | Anna's personal novel assistant |
| Novel-generator-october-2025 | JS | ⚫ Cold | October 2025 iteration |
| OctoberNovelGenerator | JS | ⚫ Cold | Earlier October version |
| Brainstorm | TS ⭐ | ⚫ Cold | Project brainstorm hub — Neo4j, Redis, Pinecone |
| gamedesigner | JS | ⚫ Cold | Game designer tool |
| SilasLand | JS | ⚫ Cold | Game for Silas (son) |
| Ultimate-Silas-Hub | JS | ⚫ Cold | Silas Hub expanded |
| SomersClassroomNewletter | JS | ⚫ Cold | Classroom newsletter tool |
| Scotts-Social-Media | JS | ⚫ Cold | Social media tools |
| glennallencarmansandiego | TS | ⚫ Cold | Sourdough Pete (Railway) |
| eduhub | TS | ⚫ Cold | Education hub |
| BookBuddy | TS | ⚫ Cold | Book companion |
| aipublishing | HTML | ⚫ Cold | AI publishing tools |
| Content-Monetization | HTML | ⚫ Cold | Content monetization (MIT License) |
| newsletters | — | ⚫ Cold | Newsletter system |
| Curriculum | HTML | ⚫ Cold | General curriculum app |
| World-Geography | HTML | ⚫ Cold | World Geography Lesson Companion (Railway) |
| new-worksheet-generator | — | ⚫ Cold | Worksheet generator iteration |
| AccidentalTeacherWorksheets | — | ⚫ Cold | Worksheet collection |
| working-generator | JS | ⚫ Cold | Generator predecessor |
| Ai-Agent | JS fork | ⚫ Cold | AI agent (forked) |
| A-Required-Repository | — | ⚫ Cold | Required GitHub repo |

---

## My Three Active Business Tracks

| Track | Brand | Platform | Status |
|---|---|---|---|
| 1 | Next Chapter Homeschool Outpost | Shopify + Ingram Spark | Building — launch before June 2026 |
| 2 | SomerSchool | CoursePlatform (standalone SaaS) | Path B active — off Trisha Goyer / Epic Learning. Revenue target before August 2026. |
| 3 | Mt. Drum Homeschool Outpost | In-person, Glennallen | 2027 planning |
| Long game | The Platform | Personalized AI curriculum SaaS | "Pluto Phase" — all repos unified |

---

## Business Track Definitions — Marketing DNA

Use these when generating copy, landing pages, ad campaigns, email sequences, or any customer-facing content.

### Track 1: Next Chapter Homeschool Outpost
| Element | Definition |
|---|---|
| **Business** | Shopify + Ingram Spark dropship homeschool curriculum store. No inventory, no warehouse. |
| **Persona** | Homeschool moms (30–45), faith-adjacent but not exclusively Christian, overwhelmed by curriculum choices, many in Alaska (allotment-eligible). Value curation over catalog size. Full avatar in `customer-avatar.md` ("Alaskan Annie"). |
| **USP** | Curated by a real classroom teacher (not a wholesaler). Alaska allotment eligible. Carries faith resources without being a "Christian store." Companion guides + public domain texts = affordable, legal, original. "Your one-stop homeschool shop" — proven in click test. |
| **Challenges** | Crowded market (Rainbow Resource, CBD, Christianbook). No existing audience — cold start. Competing against massive catalogs with a curated boutique. Launch must happen before teaching contract ends May 2026. |
| **Brand Message** | "For the child who doesn't fit in a box." — Lead with the unique child (emotional). Convert with "your one-stop homeschool shop" (practical). Two-layer strategy validated by A/B click tests. |
| **Visual Identity** | Earthy, warm, organic. Olive greens, dusty roses, teals. No corporate navy/gray. No aggressive reds. Think curated lifestyle blog, not educational supplier. |
| **Voice** | Empathetic, specific, convictional. We see her child. We have a point of view. We are the calm exhale, not a generic catalog. |

### Track 2: SomerSchool (Standalone SaaS)
| Element | Definition |
|---|---|
| **Business** | Full homeschool SaaS — standalone course platform. Scott owns the platform, the audience, the revenue. Off Trisha Goyer / Epic Learning permanently. ALL SECULAR — Alaska Statute 14.03.320 compliance required. |
| **Persona** | Homeschool parents (30–50), tech-comfortable, want structured teacher-designed courses. Anna's podcast audience + NCHO buyers = warm launch market. |
| **USP** | Built by a real classroom teacher, not a publisher. Structured. Secular. Allotment-eligible. Visible progress as retention mechanism — badge + XP + parent notification at every lesson end. |
| **Challenges** | Revenue BEFORE August 2026 — contract ends May 24. COPPA compliance required (parent account → child profile → child login). Trisha Goyer is now a competitor — keep relationship positive. |
| **Visual Identity** | Red and white. Bold, clean, educational. Confirmed via Facebook ad test. NOT earthy/organic (that's NCHO). |
| **Pricing** | $49/mo base (1 student), +$25 each, capped at $149/mo (5+ students). À la carte $149/course. 3-course bundle $379. 5-course bundle $559. |

### Track 3: BibleSaaS
| Element | Definition |
|---|---|
| **Business** | AI-powered Bible study web app. SM-2 spaced repetition, 344K TSK cross-references, living portrait visualization, Stripe subscription. 26/27 phases complete. |
| **Persona** | Christian adults (25–55) who want deeper Bible study but find concordances dry, apps cluttered, and traditional tools intimidating. Privacy-conscious — won't use apps that share their data or build social graphs. |
| **USP** | AI that meets you where you are — not a quiz app, not a social network. Spaced repetition makes study stick. 344K cross-references surface connections you'd never find manually. Living portrait grows with you. Privacy-first: no social graph, no data selling. |
| **Challenges** | Phase 27 is the only blocker (LLC + real Stripe keys + production env vars). No marketing yet. Explaining "AI Bible study" to a faith audience without triggering skepticism. Claude hit #1 App Store — timing is ideal, window may close. |

---

## Key Decisions Already Made — Do Not Re-Litigate

- Business name: **Next Chapter Homeschool Outpost** (won Facebook ad click test)
- Shopify for storefront, not custom-built
- Ingram Spark for dropship fulfillment — no warehouse, no inventory risk
- Faith posture: homeschool store that *carries* faith resources, not a faith-branded store
- Alaska allotment eligibility is a marketing feature
- Curriculum guide model: fair use + companion guide + public domain = legal
- SomerSchool (Epic Learning) is a separate non-competing brand
- No social graph in BibleSaaS — privacy-first is non-negotiable
- Chapterhouse is private (Scott & Anna only) — not a product unless productized deliberately
- BibleSaaS Phase 27 = LLC + real Stripe keys + production env keys. That is the ONLY blocker to launch.
- NCHO two-layer messaging: Brand = emotional ("for the child who doesn't fit in a box"), Offer = practical ("your one-stop homeschool shop"). Validated by Facebook click tests.
- NCHO visual identity: earthy/warm palette (olive, rose, teal). No corporate or aggressive colors. Data-backed.
- Full customer avatar documented in `customer-avatar.md` — "Alaskan Annie."
- Email domain: **buttercup.cfd** on Porkbun → Cloudflare catch-all → `alaskanguy555@yahoo.com`. Verified and active.

---

## Files in This Workspace

| File | Purpose |
|---|---|
| dreamer.md | Living dream queue — repo-connected ideas, collision maps, seed ideas, moonshots |
| master-notes.md | Full session summary — email setup, domain tricks, repo inventory, 50 opportunities |
| dreamer.py | TUI app — KILLED. No longer used. |
| customer-avatar.md | Full customer avatar for NCHO — "Annie." Demographics, psychographics, A/B test results (names, colors, slogans, offers, pain points), visual identity, brand voice, positioning pillars. 4 rounds of Facebook click test data. |
| email-setup-options.md | Cloudflare catch-all email forwarding + Mailcow self-hosted guide |
| copilot-instructions.md | **This file.** Scott's permanent identity context — injected into every Copilot session. |
| operating-system.md | Master operating document for NCHO brand + Chapterhouse build |
| chapterhouse-mvp-build-checklist.md | Build sequence + completed steps + current gaps |
| chapterhouse-product-spec.md | Product definition for Chapterhouse |
| chapterhouse-data-model-spec.md | Core schema and memory structure |
| chapterhouse-workflow-spec.md | Operational loops for briefs, research, opportunities, review, content, tasks |
| chapterhouse-ui-spec.md | Screen-by-screen UI structure |
| chapterhouse-technical-architecture-spec.md | Hosting stack, service boundaries, flows, deployment logic |
| chapterhouse-intelligence-engine-spec.md | Prompting, retrieval, scoring, ingestion behavior |
| .env | API keys (not committed to git) |
| .env.local | Local overrides (not committed to git) |
| .vscode/settings.json | Gold VS Code theme |
| CLAUDE.md | Complete Chapterhouse technical reference — all routes, architecture, build history, env vars. Claude Code reads this automatically. Must-read before touching Chapterhouse code. |
| scope-sequence-handoff.md | SomersSchool pipeline JSON contract spec — canonical field names and structure for `scope-sequence/*.json` files. |
| somersschool-curriculum-factory-handoff.md | Curriculum Factory port contract for CoursePlatform — 6-pass pipeline, DB schema SQL, API routes, 11-step build order. Paste into any CoursePlatform session. |
| chapterhouse-evolution-handoff.md | Future phases roadmap (Phases A–G) + probe test framework. |
| jobs-test-prompts.md | Curriculum factory test prompts — ready-to-paste for all grade levels and subjects. |
| social-media-automation-brain.md | Social Media Automation reference — Buffer GraphQL, 3-brand voice rules, post lifecycle. |
| vercel.json | Vercel Cron config — daily brief at 03:00 UTC (7am AKST) |
| src/lib/sources/rss.ts | RSS feed fetcher — 9 feeds (MIT Tech Review AI, OpenAI, GitHub, Vercel, Hacker News, Homeschool Mom, Shopify News, Gospel Coalition, Hechinger Report) |
| src/lib/sources/github.ts | GitHub API — Dependabot alerts + failed builds + open issues across 11 repos |
| src/app/api/briefs/generate/route.ts | Daily brief generation — Claude Sonnet 4.6, real RSS+GitHub data, knowledge summaries injected, structured output |
| src/app/api/cron/daily-brief/route.ts | Vercel Cron endpoint — triggers brief generation at 7am AKST |
| src/app/api/research/route.ts | Research ingestion — URL fetch, paste, note, image, brief item forwarding. SSRF protection added. |
| src/app/api/summarize/route.ts | Stage 3 — POST groups research by tag + compresses with Claude. GET returns current summaries. |
| src/app/api/chat/route.ts | Chat streaming — GPT-5.4 + Claude. buildLiveContext injects brief + knowledge summaries + research. |
| src/app/help/page.tsx | /help page — reads chapterhouse-help-guide.md and renders as styled HTML |
| chapterhouse-help-guide.md | ELI5 guide to all 9 screens. Plain-English, updated for current state. |
| supabase/migrations/20260309_006_create_chat_threads.sql | chat_threads table — needs to be run manually in Supabase |
| supabase/migrations/20260310_007_create_knowledge_summaries.sql | knowledge_summaries table — needs to be run manually in Supabase |

### dreamer.py — KILLED ✅
- **Decision**: dreamer.py is retired. VS Code + Copilot does everything it did, better.
- Copilot has full repo registry in memory — just say "dream with me" for ideas
- dreamer.md captures idea history in human-readable form
- The TUI was cool but added friction. Not worth maintaining.
- Desktop shortcuts (DREAMER.bat, DREAMER.lnk) can be deleted.

---

## How I Work With Copilot

- **99.99% of my work happens right here in VS Code.** This workspace is my primary (and essentially only) environment.
- I vibe code — describe what I want, Copilot builds it. I do not write code from scratch.
- My sessions are long and wide-ranging. Always check this file and dreamer.md first.
- Never suggest cross-device workflows, mobile apps, or tablet setups — not relevant.
- When I say "update the dreamer" — update dreamer.md.
- When I say "sync repos" — fetch github.com/TheAccidentalTeacher and update the registry in dreamer.md.
- When I ship something, I'll tell you — update the status in the repo registry.
- "Dream with me" means generate collision dreams or seed ideas inside dreamer.md.
- Treat every session like we're co-founders picking up mid-conversation. No re-introductions needed.

---

## Tool Evaluations — What's Been Checked

| Tool | Category | Verdict | Notes |
|---|---|---|---|
| Gamma | AI Presentation | ✅ Already built | Hypomnemata (agentsvercel) has `presentation-builder.js` — AI Presentation Generator built in Sprint 5. Don't pay for Gamma. |
| Opus Clip | AI Video Clipping | 🟡 Free tier only | $15-29/mo paid. Free = 60 credits/mo with watermark, 3-day expiry. Core is proprietary virality score ML. Not worth building. |
| N8N | Automation | 🟢 Parked — use going forward | Go-to automation layer. Railway deploy. Connects all Vercel apps, Railway backends, Supabase, Stripe, LearnWorlds via webhooks/HTTP. Not platform-specific — pure HTTP glue. |
| Claude Code | AI Dev Tool | 🔴 Install now | `npm install -g @anthropic-ai/claude-code` then `claude` in any project terminal. The one thing it does that Copilot doesn't: **autonomous unsupervised iteration** — runs a command, reads the error, fixes it, runs again, loops until done, without checking in. Copilot collaborates (you stay in the loop). Claude Code executes (you walk away). Same Anthropic API key. Has voice mode. Use for "go fix this whole thing while I sleep" jobs. First job: BibleSaaS Phase 27. |
| Helicone | API Monitoring | 🔴 Act on this | Proxy layer between your apps and AI APIs. Track cost per request across all 47 repos. Free tier. |
| dreamer.py | Python TUI | ⚫ Killed | Retired. VS Code + Copilot does everything it did, better. Say "dream with me" instead. |
| Descript | AI Video/Podcast | 🟡 Anna's use | Good for Anna's podcast editing. Not Scott's priority. |
| Superhuman | AI Email | ⚫ Skip | Email client, $30/mo. Cloudflare catch-all + Brevo covers Scott's needs for free. |

---

## AI Landscape Intel — What's Current (March 2026)

- **Claude Sonnet 4.6** — released Feb 17, 2026. This is the current model in VS Code Copilot. Use `claude-sonnet-4-6` in all new code.
- **Claude Cowork** — Anthropic's real product at claude.com/product/cowork. Collaborative AI workspace. Built in partnership with Microsoft — powering Copilot Cowork inside M365.
- **Claude Code** — terminal-based autonomous coding agent. Has voice mode. The one thing it does that Copilot doesn't: fully unsupervised iteration loop. Use for "go fix this while I sleep" jobs.
- **Claude hit #1 App Store** — warm audience momentum. BibleSaaS launch timing is ideal right now.
- **GPT-5.4** — now available inside GitHub Copilot. Claude Sonnet 4.6 is still the default here.
- **GitHub Copilot Jira agent** — Copilot can now create Jira/Linear tickets from code comments. Not relevant yet, but noted.
- **Anthropic acquired Vercept** — computer use / screen-reading capability. Expect Claude to get desktop automation powers.
- **Perplexica** — open-source local Perplexity alternative (Ollama + Docker). Skip — Scott already runs Ollama for privacy and has better research tools in Hypomnemata.
- **Microsoft Copilot Cowork** — M365 agentic task execution. Enterprise only (Outlook/Teams/SharePoint). Not relevant to Scott's stack.

## VS Code Copilot v1.110 — February 2026 Release (Key New Features)

- **`/yolo`** — type `/yolo` in chat to toggle global auto-approval. Copilot stops asking permission and just executes. Pair with terminal sandboxing. This closes the gap with Claude Code for most tasks.
- **`/autoApprove`** — same as `/yolo` but more granular. Toggle per-session.
- **Fork a conversation** — branch from any checkpoint to explore an alternative approach without losing current state. Good for architecture decisions.
- **Queue messages mid-run** — send follow-up messages while Copilot is still working to redirect without waiting.
- **`/compact`** — manually compact conversation history when context fills. Guide what to keep: e.g., `/compact forget all variants except the Next.js version`.
- **Agent memory across tools** — Copilot, CLI, and code review now share persistent memory. Context builds over time across sessions.
- **Agent plugins** (experimental) — prepackaged skill/tool/MCP bundles installable from Extensions view.
- **Agentic browser tools** (experimental) — Copilot can drive the integrated browser: navigate, click, screenshot, verify. Useful for testing deployed Vercel apps.
- **Copilot CLI now built into VS Code** — no separate install needed. Diff tabs, right-click to send snippets.
- **AI coauthor attribution on commits** — commits note AI involvement.

---

## Pending Actions — Do These

1. **BibleSaaS Phase 27** — LLC formation + real Stripe keys + production env vars. That's it. Launch blocker is trivial. Claude is #1 in App Store right now. Highest leverage thing you can do.
2. ~~**Email & Domain Setup**~~ — DONE ✅. buttercup.cfd live, catch-all forwarding to Yahoo confirmed working.
3. **Claude Code** — installed (v2.1.71). Needs `ANTHROPIC_API_KEY` set in env to authenticate.
4. **Helicone** — add as proxy to monitor AI API costs across deployed apps. Free tier.
5. **N8N on Railway** — park until needed, but deploy when you're ready to wire up SomerSchool enrollments or Stripe→Supabase flows.
6. ~~dreamer.py~~ — killed, no action needed.
7. ~~**Daily Brief v1**~~ — DONE ✅. See Daily Brief section below.
8. ~~**Chapterhouse Auth gate**~~ — DONE ✅. Supabase email/password auth. Middleware + auth callback both enforce `ALLOWED_EMAILS` allowlist. scott@somers.com and anna@somers.com.
9. ~~**Test the daily brief in production**~~ — DONE ✅. Generate works. RSS: 3 feeds OK, 6 failed (feed-side issue, not code). GitHub: 11 repos checked. 20 items scanned → Claude. Brief saved to Supabase.
10. ~~**Vercel env vars**~~ — DONE ✅. `GITHUB_TOKEN`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL` all set in Vercel dashboard.
11. ~~**Set `ALLOWED_EMAILS` in Vercel**~~ — DONE ✅. Set to `scott@somers.com,anna@somers.com`.
12. ~~**Secure `/api/debug`**~~ — DONE ✅. CRON_SECRET bearer auth added.
13. ~~**Fix 6 failing RSS feeds**~~ — DONE ✅. Replaced: Anthropic→MIT Tech Review AI, HSLDA→The Homeschool Mom, Shopify Changelog→Shopify News, Christianity Today→The Gospel Coalition, Education Week→Hechinger Report.
14. ~~**SSRF protection**~~ — DONE ✅. Research URL fetch now blocks all internal IP ranges (127.x, 192.168.x, 10.x, 169.254.x, IPv6 loopback).
15. **Run 2 pending migrations in Supabase** — `chat_threads` (006) and `knowledge_summaries` (007). Go to Supabase SQL Editor and run both.
16. **Verify Vercel Cron fired** — First fire should be March 11 7am AKST. Check Daily Brief page for auto-generated brief.

---

## Email & Domain Setup — DONE ✅

**Goal:** Cheap multi-domain catch-all email. Unlimited addresses like `anything@yourdomain.com` forwarding to one inbox. $0 server cost.

**Plan:** Option 1 from email-setup-options.md — Cloudflare catch-all forwarding + Brevo SMTP for sending.

**Status: COMPLETE — buttercup.cfd catch-all email is live and forwarding to Yahoo.**

**What's been completed:**
- Domain purchased: **buttercup.cfd** on Porkbun (username: subxeroscott, expires 2027-03-09, renewal ~$12.87/yr)
- Domain added to Cloudflare (free plan, account: scosom@gmail.com)
- Nameservers changed to Cloudflare: `ganz.ns.cloudflare.com` + `lucy.ns.cloudflare.com`
- Cloudflare Email Routing: **Enabled + Configured**
- DNS records: 3 MX records (route1/2/3.mx.cloudflare.net) + DKIM TXT + SPF TXT — all locked
- Catch-all rule: **Active** → forwards to `alaskanguy555@yahoo.com`
- Custom address: `a@buttercup.cfd` → `alaskanguy555@yahoo.com` (Active)
- Destination address: `alaskanguy555@yahoo.com` — **Verified**
- DNS propagated and **tested working** March 9, 2026

**Optional next step:**
- **Brevo SMTP** — set up Brevo free SMTP + Gmail/Yahoo "Send mail as" to reply FROM buttercup.cfd addresses

---

## Daily Brief — DONE ✅ (March 10, 2026)

**What was built:**
- `rss-parser` installed
- `src/lib/sources/rss.ts` — 9 RSS feeds: Anthropic Blog, OpenAI Blog, GitHub Changelog, Vercel Blog, Hacker News Top 10, HSLDA News, Shopify Changelog, Christianity Today, Education Week. All run in parallel; failed feeds are skipped silently.
- `src/lib/sources/github.ts` — GitHub API hits 11 repos (all active + warm): Dependabot security alerts, failed workflow runs (last 48h), open issues. Sorted: security → build failures → issues.
- `src/app/api/briefs/generate/route.ts` — rewritten. Fetches real RSS + GitHub data, feeds to Claude Sonnet 4.6 (`claude-sonnet-4-6`), outputs structured brief in 🔴🟡🟢📊⚫ section format, saves to Supabase `briefs` table with real `source_count`.
- `src/app/api/cron/daily-brief/route.ts` — cron endpoint at `GET /api/cron/daily-brief`. Authenticated via `CRON_SECRET` Bearer token.
- `vercel.json` — cron schedule `0 15 * * *` (3:00 UTC = 7:00am AKST).
- `src/components/brief-item-card.tsx` — client component with live **Convert to task** and **Send to review** buttons on every brief item.
- `src/components/new-brief-panel.tsx` — Generate always visible at top. Debug strip shows RSS/GitHub ingestion stats after generation.
- Right sidebar shows full ingestion pipeline (9 feeds, 11 repos) + last brief stats.

**Tested in production:** ✅ First real brief generated March 10. RSS: 3 feeds OK, 6 failed (feed-side — not code). GitHub: 11 repos checked. 20 items scanned → Claude Sonnet 4.6 → saved to Supabase.

**Vercel env vars:** ✅ All three set (`GITHUB_TOKEN`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`).

**Cost estimate:** Under $0.10/day.

**Monitored repos:** roleplaying, chapterhouse, NextChapterHomeschool, agentsvercel, arms-of-deliverance, BibleSAAS, talesofoldendays, 1stgradescienceexample, FoodHistory, mythology, 2026worksheets.

**RSS feeds monitored (current working set):** MIT Technology Review AI, OpenAI Blog, GitHub Changelog, Vercel Blog, Hacker News (top 10), The Homeschool Mom, Shopify News, The Gospel Coalition, Hechinger Report.

**Known issue:** First run had 6/9 failing. Fixed March 10 — all 9 feeds now have verified-working URLs.

**Next steps for Daily Brief:**
- Run `knowledge_summaries` migration in Supabase SQL Editor
- Verify Vercel Cron first fire (March 11 7am AKST)
- Future: email delivery to `brief@buttercup.cfd` via Resend

---

## Chapterhouse Feature Status — March 14, 2026

| Screen | Status | What works |
|--------|--------|------------|
| Chat (Home) | ✅ WORKING | Streaming, 5 model options (GPT-5.4/Pro/Mini, Claude Opus/Sonnet 4.6), persistent threads, auto-learn, founder memory + knowledge summaries + brief + research injected into context. **Council Mode toggle** — Solo/Council switch in input bar. Council mode streams multi-member Fellowship responses via SSE with rebuttal round. |
| Daily Brief | ✅ WORKING | Real RSS (9 feeds, all URLs verified) + GitHub (11 repos) → Claude Sonnet 4.6. Knowledge summaries injected. Generate + cron. Convert to task + Send to review on every item. |
| Research | ✅ WORKING | URL fetch + GPT-5.4 analysis, paste text, quick note, screenshot/GPT Vision. Manual fallback. SSRF protection. Condense knowledge button → /api/summarize. |
| Product Intelligence | ✅ WORKING | GPT-5.4 scores opportunities across Store/Curriculum/Content (A+ to C). Category filter. |
| Content Studio | ✅ WORKING | 3 modes via Claude Sonnet 4.6: Newsletter/Campaign, Curriculum Guide, Product Description. Copy to clipboard. |
| Review Queue | ✅ WORKING | Dual-feed: research items + opportunities. Approve/reject. Convert opportunity → task. |
| Tasks | ✅ WORKING | Full CRUD. Status machine: open → in-progress → blocked → done → canceled. Source linking (from brief/opportunity/manual). |
| Documents | ✅ WORKING | Server-rendered. Reads all .md from repo root. Search/filter from top nav. |
| Settings | ✅ WORKING | Env status checker (present/missing). Founder Memory CRUD. Category picker. |
| Help | ✅ WORKING | /help page serving chapterhouse-help-guide.md. Linked from sidebar. |
| Login | ✅ WORKING | Supabase email/password auth. ALLOWED_EMAILS enforcement in middleware. |
| **Job Runner** | ✅ WORKING | Background AI jobs via QStash → Railway workers. Supabase Realtime progress updates. Create/cancel/run jobs. |
| **Curriculum Factory** | ✅ WORKING | 4-pass Council critique loop (Gandalf → Legolas → Aragorn → Gimli). Single + batch generation. |
| **Council Chamber** | ✅ WORKING | 5-agent curriculum generation as background job. Select subject/grade/duration. |
| **Pipelines** | ✅ WORKING | n8n workflow control panel. Status, execution history, manual triggers. Requires n8n API key. |

### Sidebar
Accordion-grouped navigation (5 sections: Command Center, Intelligence, Production, AI & Automation, System). Hover tooltips on every nav item. Status badges (live/beta/soon). Dynamic system status rail. Help link below nav.

### Known Issues
| Issue | Severity | Detail |
|-------|----------|--------|

| Migration schema conflicts | **P3** | `research_items` and `tasks` tables have competing CREATE TABLE IF NOT EXISTS across migration files. Production schema works but migration files are misleading. |

### AI Model Map
| Feature | Model | Provider |
|---------|-------|----------|
| Daily Brief generation | claude-sonnet-4-6 | Anthropic |
| Chat (default) | gpt-5.4 | OpenAI |
| Chat (Claude option) | claude-* (user-selected) | Anthropic |
| Council Mode — Gandalf | claude-sonnet-4-6 | Anthropic |
| Council Mode — Legolas | claude-sonnet-4-6 | Anthropic |
| Council Mode — Aragorn | gpt-5.4 | OpenAI |
| Council Mode — Gimli | gpt-5.4 | OpenAI |
| Council Mode — Merry & Pippin | gpt-5-mini | OpenAI |
| Research analysis | gpt-5.4 | OpenAI (Responses API) |
| Research screenshot | gpt-5.4 | OpenAI (Vision) |
| Opportunity analyzer | gpt-5.4 | OpenAI (Responses API) |
| Extract learnings | gpt-5.4 | OpenAI (Responses API) |
| Content Studio | claude-sonnet-4-6 | Anthropic |
| Curriculum Factory (4-pass) | claude-sonnet-4-6 | Anthropic |

### Supabase Tables (All Live)
| Table | Used by |
|-------|--------|
| `briefs` | Daily Brief, Chat context |
| `research_items` | Research, Chat context, Opportunity analyzer, Review Queue |
| `opportunities` | Product Intelligence, Chat context, Review Queue |
| `founder_notes` | Settings/Founder Memory, Chat context, Extract-learnings |
| `tasks` | Tasks page, Review Queue, Brief item cards |
| `chat_threads` | Chat interface (persistent threads) |
| `knowledge_summaries` | Stage 3 summarization — compressed research by tag, injected into brief + chat |
| `jobs` | Job Runner, Curriculum Factory, Council Chamber — Realtime enabled |
| `documents` | Schema exists — not used (Documents reads filesystem) |
| `sources` | Schema exists — not used yet (RSS items go direct to Claude) |
| `settings` | Schema exists — not used |

---

## Last Updated
March 17, 2026 (Session 14) — Contract-clean Pipeline Handoff JSON + code audit. `CANONICAL_SUBJECT_LABELS` (`ela→"Language Arts"` etc.), `schema_version` + `generated_by` guaranteed in post-extraction fixup. Earl → GPT-5.4, Beavis → `gpt-5-mini` via `callWithOpenAI()`. `openai` dep added to worker. `scope-sequence/ela-g1.json` sample. `CCSS-M` → `CCSS-Math` throughout docs (spec-canonical). Railway TS build fix: `unit.lessons.length` → `lessonCount` inside forEach callback.

March 16, 2026 — All 16 screens WORKING. **Session 12:** Curriculum factory upgraded to full SomersSchool pipeline handoff. `structuredOutput` wired to council-chamber-viewer UI — Pipeline Handoff JSON panel (emerald card, copy/download/preview toggle). 6-pass visual PassStepper replaces bare `%` bar. Accumulating session log (appends each pass message, not overwritten). Output order corrected (Scope → JSON → Earl open → B&B → Working Papers → Download). Removed duplicate Earl card. `council/page.tsx` "How It Works" updated with Pass 6 (Extract). Phase 2 architecture docs fully reflect 6-pass reality. **Session 11:** Phase 6 YouTube Intelligence — paste any YouTube URL → extract transcript via Gemini 2.5 Flash on Railway (~77s, 21K+ chars) → generate 8 types of curriculum materials via Claude Sonnet 4.6. 3-tier Vercel fast path (captions → innertube → Railway handoff). Hallucination guard validates video via YouTube Data API before Gemini processes. youtube-transcript npm blocked from cloud IPs — Gemini handles 100% of production transcripts. 4 API routes, 4 UI components, 1 Railway worker job type. Session 8: Phase 5 Social Media Automation — Claude-powered 3-brand × 3-platform post generation, human review gate, Buffer GraphQL scheduling, Shopify webhook auto-triggers, weekly cron batch generation. Session 7: global cross-table search bar, inline URL fetching (12K chars, article extraction, SSRF protection, visual indicator), auto-learning (Claude extracts facts → founder_notes), agentic research (Tavily → GPT-5.4 → auto-ingest), research metadata extraction (OG tags), daily brief email delivery (Resend → scott@nextchapterhomeschool.com), thread persistence (debounced 1.5s auto-save). Session 6: Council of the Unserious 5-pass pipeline, Council Mode in chat (Solo/Council toggle, SSE multi-member streaming, rebuttal round), national standards auto-alignment (CCSS-ELA/CCSS-Math/NGSS/C3). Job Runner, Curriculum Factory, Council Chamber, Pipelines all built and deployed. Accordion sidebar with 5 groups, tooltips, status badges. Dynamic right rail.
