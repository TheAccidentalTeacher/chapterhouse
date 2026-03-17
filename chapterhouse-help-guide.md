# Chapterhouse — Help Guide

> Plain-English guide to everything the app does, how to use it, and what to expect.

---

## What Is Chapterhouse?

Chapterhouse is your private operating system — a website only you and Anna can access. It lives at **chapterhouse.vercel.app** and runs 24/7. Think of it as a single dashboard where you read the morning news, talk to AI, save research, generate content, track tasks, and make decisions — all in one place, all tailored to Next Chapter.

Nobody else can see it. It's locked to your two email addresses.

---

## All Screens

Chapterhouse has seventeen screens organized in five sidebar groups. Here's what each one does.

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
- **Council mode** — your question goes to the Council of the Unserious (Gandalf, Lt. Commander Data, Polgara, Earl Harbinger, and Beavis & Butthead). Each responds in character, with colored avatar bubbles. After the initial round, a **rebuttal round** follows where members respond to each other.

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

### Intelligence

### 3. Research

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

### 4. Product Intelligence

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

### 5. YouTube Intelligence

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

### 6. Content Studio

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

### 7. Review Queue

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

### 8. Tasks

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

### 9. Documents

**What it is:** A library of all the brand documents, strategy guides, and reference files in the system.

**How to use it:**
- Scroll or use the **search bar** to find a document
- Click any card to expand and read the full content
- Documents are read-only here — they're the source-of-truth files that live in the codebase

**What's in here:** Your persona, biography, brand personality guide, Shopify strategy, operating system doc, product specs, and more — including this help guide.

---

### System

### 10. Settings

**What it is:** System configuration and your "founder memory" manager.

**Two sections:**

**Founder Memory** — Facts the AI should always know about you. Add facts like "We don't do discount pricing" or "Anna handles all curriculum reviews." These get injected into every chat conversation automatically. You can also add them via `/remember` in chat.

**Environment Status** — Shows green/yellow dots for each required service connection (API keys, database, etc.). If something is yellow, that service isn't configured.

---

### AI & Automation

### 11. Job Runner

**What it is:** A dashboard for background AI jobs that run while you sleep. Jobs are queued, processed by a Railway worker, and report progress in real time.

**How to use it:**
- Click **Create Job** to queue a new background AI task
- Watch progress bars update live as jobs run (powered by Supabase Realtime — no page refresh needed)
- Each job shows: label, type badge, status badge (queued/running/completed/failed), and a progress bar
- Click any job to see full details, output, or error messages
- Cancel running jobs if needed

**Behind the scenes:** Jobs are published to QStash (Upstash), which delivers them to a Railway worker service. The worker processes the AI task, writes progress updates to Supabase, and the UI picks up changes in real time.

---

### 12. Curriculum Factory

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
  5. **Beavis & Butthead** stress-test engagement — COOL/SUCKS/MEH per unit
- View the final output as rendered Markdown, download as HTML/PDF/DOCX, or copy to clipboard

**National standards auto-alignment:** Standards are auto-detected from the subject field. ELA → CCSS-ELA, Math → CCSS-M, Science → NGSS, Social Studies → C3 Framework. No manual input needed.

**Batch mode:** Generate up to 70 curricula overnight (10 subjects × 7 grade levels). Jobs are staggered to avoid API rate limits.

---

### 13. Council Chamber

**What it is:** A purpose-built 5-agent system for generating curriculum scope & sequences as a background job. Uses the full Council of the Unserious (Gandalf → Data → Polgara → Earl → Beavis & Butthead) as a longer, more thorough process.

**How to use it:**
- Select subject, grade, and duration
- Submit to start the job — it runs in the background
- Check the Job Runner page for progress
- Results appear when complete

**How it differs from Council Mode in Chat:** Council Mode in Chat is real-time, general-purpose, and handles any topic. Council Chamber is purpose-built for curriculum generation and runs as a background job.

---

### 14. Pipelines

**What it is:** A control panel for n8n automation workflows running on Railway.

**How to use it:**
- View all your n8n workflows with their current status (active/inactive)
- See the last run timestamp and result (success/failed/running)
- Click **Run now** to manually trigger any workflow
- Auto-refreshes every 30 seconds

**Requires:** n8n API key configured in environment variables. Without it, shows a setup message.

---

### 15. Social Media

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

### 16. Help

**What it is:** This page! A plain-English guide to every feature in Chapterhouse.

---

### 17. Login

**What it is:** The authentication gate. Locked to two email addresses only.

---

## The Sidebar

The sidebar on the left organizes all 17 screens into five collapsible groups:

| Group | Screens |
|-------|---------|
| **Command Center** | Home (Chat), Daily Brief |
| **Intelligence** | Research, Product Intelligence, YouTube Intelligence |
| **Production** | Content Studio, Review Queue, Tasks, Documents |
| **AI & Automation** | Job Runner, Curriculum Factory, Pipelines, Council Chamber, Social Media |
| **System** | Settings |

Click a group header to expand/collapse it. The group containing the current page opens automatically.

**Global search:** The search bar at the top of the sidebar searches across tasks, research, opportunities, chat threads, and briefs simultaneously. Results are color-coded by type. Click any result to navigate directly to that item.

**Tooltips:** Hover over any nav item to see a tooltip card explaining what that screen does.

**Status badges:** Some items show a badge — "beta" (amber) means partially working, "soon" (blue) means planned but not built yet.

**Right sidebar:** Shows a dynamic system status rail with colored dots for every screen (green = live, amber = beta, blue = planned).

---

## Your Daily Workflow

Here's how a typical day might look:

1. **Morning:** Open Chapterhouse. Your daily brief is already generated (7 AM auto-run). Read through it. Convert anything important to a task or send it to review.

2. **During the day:** Use **Chat** for quick questions, brainstorming, or research. Use **Research** to save interesting articles, screenshots, or notes as you find them.

3. **Weekly:** Run **Product Intelligence** to surface new opportunities from everything you've collected. Review and act on them.

4. **When creating content:** Open **Content Studio** to draft newsletters, curriculum guides, or product descriptions.

5. **Staying organized:** Check **Review Queue** to clear pending items. Check **Tasks** to track what needs doing.

---

## Known Limitations

| Item | Status |
|------|--------|
| **Bell icon** (top right) | Links to Review Queue — not a notification system yet. |
| **Some RSS feeds** | About 3 of 9 feeds work reliably. The others are blocked by the source websites. The brief still generates — it just has fewer sources some days. |
| **Document editing** | Documents are read-only. To edit them, you'd edit the files directly in the codebase. |
| **n8n Pipelines** | Requires n8n API key configured. Without it, the page shows a setup message. |

---

## Quick Reference

| Question | Answer |
|----------|--------|
| **Who can access this?** | Only scott@somers.com and anna@somers.com |
| **Where does it live?** | chapterhouse.vercel.app |
| **Is my data private?** | Yes — stored in your private Supabase database. No one else has access. |
| **What AI models are used?** | GPT-5.4 (chat, research, opportunities), Claude Sonnet 4.6 (daily brief, content studio, curriculum factory, social media, YouTube curriculum tools). Council Mode uses both: Gandalf + Data + Polgara on Claude, Earl on GPT-5.4, Beavis & Butthead on GPT-5-mini. YouTube transcripts use Gemini 2.5 Flash on Railway. |
| **Does it cost money to run?** | Vercel Pro hosting + AI API usage. No per-user fees. |
| **How do I sign out?** | Click the door icon in the top right corner |
| **How do I teach it something?** | Type `/remember [fact]` in chat, or add facts in Settings → Founder Memory |
| **When does the daily brief run?** | 7:00 AM Alaska time, every day, automatically |

---

*This guide lives in the Documents section of Chapterhouse. Last updated: March 16, 2026.*
