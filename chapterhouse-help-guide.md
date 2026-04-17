# Chapterhouse — Help Guide

> Plain-English guide to everything the app does, how to use it, and what to expect.

---

## What Is Chapterhouse?

Chapterhouse is your private operating system — a website only you and Anna can access. It lives at **chapterhouse.vercel.app** and runs 24/7. Think of it as mission control: you read the morning news, talk to AI, save research, generate content, track tasks, manage dreams, collect intelligence, process email, manage context — all in one place, all tailored to Next Chapter and SomerSchool.

Nobody else can see it. It's locked to your two email addresses.

**Core concept:** Chapterhouse is the command center for all three business tracks (NCHO, SomerSchool, BibleSaaS). Intelligence flows in from multiple sources (daily briefs, email, manual research, Intel reports, YouTube). You decide what matters (via tasks, seeds, opportunities). AI agents automate the rest (digest generation, draft replies, curriculum building, social media).

---

## All Screens

Chapterhouse has twenty-one screens organized in six sidebar groups. Here's what each one does.

### Command Center

---

### 1. Home (Chat)

**What it is:** A chat window — like texting an assistant who knows your brand, your research, your daily brief, and your goals. Supports two modes: **Solo** (one AI responds) and **Council** (multiple Council of the Unserious members respond).

**How to use it:**
- Type a question or request in the box at the bottom and press Enter
- Pick which AI brain to use from the dropdown (GPT-5.4 is the default; Claude is also available)
- Start new conversations with the **+** button
- Pin important conversations so they stay at the top
- Rename or delete old conversations

**Council Mode:** Click the amber **Council** pill button next to the text input to toggle Council Mode on/off:
- **Solo mode** (default) — one AI model responds, like a normal chat
- **Council mode** — your question goes to the Council of the Unserious (Gandalf, Lt. Commander Data, Polgara, Earl Harbinger, and Silk). Each responds in character, with colored avatar bubbles. After the initial round, a **rebuttal round** follows where members respond to each other.

**Special trick:** Type `/remember [any fact]` and the system will memorize it permanently. Example: `/remember We decided to launch the first curriculum guide by September`. That fact then gets included in every future chat automatically.

**URL fetching:** Paste a URL in your message and the chat will automatically fetch the page content, extract the article text (up to 12K chars), and include it as context for the AI. A "Fetching URL…" indicator appears while loading.

**Auto-learning:** After every message you send, the system silently extracts new facts worth remembering from the conversation and saves them to your Founder Memory. You’ll see a small brain icon flash when it learns something.

**What happens behind the scenes:** Every time you send a message, the AI also reads your daily brief, your saved research, your open opportunities, and your founder memory — so its answers are always relevant to where you actually are.

---

### 2. Daily Brief

**What it is:** A morning summary of what happened overnight across your industry, competitors, and the GitHub repos you care about.

**How to use it:**
- Click **Generate Brief** to create a fresh one (takes 15–30 seconds)
- Optionally type a "focus area" to steer what the AI pays attention to
- Read through the sections — each item has a headline, why it matters, and a relevance score
- Click **Convert to task** on any item to send it straight to your Tasks list
- Click **Send to review** to put it in the Review Queue for later decision-making
- You can also write a brief manually using the **Write manually** toggle

**Automatic mode:** A brief generates itself every morning at 7:00 AM Alaska time via a scheduled job. When it completes, an email copy is sent to scott@nextchapterhomeschool.com automatically.

**Where the data comes from:** 9 RSS news feeds (education, homeschool, edtech) + 11 GitHub repos you follow. The AI reads all of it and writes the summary.

---

### 3. Dreamer

**What it is:** Your idea management system. A kanban board where seeds become active projects, then move into Building or Shipped. Includes an AI review layer (Earl Harbinger analyzes your seed ideas and suggests which to prioritize).

**Four columns:**
- **Seeds** — Raw idea capture (from manual entry, chat suggestions, Intel reports, or the push API)
- **Active** — Ideas you're actively considering
- **Building** — Projects currently in progress (repos, work streams)
- **Shipped** — Completed and live

**How to use it:**
- Drag any card between columns to change its status
- Click the **+** button to add a new seed manually
- Each card shows: title, description, source (dreamer.md, chat, brief, intel, push_api), status, and timestamps
- Click **Archive** to hide old seeds you've decided against
- Click **Dismiss** to mark something as "do not revisit"

**Earl's AI Review:** Every week (or on-demand), click **Get AI Review** and Earl Harbinger (via Claude Sonnet 4.6) analyzes all your seeds and returns:
- **Promote** — This is high-impact, prioritize it
- **Dismiss** — Not worth pursuing, deprioritize
- **Hold** — Keep it warm but not now
- **Merge** — This combines with another seed, consolidate them

**You always approve manually** — Earl suggests, you decide.

**Daily Dream Log:** Each day, you can add one mood check-in to track energy/focus/conviction. View the log to spot patterns ("When I'm focused on X, my ideas flow better").

**Behind the scenes:** Seeds auto-import from dreamer.md in your workspace. High-collision findings from daily briefs and Intel reports automatically generate seed proposals for your review.

---

### 4. Intel

**What it is:** The intelligence analysis engine. Feed URLs to the system, and it runs multi-layer analysis (Claude Sonnet for primary analysis, Claude Haiku for verification) to extract signal from noise. Results are categorized by impact type (direct, ecosystem, community, background) and scored A+ to C.

**Three ways to add intelligence:**

| Tab | What to do |
|-----|-----------|
| **New Session** | Paste 1–20 URLs, hit Analyze. System fetches each page, extracts content, runs analysis. |
| **Publishers Weekly** | Paste the raw text of a Publishers Weekly email → auto-extracts book/market/trend data |
| **Auto-Fetch** | Cron runs daily at 4:00 AM UTC, monitoring 5 watch sources (daily.dev, tech news feeds, edtech research, homeschool news) |

**Each Intel report shows:**
- **Summary** — Top findings across all URLs
- **Categorized sections:**
  - 🔴 Direct Impact (affects your business directly)
  - 🟡 Ecosystem Signal (market-level trends)
  - 🟠 Community Signal (user/customer behavior shifts)
  - 🔵 Background (interesting but less urgent)
- **Impact scores:** A+ (act immediately), A (this week), A- (this month), B+ (monitor), etc.
- **Affected repos:** Which of your 47 repos this matters for
- **Proposed seeds:** AI automatically suggests 1–3 seed ideas to add to Dreamer

**Behind the scenes:** Claude Sonnet 4.6 extracts facts, Claude Haiku 4.5 verifies claims, and the Council of the Unserious provides multi-voice commentary on key findings. Results feed both into Dreamer (as proposed seeds) and into your chat context (last 48h Intel is always available in Chat).

---

### 5. Email Inbox

**What it is:** Your email management system. Sync from Gmail and Mailcow, auto-categorize, auto-ingest to research/opportunities, generate draft replies, and see action items at a glance.

**Two views:**

**Live View** — Shows your raw inbox from connected email accounts (Gmail, ncho@mailcow).

**AI View** — Categorized and analyzed:
- 11 categories (spam, vendor, sales inquiry, customer, newsletter, notification, internal, order, media, other)
- Unread indicator + action_required flag (red pulsing dot for emails needing a reply)
- Urgency score (0–5)
- AI summary of each email

**Auto-processes run every 3 hours:**
1. **Sync** — Fetches last 30 days from connected email accounts, deduplicates by UID
2. **Categorize** — Claude Haiku 4.5 auto-assigns category + urgency + action_required flag
3. **Auto-ingest** — Newsletters and media → added to Research. Sales inquiries and customer emails → added to Product Intelligence as opportunities

**Draft Reply button** — Click on any email, scroll down, click **Draft Reply** (orange button):
- Claude Haiku generates a contextual reply draft
- Can edit before sending
- Draft caches for 24 hours so you don't regenerate
- Replies auto-route to your email drafts (not sent automatically)

**Email Action Banner** — On Home page: shows top 5 unread emails that need replies. Click one to jump directly to it in Inbox.

**Behind the scenes:** Automatic draft replies for action items appear in your daily digest (Step 4.5A). Newsletter and media URLs get automatically added to your Research queue (Step 4.5B). This happens in the background; you see the results in Research and Opportunities without manual work.

**Cost:** ~$0.001 per draft reply (Haiku). Digest + auto-ingest costs bundled into overall brief generation (~$0.05/day).

---

### 6. Context Brain

**What it is:** A four-layer memory system where you manage all the documents that feed into AI conversations. These documents are automatically injected into every chat call, every brief generation, and every Council Chamber session.

**Four slots** (injected in this order):

| Slot | Document | Inject Order | What it contains |
|------|----------|--------------|------------------|
| **Core** | copilot-instructions.md | 1 | Your permanent identity (who you are, your three business tracks, all locked decisions) |
| **Sessions** | push log + session notes | 2 | The most recent 8 sessions summarized (so AI knows what you decided last week) |
| **Extended** | extended_context.md | 3 | Customer research, brand voice rules, copy principles, competitor analysis |
| **Intelligence** | intel session summaries | 4 | Last 48 hours of Intel analysis (highest-impact findings) |
| **Bonus** | email digest | 5 | Previous day's email summary for continuity |

**How to use it:**
- Click **Context Brain** in sidebar
- Select a document from the pill selector
- Read the current content
- Edit the text inline (no external editor needed)
- Click **Save** to persist changes
- Changes auto-inject into every AI call immediately

**Push API** — For documents outside Chapterhouse (in your desktop workspace), use the push tools:
- **PUSH-DREAMER.bat** — pushes latest dreamer.md to Context Brain
- **PUSH-ALL.bat** — pushes copilot-instructions.md + extended_context.md + dreamer.md

This pattern keeps your workspace (desktop files) and Chapterhouse (cloud AI context) in sync without manual copy-paste.

---

### Intelligence

### 7. Research
| **Auto-research** | Type a topic and click Research. The system searches the web via Tavily, analyzes each result with GPT-5.4, checks for duplicates, and auto-saves relevant items. |

**After saving:** Each research item shows a title, summary, verdict, and tags. You can re-analyze or delete items. Everything you save here automatically feeds into your chat context and opportunity analysis.

---

### 7. Research

**What it is:** Your brain's intake system. Anything interesting you find — an article, a screenshot, a quick thought — goes here and gets analyzed by AI.

**Four ways to add something:**

| Tab | What to do |
|-----|-----------|
| **URL** | Paste a web address. The AI fetches and reads the page, then writes a summary and verdict. |
| **Paste text** | Copy-paste any text (email, article excerpt, Slack message). AI analyzes it. |
| **Quick note** | Jot down a thought or observation. AI adds context. |
| **Screenshot** | Drag and drop an image (competitor site, social post, ad). AI vision reads and analyzes it. |
| **Auto-research** | Type a topic and click Research. The system searches the web via Tavily, analyzes each result with GPT-5.4, checks for duplicates, and auto-saves relevant items. |

**After saving:** Each research item shows a title, summary, verdict, and tags. You can re-analyze or delete items. Everything you save here automatically feeds into your chat context and opportunity analysis.

---

### 8. Product Intelligence

**What it is:** An AI-powered radar that reads all your research and briefs, then suggests opportunities worth pursuing.

**How to use it:**
- Click **Run Opportunity Analysis** (takes about 15 seconds)
- AI generates a list of opportunities, each scored on three dimensions:
  - **Store score** — how relevant is this to your Shopify store?
  - **Curriculum score** — how relevant to curriculum products?
  - **Content score** — how relevant to content/marketing?
- Scores range from **A+** (very relevant) to **C** (low relevance)
- Expand any opportunity to see supporting evidence and a recommended next action
- Mark opportunities as **In progress**, **Done**, or **Passed**

**The more research you save, the better these suggestions get.**

---

### 9. YouTube Intelligence

**What it is:** Turn any YouTube video into curriculum materials. Paste a URL, get a transcript, then generate quizzes, lesson plans, vocabulary lists, and more — all grade-appropriate.

**How to use it:**
- **Paste a YouTube URL** into the input box or **search YouTube** right from the page
- Chapterhouse attempts to extract a transcript instantly (via captions or YouTube's internal API)
- If the instant path fails (YouTube blocks cloud IPs), the system creates a background job that uses **Gemini 2.5 Flash** to watch the actual video and transcribe it (~77 seconds for a 20-minute video)
- Watch the job status update in real time — no page refresh needed
- Once you have a transcript, use the **8 curriculum tools** to generate materials:

| Tool | What You Get |
|------|-------------|
| **Quiz** | Multiple choice + short answer questions |
| **Lesson Plan** | Full plan with objectives, activities, assessment |
| **Vocabulary** | Key terms with definitions and context |
| **Discussion Questions** | Open-ended questions for group or family discussion |
| **DOK Projects** | Depth of Knowledge projects at multiple levels |
| **Graphic Organizers** | Visual organization templates |
| **Guided Notes** | Fill-in-the-blank study guides |

**Batch mode:** Process multiple videos at once using the batch sidebar. Great for building materials across a unit that uses several videos.

**Behind the scenes:** Gemini 2.5 Flash on Railway handles 100% of production transcripts. A hallucination guard validates every video ID via YouTube Data API before processing — if the video doesn't exist, it fails immediately instead of generating fake content.

---

### Production

### 10. Content Studio

**What it is:** A writing assistant that drafts content in your brand voice. Three modes:

| Mode | What you get |
|------|-------------|
| **Newsletter / Campaign** | Give it a topic or hook → get a polished email newsletter or campaign brief |
| **Curriculum Guide** | Give it a book title and author → get discussion questions, a full unit study, or an activity set tailored to a grade range |
| **Product Description** | Give it a product name → get Shopify-ready copy with headline, body, bullet points, and meta description |

**How to use it:**
- Pick a tab, fill in the fields, click **Generate**
- Read the output, click **Copy** to grab it
- Paste wherever you need it (Shopify, Mailchimp, Google Docs, etc.)

---

### 11. Review Queue

**What it is:** A holding pen where items wait for your decision before they move forward.

**What shows up here:**
- Research items marked for review
- Opportunities from Product Intelligence that haven't been acted on yet

**What you can do:**
- **Save** a research item (approves it, removes from queue)
- **Reject** a research item (dismisses it)
- **Create task** from an opportunity (sends it to Tasks)
- **Mark in progress** or **Pass** on an opportunity

**When the queue is empty**, you'll see a "Queue is clear" message — that means you're caught up.

---

### 12. Tasks

**What it is:** Your to-do list. Simple, focused, no fluff.

**How tasks get created:**
- Click **Add task** and type one manually
- Click **Convert to task** from a daily brief item
- Click **Create task** from a Review Queue opportunity

**Task statuses:**
| Status | Meaning |
|--------|---------|
| **Open** | Not started yet |
| **In progress** | You're working on it |
| **Blocked** | Stuck — waiting on something |
| **Done** | Finished |
| **Canceled** | Decided not to do it |

Each task shows where it came from (brief, opportunity, or manual) so you always have context.

---

### 13. Documents

**What it is:** A library of all the brand documents, strategy guides, and reference files in the system.

**How to use it:**
- Scroll or use the **search bar** to find a document
- Click any card to expand and read the full content
- Documents are read-only here — they're the source-of-truth files that live in the codebase

**What's in here:** Your persona, biography, brand personality guide, Shopify strategy, operating system doc, product specs, and more — including this help guide.

---

### System

### 14. Settings

**What it is:** System configuration and your "founder memory" manager.

**Two sections:**

**Founder Memory** — Facts the AI should always know about you. Add facts like "We don't do discount pricing" or "Anna handles all curriculum reviews." These get injected into every chat conversation automatically. You can also add them via `/remember` in chat.

**Environment Status** — Shows green/yellow dots for each required service connection (API keys, database, etc.). If something is yellow, that service isn't configured.

---

### AI & Automation

### 15. Job Runner

**What it is:** A dashboard for background AI jobs that run while you sleep. Jobs are queued, processed by a Railway worker, and report progress in real time.

**How to use it:**
- Click **Create Job** to queue a new background AI task
- Watch progress bars update live as jobs run (powered by Supabase Realtime — no page refresh needed)
- Each job shows: label, type badge, status badge (queued/running/completed/failed), and a progress bar
- Click any job to see full details, output, or error messages
- Cancel running jobs if needed

**Behind the scenes:** Jobs are published to QStash (Upstash), which delivers them to a Railway worker service. The worker processes the AI task, writes progress updates to Supabase, and the UI picks up changes in real time.

---

### 16. Curriculum Factory

**What it is:** A 5-pass AI pipeline that generates curriculum scope & sequences using the Council of the Unserious critique loop.

**How to use it:**
- Select a subject, grade level, and duration
- Optionally add standards alignment or additional context
- Click **Generate** for a single curriculum, or use **Batch** mode to generate many at once
- The 5-pass process:
  1. **Gandalf** drafts the initial scope & sequence
  2. **Lt. Commander Data** audits it against national standards (CCSS-ELA, CCSS-M, NGSS, or C3)
  3. **Polgara** synthesizes Gandalf + Data into a production-ready, child-first final version
  4. **Earl Harbinger** assesses operational viability — build order, revenue, minimum viable version
  5. **Silk (Prince Kheldar)** stress-tests the hidden assumption — names what no one said
- View the final output as rendered Markdown, download as HTML/PDF/DOCX, or copy to clipboard

**National standards auto-alignment:** Standards are auto-detected from the subject field. ELA → CCSS-ELA, Math → CCSS-M, Science → NGSS, Social Studies → C3 Framework. No manual input needed.

**Batch mode:** Generate up to 70 curricula overnight (10 subjects × 7 grade levels). Jobs are staggered to avoid API rate limits.

---

### 17. Council Chamber

**What it is:** A purpose-built 5-agent system for generating curriculum scope & sequences as a background job. Uses the full Council of the Unserious (Gandalf → Data → Polgara → Earl → Silk) as a longer, more thorough process.

**How to use it:**
- Select subject, grade, and duration
- Submit to start the job — it runs in the background
- Check the Job Runner page for progress
- Results appear when complete

**How it differs from Council Mode in Chat:** Council Mode in Chat is real-time, general-purpose, and handles any topic. Council Chamber is purpose-built for curriculum generation and runs as a background job.

---

### 18. Pipelines

**What it is:** A control panel for n8n automation workflows running on Railway.

**How to use it:**
- View all your n8n workflows with their current status (active/inactive)
- See the last run timestamp and result (success/failed/running)
- Click **Run now** to manually trigger any workflow
- Auto-refreshes every 30 seconds

**Requires:** n8n API key configured in environment variables. Without it, shows a setup message.

---

### 19. Social Media

**What it is:** AI-powered social media post generation, human review, and scheduling for all your brands. Replaces Sintra ($49/mo).

**Three tabs:**

**Review Queue** — Every AI-generated post lands here first. Nothing auto-publishes. For each post:
- Edit the text inline if you want to change anything
- Pick a date/time to schedule it
- Select which Buffer channel to publish to
- Click **Approve** to schedule via Buffer, or **Reject** to dismiss
- Every edit is tracked — you can see what the AI originally wrote vs. what you changed

**Generate** — Create new posts on demand:
- Toggle which brands (NCHO, SomersSchool, Alana Terry) and platforms (Facebook, Instagram, LinkedIn)
- Set how many posts per combo, optionally add a topic seed
- Claude writes each post following brand-specific voice rules

**Accounts** — Manage your Buffer channel connections:
- Click **Sync from Buffer** to pull in your connected channels
- Map each channel to a brand + platform combination
- View active accounts

**Auto-triggers (hands-free):**
- **Weekly cron** (Monday 5:00 AM UTC) generates a fresh batch of 18 posts (3 brands × 3 platforms × 2 each)
- **Shopify webhook** — when Anna adds a new product to the NCHO store, launch posts are auto-generated

---

### 20. Help

**What it is:** This page! A plain-English guide to every feature in Chapterhouse.

---

### 21. Login

**What it is:** The authentication gate. Locked to two email addresses only.

---

## The Sidebar

The sidebar on the left organizes all twenty-one screens into six collapsible groups:

| Group | Screens |
|-------|---------|
| **Command Center** | Home (Chat), Daily Brief |
| **Dream & Intelligence** | Dreamer, Intel, Email Inbox |
| **Intelligence** | Research, Product Intelligence, YouTube Intelligence |
| **Production** | Content Studio, Review Queue, Tasks, Documents, Context Brain |
| **AI & Automation** | Job Runner, Curriculum Factory, Council Chamber, Pipelines, Social Media |
| **System** | Settings |

Click a group header to expand/collapse it. The group containing the current page opens automatically.

**Global search:** The search bar at the top of the sidebar searches across tasks, research, opportunities, chat threads, briefs, seeds, intel sessions, and emails simultaneously. Results are color-coded by type. Click any result to navigate directly to that item.

**Tooltips:** Hover over any nav item to see a tooltip card explaining what that screen does.

**Status badges:** Some items show a badge — "beta" (amber) means partially working, "soon" (blue) means planned but not built yet. Most items show "live" (green).

**Dynamic system status:** The right sidebar shows real-time status indicators for external services (Supabase, OpenAI, Anthropic, QStash, Railway worker status).

---

## Your Daily Workflow

Here's how a typical day might look using all of Chapterhouse:

1. **Morning (7 AM):** Daily brief auto-generates. Open Chapterhouse, read it. Your email inbox has auto-synced and categorized overnight. Click on any action_required email to see its auto-generated draft reply. Check your Email Action Banner (Home page) to see top 5 emails needing replies.

2. **Breakfast review:** In Daily Brief, notice the "⚡ Collisions" section — high-impact items that affect 2+ business tracks. Read Intel reports if there are new ones from the 4 AM auto-fetch (daily.dev, tech news, homeschool research).

3. **Sand the ideas:** Open Dreamer. Check Earl's AI suggestions from this week — which seeds should become Active vs. Dismissed?

4. **During the day:** 
   - Use **Chat** (toggle Council Mode on/off) for quick decisions, brainstorming, or research synthesis
   - Use **Research** to save articles, screenshots, notes as you find them (auto-ingests into chat context)
   - Use **Email Inbox** → Draft Reply on any customer/sales inquiry you want to respond to
   - Use **Product Intelligence** on a weekly basis to surface opportunities from accumulated research

5. **Afternoon:** Open **Context Brain**, make any edits to keep your founder memory fresh (copilot-instructions.md, extended_context.md, dreamer session notes).

6. **Content creation:** **Content Studio** for newsletters, curriculum guides, product descriptions. Or **YouTube Intelligence** if building curriculum from videos.

7. **End of day:** Check **Tasks** — anything blocked? Anything done that should move to Shipped? Check **Review Queue** — any pending research or opportunities to decide on? Social media posts auto-generated Monday morning, approve them throughout the week as needed.

---

## The Three Business Tracks (Brief Overview)

Chapterhouse serves three concurrent business tracks. Context Brain keeps all three visible at once:

| Track | What It Does | Key Pages | Deadline |
|-------|-------------|-----------|----------|
| **NCHO** | Shopify curriculum store + curated products | Product Intelligence, Social Media, Email (auto-ingests sales inquiries) | Launch within 1 week |
| **SomersSchool** | Homeschool SaaS course platform | Curriculum Factory, Council Chamber, YouTube Intelligence, Dreamer (feature ideas) | Revenue by August 2026 |
| **BibleSaaS** | Personal AI-powered Bible study app | Dreams, Research, chat (long-term roadmap) | Beta phase |

All three get mentioned in briefs, all three have their own contexts, all three have dedicated seeds/tasks/opportunities. The AI context system keeps them all in mind simultaneously.

---

## Advanced Features

### Collision Scoring in Briefs

Every daily brief item is scored 0–3 on three axes:
- **ncho** — relevance to homeschool store
- **somersschool** — relevance to course platform
- **biblesaas** — relevance to Bible study app

Items scoring ≥2 on 2+ tracks become **"⚡ Collisions"** flagged at the top of the brief. These are cross-track opportunities. Example: "PRH Christian launches DTC curriculum platform" → Direct for NCHO (can position as competitor + partner), high for SomersSchool (validates market), medium for BibleSaaS (different audience).

### Auto-Ingestion Pipeline

**Email:**
- Newsletters (substack, morning brew, daily.dev, etc.) → Research queue
- Sales inquiries + customer emails → Product Intelligence opportunities
- URLs extracted from newsletters → auto-added to Research (with rate limiting to avoid spam)

**Daily Brief + Intel:**
- High-collision items → auto-seed proposals to Dreamer (for your review)
- Competitor announcements → auto-flag in Product Intelligence

**YouTube:**
- Video URL → transcript extraction (fast path or Gemini 2.5 Flash on Railway)
- Transcript → auto-generate 8 types of curriculum materials instantly

**Context Brain:**
- Push API syncs desktop files (dreamer.md, copilot-instructions.md, extended_context.md) to cloud
- Every new chat/brief/Council call pulls fresh context from all 4 slots + email digest

---

## Known Limitations & Workarounds
---

## Known Limitations & Workarounds

| Item | Status | Workaround |
|------|--------|-----------|
| **Document editing** | Documents are read-only in the UI | Edit the source files in the codebase, then use Push API to sync to Context Brain |
| **YouTube transcript extraction** | YouTube blocks cloud IPs. Fast captions/innertube paths fail | System auto-falls back to Gemini 2.5 Flash on Railway (~77 sec per 20-min video) — works 100% of the time |
| **Email sync latency** | Emails sync every 3 hours, categorize batch every 3 hours | For real-time sync, check Gmail/Mailcow directly; Chapterhouse catches up in next batch |
| **Some RSS feeds** | 3 of 9 daily brief feeds blocked by source websites | Brief still generates from working feeds; coverage varies day-to-day |
| **n8n Pipelines** | Requires API key configured | Add N8N_API_KEY and N8N_BASE_URL to Vercel environment |
| **Draft reply regeneration** | Drafts cache for 24 hours, then expire | Click Draft Reply again to regenerate if it's stale |
| **Context size limits** | Chapterhouse injects ~200KB of context into each AI call | Most calls work fine; very large documents may hit token limits on edge cases |
| **Bell icon** | Shows unread count but not a live notification center | Check Home page → Email Action Banner for priority emails needing replies |

---

## Quick Reference

| Question | Answer |
|----------|--------|
| **Who can access this?** | Only scott@nextchapterhomeschool.com and anna@nextchapterhomeschool.com (or personal Gmail accounts) |
| **Where does it live?** | chapterhouse.vercel.app |
| **Is my data private?** | Yes — stored in your private Supabase (PostgreSQL) database in us-west-2. No one else has access. |
| **What AI models are used?** | **Chat:** GPT-5.4 (solo) or Claude Sonnet 4.6 (trio roles). **Council:** Gandalf + Data + Polgara (Claude Sonnet 4.6), Earl (GPT-5.4), Silk (GPT-5-mini). **Brief:** Claude Haiku 4.5 (collision scoring). **Email:** Claude Haiku 4.5 (categorize, draft replies), Claude Sonnet 4.6 (digest). **Social:** Claude Sonnet 4.6. **YouTube:** Gemini 2.5 Flash (transcripts). **Curriculum:** All Council members + Extract (Claude Sonnet 4.6). |
| **Approximate monthly cost?** | ~$15–25 Vercel Pro + ~$50–100 AI API usage (briefs, chat, email, social, YouTube, curriculum) depending on usage volume. |
| **How do I sign out?** | Click the door icon (top right of page header) |
| **How do I teach it something?** | Type `/remember [fact]` in Chat. Or go to Settings → Founder Memory → Add. Or use Context Brain to edit copilot-instructions.md directly. |
| **When do things auto-run?** | Daily brief: 7 AM Alaska time. Email sync/categorize: every 3 hours. Intel fetch: 4 AM Alaska time. Email digest: 12:30 AM (00:30 UTC). Social batch generation: Monday 5 AM Alaska time (12 PM UTC). |
| **How do I push my desktop files to Chapterhouse?** | Use PUSH-ALL.bat or PUSH-DREAMER.bat in your desktop workspace (requires CHAPTERHOUSE_PUSH_KEY env var). Or manually copy/paste into Context Brain. |
| **What if something breaks?** | Check Settings → Environment Status for red/yellow indicators. Most issues are API key misconfiguration. Check Vercel logs at vercel.com/dashboard. |
| **Can I delete my data?** | Yes — but contact support first. Data deletions are not reversible. |
| **Is this open source?** | No — Chapterhouse is closed-source, a private product. The code lives in a private GitHub repo (TheAccidentalTeacher/chapterhouse). |

---

**Email Support:** scott@nextchapterhomeschool.com  
**Deployment:** Vercel Pro (main app), Railway (background workers)  
**Database:** Supabase (Postgres), running in us-west-2  
**Status:** Live and production-ready (March 21, 2026)

*This guide lives in the Documents section of Chapterhouse. Last updated: March 21, 2026 (Session 25).*
