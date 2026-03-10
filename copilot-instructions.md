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

**Trisha Goyer** — partner at Epic Learning (not employee, not spouse).
- Hosts SomerSchool courses on epiclearning.learnworlds.com.
- Revenue share: $100 Scott / $49 Trisha per course sale.

---

## My Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js App Router, TypeScript, Tailwind CSS |
| Auth | Clerk |
| State | Zustand |
| Database | Supabase (PostgreSQL + pgvector + RLS + Realtime) |
| AI — primary | Claude Sonnet / Haiku (Anthropic) |
| AI — secondary | OpenAI GPT-4o, GPT-5 |
| Voice | ElevenLabs TTS |
| Images | DALL-E 3 |
| 3D/Physics | Babylon.js + Ammo.js (WASM) |
| Email (transactional) | Resend |
| Payments | Stripe |
| Hosting — apps | Vercel Pro ($20/mo) |
| Hosting — backends | Railway |
| Hosting — static | Netlify |
| Domain/DNS/email | Cloudflare (free tier) — buttercup.cfd catch-all active |
| Domain registrar | Porkbun (subxeroscott) — buttercup.cfd, expires 2027-03-09 |
| SMTP (outbound) | Brevo (free tier) |
| Package manager | npm / pnpm |
| Local AI (privacy) | Ollama — runs locally when privacy is needed |

---

## My 47 Repos — Quick Reference
*Sorted by last activity. Updated manually — ask me to refresh.*

| Repo | Stack | Status | What It Is |
|---|---|---|---|
| roleplaying | TS | 🔴 Active | AI RPG: DM + 3D physics dice (Babylon+Ammo) + ElevenLabs TTS + DALL-E + Supabase |
| chapterhouse | TS | 🔴 Active | Private ops brain — daily brief (live + auto-cron), multi-model AI, research ingestion. Deployed: chapterhouse.vercel.app |
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
| 2 | SomerSchool | epiclearning.learnworlds.com | Live — 2 courses, 1,500+ platform learners |
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

### Track 2: SomerSchool (Epic Learning)
| Element | Definition |
|---|---|
| **Business** | Online courses hosted on epiclearning.learnworlds.com. Revenue share with Trisha Goyer ($100 Scott / $49 Trisha per sale). |
| **Persona** | Parents wanting structured, teacher-designed online learning for kids. Trisha's existing audience (warm market). Willing to pay $149/course. |
| **USP** | Designed by a real teacher with classroom experience, not a content mill. Partnership with Trisha Goyer adds credibility and reach. Interactive, not just PDFs. |
| **Challenges** | Platform dependency (LearnWorlds owns the infrastructure). Limited catalog (2 courses live). Trisha relationship is partnership, not employment — requires alignment. Separate brand from NCHO — can't cross-pollinate too aggressively. |

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
| vercel.json | Vercel Cron config — daily brief at 03:00 UTC (7am AKST) |
| src/lib/sources/rss.ts | RSS feed fetcher — 9 feeds across AI, homeschool, ecommerce, faith, education |
| src/lib/sources/github.ts | GitHub API — Dependabot alerts + failed builds + open issues across 11 repos |
| src/app/api/briefs/generate/route.ts | Daily brief generation — Claude Sonnet 4.6, real data, structured output |
| src/app/api/cron/daily-brief/route.ts | Vercel Cron endpoint — triggers brief generation at 7am AKST |

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
8. **Chapterhouse Auth gate** — Supabase magic link locked to Scott + Anna emails. App is currently open. P0 security issue.
9. **Test the daily brief in production** — hit Generate on chapterhouse.vercel.app/daily-brief. Verify RSS feeds return data, GitHub alerts populate, Claude output matches 🔴🟡🟢📊⚫ format.
10. **Verify Vercel Cron is registered** — check Vercel project → Settings → Cron Jobs. Should show `/api/cron/daily-brief` running at 03:00 UTC daily.

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
- `vercel.json` — cron schedule `0 15 * * *` (3:00 UTC = 7:00am AKST). Will show in Vercel dashboard → Cron Jobs.
- Committed as `98d4f17` and pushed to GitHub.

**Env vars set locally (.env + .env.local):**
- `GITHUB_TOKEN` — set in `.env` (do not paste token value in docs)
- `CRON_SECRET` — set in `.env`
- `NEXT_PUBLIC_APP_URL=https://chapterhouse.vercel.app`

**Env vars that must also be set in Vercel dashboard (Settings → Environment Variables):**
- `GITHUB_TOKEN` — same value as above
- `CRON_SECRET` — same value as above
- `NEXT_PUBLIC_APP_URL` — `https://chapterhouse.vercel.app`

**Cost estimate:** Under $0.10/day. 9 RSS feeds (~50 items) + GitHub (0–30 alerts) → ~2,000 tokens in, ~800 tokens out per Claude call. At Sonnet 4.6 pricing = ~$0.03–0.08/day.

**Monitored repos:** roleplaying, chapterhouse, NextChapterHomeschool, agentsvercel, arms-of-deliverance, BibleSAAS, talesofoldendays, 1stgradescienceexample, FoodHistory, mythology, 2026worksheets.

**RSS feeds monitored:** Anthropic Blog, OpenAI Blog, GitHub Changelog, Vercel Blog, Hacker News (top 10), HSLDA News, Shopify Changelog, Christianity Today, Education Week.

**Next steps for Daily Brief:**
- Test manually: open chapterhouse.vercel.app/daily-brief → click Generate
- Verify Vercel Cron is registered in project dashboard
- Add more feeds as needed (see `src/lib/sources/rss.ts` FEEDS array)
- Add more repos to `MONITORED_REPOS` in `src/lib/sources/github.ts`
- Future: email delivery to `brief@buttercup.cfd` via Resend

---

## Last Updated
March 10, 2026 — Daily Brief v1 COMPLETE. Real RSS + GitHub ingestion live. Claude Sonnet 4.6 generating structured briefs. Vercel Cron wired for 7am AKST. GitHub token, CRON_SECRET, and APP_URL set locally. Env vars need to be added to Vercel dashboard + redeploy to activate cron.
