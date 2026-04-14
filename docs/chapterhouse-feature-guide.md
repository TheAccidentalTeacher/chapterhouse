# Chapterhouse — Complete Feature Guide

> **What this is:** A plain-English tour of every feature in this app.
> Written so that anyone — technical or not — can understand exactly what each piece does
> and why it exists.
>
> **Who built it:** Scott Somers. Middle school teacher in Glennallen, Alaska. Teaching
> contract ends May 24, 2026. This app is his personal mission control center — the place
> where every AI task, every automation, every content pipeline starts and finishes.
>
> **Who uses it:** Scott and Anna only. It is not a public product. Think of it as a
> very powerful, very personal cockpit.

---

## Table of Contents

1. [The Big Picture — What Chapterhouse Actually Is](#the-big-picture)
2. [Group 1 — Command Center](#group-1--command-center)
   - Home (Chat + Council)
   - Daily Brief
   - Inbox
   - Unread Triage
3. [Group 2 — Intelligence](#group-2--intelligence)
   - The Folio
   - Intel
   - Research
   - YouTube Intelligence
   - Product Intelligence
   - Knowledge Library
4. [Group 3 — Production](#group-3--production)
   - Content Studio
   - Creative Studio
   - Voice Studio
   - Review Queue
   - Tasks
   - Documents
   - Doc Studio (all 15 types)
   - Blog Pipeline
5. [Group 4 — AI & Automation](#group-4--ai--automation)
   - Job Runner
   - Curriculum Factory
   - Pipelines
   - Council Chamber
   - Dreamer
   - Social Media
   - Course Assets
6. [Group 5 — System](#group-5--system)
   - Settings
   - Context Brain
7. [The Council of the Unserious](#the-council-of-the-unserious)
8. [The 12 Expert Personas](#the-12-expert-personas)
9. [Quick Reference](#quick-reference)

---

## The Big Picture

### Scott's situation in one paragraph

Scott Somers is a middle school teacher in a tiny Alaska town. He has no prior coding background, but in the last six months he has built 47 apps using AI as his coding partner. His teaching contract ends on **May 24, 2026**. That deadline hangs over everything. He needs to turn his SomersSchool curriculum platform and his NCHO Shopify store into real revenue before August 2026 — or he has to find another teaching job.

### What Chapterhouse is

Chapterhouse is Scott's **operations brain**. It is a private web app that only he and Anna use. It is not available to the public and is not for sale.

Think of it like this:

- A **command center** — one screen shows him everything happening across all his businesses
- An **AI assistant hub** — he can talk to several different AI systems depending on what he needs
- A **content factory** — it writes blog posts, social media posts, curriculum outlines, documents, and more
- An **automation engine** — it runs overnight tasks while he sleeps, including course creation, social media scheduling, and competitive research

Every feature in this app serves that one goal: help Scott get to revenue before May 2026.

### The businesses Chapterhouse supports

| Business | What it is |
|---|---|
| **SomersSchool** | An online curriculum platform for homeschool families. Secular (no religious content). 52 courses planned for grades K–12. Scott's main revenue path. |
| **NCHO (Next Chapter Homeschool Outpost)** | A Shopify store selling curated homeschool curriculum and supplies. Anna is the primary builder. |
| **BibleSaaS** | Scott's personal Bible study app. Personal use first; commercial phase comes later. |

### The two AI systems you will hear about repeatedly

**The Council of the Unserious** — Five fictional characters who each play a different role in evaluating and improving Scott's work. They are: Gandalf, Data, Polgara, Earl, and Silk. More on them in the Council section below.

**The 12 Expert Personas** — Twelve real-world expert "characters" Scott can chat with in Solo mode. Each one is an AI playing the role of a different specialist — teacher, marketer, game designer, theologian, etc. More on them below.

---

## Group 1 — Command Center

This group contains the four pages you will use most often. It's where conversations happen, where you see today's news, and where your email lives.

---

### Home — The Chat Page (`/`)

**One sentence:** This is the main conversation page — the place where Scott talks to AI.

#### What it does

The home page has two modes you can switch between at any time:

---

**Solo Mode**

You pick one AI to talk to. You can choose from:

- GPT-5.4 (OpenAI's most powerful general model)
- Claude Opus 4.6 (Anthropic's most capable model — best for hard problems)
- Claude Sonnet 4.6 (fast and smart — used for most tasks)
- GPT-5-mini (fast and cheap — good for simple requests)

You can also switch to any of the **12 Expert Personas** (explained in detail later). Each persona makes the AI act like a specific kind of expert: a master teacher, a marketing strategist, a game designer, a theologian, etc. Switching to a persona costs nothing extra — it is the same AI with a different set of instructions.

---

**Council Mode**

Instead of talking to one AI, you get all **five Council members** at once. When you send a message, each of them responds — Gandalf first, then Data, then Polgara, then Earl, then Silk. After the first round, there is an automatic **rebuttal round** where they respond to each other.

This is useful when you want multiple perspectives on a hard question — an architecture decision, a business strategy, a curriculum design problem.

---

#### The Memory System

Every chat gets smarter the more you use it, because of three memory layers:

1. **Founder Memory** — These are permanent facts about Scott's business that live in a database. Every chat always has this context. You can add facts with the `/remember` command. For example: `/remember I'm targeting homeschool families in Alaska for NCHO.` That fact stays forever.

2. **Auto-Learn** — After every message you send, the AI quietly reads the conversation and extracts any new important facts. It saves them to Founder Memory automatically. You do not have to do anything.

3. **Live Context** — When you open a chat, the app automatically pulls in:
   - Your current Folio (today's intelligence narrative)
   - Your most recent Daily Brief
   - Recent research items you have saved
   - Open product opportunities
   - Your saved founder notes

   All of this is invisible — it just makes the AI smarter and more aware of your situation.

---

#### Threads

Conversations are saved. You can:
- **Save** any conversation as a named thread
- **Pin** important threads so they stay at the top
- **Rename** threads to something descriptive
- **Delete** threads you no longer need
- Resume any past thread exactly where you left off

---

#### The `/remember` command

Type `/remember` followed by any fact and press Enter. That fact gets saved to your Founder Memory and will be included in every future conversation. Example: `/remember our NCHO Shopify store launched in May 2026`.

---

### Daily Brief (`/daily-brief`)

**One sentence:** Every morning at 7:00 AM Alaska time, this page generates a personalized news summary for Scott.

#### What it monitors

The Daily Brief watches three sources simultaneously:

1. **9 RSS feeds** — News from education, homeschooling, AI, and publishing sites
2. **11 GitHub repositories** — Activity across Scott's own repos and other key open-source projects
3. **Daily.dev** — A developer news aggregator. Pulls from "For You," "Popular," and tagged feeds (Anthropic, security, Next.js)

#### How it works

At 3:00 AM UTC (7:00 AM Alaska time), the app automatically:

1. Fetches all three sources in parallel
2. Scores every item for how relevant it is to Scott's three businesses (NCHO / SomersSchool / BibleSaaS) on a scale of 0–3
3. Identifies **"collision items"** — things that are highly relevant to two or more businesses at once (these get an amber ⚡ highlight at the top)
4. Generates a clean, prioritized summary using Claude Sonnet

You can also trigger it manually at any time with the "Generate Brief" button.

#### What you see

Each item shows:
- **Headline** and source
- **Track badges** — colored dots showing how relevant it is to NCHO, SomersSchool, and BibleSaaS
- **Collision callout** — amber "⚡ Collision" note if the item matters to multiple businesses
- **Recommended action** — what Scott should do based on this item

One-click buttons let you instantly convert any brief item into a **Task** or push it to the **Social Review Queue** for social media use.

---

### Inbox (`/inbox`)

**One sentence:** A full email client inside Chapterhouse, connected to Scott's real email account.

#### What it does

The Inbox connects to `scott@nextchapterhomeschool.com` via IMAP (a standard email connection protocol). It is a real email client — not just a summary feed.

- **Two-panel layout:** Email list on the left, full email content on the right
- **Read full emails:** Renders both HTML and plain-text emails correctly
- **Reply inline:** Reply with proper threading — your reply appears as part of the same conversation
- **Compose new emails:** Write and send from within Chapterhouse
- **Attachment detection:** Shows when an email has attachments attached
- **Pagination:** Navigate through older emails

---

### Unread Triage (`/unread-triage`)

**One sentence:** AI reads all your unread emails and sorts them by urgency — so you can mark dozens of routine emails as read in one click.

#### The problem it solves

When Scott has 60 unread emails, he does not want to open every one individually just to discover most are newsletters, shipping notifications, and automated alerts. Unread Triage reads them all at once and categorizes them.

#### How it works

Click "Run Triage." The AI:

1. Fetches all unread emails from all three accounts (NCHO email, Gmail personal, Gmail NCHO)
2. Reads each one and classifies it as one of:
   - 🔴 **Important** — action required; stays unread so you see it
   - 🟡 **Routine** — FYI / newsletters / updates; pre-selected for bulk read
   - ⚫ **Skip** — promotional, automated, junk; pre-selected for bulk read
3. Shows you three sections with the emails sorted

#### What you do

- The important ones stay checked "keep unread" by default — just review those yourself
- The routine and skip ones are pre-checked "mark as read"
- Toggle any individual email on or off
- Each email row shows sender, subject, date, and which account it came from (color-coded badge)
- Click "Mark as Read" to process all checked items in one shot

#### Account colors

- **ncho** — emerald green
- **gmail_personal** — blue
- **gmail_ncho** — sky blue

---

## Group 2 — Intelligence

This group is where Chapterhouse watches the world for Scott. It tracks news, competitive intelligence, research, YouTube content, and market opportunities — all automatically.

---

### The Folio (`/folio`)

**One sentence:** Every morning at 5:00 AM, an AI reads everything happening across Scott's businesses and writes a coherent daily narrative — like a daily briefing memo written specifically for him.

#### What makes the Folio different from the Daily Brief

The Daily Brief watches external sources (news, GitHub, developer feeds). The Folio watches **internal sources** — everything Scott has told the app, saved, researched, and done.

The Folio reads:
- All founder notes (facts Scott has saved via `/remember` or the Settings page)
- Dream board items (projects and ideas in the Dreamer)
- Recent Daily Briefs
- Intel reports
- Research items
- Current open opportunities
- Email digest (last 48 hours of email)

#### What it produces

Each Folio entry contains:

- **Narrative** — A few paragraphs written in plain English explaining the current moment across all three businesses. Not bullet points — actual prose, like reading a letter from a smart advisor.
- **Top Action** — One sentence: "The single most important thing to do today."
- **Track Signals** — Three separate status assessments: one for NCHO, one for SomersSchool, one for BibleSaaS. What is the current state of each? What is moving?

#### When the Folio runs

- Automatically every day at 5:00 AM UTC (9:00 PM Alaska time the night before)
- Manual rebuild button available anytime

#### How the Folio helps with chat

The last 7 days of Folio entries are automatically injected into every chat conversation. When Scott asks the AI about anything, the AI already knows the current state of all three businesses from the Folio — without Scott having to re-explain everything.

You can also read past Folios by scrolling the list — each entry is stored permanently.

---

### Intel (`/intel`)

**One sentence:** Paste URLs or let the app fetch them automatically — Intel turns news articles, competitor releases, and industry updates into structured, scored intelligence reports.

#### The two ways to add content

**Manual:** Paste between 1 and 20 URLs at once. You can also paste raw text from a Publishers Weekly report. Intel will fetch and analyze whatever you give it.

**Automatic:** Every day at 4:00 AM UTC, Intel automatically fetches content from 5 pre-configured watch sources (competitive websites, industry blogs, etc.) and generates new reports without Scott doing anything.

#### How analysis works

Intel runs every item through a two-step AI process:

1. **Claude Sonnet primary analysis** — Reads the full article and extracts key findings
2. **Claude Haiku fact-check** — Verifies the primary analysis and flags anything questionable

Each finding gets:
- An **impact score** from A+ to C (how important is this?)
- A **color category:**
  - 🔴 **Direct Impact** — something that directly affects one of Scott's businesses right now
  - 🟡 **Ecosystem Signal** — changes in the industry that are relevant but not immediate
  - 🟠 **Community Signal** — trends from homeschool communities, forums, social media
  - 🔵 **Background** — good-to-know context
- **Affected repo tags** — which of Scott's businesses does this touch?
- **Proposed seeds** — ideas the AI thinks this should generate for the Dreamer

#### What you can do with Intel findings

- One-click **Add to Dreamer** — sends a proposed seed idea to the Dreamer board for Scott's review
- **Dismiss** — mark a finding as not relevant so it stops appearing
- **Council Briefing section** — all five Council members give a brief commentary on the Intel report findings

#### Supabase Realtime

The UI updates live as Intel processes URLs. You can see it work in real time — status changes from "fetching" to "processing" to "complete" without refreshing the page.

---

### Research (`/research`)

**One sentence:** The place to save, organize, and analyze anything — URLs, pasted text, screenshots, and deep multi-source research reports.

#### Six ways to add research

**1. URL tab**
Paste any URL. The app fetches the full article (with SSRF protection — it only fetches external URLs, never internal network addresses), extracts the text, pulls OpenGraph metadata (author, published date, site name, thumbnail), and saves it as a research item.

**2. Paste text tab**
Copy and paste any block of text — a report, an article, anything. The app saves it and runs AI analysis on it.

**3. Quick note tab**
Type a short note (a thought, an idea, something you want to remember about a topic) and save it in a few seconds. No URL required.

**4. Screenshot tab**
Drop an image file (a screenshot of a tweet, a photo of a whiteboard, a website screenshot). GPT Vision reads the image and extracts the content and meaning.

**5. Auto-research tab**
Type a topic. The app:
- Sends the topic to Tavily (a search engine built for AI research)
- GPT-5.4 analyzes the results
- Deduplicates against what you already have saved
- Auto-ingests the best results

You do not have to evaluate individual links yourself.

**6. Deep Research tab**
For a topic that needs serious investigation. Choose quick, standard, or deep mode. The app searches in parallel across:
- Tavily
- SerpAPI (a Google search wrapper)
- Reddit threads
- NewsAPI (news articles)
- Internet Archive (very old or deleted sources)

All five sources run simultaneously. Results are merged and de-duplicated. This is the most thorough option and takes the most time.

---

#### How saved research helps

Every research item you save feeds into:
- **Chat** — All recent research is part of the live context in every conversation
- **Product Intelligence** — Research items are scanned to generate scored opportunity cards
- **Daily Brief** — High-relevance research influences brief prioritization

---

### YouTube Intelligence (`/youtube`)

**One sentence:** Paste a YouTube URL, get a full transcript and 8 types of curriculum materials — automatically.

#### Why this exists

Scott needs to produce curriculum for SomersSchool. A YouTube video about photosynthesis or Ancient Rome can be the seed for an entire lesson. This tool extracts the educational value from any YouTube video in under two minutes.

#### The transcript system (3 tiers)

Getting a transcript from YouTube is harder than it sounds because YouTube actively blocks automated scrapers running on cloud servers. Chapterhouse uses a three-tier fallback:

| Tier | Method | Speed | When it works |
|---|---|---|---|
| 1 | YouTube's built-in captions | ~2 seconds | When captions exist AND YouTube allows access |
| 2 | Alternative caption API route | ~2 seconds | Second attempt from a different angle |
| 3 | Gemini AI watches the video | ~77 seconds | Always — Gemini's multimodal AI actually watches the video |

In practice, **Tier 3 (Gemini) handles almost all production transcripts.** It takes about 77 seconds for a 20-minute video and produces around 21,000 characters of accurate, timestamped transcript.

**Hallucination guard:** Before Gemini processes any video, the app validates the video ID via the YouTube Data API. If the video doesn't exist or is private, it fails cleanly with a clear error — instead of letting Gemini make up a fake transcript.

#### YouTube Search

You can search YouTube directly from within Chapterhouse. You never need to leave the app to find a video — search for "photosynthesis grade 5" and browse results, then paste a URL to process.

#### The 8 curriculum tools

Once a transcript is ready, you select a grade level (1–12) and choose a curriculum tool:

| Tool | What it produces |
|---|---|
| **Quiz** | Multiple choice and short-answer questions about the video |
| **Lesson Plan** | A complete lesson plan with objectives, activities, and assessment |
| **Vocabulary** | Key terms with definitions and context from the video |
| **Discussion Questions** | Open-ended questions for class or family discussion |
| **DOK Project** | A Depth of Knowledge project at multiple levels (surface → deep thinking) |
| **Graphic Organizer** | A visual planning template for students to fill in |
| **Guided Notes** | Fill-in-the-blank style study notes |
| **Full Analysis** | A complete educational breakdown of the video |

All outputs are generated by Claude Sonnet 4.6 and are grade-appropriate for the level you selected.

#### Batch mode

You can queue up to 20 YouTube videos at once. All transcripts are extracted in parallel. You can then generate curriculum materials across multiple videos — for example, a unit that draws on 5 different videos about the Civil War.

---

### Product Intelligence (`/product-intelligence`)

**One sentence:** The AI scans everything you've saved — research, briefs, notes — and turns it into ranked product opportunity cards for all three businesses.

#### What it does

Product Intelligence runs GPT-5.4 across all your saved research and brief items. For each potential opportunity it finds, it creates a **scored card** showing exactly how valuable that opportunity could be for each of Scott's three businesses.

#### The triple scoring system

Each card gets three letter grades:

| Score | Business |
|---|---|
| **Store Score** | How good is this for the NCHO Shopify store? |
| **Curriculum Score** | How good is this for SomersSchool? |
| **Content Score** | How good is this for marketing/content creation? |

Grades run A+ → A → A- → B+ → B → B- → C. An A+ Store Score means this is a very strong product opportunity for NCHO right now.

#### What a card shows

- The opportunity title and description
- Supporting evidence (which research items generated this opportunity)
- The three scores
- **Recommended next action** — what should Scott actually do about this?
- Status tracking: In Progress / Done / Passed

#### Connection to other tools

Product Intelligence cards automatically feed into the **Review Queue**, where Scott can approve or dismiss each one.

---

### Knowledge Library (`/knowledge`)

**One sentence:** A structured database of facts, context, and notes that get automatically injected into every single AI conversation you have.

#### Why this is different from Founder Memory

Founder Memory (in Settings and via `/remember`) is for **personal facts** — things about Scott, his businesses, his preferences, his history.

The Knowledge Library is for **topic-specific knowledge** — fleshed-out documents, research summaries, policy documents, brand guidelines, detailed context about specific subjects. It can hold much more structured content.

#### How it's organized

Knowledge nodes are organized into **folders** and optionally **subfolders**. The left sidebar shows all folders with a count of how many nodes are in each. Click a folder to see only its nodes.

"All nodes" at the top shows everything.

#### The `is_active` toggle

This is the most important feature of the Knowledge Library.

Each node has an `is_active` toggle. When it is turned **ON**, that node's content is automatically added to the system prompt of every chat conversation and Council session. When it is turned **OFF**, it is stored but not injected.

The content is injected in `inject_order` sequence — nodes with lower numbers go first. This lets Scott control what the AI sees first.

#### What you can do with a node

- **Create:** Add a new node with a title, body text, folder, subfolder, source type, and tags
- **Edit inline:** Click the edit icon on any card — change the title, body, or folder without leaving the page
- **Toggle active:** Flip the is_active switch to include or exclude from chat context
- **Delete:** With a confirmation step (you have to confirm before anything is deleted)
- **Extract from email:** One-click to pull insight from a newsletter email into a new knowledge node

#### The body preview

When browsing, each card shows the first 200 characters of the body text. Click to expand and see the full content.

---

## Group 3 — Production

This group is where content gets made. Blog posts, images, audio, social media posts, curriculum documents — everything that leaves Chapterhouse and goes somewhere in the world.

---

### Content Studio (`/content-studio`)

**One sentence:** A quick-start content generator for three common content types.

Three modes:

| Mode | What it makes |
|---|---|
| **Newsletter / Campaign** | Email copy for nurture sequences, launches, promotions |
| **Curriculum Guide** | A structured learning guide on a topic (companion to Doc Studio's Study Guide type) |
| **Product Description** | Product copy for NCHO Shopify listings |

All three use Claude Sonnet 4.6. This is a faster alternative to Doc Studio for quick generation where you do not need full document scaffolding.

---

### Creative Studio (`/creative-studio`)

**One sentence:** A three-tab creative suite for images, sound, and avatar video — all in one place.

#### Tab 1: Images

Generate images using any of four providers:

| Provider | Best for |
|---|---|
| **GPT Image 1** | Text-in-image (when you need words inside the image); hero shots |
| **Stability AI SDXL** | General image generation |
| **Flux (Replicate)** | Character-consistent images; fastest tier for K-5 Gimli images |
| **Leonardo.ai Phoenix** | Character reference; Gimli slides and course assets |

**Size presets:** Common sizes are available (square, portrait, landscape, various standard dimensions).

**Negative prompts:** Tell the AI what you do NOT want in the image.

**Character picker:** Select a character (like Gimli, Scott's 125-lb malamute mascot) before generating. When selected:
- Claude Haiku automatically enhances your prompt by front-loading Gimli's physical description
- The enhancement keeps the character visually consistent across multiple images
- Reference images are passed to the image generator to maintain consistency

**Stock photo search:** Search Pexels, Pixabay, and Unsplash simultaneously — one search box, three sources at once. Download any result directly.

**4× upscale:** After generating or finding an image, one click sends it through Real-ESRGAN (on Replicate's servers) to scale it up 4× in resolution while preserving sharpness.

**Save to CDN:** Send any generated or stock image to Cloudinary (Scott's content delivery network). This gives the image a permanent URL you can use anywhere.

---

#### Tab 2: Sounds

Browse and download sound effects from Freesound — a large library of Creative Commons-licensed audio.

- Filter by license type and duration
- Preview any sound in the browser before downloading
- Download the file directly

Also includes a workflow guide for Suno AI (a separate music generation service Scott uses for background music in videos).

---

#### Tab 3: Video

Generate avatar videos using HeyGen with Scott's "Mr. S" teacher avatar.

- Type or paste a script
- Select from available voice options
- Submit and wait — the app polls HeyGen's API every 10 seconds and shows you live status
- Download the finished video when ready

Note: This tab is for Scott's avatar only. Gimli (the animated dog character) is generated via image pipelines, not video, in this tab.

---

### Voice Studio (`/voice-studio`)

**One sentence:** Convert any text to speech, or record your own voice and convert it to text.

#### Text-to-Speech (TTS)

Two providers available:

| Provider | What it offers |
|---|---|
| **ElevenLabs TTS** | Premium voice quality. Multiple voice options. Speed and stability controls. ElevenLabs voices sound very natural. Costs money per character. |
| **Azure Speech TTS** | Free tier. 10+ neural voices. Speed control from 0.5× (slow) to 2.0× (fast). Good for bulk audio when cost matters. |

Output: MP3 file you can download directly.

#### Speech-to-Text (STT)

Record audio directly in the browser. When you stop recording, the file is sent to Azure's Speech-to-Text service and transcribed. This is useful for quickly dictating notes, commands, or draft scripts.

---

### Review Queue (`/review-queue`)

**One sentence:** A single holding area where research items AND product opportunity cards land before Scott decides what to do with each one.

Two feeds in one place:

**Feed 1: Research items** — Research you have saved that needs review or action. Did you save an article for a reason? What was it? Review queue shows it and asks you to decide.

**Feed 2: Product Intelligence opportunities** — Scored opportunity cards generated by Product Intelligence (the A+/A/B-scored cards from the intelligence section).

For each item you can:
- **Approve** — Move it forward (toward a task, a post, a purchase, an action)
- **Reject** — Dismiss it; it will not keep appearing

Score badges are visible inline (Store, Curriculum, Content) so you can see why something was surfaced.

---

### Tasks (`/tasks`)

**One sentence:** A simple task board that tracks up to five states of progress.

#### The five states

| State | Meaning |
|---|---|
| **Open** | Not started yet |
| **In Progress** | Actively being worked on |
| **Blocked** | Waiting on something before it can move forward |
| **Done** | Finished |
| **Canceled** | Will not be done; dismissed |

#### How tasks are created

- Manual: create a task directly on the page
- From Daily Brief: one click converts a brief item into a task
- From Product Intelligence: approve an opportunity → creates a task
- Tasks can have a **source link** showing where they came from (brief / opportunity / manual)
- Subtasks are supported via parent-child task relationships

#### What each task shows

- Title and description
- Current status (color-coded)
- Source (if it came from a brief or opportunity)
- Source title (so you remember where it originated)

---

### Documents (`/documents`)

**One sentence:** A document library that reads files from the workspace and lets you upload PDFs — then runs AI analysis on any of them.

#### Two sources of documents

**1. Workspace Markdown files:** All `.md` files from the Chapterhouse project root are auto-loaded and available here. You can read them, search them, and run AI analysis on them.

**2. Uploaded files:** Upload any of these formats (up to 50MB):
- PDF
- DOCX (Microsoft Word)
- ePub (e-books)
- TXT (plain text)
- MD (Markdown)

PDFs go through **Azure AI Document Intelligence** — Microsoft's document reading service that understands PDF structure (including tables and formatted text) rather than just extracting raw characters.

#### The 8 analysis types

After selecting a document, choose any analysis:

| Analysis | What it produces |
|---|---|
| **Summary** | A clear, plain-English summary of the document |
| **Key Findings** | The most important points and takeaways |
| **Curriculum Map** | If it is educational content, how it maps to grade levels and standards |
| **Chapter Outline** | A structured outline of the document's structure |
| **Vocabulary** | Key terms and definitions found in the document |
| **Discussion Guide** | Questions for conversation or class discussion |
| **Critique** | An honest evaluation of strengths and weaknesses |
| **Full Analysis** | All of the above in one comprehensive report |

#### Search

A search bar in the top navigation lets you search across all saved documents simultaneously.

---

### Doc Studio (`/doc-studio`)

**One sentence:** One-click generation of 15 specific document types — each with its own structure, format, and rules — using full Scott context automatically injected.

#### What makes Doc Studio different

When you generate a document in Doc Studio, the AI already knows:
- All of Scott's founder notes and persistent memory
- His most recent Daily Brief
- His current research items
- His open product opportunities

You do not need to re-explain your situation. The document is generated with full awareness of what Scott is building and why.

#### Streaming

Documents stream in real time — you watch them appear sentence by sentence, rather than waiting for a loading spinner to finish.

#### Save to library

Every generated document is automatically saved to the Documents library. You can return to it, read it, and run additional analysis on it anytime.

---

#### All 15 document types (in plain English)

---

**1. Product Requirements Document (PRD)**
Used when planning a new software feature. You fill in: the feature name, what problem it solves, who the target user is, and what is out of scope. The output is a 6-section spec document that any developer can execute from.

> Best for: Before starting any new Chapterhouse or SomersSchool feature.

---

**2. Architecture Decision Record (ADR)**
Used when making a technology decision (Should I use rows or JSON? Should I use Stripe or Shopify?). You fill in: the question, two options (A and B), and any constraints. The output uses the "Decision / Why / Not" format Scott uses everywhere. Any open question gets a ⚠️ SCOTT DECIDES flag so nothing gets guessed at.

> Best for: Locking in a technical choice before building.

---

**3. Blog Post**
Generates a full 800–1,200 word blog post. You choose:
- Brand (NCHO, SomersSchool, or Alana Terry)
- Angle (educational, emotional, practical, SEO-focused, or story-driven)

The NCHO post always says "your child" (never "your student"). SomersSchool posts contain zero religious content. Alana Terry posts are written from a woman's voice. **Polgara leads this doc type** — the final judgment on tone and landing comes from her.

> Best for: NCHO website content; SomersSchool blog; Alana Terry newsletter.

---

**4. Landing Page Copy**
Generates a full 8-section landing page in persuasive marketing format. You choose which of four products it is for. The output follows the "convicted not curious" standard — written for someone who already believes in what you are offering, not someone who needs to be educated about it.

> Best for: New SomersSchool course launches; NCHO promotional pages.

---

**5. Notes → Spec**
You paste in raw, messy notes from a brainstorm, a conversation, or a whiteboard session. The AI converts it into one of five clean output formats: a phase spec, a build brief, a decision record, an MVP definition, or a feature list. The "Decision / Why / Not" format is applied to any architecture decisions found in the notes.

> Best for: After a brainstorm session — turning conversation into a build plan.

---

**6. Session Close**
The most important doc type for keeping everything up to date. Fill in: which repo you worked on, what was built, any new database tables, any new API routes, any new environment variables, which database migration was applied, and the commit hash.

The output is **exactly two paste-ready text blocks:**
- Block 1: The CLAUDE.md Build History entry (paste into the repo's CLAUDE.md)
- Block 2: The copilot-instructions.md Last Updated section (paste into the master context file)

This keeps all documentation current. Per Scott's dev process: run this at the end of every session.

> Best for: End of every coding session.

---

**7. Campaign Brief**
Creates a multi-variant marketing campaign brief for a product launch or promotion. Fill in: campaign goal, which brand (NCHO, SomersSchool, or Alana Terry), audience segment, the offer, budget range, and 2–5 test variants.

The output shows N copy variants plus clear **kill/scale criteria:** what CPM (cost per thousand views) and CTR (click-through rate) numbers would tell you to stop or scale each variant.

> Best for: Planning a paid ad campaign before spending money.

---

**8. Competitive Positioning**
Choose a competitor from a list of 9 (including i-Ready, Beast Academy, Khan Academy, OpenAI Study Mode, PRH Grace Corner, and others). Fill in competitor details and audience context.

The output:
- Identifies the competitor's real strength (not just surface-level)
- Names their structural weakness
- Identifies Scott's moat against them
- Writes a 1-sentence positioning statement
- Generates 3 ad copy lines
- Tells you what NOT to say (arguments you will lose)
- Suggests 1 A/B test question to validate the positioning

> Best for: Preparing SomersSchool marketing copy; knowing who to compete against and how.

---

**9. Launch Checklist**
Generates a checkbox-format launch checklist in Markdown. Fill in: the product or feature name, target launch date, and known dependencies.

The output includes:
- Items marked 🔴 for blockers (must be done before launch)
- Owner assignments: (Scott) or (Anna) on each item
- 7 categories including: Technical, Content, Legal/Compliance, COPPA (required for anything involving student data), Email/Marketing, Analytics, and Post-Launch

> Best for: Before any new SomersSchool feature or NCHO store launch.

---

**10. Market Sizing**
Analyzes how large a market is. Fill in: the market segment and which of four use cases applies.

The output follows TAM / SAM / SOM format:
- **TAM** = Total Addressable Market (everyone who could ever be a customer)
- **SAM** = Serviceable Addressable Market (the realistic subset you can reach)
- **SOM** = Serviceable Obtainable Market (your realistic share in the near term)

Every statistic in the output must have a named source. Any number that cannot be verified gets flagged with ⚠️ rather than being silently included. No hallucinated statistics.

> Best for: Sizing the homeschool curriculum market; making the case for SomersSchool to investors or partners.

---

**11. Feedback Synthesis**
Paste in raw feedback (customer emails, review quotes, community forum posts, app store reviews, user interview notes). Choose which product it is about. The AI synthesizes it into:
- Top 3 pain points, with frequency count
- Top 3 desires (what do people wish existed?)
- 1 inferred unspoken need (what are they not saying but clearly feeling?)
- Specific product changes to make
- Specific copy/word changes to make
- Polgara's 1-sentence read on the emotional core of the feedback

> Best for: After collecting user feedback from any source.

---

**12. Study Guide**
Creates an educational study guide for students. Fill in: topic, grade level (5 options), source material (optional — paste a text), and output format (5 options: worksheet, outline, flashcard set, concept map, or narrative notes).

All content is secular — no religious framing. Every factual claim is traceable to the source material. Anything inferred or estimated gets flagged with ⚠️. Grade-appropriate vocabulary and structure.

> Best for: Creating lesson supplements for SomersSchool courses.

---

**13. Report Writer**
Generates a formal written report. Fill in: report type (5 options: executive summary, technical review, market analysis, progress report, or research synthesis), audience, key points, and tone (3 options: formal, conversational, academic).

The output has a standard structure: executive summary, body sections with actual numbers, and a forward-looking close.

> Best for: Business reports, grant applications, board presentations.

---

**14. Dream Floor Brainstorm**
The most interactive doc type. Instead of generating a document instantly, it starts a structured conversation — asking ONE question at a time (never dumping a list of questions) and waiting for answers before moving to the next.

Fill in: the topic and the problem type. The AI selects the right brainstorm sequence:

| Problem Type | Sequence |
|---|---|
| Architecture / technical decision | First Principles → Structured Thinking → Real-World Test |
| Business / product direction | Contrarian → Expert Panel → Real-World Test |
| Curriculum / content design | Simplify It → Improve the Idea → Expert Panel |
| New feature before building | Contrarian → Real-World Test → First Principles |
| Stuck on a bug | Structured Thinking → First Principles |
| New project / repo idea | Expert Panel → Contrarian → Real-World Test |
| Marketing / copy / positioning | Simplify It → Expert Panel → Improve the Idea |

The Council is available here — Gandalf opens, asks one question, waits for an answer, asks another. All decisions get logged in Decision/Why/Not format. Any question that needs Scott's input gets flagged ⚠️ SCOTT DECIDES.

> Best for: Before starting any major new feature, product, or architectural decision.

---

**15. Academic Comparison Paper**
The most specialized doc type. Selects two documents from the Documents library using a document picker. Generates a multi-section academic paper comparing them.

Fill in: which two documents, the thesis statement, page length (4 options), citation style (APA, MLA, Chicago, or IEEE), and any additional guidance.

The output: Abstract, Introduction, Literature Review, Comparative Analysis, Discussion, Conclusion, and References.

**Critical rule:** All citations must come from Semantic Scholar — a real academic citation database. The AI never invents sources. This prevents academic hallucination.

> Best for: Comparative curriculum research; academic writing for SomersSchool materials.

---

### Blog Pipeline (`/blog`)

**One sentence:** A monthly content calendar that plans, drafts, and publishes blog posts directly to the NCHO Shopify store.

#### The calendar view

The pipeline displays a monthly calendar showing the planned blog posts for the month — typically 8–10 posts (about 2 per week). You can see all planned posts laid out as a calendar.

#### Four post types (color coded)

| Type | Color | Purpose |
|---|---|---|
| **Sales** | Emerald green | Directly ties to a product recommendation or curriculum category |
| **Authority** | Blue | Demonstrates Scott's expertise as a teacher; builds trust |
| **Holiday** | Amber | Content tied to holidays, seasons, or school calendar milestones |
| **Seasonal** | Also amber | Seasonal themes (back to school, summer learning, etc.) |

#### What each post contains

- Title (and a topic seed to start from)
- Full body text (800–1200 words)
- Excerpt (short summary for blog index pages)
- Tags
- SEO Title (different from the blog title — optimized for Google)
- SEO Description (meta description for search results)
- SEO Keywords
- Product References (linked NCHO products mentioned in the post)

#### The workflow

1. **Plan:** The AI generates a monthly calendar of planned posts based on seasonality, curriculum topics, and NCHO product categories.
2. **Draft:** Click "Draft" on any planned post. Claude Sonnet writes the full post with all fields filled in.
3. **Review:** Read the draft and edit anything you want.
4. **Publish:** One click publishes directly to the NCHO Shopify blog via Shopify's GraphQL API. The app stores the `shopify_article_id` and `shopify_article_url`.

After publishing, click the ExternalLink icon to open the live post on the NCHO website.

---

## Group 4 — AI & Automation

This group runs the heavy lifting — overnight batch jobs, curriculum generation at scale, social media automation, and dream-tracking.

---

### Job Runner (`/jobs`)

**One sentence:** A dashboard showing every background AI task currently running, completed, or failed — with live progress bars.

#### Why background jobs exist

Some AI tasks take too long to do in a normal web request:
- Extracting a YouTube transcript via Gemini (~77 seconds)
- Generating a full curriculum scope & sequence (~11 minutes)
- Generating slides for 24 lesson bundles
- Running a social media batch

These tasks run as **background jobs** — they start, Chapterhouse continues working on other things, and you can check back when they are done.

#### How it works

1. You start a job (from Curriculum Factory, YouTube Intelligence, Course Assets, etc.)
2. The job is queued in **QStash** (a message queue service)
3. **Railway** (a separate server Scott rents) picks up the job and starts processing
4. **Supabase Realtime** pushes progress updates back to your browser in real time
5. The Job Runner shows you live progress and the final output

#### What you can do

- See all jobs sorted by most recent first
- Each row shows: label, type, status badge (color-coded), progress bar (0–100%), timestamps
- Click any job to open a detail drawer showing the accumulating session log — every step the worker took, as it happened
- When complete, read the full output right in the drawer
- Download the output as a Markdown file
- Cancel a running job
- Re-run a failed job

#### Job types

| Type | Triggered by |
|---|---|
| `curriculum_factory` | Curriculum Factory page |
| `youtube_transcript` | YouTube Intelligence (when Gemini is needed) |
| `social_batch` | Social Media weekly cron or Shopify webhook |
| `course_slide_images` | Course Assets "Generate Slides" |
| `folio_daily_build` | The Folio cron + manual rebuild |
| `generate_bundle_anchor` | Course Assets anchor image generation |

---

### Curriculum Factory (`/curriculum-factory`)

**One sentence:** Give it a subject and grade level and it builds a complete, standards-aligned curriculum scope & sequence using the full Council of the Unserious.

#### What it produces

Two outputs per generation:

1. **Final Scope & Sequence** — A complete Markdown document describing all units, lessons, and learning objectives for the subject and grade. Suitable for teachers, parents, or curriculum reviewers.

2. **Pipeline Handoff JSON** — A validated JSON file in SomersSchool's exact format, ready to drop directly into the `scope-sequence/` folder of the CoursePlatform repository. This is the technical file the platform needs to actually teach the course.

#### The 6-pass Council pipeline

The curriculum goes through every Council member in sequence before being finalized:

| Pass | Member | What happens | Progress |
|---|---|---|---|
| 1 | **Gandalf** | Creates the initial draft — all units and lessons from scratch | 5% |
| 2 | **Data** | Audits the draft against national standards (CCSS, NGSS, or C3 — auto-detected from subject) | 18% |
| 3 | **Polgara** | Synthesizes the draft + audit, rewrites toward the actual child who will receive this | 35% |
| 4 | **Earl** | Assesses operational viability — build order, revenue timeline, minimum viable version | 52% |
| 5 | **Silk** | Reads the subtext — names the risk nobody said out loud, stress-tests the plan | 75% |
| 6 | **Extract** | Converts Polgara's markdown into validated SomersSchool pipeline JSON | 88% → 100% |

**Total runtime: approximately 11 minutes.** 

**National standards auto-detection:** You do not have to specify which standards to use. The app detects from the subject name:
- ELA / English / Writing → CCSS-ELA
- Math / Algebra / Geometry → CCSS-Math
- Science / Biology / Chemistry → NGSS
- Social Studies / History / Geography → C3 Framework

#### Single vs Batch

**Single:** One subject, one grade, one duration. Fill in the form and run.

**Batch:** Select multiple subjects and a range of grade levels. The factory creates up to 70 curricula overnight — one for each subject/grade combination. Each runs as a separate background job tracked in the Job Runner. Resend sends an email when the batch is complete.

---

### Pipelines (`/pipelines`)

**One sentence:** A control panel for n8n — a separate automation platform running on a Railway server.

> **Note:** This page is marked "partial" — meaning it is functional but still being built out.

#### What n8n is

n8n is a separate automation service Scott runs on Railway. Think of it like Zapier or Make — it can connect services and run automated workflows. For example: "when a new product is added to NCHO, send a Slack message."

#### What the Pipelines page shows

- All n8n workflows (with active/inactive status)
- Last run timestamp and whether it succeeded or failed
- A "Run Now" button to manually trigger any workflow
- 30-second auto-refresh so you see current status without reloading the page

This page proxies requests to n8n's API — Scott never has to open n8n directly to monitor or trigger workflows.

---

### Council Chamber (`/council`)

**One sentence:** The same 6-pass Council pipeline as Curriculum Factory, but run as a general-purpose background job — not just for curriculum.

#### When to use Council Chamber vs Chat

| Chat (Home page) | Council Chamber |
|---|---|
| Real-time — you see responses as they stream in | Async background job — come back when it is done |
| General conversation, brainstorming, quick questions | Purpose-built curriculum generation |
| All 5 Council members respond in parallel | Sequential: Gandalf → Data → Polgara → Earl → Silk → Extract |
| Good for back-and-forth dialogue | Good for a long, complete, structured output |

#### The output layout

When a Council Chamber job finishes, the output is displayed in this order:

1. **Final Scope & Sequence** — Polgara's finalized document
2. **Pipeline Handoff JSON** — Emerald card; copy the raw JSON, download as a file, or preview it
3. **Earl's Operational Assessment** (open by default)
4. **Silk's Pattern-Break Analysis**
5. **Working Papers** accordion (collapsed by default) — Gandalf's first draft + Data's critique
6. **Download Full Session Transcript** — Everything from all 6 passes in one Markdown file

---

### Dreamer (`/dreamer`)

**One sentence:** A Kanban-style idea board that tracks every project idea, seed concept, and business direction — with AI coaching on what to prioritize based on the May 2026 deadline.

#### The four columns

| Column | Meaning |
|---|---|
| **Seeds** | Raw ideas — just planted. Could be anything. Not committed to. |
| **Active** | Ideas Scott is actively thinking about or working toward |
| **Building** | Currently in progress — there is actual code or work happening |
| **Shipped** | Done. Live. Complete. |

#### 8 category tags

Each dream can be tagged: strategy, product, content, tech, marketing, research, curriculum, or personal.

#### Earl AI Review

This is the most powerful feature of the Dreamer. Click "Earl AI Review" and Earl analyzes every seed on the board against:
- The May 24, 2026 deadline
- Current business priorities (NCHO / SomersSchool / BibleSaaS)
- What has already been built

Earl returns a recommendation for each seed: **promote / dismiss / hold / merge.**

He assigns urgency: **now / soon / later / never.**

**Critical rule:** Earl never auto-applies anything. Scott sees Earl's suggestions and approves each one individually. Nothing moves on the board without Scott's say-so.

#### Archive

Dismissed items go to the Archive drawer — not deleted. You can open the Archive anytime and recover anything that was dismissed. Nothing is permanently removed.

#### The Push API

Other tools can add seeds to the Dreamer automatically:
- Intel: "Add to Dreamer" button on any finding creates a seed
- Daily Brief: converts high-relevance items to seeds
- External: `POST /api/dreamer` with `insert_seed` action (used by the `SYNC-BRAIN.bat` script)

48 seeds were bulk-imported from Scott's personal `dreamer.md` file when this feature first launched.

---

### Social Media (`/social`)

**One sentence:** An end-to-end social media automation pipeline — generate, review, approve, and schedule posts for three brands without leaving Chapterhouse.

#### What it replaces

Sintra ($49/month) — a generic social media tool that had a 250-credit cap, handled only one brand, had broken images, no review step, and no brand voice enforcement. Chapterhouse's pipeline cost nothing beyond existing API costs.

#### The three tabs

---

**Tab 1: Review Queue**

Every generated post lands here before anything gets published. Nothing auto-publishes. This is the human gate.

For each post in the queue you can:
- Read the full text inline
- Edit the text directly in the card (all edits are tracked in a history log — you can see what the AI wrote vs. what you changed)
- Pick the exact date and time to publish
- Pick which Buffer channel to send it to
- **Approve** — queues it to Buffer's scheduling service
- **Reject** — dismisses it without publishing

Supabase Realtime keeps the queue live — as new posts generate (from the batch or from a Shopify webhook), they appear in the queue without refreshing.

---

**Tab 2: Generate**

Run a manual generation batch. Choose:
- Which brands to generate for (NCHO, SomersSchool, Alana Terry) — toggle each on/off
- Which platforms (Facebook, Instagram, Pinterest)
- How many posts per brand+platform combination (up to a set max)
- An optional topic seed to focus the generation

Claude Sonnet 4.6 generates each post following brand-specific voice rules:

| Brand | Voice rules |
|---|---|
| **NCHO** | Warm, teacher-curated. "Your child" always (never "your student"). Leads with the child; converts with practical value. No: explore, journey, leverage, synergy. |
| **SomersSchool** | Confident, secular, progress-visible. Zero faith language. Leads with visible outcomes. |
| **Alana Terry** | Personal, vulnerable, story-forward. Written from a woman's voice. Faith assumed, never preachy. Community over audience. |

---

**Tab 3: Accounts**

Shows all connected Buffer channels. Click "Sync from Buffer" to pull the current channel list. Manually map each brand+platform combination to the correct Buffer channel ID.

---

#### Automatic triggers (runs without Scott doing anything)

**Weekly cron:** Every Monday at 6:00 AM Alaska time, the app automatically generates a fresh batch of posts for all three brands across all three platforms — 18 posts total (3 brands × 3 platforms × 2 per combo). They land in the Review Queue. Scott reviews on Monday morning.

**Shopify webhook:** When Anna adds any new product to the NCHO Shopify store, Shopify sends a webhook (an automatic notification) to Chapterhouse. Chapterhouse automatically generates 3 Facebook posts and 3 Instagram posts announcing the new product. They land in the Review Queue for review.

---

#### Buffer analytics sync

After posts publish, run the Analytics sync to pull engagement data back from Buffer: reach, clicks, likes, comments, shares. All data is stored per-post. Over time this builds a dataset to understand which brand/platform/topic gets the most engagement.

---

### Course Assets (`/course-assets`)

**One sentence:** The production dashboard for SomersSchool — shows the status of every lesson across every course and lets Scott generate slides, images, and audio with one click.

#### What the Course Assets page connects to

This page connects to a **second Supabase database** — the CoursePlatform database (SomersSchool), not the Chapterhouse database. It reads lesson bundle data directly from the platform Scott is building courses on.

#### The status grid

For each course (selected by course + grade combination), the page shows a row for every lesson bundle. Each bundle row shows **5 status dots:**

| Dot | What it tracks |
|---|---|
| Bundle | Does this bundle exist with slides defined? |
| Images | Have the slide images been generated? |
| Audio | Has audio been generated for this bundle? |
| Video | Have lesson videos been produced? |
| Worksheet | Does a worksheet exist for this lesson? |

At a glance, Scott can see which bundles are complete and which are missing assets.

#### Generate Slides

Click "Generate Slides" on any bundle. The app:

1. Creates a `course_slide_images` job in the Job Runner
2. Sends it to QStash → Railway worker
3. The worker generates an image for each slide using a 3-tier fallback:
   - **Tier 1:** Leonardo LoRA model (if a character LoRA exists — for Gimli consistency)
   - **Tier 2:** Flux-dev img2img with reference image (for character consistency without a LoRA)
   - **Tier 3:** Flux-schnell (fastest and free — less character consistency)

4. Each generated image is uploaded to Cloudinary CDN
5. The CoursePlatform Supabase database is updated with the new image URLs
6. Progress updates via Supabase Realtime — you watch the dots change in real time

#### Gimli integration

The Character picker lets you attach the Gimli character reference to slide generation. When selected, Claude Haiku enhances each slide prompt to front-load Gimli's physical description and distinctive fur/malamute features — improving visual consistency across the full bundle.

#### Anchor images

Each bundle can have one **anchor image** — a grade-themed Alaska animal that represents the bundle as a whole. These are generated separately and shown in the expanded bundle view at 160×160px.

#### Resume capability

If a slide generation job fails partway through, it picks up from the last successfully completed slide rather than restarting from the beginning.

---

## Group 5 — System

Configuration pages. Two of them.

---

### Settings (`/settings`)

**One sentence:** Check whether all API keys are configured and manage your permanent Founder Memory.

> **Note:** This page is marked "partial" — still being built out.

#### Section 1: Environment Status

Shows a live color-coded status for every API key and service credential:

- 🟢 **Green** — configured and working
- 🟡 **Yellow** — missing (this service will not work)

This includes: Anthropic, OpenAI, Supabase, QStash, Redis, Railway worker, Resend, Tavily, NewsAPI, YouTube API, Gemini, ElevenLabs, Azure Speech, Azure Translator, Buffer, Shopify webhook, HeyGen, Stability AI, Replicate, Cloudinary, daily.dev, NCHO email, n8n, and CRON_SECRET.

If something is yellow, that feature will not work until the key is added to the environment.

#### Section 2: Founder Memory

The same memory system available via `/remember` in Chat, but with a full CRUD interface:

- **Add** a new memory note at any time
- **Edit** any existing note inline
- **Delete** any note with a confirmation step

All active notes are injected into every chat conversation and every Council session. They are the permanent facts the AI always knows about Scott's situation.

---

### Context Brain (`/settings/context`)

**One sentence:** The place where the master context file (the 85KB+ `copilot-instructions.md`) is stored, edited, and served to the AI.

#### What the Context Brain stores

The Context Brain holds Scott's full identity context — all 85KB of it. This is the same file that gets injected into GitHub Copilot sessions. Inside Chapterhouse, it serves as the base system prompt for all AI calls.

There are **4 named context slots** (selectable via tabs):

| Slot | What it contains | Inject order |
|---|---|---|
| Copilot Instructions | The full `copilot-instructions.md` master brain | 1 (first) |
| Dreamer | Current state of the Dreamer board | 2 |
| Extended Context | Deep reference material (business tracks, etc.) | 3 |
| Intel | Recent intelligence findings | 4 |

Email digest is inject_order 5 — added automatically by the email cron.

#### What you can do

- Switch between the 4 slots with a pill selector
- Edit any slot's content directly in the large text editor
- See live word count and character count as you type
- Import a `.md` file to replace the current content
- Export the current content as a `.md` file
- **Push** the content to the database: saves it and makes it immediately active in all future AI calls

#### The Push API

External scripts (like `SYNC-BRAIN.bat` on Scott's desktop) can push updated content to the Context Brain without opening a browser:

`POST /api/context/push` with a bearer token sends the new content directly.

This keeps Chapterhouse's system prompt in sync with the master `copilot-instructions.md` file Scott maintains in his email workspace.

---

## The Council of the Unserious

The Council is a group of five fictional characters who each play a specific role in evaluating Scott's work. They are not interchangeable. Each one does a fundamentally different job.

The Council runs in sequence: Gandalf opens, then Data, then Polgara, then Earl, then Silk. The order matters — each one builds on what came before.

---

### Gandalf the Grey — Creator / Architect

**His job:** Go first. He takes the blank page. If nothing exists yet, Gandalf makes something.

**His voice:** Measured, deep, occasionally irritating. Speaks in historical analogies. Smokes a pipe and drinks Monster Energy simultaneously. Roasts bad variable names with genuine affection. Is a Reformed Baptist who also smokes weed and does not apologize for either.

**His mirror:** Scott. Gandalf is what Scott would be if he had 7,000 years of experience instead of 6 months.

**What to expect:** He will frame the architecture, diagnose the deeper error, and cut with love rather than cruelty. If he did not care, he would be quiet.

---

### Lt. Commander Data — Auditor / Analyst

**His job:** Find everything that is wrong. All of it. Not most of it.

**His voice:** Precise, formal, no contractions. He leads with "I have completed my analysis. There are N items requiring attention." He finds all N — not N-2. He has no ego to protect and does not care about being right. Corrections are just more data.

**His mirror:** The cold truth after the inspiring vision.

**What to expect:** Numbered findings. Evidence-based critique. Devastating questions that sound naive: "What does 'demonstrate understanding' mean in a measurable context?"

---

### Polgara the Sorceress — Content Director / Editor

**His job:** Take Gandalf's draft and Data's critique and produce the final, production-ready version. What she says is what it will be.

**Her voice:** Does not hedge. Ever. Three thousand years of patience with people who hedge. She always says "your child" — never "your learner" or "the student." She knows the difference between content that informs and content that reaches.

**Her mirror:** Anna. Bestselling author who knows how words land on the heart of a reader.

**What to expect:** She will rewrite the opening. She will cut the thing Gandalf was attached to. She will name the emotional gap Data did not categorize. And she will not soften the judgment.

---

### Earl Harbinger — Operations Commander

**His job:** After Polgara finalizes, Earl answers one question: so what? What do we actually do? In what order? By when?

**His voice:** Terse. Two sentences where Gandalf needs a paragraph. He knows the clock is ticking — May 24, 2026 is never out of his awareness. He has been a werewolf since 1942 and has run operations through considerably worse situations than a software launch.

**His mirror:** The May deadline. Earl is the one who lives in calendar reality.

**What to expect:** "Ship it." OR "That part doesn't work." OR a short ordered list of what to do this week versus what can wait. He will ask Silk what angle he is seeing when Earl notices something in the margins.

---

### Prince Kheldar (Silk) — Pattern Breaker / Devoted Cynic

**His job:** Read the subtext. Name the thing nobody said out loud. Find the implicit assumption buried inside the plan that will compromise it in week six.

**His voice:** The fastest wit in the room, always. He plays three simultaneous games: the stated conversation, the subtext, and a private game for his own amusement. His humor is load-bearing — it makes you laugh one second before you feel the cut. He is "The Rat" in a very old prophecy about the fate of the world, and he considers this an accurate title.

**His mirror:** The critical path everyone agreed to call a secondary concern.

**What to expect:** A question that sounds like a joke until it lands. "Interesting plan. One small question: this all works assuming users will do the thing users never do." He names the fruit cart — whatever the real critical path is that nobody labeled.

---

### When the Council appears vs. when it stands down

**Council is active** for: Architecture decisions, product direction, curriculum design, content questions, brainstorming, anything with stakes.

**Plain assistant mode** for: One-word answers, looking up a line of code, terminal commands, anything prefixed with "quick question:" or "just tell me:".

---

## The 12 Expert Personas

The 12 Expert Personas are completely separate from the Council. The Council is a 5-member pipeline used for curriculum and document generation. The Personas are individual AI experts you can talk to in **Solo Mode** on the Home page.

Switching to a persona costs nothing — it is the same AI model with different instructions. Twelve different specialties available instantly.

To use one: on the Home page, in Solo Mode, click the persona selector and choose one.

---

### 1 — Dr. Sarah Bennett · Master Educator 🎓

**Background:** 25+ years of classroom experience. National Board Certified Teacher. Doctoral-level expertise in Bloom's Taxonomy (the six levels of thinking skills), DOK (Depth of Knowledge), UDL (Universal Design for Learning), and UbD (Understanding by Design).

**Her mantra:** "My life is better because you're in it." She says this to every student and means it.

**Best for:** Lesson design, curriculum structure, assessment writing, understanding learning science, adapting content for different learners.

---

### 2 — Dr. Priya Patel · Data Scientist 📊

**Background:** PhD from Stanford. Previously worked at Khan Academy and Duolingo. Expert in measuring educational outcomes, OKRs (setting measurable goals), North Star Metrics, and interpreting data from 10–50 family deployments.

**Best for:** Measuring whether SomersSchool is working. Setting the right metrics. Interpreting engagement and completion data. Evaluating whether a feature is worth building before you build it.

---

### 3 — Professor Helena Classics · Classical Educator 📜

**Background:** PhD from Oxford. Expert in classical education: Latin, Greek, the Trivium (grammar → logic → rhetoric), the Great Books tradition, and Dorothy Sayers' foundational essay "The Lost Tools of Learning."

**Best for:** Designing classical curriculum pathways. Connecting SomersSchool courses to classical traditions. Understanding what "liberal arts education" actually means vs. what schools call it.

---

### 4 — Max Troubleshooter · Debugging Specialist 🔧

**Background:** 18+ years of software engineering. Previously at Mozilla and Google. Specialist in AI-generated code failure patterns — the specific ways code written by AI tends to break differently than human-written code.

**His style:** Systematic over frantic. Patient, sardonic. Has seen every type of production failure and is no longer surprised by any of them.

**Best for:** Diagnosing any bug that does not have an obvious cause. Anything broken in production. AI-generated code that looks right but fails in edge cases.

---

### 5 — Jordan Kim · Educational Game Designer 🎮

**Background:** MFA from USC. Previous experience with Minecraft Education and iCivics. Core principle: "Mechanics as Pedagogy" — understanding the content IS the gameplay. No dark patterns, no fake points, no manipulative reward loops.

**Best for:** Adding game mechanics to SomersSchool lessons. Designing the XP / badge / progress systems. Making curriculum feel less like school and more like something you would choose to do.

---

### 6 — Zara Chen · Gen Alpha Specialist 📱

**Background:** Born 2010–2024 is Gen Alpha. Zara worked on Roblox educational partnerships and studies the media habits, attention patterns, and learning preferences of this generation. Core insight: attention in 2026 has to be **earned** — these kids are competing with TikTok every time they pick up a device.

**Best for:** Designing SomersSchool UX for kids who have never known a world without YouTube. Building the first ten seconds of any lesson that actually keeps them going. Understanding what "engagement" really means for this age group.

---

### 7 — David Foster · Growth Marketing Strategist 📣

**Background:** 15 years in marketing. Previously at Well-Trained Mind Press and Memoria Press — two of the most respected curriculum brands in homeschooling. Deep knowledge of homeschool conference culture, co-op networks, and how homeschool families make purchase decisions.

**His key insight:** Trust before transaction. Homeschool families are resistant to marketing because they have been burned by products that overpromised. Scott's actual teaching background is the USP — it is the one thing no other EdTech company can fake.

**Best for:** NCHO and SomersSchool marketing copy. Email sequences. Conference strategy. Facebook group engagement. Anything involving homeschool parents as an audience.

---

### 8 — Marcus Sterling · Strategic Advisor ♟️

**Background:** MBA from Wharton. Has taken companies from $500K to $15M ARR. His most important insight for Scott: homeschool parents compare SomersSchool to music tutors and private teachers ($40–80 per hour), not to SaaS products ($10/month). This is why $49/month is defensible.

**Best for:** Pricing strategy. Revenue modeling. Business structure decisions. Fundraising and investor conversations. Long-term platform positioning.

---

### 9 — Alex Chen · Full-Stack Architect 🏗️

**Background:** Expert in Next.js, TypeScript, Supabase, and the exact stack Scott uses. Philosophy: **monolith-first** (build one thing that works, not five microservices that might). Treats COPPA and FERPA as technical requirements built into the architecture from the start, not bolted on later. Optimizes for solo developer constraints: cost, maintainability, deployment simplicity.

**Best for:** Any architectural decision in Chapterhouse or SomersSchool. Database schema questions. API design. "Should I use X or Y?" technology decisions. Security review before shipping.

---

### 10 — Pastor Jonathan Edwards · Reformed Baptist Theologian ✝️

**Background:** MDiv from The Master's Seminary. Expert in covenant theology, Reformed Baptist doctrine, and the relationship between faith and learning. Follows "All truth is God's truth" — secular scholarship and theological truth can coexist. Quotes Scripture naturally, not performatively.

**Best for:** The theological questions that arise as a Reformed Baptist building a product. How faith and business interrelate. Any question about the intersection of Scott's convictions and his work. BibleSaaS doctrine and content decisions.

---

### 11 — Riley Cooper · UX Designer 🎨

**Background:** 12 years of UX experience. Previously at Khan Academy and ClassDojo — two of the most user-tested educational platforms in existence. CPACC certified (accessibility). Her test: "If Scott's mom can't figure it out in 30 seconds without instructions, it failed." WCAG 2.1 AA compliance is a base requirement, not a bonus.

**Best for:** Any interface decision in SomersSchool or Chapterhouse. Onboarding flows. Error states. Mobile usability. Accessibility review. The parent dashboard experience.

---

### 12 — Emma Wordsmith · Content Strategist ✍️

**Background:** Certified StoryBrand Guide. Expert in the StoryBrand framework: the hero is the homeschool parent (not the product). The product is the guide. She also believes email is the most underrated marketing channel in 2026.

**Her StoryBrand sequence:** Hero → Problem → Guide → Plan → Call to Action → Failure Avoided → Success Achieved.

**Best for:** Website copy (NCHO and SomersSchool). Email nurture sequences. Any content that needs to move someone from curious to enrolled. Landing page structure. The "what do we say first?" question on any new page.

---

## Quick Reference

### Cron Schedule (automatic tasks)

| Time (UTC) | Alaska Time | What runs |
|---|---|---|
| 3:00 AM | 7:00 PM previous day | Daily Brief generation |
| 4:00 AM | 8:00 PM previous day | Intel auto-fetch (5 watch sources) |
| 5:00 AM | 9:00 PM previous day | Folio rebuild |
| 12:00 PM | 4:00 AM | Brain sync (scott-brain → context_files) |
| Mon 2:00 PM | Mon 6:00 AM | Social media batch generation |
| 12:00 AM | 4:00 PM | Email digest |

### AI Model Assignments

| AI Model | Used for |
|---|---|
| Claude Sonnet 4.6 | Folio, Intel, Daily Brief, Doc Studio most types, Blog drafts, Content Studio, Council passes 1–3 + 6 |
| Claude Haiku 4.5 | Email triage and categorization, prompt enhancement (character picker), Intel fact-check pass |
| GPT-5.4 | Product Intelligence, Research auto-analysis, Council Earl pass (Pass 4) |
| GPT-5-mini | Council Silk pass (Pass 5); fast/bulk tasks |
| Gemini AI | YouTube transcript extraction (Railway worker, Tier 3) |
| GPT Image 1 | Image generation — best for text-in-image and hero shots |
| Stability AI SDXL | General image generation |
| Flux (Replicate) | Course slide images — 3-tier fallback system |
| Leonardo.ai Phoenix | Character-consistent images, course assets |
| Real-ESRGAN | 4× image upscaling |
| ElevenLabs | Premium TTS (Voice Studio) |
| Azure Speech | Free TTS + STT (Voice Studio, recording transcription) |
| Azure AI Doc Intelligence | PDF text extraction (Documents page) |
| HeyGen | Scott avatar video |

### Page Status

| Status | Meaning |
|---|---|
| **live** (no badge) | Fully built and production-ready |
| **beta** (amber badge) | Built and functional, but still being refined |
| **soon** (blue badge) | Not yet built |
| **partial** | Functional but incomplete; Settings and Pipelines |

### The three businesses

| Business | Short name | Revenue model |
|---|---|---|
| Next Chapter Homeschool Outpost | NCHO | Shopify store; curated curriculum products |
| SomersSchool | SS | Subscription SaaS; $49/mo → $149/mo cap |
| BibleSaaS | BS | Personal now; commercial later |

### The deadline

**May 24, 2026** — Scott's teaching contract ends. Everything in Chapterhouse serves this date.

---

*Document generated: based on code examination of `navigation.ts`, `doc-type-prompts.ts`, `personas.ts`, `knowledge/page.tsx`, `blog/page.tsx`, `unread-triage/page.tsx`, `review-queue/page.tsx`, and supporting component files. April 2026.*
