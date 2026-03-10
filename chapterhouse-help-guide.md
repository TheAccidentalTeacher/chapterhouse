# Chapterhouse — Help Guide

> Plain-English guide to everything the app does, how to use it, and what to expect.

---

## What Is Chapterhouse?

Chapterhouse is your private operating system — a website only you and Anna can access. It lives at **chapterhouse.vercel.app** and runs 24/7. Think of it as a single dashboard where you read the morning news, talk to AI, save research, generate content, track tasks, and make decisions — all in one place, all tailored to Next Chapter.

Nobody else can see it. It's locked to your two email addresses.

---

## The Nine Screens

Chapterhouse has nine screens, all accessible from the sidebar on the left. Here's what each one does.

---

### 1. Home (Chat)

**What it is:** A chat window — like texting an assistant who knows your brand, your research, your daily brief, and your goals.

**How to use it:**
- Type a question or request in the box at the bottom and press Enter
- Pick which AI brain to use from the dropdown (GPT-5.4 is the default; Claude is also available)
- Start new conversations with the **+** button
- Pin important conversations so they stay at the top
- Rename or delete old conversations

**Special trick:** Type `/remember [any fact]` and the system will memorize it permanently. Example: `/remember We decided to launch the first curriculum guide by September`. That fact then gets included in every future chat automatically.

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

**Automatic mode:** A brief generates itself every morning at 7:00 AM Alaska time via a scheduled job. You don't have to click anything — just open the page and read.

**Where the data comes from:** 9 RSS news feeds (education, homeschool, edtech) + 11 GitHub repos you follow. The AI reads all of it and writes the summary.

---

### 3. Research

**What it is:** Your brain's intake system. Anything interesting you find — an article, a screenshot, a quick thought — goes here and gets analyzed by AI.

**Four ways to add something:**

| Tab | What to do |
|-----|-----------|
| **URL** | Paste a web address. The AI fetches and reads the page, then writes a summary and verdict. |
| **Paste text** | Copy-paste any text (email, article excerpt, Slack message). AI analyzes it. |
| **Quick note** | Jot down a thought or observation. AI adds context. |
| **Screenshot** | Drag and drop an image (competitor site, social post, ad). AI vision reads and analyzes it. |

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

### 5. Content Studio

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

### 6. Review Queue

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

### 7. Tasks

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

### 8. Documents

**What it is:** A library of all the brand documents, strategy guides, and reference files in the system.

**How to use it:**
- Scroll or use the **search bar** to find a document
- Click any card to expand and read the full content
- Documents are read-only here — they're the source-of-truth files that live in the codebase

**What's in here:** Your persona, biography, brand personality guide, Shopify strategy, operating system doc, product specs, and more — including this help guide.

---

### 9. Settings

**What it is:** System configuration and your "founder memory" manager.

**Two sections:**

**Founder Memory** — Facts the AI should always know about you. Add facts like "We don't do discount pricing" or "Anna handles all curriculum reviews." These get injected into every chat conversation automatically. You can also add them via `/remember` in chat.

**Environment Status** — Shows green/yellow dots for each required service connection (API keys, database, etc.). If something is yellow, that service isn't configured.

---

## Your Daily Workflow

Here's how a typical day might look:

1. **Morning:** Open Chapterhouse. Your daily brief is already generated (7 AM auto-run). Read through it. Convert anything important to a task or send it to review.

2. **During the day:** Use **Chat** for quick questions, brainstorming, or research. Use **Research** to save interesting articles, screenshots, or notes as you find them.

3. **Weekly:** Run **Product Intelligence** to surface new opportunities from everything you've collected. Review and act on them.

4. **When creating content:** Open **Content Studio** to draft newsletters, curriculum guides, or product descriptions.

5. **Staying organized:** Check **Review Queue** to clear pending items. Check **Tasks** to track what needs doing.

---

## What Doesn't Work Yet

Being honest about the edges:

| Item | Status |
|------|--------|
| **Top search bar** | Decorative only — you can't type in it. It's a visual placeholder for a future feature. |
| **Bell icon** (top right) | Does nothing yet. Future: notifications. |
| **Settings gear** (top right) | Does nothing yet. Use the Settings page in the sidebar instead. |
| **Right sidebar "Build Status"** | Always shows green dots. It's a static display, not a live health check. |
| **Some RSS feeds** | About 3 of 9 feeds work reliably. The others are blocked by the source websites. The brief still generates — it just has fewer sources some days. |
| **Document editing** | Documents are read-only. To edit them, you'd edit the files directly in the codebase. |

---

## Quick Reference

| Question | Answer |
|----------|--------|
| **Who can access this?** | Only scott@somers.com and anna@somers.com |
| **Where does it live?** | chapterhouse.vercel.app |
| **Is my data private?** | Yes — stored in your private Supabase database. No one else has access. |
| **What AI models are used?** | GPT-5.4 (chat, research, opportunities), Claude Sonnet 4.6 (daily brief, content studio) |
| **Does it cost money to run?** | Vercel Pro hosting + AI API usage. No per-user fees. |
| **How do I sign out?** | Click the door icon in the top right corner |
| **How do I teach it something?** | Type `/remember [fact]` in chat, or add facts in Settings → Founder Memory |
| **When does the daily brief run?** | 7:00 AM Alaska time, every day, automatically |

---

*This guide lives in the Documents section of Chapterhouse. Last updated: June 2025.*
