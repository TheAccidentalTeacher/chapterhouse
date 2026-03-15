# Chapterhouse Upgrade Plan — Hypomnemata Migration & Capability Expansion
### The Complete Guide to Consolidating Hypomnemata into Chapterhouse
*Version 1.0 — March 14, 2026*

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Source & Destination Inventory](#2-source--destination-inventory)
3. [What's Coming Over — Full Inventory](#3-whats-coming-over--full-inventory)
4. [What's Already in Chapterhouse](#4-whats-already-in-chapterhouse)
5. [What's Being Killed](#5-whats-being-killed)
6. [Phase M1: YouTube Video Intelligence](#6-phase-m1-youtube-video-intelligence)
7. [Phase M2: Deep Research Engine Upgrade](#7-phase-m2-deep-research-engine-upgrade)
8. [Phase M3: Document Processing](#8-phase-m3-document-processing)
9. [Phase M4: Image Generation Studio](#9-phase-m4-image-generation-studio)
10. [Phase M5: Voice Engine (TTS + STT)](#10-phase-m5-voice-engine-tts--stt)
11. [Phase M6: 12 Personas System](#11-phase-m6-12-personas-system)
12. [Phase M7: Music + Sound](#12-phase-m7-music--sound)
13. [Phase M8: Translation](#13-phase-m8-translation)
14. [Phase M9: Video Generation](#14-phase-m9-video-generation)
15. [Environment Variables Master List](#15-environment-variables-master-list)
16. [Sidebar Navigation — Post-Migration](#16-sidebar-navigation--post-migration)
17. [Database Schema Changes](#17-database-schema-changes)
18. [Dependency Additions](#18-dependency-additions)
19. [Multi-User Architecture (Future)](#19-multi-user-architecture-future)
20. [Build Order & Priority Matrix](#20-build-order--priority-matrix)
21. [Post-Migration: Hypomnemata Retirement](#21-post-migration-hypomnemata-retirement)
22. [Decision Log](#22-decision-log)

---

## 1. Executive Summary

**What:** Migrate all valuable capabilities from Hypomnemata (agentsvercel / Ai-Agent repo) into Chapterhouse. Hypomnemata is a 193-file vanilla JS application deployed on Netlify with 38 serverless functions. Chapterhouse is a modern Next.js 16.1.6 App Router application deployed on Vercel with Supabase, Railway workers, and structured navigation.

**Why:** Maintaining two separate applications is overhead. Chapterhouse already has superior architecture (TypeScript, structured routing, Supabase auth, Realtime subscriptions, proper state management). Hypomnemata has valuable features Chapterhouse lacks — particularly YouTube Intelligence, deep research, document processing, image generation, TTS/STT, and 12 expert personas. Consolidating everything into one application makes Chapterhouse the single operational cockpit.

**Who uses it:** Scott Somers (primary), Anna Somers (editorial partner), eventually Timothy/Tic (family member). Chapterhouse is private — not a product. It's the operations brain.

**Timeline:** 9 phases (M1–M9), priority-ordered. M1 (YouTube Intelligence) is ready to build immediately. No hard deadlines — build as sessions allow, but M1–M3 are the highest-value targets.

**Outcome:** After migration, Chapterhouse becomes a single unified application with:
- AI chat with Council of the Unserious + 12 switchable expert personas
- YouTube video intelligence and curriculum generation from any video
- Multi-source deep research (Tavily + SerpAPI + Reddit + Internet Archive + NewsAPI)
- Document processing (PDF, ePub, DOCX — up to 500K characters with university-level AI analysis)
- Multi-provider image generation (GPT Image 1 + Stability AI + Replicate + Leonardo.ai)
- Text-to-speech (ElevenLabs premium + Azure Speech bulk) and speech-to-text (Azure Speech)
- Music generation workflow (Suno manual + Freesound API for ambient/effects)
- Translation (Azure Translator — 2M chars/month free)
- Video generation (HeyGen Scott avatar — destination TBD)

---

## 2. Source & Destination Inventory

### Source: Hypomnemata (Ai-Agent)

| Attribute | Detail |
|---|---|
| **Repo** | `github.com/TheAccidentalTeacher/Ai-Agent` |
| **Local path** | `C:\Users\Valued Customer\Dropbox\Websites\AI Agents\Ai-Agent` |
| **Stack** | Vanilla JavaScript, no framework, no TypeScript |
| **Hosting** | Netlify (serverless functions) |
| **Architecture** | 193 files flat at root level, 38 `.cjs` serverless functions in `netlify/functions/` |
| **Auth** | Supabase auth (shared instance) |
| **Storage** | localStorage for UI state, Supabase for persistent data |
| **AI providers** | 6 providers: Anthropic, OpenAI, xAI (Grok), Google Gemini, Mistral, Cohere |
| **Multi-agent** | LangGraph.js — panel, consensus, and debate modes |
| **Status** | 🟡 Warm — last active before Chapterhouse took over |

### Destination: Chapterhouse

| Attribute | Detail |
|---|---|
| **Repo** | `github.com/TheAccidentalTeacher/chapterhouse` |
| **Local path** | `C:\Users\Valued Customer\OneDrive\Desktop\WEBSITES\Brand guide` |
| **Stack** | Next.js 16.1.6 App Router, React 19, TypeScript, Tailwind 4 |
| **Hosting** | Vercel Pro + Railway (workers) |
| **Architecture** | Structured `src/app/` routes, `src/components/`, `src/lib/`, `src/hooks/`, API routes under `src/app/api/` |
| **Auth** | Supabase (email/password, `ALLOWED_EMAILS` env-gated) |
| **Storage** | Supabase (PostgreSQL + Realtime), Cloudinary (media CDN) |
| **AI providers** | 2 primary: Anthropic (Claude Sonnet 4.6 / Haiku 4.5) + OpenAI (GPT-5.4 / GPT-5-mini) |
| **Multi-agent** | Council of the Unserious — 5-pass pipeline (Gandalf → Data → Polgara → Earl → Beavis & Butthead) |
| **Status** | 🔴 Active — primary workspace, all new development happens here |

---

## 3. What's Coming Over — Full Inventory

### 3.1 YouTube Intelligence (18 source functions → 3–4 new API routes + 1 new page)

**Source functions from Hypomnemata:**

| # | Function | What It Does | API Used |
|---|---|---|---|
| 1 | `youtube-transcript.cjs` | Fetches YouTube captions/subtitles | `youtube-transcript-plus` npm |
| 2 | `youtube-search.cjs` | Searches YouTube for videos | YouTube Data API v3 |
| 3 | `youtube-gemini-transcript.cjs` | AI-generated transcript fallback (Gemini "watches" the video) | Google Gemini 2.0 Flash |
| 4 | `youtube-whisper-transcript.cjs` | Audio extraction → Whisper STT fallback | OpenAI Whisper + `@distube/ytdl-core` |
| 5 | `video-analyze.cjs` | Multi-persona analysis of transcript | Anthropic Claude |
| 6 | `video-quiz.cjs` | Generate quiz from video transcript | Anthropic Claude |
| 7 | `video-lesson-plan.cjs` | Generate lesson plan from video | Anthropic Claude |
| 8 | `video-vocabulary.cjs` | Extract 15–20 key terms with grade-appropriate definitions | Anthropic Claude |
| 9 | `video-discussion.cjs` | Generate discussion questions | Anthropic Claude |
| 10 | `video-dok-project.cjs` | DOK 3–4 extended projects | Anthropic Claude |
| 11 | `video-graphic-organizer.cjs` | Generate graphic organizers | Anthropic Claude |
| 12 | `video-guided-notes.cjs` | Cornell Notes, outlines, fill-in-blank, timestamp refs | Anthropic Claude |
| 13 | `video-batch-quiz.cjs` | Quiz covering multiple videos | Anthropic Claude |
| 14 | `video-batch-summary.cjs` | Synthesize multiple videos into master doc | Anthropic Claude |
| 15 | `video-batch-study-guide.cjs` | Complete curriculum: summary + quiz + vocab + timeline | Anthropic Claude |
| 16 | `video-batch-vocabulary.cjs` | Merged vocabulary from multiple videos | Anthropic Claude |
| 17 | `video-combined-quiz.cjs` | Combined quiz across multiple videos | Anthropic Claude |
| 18 | `video-master-vocabulary.cjs` | Master vocab list from multiple videos | Anthropic Claude |

**Client-side UI files:**
- `video-ui.js` — YouTube video analysis UI
- `video-batch-ui.js` — Multi-video batch operations UI
- `video-content-tools.js` — Video content generation tools
- `video-analyzer.js` — Client-side video analysis orchestration
- `video-history-manager.js` + `video-history-ui.js` — Video history tracking
- `video-collections-manager.js` — Video collection grouping

### 3.2 Deep Research (2 source functions → upgrade existing + 1 new route)

| # | Function | What It Does | APIs Used |
|---|---|---|---|
| 1 | `research.cjs` | Multi-source parallel search + content extraction | SerpAPI + Tavily + Azure Bing via `SearchOrchestrator` |
| 2 | `deep-research.cjs` | Hours-long multi-agent research with 12-persona analysis | Same + all 12 personas via `ResearchAnalyzer` |

**Research infrastructure modules:**
- `research/search-orchestrator.cjs` — `SearchOrchestrator` class: parallel search across SerpAPI, Tavily, Bing, Semantic Scholar, CrossRef. URL deduplication, relevance scoring, query decomposition.
- `research/content-extractor.cjs` — `ContentExtractor` class: Cheerio HTML parsing + Mozilla Readability article extraction. 10s timeout. Returns title, text, excerpt, word count, author, date.
- `research/content-chunker.cjs` — `ContentChunker` class: smart text splitting for LLM context windows. 4000 token max chunks, 200 token overlap, paragraph-boundary-respecting.
- `research/research-analyzer.cjs` — `ResearchAnalyzer` class: multi-persona analysis via Claude. All 12 personas analyze content from their expertise lens.

### 3.3 Document Processing (3 source functions → 2 new routes + upload UI)

| # | Function | What It Does | APIs/Libraries |
|---|---|---|---|
| 1 | `document-upload.cjs` | File upload to Supabase Storage | Supabase Storage + `parse-multipart-data` |
| 2 | `document-process.cjs` | Extract text from PDF/DOCX/TXT/EPUB | `pdf-parse` + `mammoth` (DOCX) + `xlsx` |
| 3 | `extract-documents.cjs` | Advanced extraction with OCR fallback | Same + Tesseract OCR (20-page limit, triggers at <10 words/page) |

**Client-side UI:**
- `document-upload.js` — `initDocumentUpload()`: drag & drop + file picker, PDF/DOCX/TXT/EPUB support, 10MB limit, document list with preview, delete/manage.

### 3.4 Image Generation (2 source functions → 2 new routes + 1 new page)

| # | Function | What It Does | APIs/Libraries |
|---|---|---|---|
| 1 | `creative-image.cjs` | Image generation from text prompt | Replicate (Flux 2 Pro, SDXL, DreamShaper) + OpenAI (DALL-E 3 / GPT Image 1) |
| 2 | `creative-upscale.cjs` | Image upscaling (4×) | Real-ESRGAN via Replicate + optional GFPGAN face restoration |

**Client-side UI:**
- `creative-studio-ui.js` — `CreativeStudioUI` class: full-screen modal (98vw × 98vh) with tabbed interface. Image tab has model selector, width/height, steps, guidance, style. Generation history with Supabase persistence.

**Additional providers to add (not in Hypomnemata):**
- Stability AI (key: `sk-vmUj...`)
- Leonardo.ai (key: `259760c1-...`, Phoenix character reference for Gimli)
- Stock image search: Pexels + Pixabay + Unsplash

### 3.5 Voice Engine (1 source function → 2 new routes + UI controls)

| # | Function | What It Does | APIs |
|---|---|---|---|
| 1 | `creative-audio.cjs` | Text-to-speech with 4 engine options | Google Cloud TTS + ElevenLabs + OpenAI TTS + Coqui TTS (free) |

**Upgrade in migration:**
- **Add STT** — Speech-to-text via Azure Speech (not in Hypomnemata). New capability.
- **Use Azure Speech for TTS volume layer** — 500K chars/month free. ElevenLabs for premium voice only.
- **Drop Coqui TTS** — Azure Speech free tier replaces it.
- **Drop Google Cloud TTS** — Azure Speech covers same capability, already in Scott's stack.

### 3.6 12 Expert Personas (14 source files → TypeScript constants)

| # | Persona File | Name | Specialty |
|---|---|---|---|
| 1 | `analyst.md` | **Dr. Priya Patel** | Data Scientist & EdTech Analytics. PhD Stanford. Khan Academy/Duolingo alum. OKRs, AARRR Pirate Metrics, North Star Metrics. |
| 2 | `classical-educator.md` | **Professor Helena Classics** | Classical Education Scholar. PhD Oxford. 20+ years. Trivium, Dorothy Sayers, Great Books, Latin/Greek. |
| 3 | `debugger.md` | **Max Troubleshooter** | Senior Problem-Solver & Debugging Specialist. 18+ years. Mozilla/Google alum. Scientific method for code. |
| 4 | `game-designer.md` | **Jordan Kim** | Educational Game Designer. MFA USC. Minecraft Education/iCivics alum. Anti-exploitative design ethics. "Mechanics as pedagogy." |
| 5 | `gen-alpha-expert.md` | **Zara Chen** | Youth Culture Consultant. Elder Gen Z (b. 1997). 5 years at Roblox educational partnerships. TikTok/Discord cultural fluency. |
| 6 | `marketing-strategist.md` | **David Foster** | Growth Marketing for EdTech & Homeschool. 15+ years. Well-Trained Mind/Memoria Press alum. Seth Godin, StoryBrand. |
| 7 | `master-teacher.md` | **Dr. Sarah Bennett** | Master Educator. 25+ years. National Board Certified. Bloom's, Webb's DOK, UDL, UbD. "My life is better because you're in it." |
| 8 | `strategist.md` | **Marcus Sterling** | Strategic Business Advisor. MBA Wharton. 15+ years. Blue Ocean, JTBD, Lean Startup, Crossing the Chasm. |
| 9 | `technical-architect.md` | **Alex Chen** | Senior Full-Stack Developer. 12+ years. Self-taught → lead architect. Monolith-first. "Ship it, then improve it." |
| 10 | `theologian.md` | **Pastor Jonathan Edwards** | Reformed Baptist Theologian. Master's Seminary MDiv. 1689 LBCF. Spurgeon + MacArthur. |
| 11 | `ux-designer.md` | **Riley Cooper** | UX Designer for EdTech. 12+ years. Khan Academy/ClassDojo alum. CPACC certified. Nielsen heuristics, UDL. |
| 12 | `writer.md` | **Emma Wordsmith** | Content Strategist & Storytelling. 15+ years. Certified StoryBrand Guide. Donald Miller framework. |
| 13 | `default.md` | **Default Assistant** | General conversational AI. Matches user tone. |
| 14 | `fellowship.md` | **The Fellowship** | Multi-character LOTR ensemble. *Retired — replaced by Council of the Unserious.* |

**Companion files:** Each persona has a `*-research.md` file containing research notes and source material backing their expertise (e.g., `analyst-research.md`, `master-teacher-research.md`). These should be ingested as context when that persona is active.

### 3.7 Music Generation (1 source function → 1 new route)

| # | Function | What It Does | APIs |
|---|---|---|---|
| 1 | `creative-music.cjs` | Music generation from text prompt | Google Lyria 2 (via Replicate) + MiniMax Music |

**Additional capability:**
- Suno AI — no API, manual workflow only. Generate at suno.com (Pro plan) → download MP3 → upload to Cloudinary → embed.
- Freesound API — 600K+ CC0/CC-BY sound effects. Search by tag/description. Perfect for ambient audio.

### 3.8 Memory System (5 source functions — partial migration)

| # | Function | What It Does | Status |
|---|---|---|---|
| 1 | `memory-save.cjs` | Save content with auto-embeddings + tagging | **Partially replaced** by Chapterhouse `founder_notes` + auto-learning |
| 2 | `memory-search.cjs` | Hybrid semantic + full-text search | **Replaced** by Chapterhouse global cross-table search |
| 3 | `memory-graph.cjs` | Knowledge graph visualization (D3) | **Bring forward** — valuable visualization, no Chapterhouse equivalent |
| 4 | `memory-analytics.cjs` | Memory analytics dashboard | **Consider** — useful for understanding knowledge base |
| 5 | `memory-auto-connect.cjs` | Auto-detect relationships between memories | **Consider** — semantic similarity + tag overlap scoring |

**Decision:** Memory graph visualization (D3-compatible knowledge graph) is worth bringing forward as a future enhancement. The auto-learning and `founder_notes` system already handle the core memory use case. Analytics and auto-connect are nice-to-haves.

### 3.9 Multi-Agent Orchestration (3 source functions — architectural reference)

| # | Function | What It Does | Status |
|---|---|---|---|
| 1 | `chat.cjs` | Main chat handler | **Replaced** by Chapterhouse `/api/chat/` |
| 2 | `multi-agent.cjs` | LangGraph.js panel/consensus/debate | **Replaced** by Council of the Unserious SSE streaming |
| 3 | `conversation.cjs` | Extended multi-round conversation | **Replaced** by Chapterhouse thread persistence + auto-save |

**Note:** Hypomnemata uses LangGraph.js (LangChain) for multi-agent orchestration. Chapterhouse uses direct API calls with SSE streaming. The Chapterhouse approach is simpler, faster, and doesn't require the LangChain dependency tree. No migration needed — Chapterhouse's implementation is superior.

---

## 4. What's Already in Chapterhouse (No Migration Needed)

| Capability | Chapterhouse Implementation | Hypomnemata Equivalent |
|---|---|---|
| AI chat (Claude + OpenAI) | `/api/chat/` — Solo mode, model selector | `chat.cjs` — same but vanilla JS |
| Multi-agent AI | Council of the Unserious SSE streaming with rebuttal round | `multi-agent.cjs` — LangGraph panel/consensus/debate |
| Research ingestion | `/api/research/` — URL, paste, screenshot, quick note | `research.cjs` — similar but fewer modes |
| Agentic research | `/api/research/auto/` — Tavily → GPT-5.4 → auto-ingest | Not in Hypomnemata |
| URL content extraction | Inline in chat — article/main extraction, 12K chars, SSRF protection | `content-extractor.cjs` — Cheerio + Readability |
| Auto-learning | Claude extracts facts from last 6 messages → `founder_notes` | `auto-memory.js` + `memory-save.cjs` |
| Thread persistence | Debounced 1.5s auto-save to `chat_threads` | `chat-history-manager.js` — localStorage |
| Background jobs | QStash → Railway workers, Supabase Realtime progress | Not in Hypomnemata |
| Curriculum factory | 5-pass Council pipeline with national standards alignment | Not in Hypomnemata |
| Daily brief | Cron → RSS + GitHub → Claude summary → Resend email | Not in Hypomnemata |
| Global search | Cross-table `ilike` search (tasks, research, opportunities, threads, briefs) | Not in Hypomnemata |
| Content studio | 3-mode AI writer (newsletter, curriculum guide, product description) | Not in Hypomnemata |
| n8n control panel | Proxy routes to Railway-hosted n8n | Not in Hypomnemata |
| Product intelligence | GPT-5.4 opportunity scoring (A+ to C) | Not in Hypomnemata |
| Task management | Full CRUD with status machine | `task-scheduler.cjs` — autonomous task execution |

---

## 5. What's Being Killed

| Hypomnemata Feature | Reason for Kill |
|---|---|
| **Netlify serverless architecture** | Replaced by Next.js API routes on Vercel. Better DX, same capability, TypeScript. |
| **localStorage persistence** | Replaced by Supabase. Real database, real auth, real durability. |
| **Flat 193-file root structure** | Replaced by structured `src/app/` layout with proper concerns separation. |
| **LangGraph.js multi-agent** | Replaced by Council of the Unserious SSE streaming. Simpler, no LangChain dep tree. |
| **Conversation mode system** (panel/consensus/debate) | Replaced by Solo/Council toggle. Council mode with rebuttal round covers the same ground. |
| **Game designer functions** | Separate product entirely. Not relevant to Chapterhouse's mission. |
| **Fellowship persona** (`fellowship.md`) | Retired. Replaced by Council of the Unserious with better-defined roles. |
| **Coqui TTS** | Replaced by Azure Speech free tier (500K chars/month). Better quality, more voices. |
| **Google Cloud TTS** | Replaced by Azure Speech. Already in Scott's stack, one fewer vendor. |
| **xAI (Grok) provider** | No confirmed use case. Claude + GPT-5.4 cover all needs. Drop unless Scott requests. |
| **Mistral provider** | Parked. No confirmed use case per api-guide-master.md decision. |
| **Cohere provider** | Parked. Three vector solutions already active. |
| **Autonomous agent framework** (`autonomous-agents.js`, `task-scheduler.cjs`) | Replaced by QStash → Railway job runner. More reliable, better monitoring. |
| **Favorites system** (`favorites-manager.js`, `favorites-ui.js`) | Low value. Replaced by research save/tag system. |
| **AI settings UI** (`ai-settings-ui.js`) | Replaced by Chapterhouse Settings page with provider configuration. |

---

## 6. Phase M1: YouTube Video Intelligence

### Priority: 🔴 HIGHEST — Build First

### Why This Is the Crown Jewel

YouTube Intelligence is Hypomnemata's most unique and powerful feature. It transforms any YouTube video into structured curriculum materials — quizzes, lesson plans, vocabulary lists, discussion questions, graphic organizers, guided notes, and DOK projects. No other tool in Scott's stack does this. Chapterhouse has zero YouTube capability today.

**The use case:** Scott finds a 20-minute YouTube video on the Roman Republic. He pastes the URL. In 60 seconds, he has a transcript, a lesson plan, a quiz, a vocabulary list, and a set of discussion questions — all grade-appropriate, all aligned to standards. That's an entire day's lesson created from one URL.

### API Keys Required

| Service | Key | Env Var |
|---|---|---|
| YouTube Data API v3 | `AIzaSyDsCLOAeMylBh_uj7bfTKVf61dBLShzl1Y` | `YOUTUBE_API_KEY` |
| Google Gemini 2.0 Flash | `AIzaSyBmoTwsRQRbxhWCJFJi0kHuJMn5PJa5fko` | `GEMINI_API_KEY` |
| Anthropic Claude | Already in Chapterhouse | `ANTHROPIC_API_KEY` |
| OpenAI (GPT-5.4 + Whisper) | Already in Chapterhouse | `OPENAI_API_KEY` |

### npm Packages to Install

```bash
npm install youtube-transcript  # Primary transcript fetcher
# Note: Hypomnemata uses youtube-transcript-plus — evaluate both
# Also: @distube/ytdl-core for audio extraction (Whisper fallback)
# Also: youtubei.js for YouTube innertube API access
```

### New API Routes

#### `POST /api/youtube/transcript`
**File:** `src/app/api/youtube/transcript/route.ts`

**Purpose:** Given a YouTube URL or video ID, fetch the transcript using a 3-tier fallback strategy.

**Fallback chain:**
1. **Primary:** `youtube-transcript` npm — fetches official captions/subtitles. Fastest, most reliable when captions exist.
2. **Fallback 1:** Google Gemini 2.0 Flash — sends video URL to Gemini v1beta API with instruction to extract full transcript. Works on videos without captions. Free tier: 1M tokens/day.
3. **Fallback 2:** OpenAI Whisper — downloads audio via `@distube/ytdl-core`, sends to Whisper STT API. Most expensive, most reliable. Works on anything with audio.

**Input schema (Zod):**
```typescript
const transcriptSchema = z.object({
  videoUrl: z.string().url(),            // Full YouTube URL
  language: z.string().default('en'),    // Caption language preference
  fallbackToAI: z.boolean().default(true), // Allow Gemini/Whisper fallback
})
```

**Output:**
```typescript
{
  videoId: string,
  title: string,
  channelName: string,
  duration: string,
  transcript: string,              // Full text
  segments: { start: number, text: string }[], // Timestamped segments
  source: 'captions' | 'gemini' | 'whisper',  // Which method succeeded
  metadata: {
    viewCount: number,
    publishedAt: string,
    thumbnailUrl: string,
    description: string,
  }
}
```

**Video metadata:** Fetched via YouTube Data API v3 (`/youtube/v3/videos?part=snippet,contentDetails,statistics`).

**Security:** Validate that the URL is a legitimate YouTube URL before processing. No SSRF — only `youtube.com` and `youtu.be` domains accepted.

---

#### `POST /api/youtube/analyze`
**File:** `src/app/api/youtube/analyze/route.ts`

**Purpose:** Given a transcript, generate curriculum materials. Supports 8 output types.

**Input schema (Zod):**
```typescript
const analyzeSchema = z.object({
  videoId: z.string(),
  videoTitle: z.string(),
  transcript: z.string(),
  outputType: z.enum([
    'quiz',              // Multiple choice + short answer
    'lesson-plan',       // Full lesson plan with objectives, activities, assessment
    'vocabulary',        // 15-20 key terms with definitions, word forms, flashcard format
    'discussion',        // Discussion questions (Bloom's taxonomy progression)
    'dok-project',       // DOK 3-4 extended projects
    'graphic-organizer', // Cause/effect, timeline, Venn diagram, concept map
    'guided-notes',      // Cornell notes, outlines, fill-in-blank, timestamp refs
    'full-analysis',     // Multi-persona analysis (all 12 personas if imported)
  ]),
  options: z.object({
    gradeLevel: z.number().min(1).max(12).optional(),
    dokLevel: z.number().min(1).max(4).optional(), // For DOK projects
    organizerType: z.enum(['timeline', 'cause-effect', 'venn', 'concept-map', 'kwl']).optional(),
    duration: z.string().optional(), // For lesson plans: "45 minutes", "90 minutes"
  }).optional(),
})
```

**AI model selection:**
- Quiz, vocabulary, guided notes → **Claude Haiku 4.5** (fast, cheap, structured output)
- Lesson plan, discussion, DOK project → **Claude Sonnet 4.6** (needs reasoning depth)
- Full analysis (multi-persona) → **Claude Sonnet 4.6** (run once per persona)
- Graphic organizer → **Claude Sonnet 4.6** (needs layout understanding)

**Output:** Markdown string with appropriate formatting for each type. Quizzes include answer keys. Vocabulary includes pronunciation guides. Lesson plans include timing breakdowns.

---

#### `POST /api/youtube/batch`
**File:** `src/app/api/youtube/batch/route.ts`

**Purpose:** Process multiple YouTube videos at once. Generate cross-video materials (combined quiz, master vocabulary, unit study guide, weekly summary).

**Input schema (Zod):**
```typescript
const batchSchema = z.object({
  videos: z.array(z.object({
    videoId: z.string(),
    videoTitle: z.string(),
    transcript: z.string(),
  })).min(2).max(20),
  outputType: z.enum([
    'combined-quiz',       // Quiz spanning all videos
    'master-vocabulary',   // Merged + deduplicated vocabulary
    'unit-study-guide',    // Comprehensive unit guide
    'weekly-summary',      // Weekly synthesis
    'batch-summary',       // Master synthesis document
  ]),
  options: z.object({
    gradeLevel: z.number().min(1).max(12).optional(),
    unitTitle: z.string().optional(),
  }).optional(),
})
```

**Note on batch size:** With Claude's 1M token context window, up to 20 video transcripts can fit in a single prompt window without chunking. Average YouTube transcript is ~5,000–15,000 words (7K–20K tokens). 20 videos × 20K tokens = 400K tokens — well within limits.

---

#### `GET /api/youtube/search`
**File:** `src/app/api/youtube/search/route.ts`

**Purpose:** Search YouTube for videos by query. Returns video metadata for the results.

**Input:** `?q=roman+republic&maxResults=10`

**Output:** Array of `{ videoId, title, channelName, thumbnailUrl, duration, viewCount, publishedAt }`.

**API:** YouTube Data API v3 — `GET /youtube/v3/search?part=snippet&type=video&q=${query}&maxResults=${max}&key=${YOUTUBE_API_KEY}`

---

### New UI Page: `/youtube`

**File:** `src/app/youtube/page.tsx`

**Sidebar location:** Intelligence group (between Research and Product Intelligence)

**Layout — 3 sections:**

1. **Input Section (top)**
   - URL input field with "Fetch Transcript" button
   - YouTube search bar with results dropdown (click to load)
   - Video metadata card once loaded (thumbnail, title, channel, duration, view count)

2. **Transcript Viewer (middle)**
   - Full transcript with timestamps (clickable timestamps open YouTube at that point)
   - Source badge: "Captions" / "Gemini AI" / "Whisper STT"
   - Word count and estimated read time
   - "Save to Research" button → saves video + transcript to `research_items` with `source_type: 'youtube'`

3. **Curriculum Tools (bottom)**
   - 8 tool cards in a grid (one per output type)
   - Each card: icon, label, brief description, grade level selector, "Generate" button
   - Generated output appears in an expandable panel below the card
   - "Copy to Clipboard" and "Save to Research" on each output
   - "Download as Markdown" button

**Batch mode:**
   - "Add to Batch" button next to each loaded video
   - Batch sidebar showing queued videos (up to 20)
   - Batch output type selector + "Generate Batch" button
   - Progress indicator during batch generation

### New Component Files

| File | Purpose |
|---|---|
| `src/components/youtube-input.tsx` | URL input, search, video metadata card |
| `src/components/youtube-transcript-viewer.tsx` | Transcript display with timestamps |
| `src/components/youtube-curriculum-tools.tsx` | 8-tool grid with generation + output display |
| `src/components/youtube-batch-sidebar.tsx` | Batch video queue and batch generation |

### Database Changes

Add `source_type` enum support to `research_items` if not already present:
```sql
-- No new table needed — YouTube data saves to existing research_items
-- Ensure source_type can hold 'youtube' value
-- Optional: add youtube_metadata JSONB column for video-specific data
ALTER TABLE research_items ADD COLUMN IF NOT EXISTS youtube_metadata JSONB;
-- Stores: { videoId, channelName, duration, viewCount, thumbnailUrl, transcriptSource }
```

### Video History

YouTube videos loaded in the session should be tracked for quick re-access. Options:
1. **Supabase table:** `youtube_history` — `{ id, video_id, title, channel, transcript_hash, loaded_at }`
2. **Research items:** Save all loaded videos to `research_items` automatically (simpler, reuses existing infrastructure)
3. **Session state:** Zustand store for current-session videos only

**Recommendation:** Option 2 — auto-save to `research_items` with `source_type: 'youtube'`. Tag with `youtube` automatically. Transcript stored in `content` field. Video metadata in `youtube_metadata` JSONB.

### Migration Checklist — M1

- [ ] Install npm packages: `youtube-transcript`, `@distube/ytdl-core`, `youtubei.js`
- [ ] Add env vars: `YOUTUBE_API_KEY`, `GEMINI_API_KEY`
- [ ] Create API route: `/api/youtube/transcript`
- [ ] Create API route: `/api/youtube/analyze`
- [ ] Create API route: `/api/youtube/batch`
- [ ] Create API route: `/api/youtube/search`
- [ ] Create page: `/youtube/page.tsx`
- [ ] Create components: `youtube-input.tsx`, `youtube-transcript-viewer.tsx`, `youtube-curriculum-tools.tsx`, `youtube-batch-sidebar.tsx`
- [ ] Add `youtube_metadata` JSONB column to `research_items` (migration)
- [ ] Update `navigation.ts` — add YouTube page to Intelligence group
- [ ] Test: paste real YouTube URL → get transcript → generate quiz + lesson plan
- [ ] Test: batch 3 videos → generate combined quiz
- [ ] Test: save video to research → verify it appears in Research page + chat context

---

## 7. Phase M2: Deep Research Engine Upgrade

### Priority: 🟠 HIGH — Build Second

### Why This Matters

Chapterhouse already has basic research (URL ingest, paste, screenshot) and agentic research (Tavily → GPT-5.4 → auto-ingest). This phase upgrades it to match Hypomnemata's multi-source parallel search — adding SerpAPI (Google results), Reddit thread analysis, Internet Archive/Open Library, and the `SearchOrchestrator` pattern of querying multiple sources simultaneously.

### API Keys Required

| Service | Key | Env Var | Free Tier |
|---|---|---|---|
| Tavily | `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` | `TAVILY_API_KEY` | Already wired |
| SerpAPI | `29fbeaa6bd6134ae0e2db143b59471724b1b111cda394df10d12180a19fe442c` | `SERPAPI_API_KEY` | 100 searches/month free |
| Reddit | Client ID: `HDV7ht5bQREfFnFtXKhqKg` / Secret: `bcM2a3fap8jNtsD6F3hKcP3M1BUWxg` | `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` | Unlimited (OAuth) |
| News API | `a594f4be04704110bfce8abdd9573ec5` | `NEWSAPI_API_KEY` | Already wired (daily brief) |
| Internet Archive | No key needed for search/read | N/A | Unlimited |

### New API Routes

#### `POST /api/research/deep`
**File:** `src/app/api/research/deep/route.ts`

**Purpose:** Multi-source parallel research. Given a research query, search across all configured sources simultaneously, extract content from top results, and produce a synthesized research report.

**Input schema:**
```typescript
const deepResearchSchema = z.object({
  query: z.string().min(5).max(500),
  sources: z.array(z.enum([
    'tavily',        // AI-optimized web search
    'serpapi',       // Google search results
    'reddit',        // Reddit threads and discussions
    'newsapi',       // Breaking news
    'internet-archive', // Historical documents + public domain books
  ])).optional(),    // Defaults to all sources
  maxResultsPerSource: z.number().min(1).max(10).default(5),
  analysisDepth: z.enum(['quick', 'standard', 'deep']).default('standard'),
})
```

**Processing pipeline:**
1. **Parallel search:** Fire all source searches simultaneously. Each returns ranked results with URLs.
2. **Deduplication:** Remove duplicate URLs across sources. Keep the highest-ranking instance.
3. **Content extraction:** For each unique URL, fetch and extract article text using Cheerio + Readability pattern (already built in Chapterhouse's URL fetch code).
4. **Analysis:**
   - `quick` → GPT-5-mini summarizes each source in 2 sentences
   - `standard` → Claude Sonnet 4.6 synthesizes all sources into a research report
   - `deep` → Claude Sonnet 4.6 produces a multi-section report with citations, contradictions, knowledge gaps, and recommended next steps
5. **Auto-save:** Results saved to `research_items` with `source_type: 'deep_research'`. Individual sources saved as linked items.

**Output:**
```typescript
{
  query: string,
  sourcesSearched: string[],
  totalResults: number,
  synthesis: string,              // AI-generated research report (markdown)
  sources: {
    url: string,
    title: string,
    source: 'tavily' | 'serpapi' | 'reddit' | 'newsapi' | 'internet-archive',
    excerpt: string,
    relevanceScore: number,
  }[],
  metadata: {
    searchDuration: number,       // ms
    tokensUsed: number,
    model: string,
  }
}
```

#### Reddit Integration Details

**OAuth flow:** Reddit requires OAuth2 for API access. Use the "script" app type (personal use):
```typescript
// Get access token
const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64')}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: 'grant_type=client_credentials',
});

// Search Reddit
const searchResponse = await fetch(
  `https://oauth.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&limit=10`,
  { headers: { 'Authorization': `Bearer ${accessToken}`, 'User-Agent': 'Chapterhouse/1.0' } }
);
```

**IMPORTANT:** Reddit API requires a `User-Agent` header identifying your app. Use `Chapterhouse/1.0 by /u/TheAccidentalTeacher`.

#### Internet Archive / Open Library Integration

```typescript
// Search public domain books
const archiveResults = await fetch(
  `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`
);

// Search full-text archive
const archiveFullText = await fetch(
  `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&output=json&rows=5`
);
```

### UI Updates

**Existing `/research` page** gets a new tab: **"Deep Research"**

This tab contains:
- Query input field
- Source checkboxes (Tavily, SerpAPI, Reddit, NewsAPI, Internet Archive — all checked by default)
- Analysis depth selector (Quick / Standard / Deep)
- "Research" button
- Results panel showing:
  - Synthesis report (markdown rendered)
  - Collapsible source list with URLs, excerpts, and relevance scores
  - "Save All to Research" button
  - Individual "Save" buttons per source

### Migration Checklist — M2

- [ ] Add env vars: `SERPAPI_API_KEY`, `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`
- [ ] Create API route: `/api/research/deep`
- [ ] Create lib module: `src/lib/search-orchestrator.ts` — parallel multi-source search
- [ ] Create lib module: `src/lib/reddit-client.ts` — Reddit OAuth + search
- [ ] Update `/research` page with Deep Research tab
- [ ] Test: query "Alaska homeschool allotment" → verify results from multiple sources
- [ ] Test: verify Reddit OAuth flow works
- [ ] Test: verify Internet Archive search returns public domain results
- [ ] Test: verify auto-save to `research_items`

---

## 8. Phase M3: Document Processing

### Priority: 🟠 HIGH — Build Third (Scott said "CRITICAL")

### Why This Matters

Scott specifically flagged document processing as critical. He wants to upload any PDF, ePub, or DOCX — from a 5-page article to a 500,000-character textbook — and have it fully extracted and analyzed at "university level." This is the difference between "paste a URL" and "upload the entire book."

### The Architecture

**Two-layer approach:**

1. **Layer 1 — Text Extraction:** Azure AI Document Intelligence for PDFs (preserves layout, tables, form fields). `mammoth` for DOCX. Custom parser for ePub. `pdf-parse` as fallback for simple PDFs.

2. **Layer 2 — AI Analysis:** Claude Sonnet 4.6 with 1M token context window. **No chunking needed** for most documents — send the entire extracted text in one prompt. 500K characters ≈ 125K tokens — well within Claude's 1M limit.

**This is the key architectural insight:** Hypomnemata used a `ContentChunker` (4000 token chunks, 200 token overlap) because it was built for older context windows. With Claude's 1M token context, chunking is unnecessary for any document under ~750K words. Send the whole thing.

### API Keys Required

| Service | Key | Env Var |
|---|---|---|
| Azure AI Document Intelligence | `8adfl4ROr5U0nQ8adNiLBQV7FHq...` (same key as Azure AI Foundry hub) | `AZURE_AI_FOUNDRY_KEY` |
| Azure AI Foundry Endpoint | `https://api-collection-ai-hub.services.ai.azure.com/` | `AZURE_AI_FOUNDRY_ENDPOINT` |
| Anthropic Claude | Already in Chapterhouse | `ANTHROPIC_API_KEY` |

### npm Packages to Install

```bash
npm install pdf-parse     # PDF text extraction (fallback / simple PDFs)
npm install mammoth       # DOCX → HTML/text extraction
# Note: Azure Doc Intelligence is a REST API — no npm package needed
# Note: ePub parsing can use epub2 or custom XML parser
```

### New API Routes

#### `POST /api/documents/upload`
**File:** `src/app/api/documents/upload/route.ts`

**Purpose:** Accept file upload (multipart form data), extract text, store document + extracted text.

**Input:** Multipart form data with file attachment.

**Supported file types:**
| Type | Extension | Extraction Method | Max Size |
|---|---|---|---|
| PDF | `.pdf` | Azure AI Document Intelligence (primary), `pdf-parse` (fallback) | 50MB |
| DOCX | `.docx` | `mammoth` — extracts to HTML then strips tags | 50MB |
| ePub | `.epub` | Unzip → parse XHTML content files → extract text | 50MB |
| Plain text | `.txt`, `.md` | Direct read | 10MB |
| Excel | `.xlsx`, `.csv` | `xlsx` library (if needed) | 10MB |

**Processing steps:**
1. Validate file type and size
2. Upload original file to Supabase Storage (bucket: `documents/`)
3. Extract text:
   - **PDF:** POST to Azure Doc Intelligence `prebuilt-layout:analyze` → poll for result → extract text from `analyzeResult.content`
   - **DOCX:** `mammoth.extractRawText(buffer)` → plain text
   - **ePub:** Unzip → iterate content XHTML files → strip HTML → concatenate
   - **TXT/MD:** Read directly
4. Store extracted text + metadata in database
5. Return document ID + extraction summary (page count, word count, character count)

**Azure Document Intelligence call:**
```typescript
// Start analysis
const analyzeResponse = await fetch(
  `${AZURE_AI_FOUNDRY_ENDPOINT}formrecognizer/documentModels/prebuilt-layout:analyze?api-version=2024-02-29-preview`,
  {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': AZURE_AI_FOUNDRY_KEY,
      'Content-Type': 'application/pdf', // or application/octet-stream
    },
    body: pdfBuffer,
  }
);

// Get operation URL from response header
const operationUrl = analyzeResponse.headers.get('Operation-Location');

// Poll for result (Azure processes async)
let result;
while (true) {
  const statusResponse = await fetch(operationUrl, {
    headers: { 'Ocp-Apim-Subscription-Key': AZURE_AI_FOUNDRY_KEY },
  });
  result = await statusResponse.json();
  if (result.status === 'succeeded') break;
  if (result.status === 'failed') throw new Error(result.error.message);
  await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2 seconds
}

// Extract text from result
const extractedText = result.analyzeResult.content; // Full text with layout preserved
const pages = result.analyzeResult.pages; // Per-page data
const tables = result.analyzeResult.tables; // Extracted tables
```

**Response:**
```typescript
{
  documentId: string,
  fileName: string,
  fileType: string,
  fileSize: number,
  extraction: {
    characterCount: number,
    wordCount: number,
    pageCount: number,         // For PDFs
    tableCount: number,        // Tables detected by Azure
    extractionMethod: 'azure-doc-intelligence' | 'pdf-parse' | 'mammoth' | 'epub-parser' | 'direct',
  },
  storageUrl: string,          // Supabase Storage URL for original file
}
```

---

#### `POST /api/documents/analyze`
**File:** `src/app/api/documents/analyze/route.ts`

**Purpose:** Given a document ID (or raw text), perform AI analysis. Multiple analysis modes.

**Input schema:**
```typescript
const analyzeDocSchema = z.object({
  documentId: z.string().uuid().optional(),  // Fetch from DB
  text: z.string().optional(),               // Or provide directly
  analysisType: z.enum([
    'summary',          // Executive summary (1-2 pages)
    'key-findings',     // Bullet-point key findings
    'curriculum-map',   // Map content to curriculum standards
    'chapter-outline',  // Chapter-by-chapter outline with key points
    'vocabulary',       // Extract key terms with definitions
    'discussion-guide', // Discussion questions by chapter/section
    'critique',         // Academic critique (strengths, weaknesses, gaps)
    'full-analysis',    // Comprehensive analysis: summary + findings + outline + vocabulary + critique
  ]),
  options: z.object({
    gradeLevel: z.number().min(1).max(12).optional(),
    subject: z.string().optional(),          // For curriculum mapping
    maxLength: z.enum(['brief', 'standard', 'detailed']).default('standard'),
  }).optional(),
})
```

**Model selection:**
- `summary`, `key-findings` → Claude Haiku 4.5 (fast, handles long input well)
- `curriculum-map`, `critique`, `full-analysis` → Claude Sonnet 4.6 (needs reasoning)
- `chapter-outline`, `vocabulary`, `discussion-guide` → Claude Sonnet 4.6

**Context window strategy:**
- Documents ≤ 500K characters (~125K tokens): Send entire document in one prompt. No chunking.
- Documents > 500K characters: Use Claude's 1M token context. Up to ~3M characters fit.
- Documents > 3M characters (rare): Implement sliding window analysis with synthesis passes.

**Output:** Markdown string appropriate to the analysis type. Saved to `research_items` with `source_type: 'document_analysis'` and linked to the original document.

---

### New UI: Document Upload Interface

**Location:** Upgrade existing `/documents` page to add upload + analysis capabilities.

**New UI elements:**
1. **Upload zone** (top of page):
   - Drag-and-drop area with visual feedback (dashed border, icon, "Drop files here or click to browse")
   - File type badges showing supported formats
   - Upload progress bar
   - File picker button as alternative to drag-and-drop
   - Size limit indicator: "Up to 50MB per file"

2. **Document list** (existing, enhanced):
   - Uploaded documents appear alongside workspace markdown files
   - Uploaded docs show: file name, type badge (PDF/DOCX/EPUB), upload date, word count, character count, page count
   - Click to expand → shows extracted text preview (first 1000 characters)
   - "Analyze" button on each document → opens analysis panel

3. **Analysis panel** (slide-out drawer or modal):
   - Analysis type selector (8 options as radio buttons or dropdown)
   - Grade level selector (if relevant)
   - "Analyze" button
   - Output rendered as markdown
   - "Copy" / "Save to Research" / "Download as Markdown" buttons

### Database Changes

```sql
-- New table for uploaded documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,          -- 'pdf', 'docx', 'epub', 'txt', 'md', 'xlsx'
  file_size INTEGER NOT NULL,       -- bytes
  storage_path TEXT NOT NULL,       -- Supabase Storage path
  extracted_text TEXT,              -- Full extracted text
  character_count INTEGER,
  word_count INTEGER,
  page_count INTEGER,
  table_count INTEGER,
  extraction_method TEXT,           -- 'azure-doc-intelligence' | 'pdf-parse' | 'mammoth' | etc.
  metadata JSONB,                  -- Tables, layout data, etc.
  user_id UUID REFERENCES auth.users(id)
);

-- Index for quick listing
CREATE INDEX documents_created_idx ON documents(created_at DESC);

-- RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users only" ON documents
  FOR ALL USING (auth.role() = 'authenticated');
```

### Migration Checklist — M3

- [ ] Add env vars: `AZURE_AI_FOUNDRY_KEY`, `AZURE_AI_FOUNDRY_ENDPOINT`
- [ ] Install npm packages: `pdf-parse`, `mammoth`
- [ ] Run Supabase migration: create `documents` table
- [ ] Create Supabase Storage bucket: `documents`
- [ ] Create API route: `/api/documents/upload`
- [ ] Create API route: `/api/documents/analyze`
- [ ] Create component: `document-upload-zone.tsx` (drag-and-drop)
- [ ] Create component: `document-analysis-panel.tsx`
- [ ] Update `/documents/page.tsx` with upload zone + enhanced document cards
- [ ] Test: upload a real PDF → verify Azure Doc Intelligence extraction
- [ ] Test: upload a DOCX → verify mammoth extraction
- [ ] Test: analyze a 200-page PDF → verify Claude handles full text without chunking
- [ ] Test: verify file size limit enforcement (50MB)
- [ ] Test: verify file type validation (reject .exe, .zip, etc.)

---

## 9. Phase M4: Image Generation Studio

### Priority: 🟡 MEDIUM

### Why This Matters

Chapterhouse currently has zero image generation capability. Scott needs to generate curriculum illustrations, Gimli character art, NCHO product mockups, and lesson visual assets. Hypomnemata has a working creative studio with 4 image models. This phase brings that over and adds providers Scott already has API keys for.

### API Keys Required

| Service | Key | Env Var | Capabilities |
|---|---|---|---|
| OpenAI (GPT Image 1) | Already in Chapterhouse | `OPENAI_API_KEY` | Text-in-images, photorealistic, best for complex scenes with text |
| Stability AI | See `.env.local` | `STABILITY_AI_KEY` | Stable Diffusion, controllable art styles, good for curriculum illustrations |
| Replicate | See `.env.local` | `REPLICATE_TOKEN` | Flux 2 Pro, SDXL, DreamShaper, Real-ESRGAN upscaling, GFPGAN face restoration |
| Leonardo.ai | See `.env.local` | `LEONARDO_API_KEY` | Phoenix character reference for Gimli consistency, 150 free tokens/day |
| Pexels | See `.env.local` | `PEXELS_API_KEY` | Unlimited free stock photos |
| Pixabay | See `.env.local` | `PIXABAY_API_KEY` | Unlimited free photos/vectors/illustrations |
| Unsplash | See `.env.local` | `UNSPLASH_ACCESS_KEY` | 50 req/hr free stock photography |
| Cloudinary | See `.env.local` | `CLOUDINARY_URL` | Upload, CDN, auto-optimization, transformations |

### New API Routes

#### `POST /api/images/generate`
**File:** `src/app/api/images/generate/route.ts`

**Input schema:**
```typescript
const imageGenSchema = z.object({
  prompt: z.string().min(5).max(2000),
  provider: z.enum(['openai', 'stability', 'replicate', 'leonardo']),
  model: z.string().optional(),     // Provider-specific model name
  width: z.number().default(1024),
  height: z.number().default(1024),
  style: z.string().optional(),     // 'realistic', 'cartoon', 'watercolor', etc.
  negativePrompt: z.string().optional(), // What to avoid
  characterRef: z.string().optional(),   // Leonardo.ai character reference image URL
})
```

**Provider-specific implementations:**

**OpenAI (GPT Image 1):**
```typescript
const response = await openai.images.generate({
  model: "gpt-image-1",
  prompt: prompt,
  n: 1,
  size: `${width}x${height}`,
});
```

**Stability AI:**
```typescript
const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${STABILITY_AI_KEY}`,
  },
  body: JSON.stringify({
    text_prompts: [{ text: prompt, weight: 1 }],
    cfg_scale: 7, steps: 30, width, height,
  }),
});
```

**Replicate (Flux 2 Pro / SDXL / DreamShaper):**
```typescript
const response = await fetch('https://api.replicate.com/v1/predictions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${REPLICATE_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    version: 'flux-2-pro-model-hash', // Model-specific
    input: { prompt, width, height, num_outputs: 1 },
  }),
});
// Poll for result (Replicate is async)
```

**Leonardo.ai (with Phoenix character reference for Gimli):**
```typescript
const response = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${LEONARDO_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt,
    modelId: 'phoenix',  // Phoenix model for character consistency
    width, height,
    // Character reference if provided:
    ...(characterRef ? { init_image_id: characterRef } : {}),
  }),
});
```

#### `GET /api/images/search`
**File:** `src/app/api/images/search/route.ts`

**Purpose:** Search stock image providers (Pexels + Pixabay + Unsplash) simultaneously.

**Input:** `?q=roman+colosseum&perPage=10`

**Processing:** Fire all three searches in parallel, merge results, deduplicate, return.

#### `POST /api/images/upscale`
**File:** `src/app/api/images/upscale/route.ts`

**Purpose:** 4× upscale via Real-ESRGAN on Replicate. Optional GFPGAN face restoration.

**Input:** `{ imageUrl: string, scale: 4, faceRestore: boolean }`

#### `POST /api/images/save`
**File:** `src/app/api/images/save/route.ts`

**Purpose:** Upload generated image to Cloudinary, return CDN URL.

### New UI Page: `/creative-studio`

**Sidebar location:** Production group

**Layout:**
1. **Prompt input** — large text area for image description
2. **Provider selector** — radio buttons: GPT Image 1, Stability AI, Replicate (Flux 2 Pro), Leonardo.ai
3. **Settings panel** — width/height presets (1024×1024, 1280×720, 768×1024), style selector, negative prompt
4. **Generate button** + loading state
5. **Result gallery** — generated images displayed in a grid
6. **Action buttons** per image: Download, Save to Cloudinary, Copy URL, Upscale (4×)
7. **Stock image tab** — search Pexels/Pixabay/Unsplash with unified results
8. **History** — recent generations stored in Supabase

### Database Changes

```sql
CREATE TABLE generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  prompt TEXT NOT NULL,
  provider TEXT NOT NULL,           -- 'openai' | 'stability' | 'replicate' | 'leonardo'
  model TEXT,
  width INTEGER,
  height INTEGER,
  image_url TEXT NOT NULL,          -- Original generation URL
  cloudinary_url TEXT,              -- CDN URL after save
  metadata JSONB,                   -- Provider-specific response data
  user_id UUID REFERENCES auth.users(id)
);

ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users only" ON generated_images
  FOR ALL USING (auth.role() = 'authenticated');
```

### Migration Checklist — M4

- [ ] Add env vars: `STABILITY_AI_KEY`, `REPLICATE_TOKEN`, `LEONARDO_API_KEY`, `PEXELS_API_KEY`, `PIXABAY_API_KEY`, `UNSPLASH_ACCESS_KEY`, `CLOUDINARY_URL`
- [ ] Run Supabase migration: create `generated_images` table
- [ ] Create API route: `/api/images/generate` (4 providers)
- [ ] Create API route: `/api/images/search` (3 stock providers)
- [ ] Create API route: `/api/images/upscale` (Replicate)
- [ ] Create API route: `/api/images/save` (Cloudinary upload)
- [ ] Create page: `/creative-studio/page.tsx`
- [ ] Create components: prompt input, provider selector, result gallery, stock search
- [ ] Update `navigation.ts` — add Creative Studio to Production group
- [ ] Test: generate image with each provider
- [ ] Test: search stock images across all three providers
- [ ] Test: upscale a generated image
- [ ] Test: save to Cloudinary and verify CDN URL works

---

## 10. Phase M5: Voice Engine (TTS + STT)

### Priority: 🟡 MEDIUM

### Why This Matters

Two capabilities in one:
1. **Text-to-Speech:** Generate audio versions of lesson content. ElevenLabs for premium voice (Gimli, Scott clone). Azure Speech for bulk production (500K chars/month free).
2. **Speech-to-Text:** Voice input for everything — dictate research notes, chat messages, document analysis prompts. Azure Speech STT.

### API Keys Required

| Service | Key | Env Var | Use |
|---|---|---|---|
| ElevenLabs (Curriculum) | `...cf51` | `ELEVENLABS_CURRICULUM_KEY` | Premium Gimli voice, lesson audio |
| ElevenLabs (RPG) | `...0867` | `ELEVENLABS_RPG_KEY` | roleplaying repo (not for Chapterhouse) |
| ElevenLabs (General) | `...2c2d` | `ELEVENLABS_GENERAL_KEY` | Staging/testing |
| Azure Speech | See `.env.local` | `AZURE_SPEECH_KEY` | Bulk TTS (120+ voices) + STT |
| Azure Speech Region | `westus` | `AZURE_SPEECH_REGION` | Required for endpoint construction |

### New API Routes

#### `POST /api/voice/synthesize`
**File:** `src/app/api/voice/synthesize/route.ts`

**Input schema:**
```typescript
const synthesizeSchema = z.object({
  text: z.string().min(1).max(50000),  // Up to ~50K chars per request
  engine: z.enum(['elevenlabs', 'azure']),
  voice: z.string().optional(),         // ElevenLabs voice_id or Azure voice name
  language: z.string().default('en-US'),
  speed: z.number().min(0.5).max(2.0).default(1.0),
  format: z.enum(['mp3', 'wav', 'ogg']).default('mp3'),
})
```

**ElevenLabs implementation:**
```typescript
const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
  method: 'POST',
  headers: {
    'xi-api-key': ELEVENLABS_CURRICULUM_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text,
    model_id: 'eleven_turbo_v2',
    voice_settings: { stability: 0.5, similarity_boost: 0.75, speed },
  }),
});
// Returns: audio/mpeg stream
```

**Azure Speech implementation:**
```typescript
const response = await fetch(
  `https://${AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
  {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-160kbitrate-mono-mp3',
    },
    body: `<speak version='1.0' xml:lang='${language}'>
      <voice name='${voice || 'en-US-AriaNeural'}'><prosody rate='${speed}'>${text}</prosody></voice>
    </speak>`,
  }
);
// Returns: audio buffer
```

**Cost strategy:**
- ElevenLabs: Premium voices only (Gimli, custom voices). Creator plan minimum ($5/mo) for commercial.
- Azure Speech: Volume layer. 500K chars/month free. 120+ neural voices. Use for all bulk audio.

#### `POST /api/voice/transcribe`
**File:** `src/app/api/voice/transcribe/route.ts`

**Purpose:** Upload audio → get text. Speech-to-text.

**Input:** Multipart form data with audio file (or audio blob from browser mic).

**Azure Speech STT:**
```typescript
const response = await fetch(
  `https://${AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`,
  {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
      'Content-Type': 'audio/wav', // or audio/webm for browser recordings
    },
    body: audioBuffer,
  }
);
// Returns: { RecognitionStatus, DisplayText, Offset, Duration }
```

### UI Changes

1. **Chat input bar:** Add microphone button for voice input (STT → text → send)
2. **Content studio output:** Add "Read Aloud" button (TTS → audio player)
3. **Voice Studio page** (`/voice-studio`): Dedicated page for batch TTS generation
   - Text area input (or pull from document/research)
   - Engine selector (ElevenLabs / Azure)
   - Voice selector (preloaded list of available voices)
   - Preview + Download buttons
   - Batch mode: select multiple documents → generate audio for each

### Migration Checklist — M5

- [ ] Add env vars: `ELEVENLABS_CURRICULUM_KEY`, `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`
- [ ] Create API route: `/api/voice/synthesize`
- [ ] Create API route: `/api/voice/transcribe`
- [ ] Create page: `/voice-studio/page.tsx` (or add tab to creative studio)
- [ ] Add mic button to chat input component
- [ ] Add "Read Aloud" button to content studio output
- [ ] Update `navigation.ts` — add Voice Studio to Production group
- [ ] Test: generate audio with ElevenLabs (premium voice)
- [ ] Test: generate audio with Azure Speech (free tier, en-US-AriaNeural)
- [ ] Test: record audio via browser mic → transcribe to text
- [ ] Test: use STT in chat → verify text appears in input field

---

## 11. Phase M6: 12 Personas System

### Priority: 🟢 LOWER — But Low Effort

### Why This Matters

The 12 personas are switchable expert identities that change the system prompt. They're complementary to the Council of the Unserious — the Council is a 5-member pipeline for structured work; personas are individual experts for focused conversation. Zero additional API cost — same Claude/OpenAI calls, different system prompt.

### How It Works in Chapterhouse

**Current chat modes:**
- Solo mode → one AI model responds
- Council mode → 5 Council members respond in sequence with rebuttal

**New mode added:**
- Persona mode → one AI model responds using a specific persona's system prompt

**UI change:** Add persona selector dropdown to the chat input bar:
```
[Solo ▾] [Claude Sonnet 4.6 ▾] [No Persona ▾]
```
Becomes:
```
[Solo ▾] [Claude Sonnet 4.6 ▾] [Dr. Sarah Bennett ▾]
```

When a persona is selected:
1. The persona's system prompt replaces the default system prompt
2. The persona's research companion file content is appended as context
3. The AI's response style, expertise, and voice match the selected persona
4. Council mode is disabled (persona mode and Council mode are mutually exclusive)

### Implementation: TypeScript Constants

Create `src/lib/personas.ts`:

```typescript
export interface Persona {
  id: string;
  name: string;
  title: string;
  icon: string;        // Emoji or icon identifier
  specialty: string;   // One-line description
  systemPrompt: string; // Full system prompt text
  researchContext?: string; // Companion research notes
  color: string;       // Chat bubble accent color
}

export const personas: Persona[] = [
  {
    id: 'master-teacher',
    name: 'Dr. Sarah Bennett',
    title: 'Master Educator & Pedagogical Advisor',
    icon: '🎓',
    specialty: 'Bloom\'s, Webb\'s DOK, UDL, UbD. 25+ years. National Board Certified.',
    systemPrompt: `You are Dr. Sarah Bennett, a master educator with 25+ years...`,
    color: '#6366f1', // Indigo
  },
  // ... all 12 personas
];
```

**Source:** Read the full system prompt from each persona `.md` file in Hypomnemata's `personas/` directory. The research companion files (`*-research.md`) become the `researchContext` field.

### Implementation Steps

1. Read all 12 persona `.md` files from `C:\Users\Valued Customer\Dropbox\Websites\AI Agents\Ai-Agent\personas\`
2. Read all 12 `*-research.md` companion files
3. Create `src/lib/personas.ts` with all 12 personas as TypeScript constants
4. Update `src/components/chat-interface.tsx`:
   - Add persona selector dropdown
   - When persona selected: inject `persona.systemPrompt` as system message
   - Optionally append `persona.researchContext` as additional context
   - Disable Council mode when persona is active
   - Show persona indicator in chat header (name + icon)
5. Update `/api/chat/` route to accept optional `personaId` parameter and use persona system prompt

### Migration Checklist — M6

- [ ] Read all 24 persona source files (12 personas + 12 research companions)
- [ ] Create `src/lib/personas.ts` with full type-safe persona definitions
- [ ] Update chat interface: add persona selector dropdown
- [ ] Update `/api/chat/` to accept and apply persona system prompts
- [ ] Add persona indicator to chat header/bubble
- [ ] Ensure Council mode and Persona mode are mutually exclusive
- [ ] Test: select each persona → verify voice/style changes
- [ ] Test: switch between persona and Council mode
- [ ] Test: verify persona context enriches responses

---

## 12. Phase M7: Music + Sound

### Priority: 🟢 LOWER

### What's Available

| Tool | API Status | Capability |
|---|---|---|
| **Suno AI** | ❌ No public API | Full song generation from text prompt. UI-only workflow. $10/mo Pro for commercial. |
| **Google Lyria 2** (via Replicate) | ✅ API available | Music generation via Replicate | 
| **MiniMax Music** | ✅ API available | Music generation |
| **Freesound** | ✅ API available (`FREESOUND_API_KEY`) | 600K+ CC0/CC-BY sound effects. Search by tag/description. |

### New API Route

#### `GET /api/sounds/search`
**File:** `src/app/api/sounds/search/route.ts`

**Purpose:** Search Freesound for ambient audio and sound effects.

**Input:** `?q=medieval+tavern&license=cc0&duration_min=5&duration_max=60`

**Output:** Array of `{ id, name, description, duration, url, previewUrl, license, tags }`.

**Freesound API call:**
```typescript
const response = await fetch(
  `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(query)}&filter=license:"Creative Commons 0"&fields=id,name,description,duration,url,previews,tags,license&token=${FREESOUND_API_KEY}`
);
```

### Suno Workflow (Manual — No API)

Document this workflow in the UI as a guide panel:
1. Log into suno.com (Pro plan)
2. Type prompt: "Make a silly song that teaches the water cycle to 2nd graders"
3. Download MP3
4. Upload to Cloudinary (`/api/images/save` — rename to `/api/media/save` for generalization)
5. Copy CDN URL → embed in lesson

### UI

Add **Sound Browser** tab to Creative Studio:
- Search field with Freesound query
- License filter (CC0 / CC-BY / All)
- Duration range filter
- Results list with audio preview player
- Download / Save to Cloudinary buttons
- "Suno Workflow" helper panel with step-by-step instructions

### Migration Checklist — M7

- [ ] Add env var: `FREESOUND_API_KEY`
- [ ] Create API route: `/api/sounds/search`
- [ ] Add Sound Browser tab to Creative Studio page
- [ ] Include audio preview player component
- [ ] Add Suno workflow guide panel
- [ ] Test: search "medieval tavern" → verify CC0 results with previews

---

## 13. Phase M8: Translation

### Priority: 🟢 LOWER — But Free and Easy

### Why This Matters

Azure Translator gives 2 million characters per month FREE. That's enough to translate entire courses to Spanish. Supports 100+ languages. Zero cost for current volume.

### API Key

| Service | Key | Env Var | Free Tier |
|---|---|---|---|
| Azure Translator | See `.env.local` | `AZURE_TRANSLATOR_KEY` | 2M chars/month |
| Region | `westus3` | `AZURE_TRANSLATOR_REGION` | — |

### New API Route

#### `POST /api/translate`
**File:** `src/app/api/translate/route.ts`

**Input schema:**
```typescript
const translateSchema = z.object({
  text: z.string().min(1).max(50000),
  targetLanguage: z.string().default('es'),  // ISO 639-1 code
  sourceLanguage: z.string().optional(),     // Auto-detect if omitted
})
```

**Implementation:**
```typescript
const response = await fetch(
  `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${targetLanguage}`,
  {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': AZURE_TRANSLATOR_KEY,
      'Ocp-Apim-Subscription-Region': 'westus3',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([{ text }]),
  }
);
```

### UI

Add "Translate" button to Content Studio output panel:
- Language selector dropdown (Spanish, French, German, Chinese, Korean, Japanese, etc.)
- One-click translate → shows translated text below original
- Copy to clipboard button on translated text

### Migration Checklist — M8

- [ ] Add env vars: `AZURE_TRANSLATOR_KEY`, `AZURE_TRANSLATOR_REGION`
- [ ] Create API route: `/api/translate`
- [ ] Add Translate button to Content Studio output
- [ ] Test: translate a curriculum description to Spanish
- [ ] Test: verify auto-detection of source language

---

## 14. Phase M9: Video Generation

### Priority: 🔵 LOW — Destination Undecided

### Decision Needed

Should HeyGen video generation live in Chapterhouse or CoursePlatform?

| Option | Pros | Cons |
|---|---|---|
| **Chapterhouse** | Scott works here daily, immediate access, creative studio consolidation | Chapterhouse is ops brain, not content production |
| **CoursePlatform** | Closer to where videos are consumed, part of lesson builder pipeline | CoursePlatform isn't being actively built right now |

**Recommendation:** Start in Chapterhouse. Move to CoursePlatform when that system is ready for video integration.

### API Key

| Service | Key | Env Var |
|---|---|---|
| HeyGen | `sk_V2_hgu_kodBIj37Jdu_3F6Siklo3UQFfFF64QAV7R8u4W5zPhgp` | `HEYGEN_API_KEY` |

### New API Route

#### `POST /api/video/generate`
**File:** `src/app/api/video/generate/route.ts`

**Input schema:**
```typescript
const videoGenSchema = z.object({
  script: z.string().min(10).max(5000),
  avatarId: z.string(),           // Scott's HeyGen avatar ID
  voiceId: z.string().optional(), // HeyGen voice ID
  dimensions: z.object({
    width: z.number().default(1280),
    height: z.number().default(720),
  }).optional(),
})
```

**HeyGen API call:**
```typescript
const response = await fetch('https://api.heygen.com/v2/video/generate', {
  method: 'POST',
  headers: {
    'X-Api-Key': HEYGEN_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    video_inputs: [{
      character: { type: "avatar", avatar_id: avatarId },
      voice: { type: "text", input_text: script, voice_id: voiceId },
    }],
    dimension: { width: 1280, height: 720 },
  }),
});
// Returns: { data: { video_id } }
// Poll: GET /v1/video_status.get?video_id=${videoId}
// When complete: download URL available
```

### Migration Checklist — M9

- [ ] Decide: Chapterhouse or CoursePlatform?
- [ ] Add env var: `HEYGEN_API_KEY`
- [ ] Create API route: `/api/video/generate`
- [ ] Create API route: `/api/video/status` (poll for completion)
- [ ] Add video generation tab to Creative Studio (if Chapterhouse)
- [ ] Test: generate a test video with Scott's avatar

---

## 15. Environment Variables Master List

All env vars to add to Chapterhouse's `.env.local` (and Vercel/Railway deployments):

```bash
# ============================================
# M1: YouTube Video Intelligence
# ============================================
YOUTUBE_API_KEY=AIzaSyDsCLOAeMylBh_uj7bfTKVf61dBLShzl1Y
GEMINI_API_KEY=AIzaSyBmoTwsRQRbxhWCJFJi0kHuJMn5PJa5fko

# ============================================
# M2: Deep Research Engine
# ============================================
SERPAPI_API_KEY=29fbeaa6bd6134ae0e2db143b59471724b1b111cda394df10d12180a19fe442c
REDDIT_CLIENT_ID=HDV7ht5bQREfFnFtXKhqKg
REDDIT_CLIENT_SECRET=bcM2a3fap8jNtsD6F3hKcP3M1BUWxg

# ============================================
# M3: Document Processing + M5: Voice + M8: Translation
# (All Azure — share the hub key for Doc Intelligence)
# ============================================
AZURE_AI_FOUNDRY_KEY=your_azure_ai_foundry_key
AZURE_AI_FOUNDRY_ENDPOINT=https://your-hub.services.ai.azure.com/
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=westus
AZURE_TRANSLATOR_KEY=your_azure_translator_key
AZURE_TRANSLATOR_REGION=westus3

# ============================================
# M4: Image Generation
# ============================================
STABILITY_AI_KEY=your_stability_key
REPLICATE_TOKEN=your_replicate_token
LEONARDO_API_KEY=your_leonardo_key
PEXELS_API_KEY=your_pexels_key
PIXABAY_API_KEY=your_pixabay_key
UNSPLASH_ACCESS_KEY=your_unsplash_key
CLOUDINARY_URL=cloudinary://your_cloudinary_url

# ============================================
# M5: Voice (TTS)
# ============================================
ELEVENLABS_CURRICULUM_KEY=<curriculum-processor-key-ending-cf51>
ELEVENLABS_GENERAL_KEY=<general-key-ending-2c2d>

# ============================================
# M7: Music + Sound
# ============================================
FREESOUND_API_KEY=mKkgqv6rxPxcjKFhC8yAutjOKZN3R01fhjS1Le56

# ============================================
# M9: Video Generation
# ============================================
HEYGEN_API_KEY=sk_V2_hgu_kodBIj37Jdu_3F6Siklo3UQFfFF64QAV7R8u4W5zPhgp
```

**Already in Chapterhouse (no changes needed):**
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`
- `RESEND_API_KEY`
- `TAVILY_API_KEY`
- `NEWSAPI_API_KEY`
- `GITHUB_TOKEN`
- `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`, `ALLOWED_EMAILS`
- `N8N_BASE_URL`, `N8N_API_KEY`
- `RAILWAY_WORKER_URL`

---

## 16. Sidebar Navigation — Post-Migration

Updated navigation structure after all 9 phases complete:

```
┌─────────────────────────────────────────┐
│  COMMAND CENTER                         │
│    🏠 Home           [live]             │
│    ✨ Daily Brief    [live]             │
│                                         │
│  INTELLIGENCE                           │
│    🔍 Research       [live] (upgraded)  │
│    📺 YouTube        [NEW — M1]        │
│    💡 Product Intel  [live]             │
│    📄 Documents      [live] (upgraded)  │
│                                         │
│  PRODUCTION                             │
│    📝 Content Studio [live] (upgraded)  │
│    🎨 Creative Studio [NEW — M4]       │
│    🔊 Voice Studio   [NEW — M5]        │
│    📋 Review Queue   [live]             │
│    📑 Tasks         [live]              │
│    📚 Documents     [live]              │
│                                         │
│  AI & AUTOMATION                        │
│    ⚙️ Job Runner     [live]             │
│    ⚡ Curriculum Fac  [live]            │
│    👥 Council        [live]             │
│    🔗 Pipelines      [live]             │
│                                         │
│  SYSTEM                                 │
│    🔧 Settings       [live]             │
│    ❓ Help           [live]             │
└─────────────────────────────────────────┘
```

**Navigation changes required** (update `src/lib/navigation.ts`):

| Action | Item | Group | Phase |
|---|---|---|---|
| ADD | YouTube | Intelligence (after Research) | M1 |
| UPGRADE | Research tooltip + features list | Intelligence | M2 |
| UPGRADE | Documents tooltip + features list | Intelligence/Production | M3 |
| ADD | Creative Studio | Production (after Content Studio) | M4 |
| UPGRADE | Content Studio tooltip (add translation) | Production | M8 |
| ADD | Voice Studio | Production (after Creative Studio) | M5 |

---

## 17. Database Schema Changes

### New Tables

| Table | Phase | Purpose |
|---|---|---|
| `documents` | M3 | Uploaded document storage + extracted text |
| `generated_images` | M4 | Image generation history |

### Column Additions to Existing Tables

| Table | Column | Type | Phase | Purpose |
|---|---|---|---|---|
| `research_items` | `youtube_metadata` | JSONB | M1 | Video ID, channel, duration, views, thumbnail, transcript source |
| `research_items` | `source_type` | TEXT | M1 | Distinguish 'url', 'paste', 'screenshot', 'youtube', 'deep_research', 'document_analysis' |

### Migration Files to Create

```
supabase/migrations/
  20260315_010_add_youtube_metadata.sql       -- M1
  20260315_011_create_documents_table.sql     -- M3
  20260315_012_create_generated_images.sql    -- M4
```

---

## 18. Dependency Additions

### npm Packages to Install

| Package | Phase | Purpose |
|---|---|---|
| `youtube-transcript` | M1 | Primary YouTube transcript fetcher |
| `@distube/ytdl-core` | M1 | YouTube audio download (Whisper fallback) |
| `pdf-parse` | M3 | PDF text extraction (fallback) |
| `mammoth` | M3 | DOCX → text extraction |

**Already installed in Chapterhouse (no action):**
- `@anthropic-ai/sdk` — Claude API
- `openai` — OpenAI API
- `@supabase/supabase-js` — Supabase client
- `zod` — Schema validation
- `react-markdown` + `remark-gfm` — Markdown rendering
- `lucide-react` — Icons
- `resend` — Email

**Not needed (killed in migration):**
- `@langchain/langgraph` — Replaced by Council SSE streaming
- `@langchain/core`, `@langchain/anthropic`, `@langchain/openai` — LangChain dep tree eliminated
- `cheerio` — Chapterhouse already has URL content extraction without it
- `@google-cloud/text-to-speech` — Replaced by Azure Speech free tier
- `xlsx` — Low priority; add only if Excel processing is needed
- `parse-multipart-data` — Next.js handles multipart natively

---

## 19. Multi-User Architecture (Future)

Scott mentioned wanting multi-user support eventually for Anna and Timothy (Tic). Current architecture notes:

### Current State
- **Auth:** Supabase email/password, gated by `ALLOWED_EMAILS` environment variable
- **RLS:** All tables use `auth.role() = 'authenticated'` — any logged-in user sees everything
- **No per-user data isolation** — Chapterhouse is currently single-tenant (Scott + Anna see same data)

### What Multi-User Would Require
1. **User table with roles:** `admin` (Scott), `editor` (Anna), `viewer` (Tic)
2. **Per-user thread ownership:** `chat_threads.user_id` column with RLS policy
3. **Shared vs personal:** Some data is shared (research, briefs, opportunities), some is personal (chat threads, preferences)
4. **Settings per user:** Model preferences, persona defaults, notification preferences
5. **Activity log:** Who created/modified what, when

### When to Build
Not now. After migration is complete and Chapterhouse is stable with all M1–M9 features. Multi-user is a polish feature, not a capability feature.

---

## 20. Build Order & Priority Matrix

| Phase | Name | Priority | Effort | Unique Value | API Cost | Dependencies |
|---|---|---|---|---|---|---|
| **M1** | YouTube Intelligence | 🔴 Highest | Medium (3-4 sessions) | Crown jewel — transforms video into curriculum | Low (YouTube API free, Claude per-use) | None |
| **M2** | Deep Research Upgrade | 🟠 High | Medium (2-3 sessions) | Multi-source parallel intelligence | Low (SerpAPI 100/mo free, Reddit free) | None |
| **M3** | Document Processing | 🟠 High | High (3-4 sessions) | Upload anything, analyze everything (500K chars) | Low (Azure Doc Intel included in hub) | None |
| **M4** | Image Generation | 🟡 Medium | Medium (2-3 sessions) | Multi-provider creative studio | Medium (Replicate pay-per-use) | Cloudinary env var |
| **M5** | Voice Engine | 🟡 Medium | Medium (2-3 sessions) | TTS for lessons + STT dictation | Low (Azure 500K chars/mo free) | Azure env vars |
| **M6** | 12 Personas | 🟢 Lower | Low (1 session) | Enriched chat, zero API cost | Zero | Read persona source files |
| **M7** | Music + Sound | 🟢 Lower | Low (1 session) | Ambient audio, sound effects | Zero (Freesound free) | None |
| **M8** | Translation | 🟢 Lower | Low (1 session) | Free 2M chars/mo translation | Zero (Azure free tier) | Azure Translator env var |
| **M9** | Video Generation | 🔵 Lowest | Medium (1-2 sessions) | Scott avatar videos | Medium (HeyGen per-video) | Destination decision |

### Recommended Build Sequence

```
Session N:     M1 (YouTube) — API routes + transcript + analyze
Session N+1:   M1 (YouTube) — UI page + batch mode + testing
Session N+2:   M2 (Deep Research) — multi-source search + UI tab
Session N+3:   M3 (Documents) — upload + Azure extraction + analyze route
Session N+4:   M3 (Documents) — UI (drag-drop, analysis panel) + testing
Session N+5:   M6 (Personas) — quick win, low effort, high delight
Session N+6:   M4 (Images) — generation routes + stock search
Session N+7:   M4 (Images) — Creative Studio UI
Session N+8:   M5 (Voice) — TTS + STT routes + chat mic button
Session N+9:   M7 (Sound) + M8 (Translation) — both low effort, same session
Session N+10:  M9 (Video) — if destination decided
```

---

## 21. Post-Migration: Hypomnemata Retirement

After all phases are complete and verified in Chapterhouse:

1. **Archive the repo:** Keep `TheAccidentalTeacher/Ai-Agent` on GitHub as read-only (don't delete — it's a record)
2. **Remove Netlify deployment:** Delete the Netlify site to stop serving the old app
3. **Update repo registry:** Mark `agentsvercel` / `Ai-Agent` as ⚫ Cold / Archived in `copilot-instructions.md`
4. **Transfer any remaining Supabase data:** If Hypomnemata has a separate Supabase instance with valuable data, migrate it to Chapterhouse's instance
5. **Clean up local files:** The local copy at `C:\Users\Valued Customer\Dropbox\Websites\AI Agents\Ai-Agent` can remain as reference but mark it clearly as archived

**Do NOT retire Hypomnemata until:**
- All 9 phases are built and tested
- Scott confirms feature parity for everything he uses
- At least one full week of Chapterhouse-only usage to catch gaps

---

## 22. Decision Log

| Date | Decision | Status |
|---|---|---|
| March 14, 2026 | YouTube Intelligence is M1 priority (crown jewel) | ✅ Locked |
| March 14, 2026 | Keep all 12 personas — switchable system prompts alongside Council | ✅ Locked |
| March 14, 2026 | Keep music generation (Suno manual + Freesound API) | ✅ Locked |
| March 14, 2026 | Keep video generation (HeyGen) — destination TBD (Chapterhouse or CoursePlatform) | 🟡 Open |
| March 14, 2026 | Keep image generation — 4 providers + 3 stock APIs | ✅ Locked |
| March 14, 2026 | Keep TTS (ElevenLabs premium + Azure bulk) AND add STT (Azure) | ✅ Locked |
| March 14, 2026 | Document processing is CRITICAL — PDF/ePub up to 500K chars, university-level analysis | ✅ Locked |
| March 14, 2026 | Multi-user support is future — build after migration complete | ✅ Locked |
| March 14, 2026 | Kill LangGraph.js — Council SSE streaming is superior architecture | ✅ Locked |
| March 14, 2026 | Kill Coqui TTS + Google Cloud TTS — replaced by Azure Speech free tier | ✅ Locked |
| March 14, 2026 | Kill xAI (Grok), Mistral, Cohere providers — no confirmed use case | ✅ Locked |
| March 14, 2026 | No chunking for documents under 3M characters — use Claude 1M context directly | ✅ Locked |
| March 14, 2026 | Memory graph visualization (D3 knowledge graph) deferred — future enhancement | 🟡 Parked |
| March 14, 2026 | Deep research adds SerpAPI + Reddit + Internet Archive to existing Tavily | ✅ Locked |

---

*This document is the living upgrade plan. Update it as phases complete. Add decisions as they're made. Reference it at the start of every build session.*

*Created: March 14, 2026 — Chapterhouse Session 7*
*Local path: `C:\Users\Valued Customer\OneDrive\Desktop\WEBSITES\Brand guide\chapterhouse-upgrade-plan.md`*
*Status: Active — M1 ready to build*
