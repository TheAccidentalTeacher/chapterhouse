# Chapterhouse — AI API Cost Audit
### Comprehensive call inventory, pricing analysis, and model-swap feasibility
*Last updated: March 23, 2026 (Session 23)*

---

## Pricing Reference (Current)

| Provider | Model | Input $/MTok | Output $/MTok | Notes |
|---|---|---|---|---|
| **Anthropic** | Claude Sonnet 4.6 | $3.00 | $15.00 | Primary workhorse |
| **Anthropic** | Claude Haiku 4.5 | $1.00 | $5.00 | Fast batch tasks |
| **Anthropic** | Claude Opus 4.6 | $5.00 | $25.00 | Not currently used |
| **OpenAI** | GPT-5.4 | ~$5.00 | ~$20.00 | Reasoning + extraction |
| **OpenAI** | GPT-5-mini | ~$0.30 | ~$1.20 | Budget tier |
| **OpenAI** | GPT-4o-mini | $0.15 | $0.60 | Used in deep research |
| **OpenAI** | Whisper-1 | $0.006/min | — | Audio STT |
| **Google** | Gemini 2.5 Flash | ~$0.075* | ~$0.30* | YouTube transcripts |
| **Groq** | Llama 3.3 70B | ~$0.0005 | ~$0.0008 | Free tier 500 tok/s |

*Gemini 2.5 Flash: free tier = 1M tokens/day. Paid: ~$0.075/MTok input (text), video input priced per second or token. Scott currently using free tier.*

**⚠️ GROQ RESTRICTION:** Groq CANNOT process student content (no contractual training-data prohibition on free tier). Safe for Chapterhouse internal ops (no student data flows here).

---

## Complete Call Inventory

### 1. Solo Chat — Main Response
**File:** `src/app/api/chat/route.ts`  
**Function:** `POST handler → OpenAI Responses API or Anthropic stream`  
**Model:** User-selectable — default `gpt-5.4`. Options: `gpt-5.4`, `claude-sonnet-4-6`, `claude-haiku-4-5`, `gpt-5-mini`  
**Type:** Streaming  
**Trigger:** Every user message in Solo mode  
**What it does:** Main chat response. Full `buildLiveContext()` injected into system prompt (push log, intel, founder notes, briefs, research, opportunities, email intent if detected).  
**Estimated tokens per call:** 8K–25K input (context heavy), 500–2K output  
**Estimated cost per call:** $0.03–$0.18 (Sonnet) | $0.04–$0.55 (GPT-5.4) | $0.01–$0.07 (Haiku) | $0.001–$0.004 (GPT-5-mini)  
**Volume:** Varies. Scott's primary interface — probably 20–50 calls/day.

---

### 2. Extract-Learnings (fires after EVERY chat message)
**File:** `src/app/api/extract-learnings/route.ts`  
**Function:** `POST handler → openai.responses.create()`  
**Model:** `gpt-5.4`  
**Type:** Non-streaming  
**max_output_tokens:** 512  
**Trigger:** Fires silently after every solo AND council chat message  
**What it does:** Reads last 6 messages, extracts new facts (preferences, decisions, dismissed signals) → saves to `founder_notes` table. Returns JSON array.  
**Estimated tokens per call:** ~1K–3K input (prompt template + 6 messages), ~200 output  
**Estimated cost per call:** $0.005–$0.016 (GPT-5.4)  
**Volume:** SAME FREQUENCY AS CHAT. ~20–50 calls/day. **This is the highest-volume GPT-5.4 call in the entire app.**

> 🚨 **Cost flag:** GPT-5.4 is overkill for this task. It's a structured JSON extraction from a short conversation window. GPT-5-mini or Claude Haiku can do this at 10–15× lower cost with essentially identical output quality. See swap analysis below.

---

### 3. Council Mode Chat — 5 Member Responses + Rebuttal
**File:** `src/app/api/chat/council/route.ts`  
**Function:** SSE stream, `COUNCIL[]` member array  
**Models:**

| Member | Model | Why |
|---|---|---|
| Gandalf | `claude-sonnet-4-6` | Deep creative synthesis, Scott's mirror — needs top-tier reasoning |
| Data | `claude-sonnet-4-6` | Systematic audit, structured JSON output — Sonnet handles reliably |
| Polgara | `claude-sonnet-4-6` | Editorial judgment, Anna's voice — nuance requires Sonnet |
| Earl | `gpt-5.4` | Blunt operational voice — GPT-5.4's direct style suits Earl perfectly |
| Beavis & Butthead | `gpt-5-mini` | Binary judgment, low-stakes output — GPT-5-mini is correct here |

**Type:** SSE streaming, all 5 members fire in parallel, then rebuttal round  
**Trigger:** Every user message in Council mode  
**Estimated tokens per full Council exchange:** ~30K–80K total (5 × large system prompts + context + responses)  
**Estimated cost per Council exchange:** $0.15–$0.60 (5 members × avg Sonnet call)  
**Volume:** Lower than solo — maybe 5–15 exchanges/day when Council mode is active.

---

### 4. Daily Brief — Primary Generation
**File:** `src/app/api/briefs/generate/route.ts`  
**Function:** `claude-sonnet-4-6 → main brief JSON`  
**Model:** `claude-sonnet-4-6`  
**max_tokens:** 2048  
**Trigger:** Vercel cron 3:00 UTC daily (7 AM Alaska). Also manual.  
**What it does:** Ingests RSS feeds (9) + GitHub repos (11) + daily.dev (up to 30 posts) + founder notes + research + opportunities + knowledge summaries → produces structured brief JSON with prioritized items, next actions, collision flags.  
**Estimated tokens per call:** 15K–40K input (all that injected context), ~2K output  
**Estimated cost per call:** $0.08–$0.18/brief (Sonnet)  
**Volume:** 1×/day + occasional manual. ~$3–5/month.

---

### 5. Daily Brief — Collision Scoring Pass
**File:** `src/app/api/briefs/generate/route.ts`  
**Function:** `claude-haiku-4-5 → track impact scores`  
**Model:** `claude-haiku-4-5`  
**max_tokens:** 1024  
**Trigger:** Fires immediately after primary brief generation (same cron call)  
**What it does:** Takes the generated brief JSON, scores every item 0–3 on ncho/somersschool/biblesaas tracks. Items scoring ≥2 on 2+ tracks get a `collision_note`. This is the "⚡ Collisions" section.  
**Estimated tokens per call:** ~3K–6K input (brief JSON), ~500 output  
**Estimated cost per call:** ~$0.006–$0.01/run (Haiku)  
**Volume:** Same as brief = 1×/day. Correct model choice here — low cost, low-stakes scoring.

---

### 6. Intel Analysis — Step 2 (Primary Analysis)
**File:** `src/app/api/intel/route.ts`  
**Function:** `anthropic.messages.create()` — Step 2  
**Model:** `claude-sonnet-4-6`  
**max_tokens:** 4000  
**Trigger:** Manual URL paste, daily cron (04:00 UTC), after brief generation (Stage 3), Publishers Weekly paste path  
**What it does:** Fetches URL content (up to multiple URLs, combined), runs structured intelligence analysis → produces JSON with `sections[]` (Direct Impact / Ecosystem Signal / etc.), `proposed_seeds[]`, `summary`.  
**Estimated tokens per call:** 15K–40K input (fetched URLs + system prompt), ~3K output  
**Estimated cost per call:** $0.09–$0.18/session (Sonnet)

---

### 7. Intel Analysis — Step 3 (Haiku Verification Pass)
**File:** `src/app/api/intel/route.ts`  
**Function:** `anthropic.messages.create()` — Step 3  
**Model:** `claude-haiku-4-5`  
**max_tokens:** 4000  
**Trigger:** Immediately after Step 2 (same call chain)  
**What it does:** Cross-checks the Sonnet analysis against the source content. Corrects hallucinated claims, adjusts impact scores, adds `verification_warnings`.  
**Estimated tokens per call:** ~35K input (source content truncated to 30K + Sonnet JSON), ~2K output  
**Estimated cost per call:** ~$0.04/run (Haiku input is large due to 30K source block)

> 🚨 **Optimization flag:** `max_tokens: 4000` is the same cap as the primary Sonnet call. A verification/correction pass rarely needs to produce 4000 tokens — it's rewriting or flagging, not generating from scratch. Could safely be cut to `max_tokens: 1500`. Would reduce output cost by ~60% on this call.

---

### 8. Intel Analysis — Step 4 (Council Synthesis)
**File:** `src/app/api/intel/route.ts`  
**Function:** `anthropic.messages.create()` — Step 4 (non-fatal)  
**Model:** `claude-sonnet-4-6`  
**max_tokens:** 1400  
**Trigger:** After Step 3, always (non-fatal — Intel report saved even if this fails)  
**What it does:** Council of the Unserious voices react to the verified Intel findings. Each member speaks in character. Displayed as "⚔ Council Briefing" block on Intel page.  
**Estimated tokens per call:** ~3K–6K input (findings + seeds formatted), ~1K output  
**Estimated cost per call:** ~$0.02–$0.05/session (Sonnet)  
**Volume:** Every Intel session = 3 API calls total (Sonnet + Haiku + Sonnet).

---

### 9. Email Categorization
**File:** `src/app/api/email/categorize/route.ts`  
**Function:** `anthropic.messages.create()` per batch of 10  
**Model:** `claude-haiku-4-5`  
**max_tokens:** 1024  
**Trigger:** Daily email-digest cron (midnight UTC) calls sync → categorize. Also available manually.  
**What it does:** Classifies emails into 11 categories (spam, vendor, sales_inquiry, customer, newsletter, notification, internal, order, media, other). Batches of 10. Returns `{uid, category, ai_summary, action_required, urgency}` per email.  
**Estimated tokens per batch of 10 emails:** ~2K–4K input, ~500 output  
**Estimated cost per 30 emails:** ~$0.005–$0.01/day (Haiku — correct model choice)

---

### 10. Email Digest Generation
**File:** `src/app/api/cron/email-digest/route.ts`  
**Function:** `anthropic.messages.create()`  
**Model:** `claude-sonnet-4-6`  
**Trigger:** Daily cron midnight UTC, after sync+categorize  
**What it does:** Takes categorized emails grouped by category → generates a `.md` daily digest → saves to `context_files` table (`document_type: 'email_daily', inject_order: 5`) → auto-flows into every chat system prompt.  
**Estimated tokens per call:** ~5K–15K input (email summaries), ~1K output  
**Estimated cost per call:** ~$0.02–$0.07/day (Sonnet)

---

### 11. Dreams AI Review (Earl)
**File:** `src/app/api/dreams/ai-review/route.ts`  
**Function:** `anthropic.messages.create()`  
**Model:** `claude-sonnet-4-6`  
**max_tokens:** 4096  
**Trigger:** Manual only (Scott clicks "Earl Review" button on Dreamer board)  
**What it does:** Earl Harbinger reviews ALL seed dreams — prioritized assessment (promote/dismiss/hold/merge), urgency rating (now/soon/later/never), revenue-focused rationale. Returns JSON array of suggestions. Scott approves each individually; nothing auto-applies.  
**Estimated tokens per call:** ~5K–15K input (all seeds formatted), ~2K output  
**Estimated cost per call:** ~$0.03–$0.12 (Sonnet)  
**Volume:** Occasional. Maybe 5–10/month.

---

### 12. Social Media Post Generation
**File:** `src/app/api/social/generate/route.ts`  
**Function:** `anthropic.messages.create()`  
**Model:** `claude-sonnet-4-6`  
**max_tokens:** 4096  
**Trigger:** Weekly cron (Monday 05:00 UTC) → generates 18 posts. Shopify webhook (new product → auto-generates NCHO launch posts). Manual.  
**What it does:** Generates social posts for 3 brands (NCHO, SomersSchool, Alana Terry) × 3 platforms (Facebook, Instagram, LinkedIn). Brand voice system prompts enforced per brand. Returns post text + hashtags + image brief.  
**Estimated tokens per batch of 18 posts:** ~15K–25K input (system prompt × calls, brand voice blocks), ~6K output  
**Estimated cost per weekly batch:** ~$0.05–$0.12 (Sonnet)  
**Volume:** 1×/week cron + occasional manual + Shopify webhook triggers. ~$0.25–$0.60/month.

---

### 13. YouTube Curriculum Tools
**File:** `src/app/api/youtube/analyze/route.ts`  
**Function:** `getAnthropic().messages.create()`  
**Model:** `claude-sonnet-4-6` (all 8 tool types)  
**max_tokens by tool:**

| Tool | max_tokens | Why |
|---|---|---|
| Quiz | 4096 | Multiple choice + short answer |
| Lesson Plan | 4096 | Standard lesson structure |
| Vocabulary | 8192 | Large vocab lists with context |
| Discussion Questions | 4096 | Open-ended questions |
| DOK Projects | 6000 | Multi-level Depth of Knowledge |
| Graphic Organizers | 4096 | Template structure |
| Guided Notes | 4096 | Fill-in-the-blank |
| Full Analysis | 4096 | Comprehensive overview |

**Trigger:** Manual — Scott pastes a YouTube URL, selects a curriculum tool  
**What it does:** Takes transcript text + grade level as input, generates grade-appropriate curriculum material.  
**Estimated tokens per tool call:** ~10K–25K input (transcript + system prompt + grade context), ~2K–6K output  
**Estimated cost per tool call:** $0.05–$0.18 (Sonnet)  
**Volume:** Occasional. Estimated 10–20 calls/week when actively using YouTube Intelligence.

---

### 14. YouTube Transcript — Gemini 2.5 Flash (Primary Production Path)
**File:** `worker/src/jobs/youtube-transcript.ts`  
**Function:** `fetchGeminiTranscript()` → raw REST call to Google Generative AI API  
**Model:** `gemini-2.5-flash` (via `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`)  
**Trigger:** Every YouTube URL submission (captions + innertube fast path FAIL from cloud IPs → Railway worker always hits Gemini)  
**What it does:** Sends the YouTube video URL as a multimodal input to Gemini. Gemini watches the video natively and returns a verbatim transcript with timestamps. **This is the 100% production path** — no other tier succeeds from Railway's cloud IPs.  
**Estimated tokens:** ~289K tokens for a 20-min video (Gemini counts video frames + audio)  
**Estimated cost:** Currently free tier (Gemini 2.5 Flash: 1M tokens/day free). At Scott's usage level, likely stays free.  
**Fallback:** Tier 5 = `fetchGeminiVideoAnalysis()` — same model, generates educational summary instead of verbatim transcript. Flagged as `gemini-analysis` source in UI.

---

### 15. YouTube Transcript — Whisper-1 (Blocked in Production)
**File:** `worker/src/jobs/youtube-transcript.ts`  
**Function:** `fetch()` to `api.openai.com/v1/audio/transcriptions` with `whisper-1`  
**Model:** `whisper-1`  
**Status:** ⚠️ **NOT CURRENTLY WORKING** — yt-dlp audio download is blocked by YouTube bot-check from Railway IPs. This code path exists but never executes in production.  
**Cost if it worked:** $0.006/minute of audio → $0.12 for 20-min video  
**Note:** If a proxy or residential IP layer were added, this would be significantly cheaper than Gemini for audio-only transcripts.

---

### 16. Research Library — URL/Text Ingest
**File:** `src/app/api/research/route.ts`  
**Function:** `openai.responses.create()` (two calls per ingest)  
**Model:** `gpt-5.4` (both calls)  
**Trigger:** URL paste, text paste, screenshot ingest, quick note  
**What it does:**
- Call 1: Extracts key content, AI summary, tags from the URL/text
- Call 2: Generates a knowledge summary for the `knowledge_summaries` table

**Estimated tokens per ingest:** ~5K–15K input, ~500–1K output each  
**Estimated cost per ingest:** ~$0.03–$0.09 (GPT-5.4 × 2 calls)

---

### 17. Agentic Auto-Research
**File:** `src/app/api/research/auto/route.ts`  
**Function:** `openai.responses.create()`  
**Model:** `gpt-5.4`  
**Trigger:** Manual — "Auto-Research" button with a topic seed  
**What it does:** GPT-5.4 receives Tavily search results and synthesizes them into a research entry with analysis, implications, and action items.  
**Estimated cost per run:** ~$0.05–$0.15 (GPT-5.4, medium context)

---

### 18. Deep Research — Per-Source Synthesis
**File:** `src/app/api/research/deep/route.ts`  
**Function:** `openai.responses.create()`  
**Model:** `gpt-4o-mini`  
**Trigger:** "Deep Research" mode — multiple parallel source synthesis calls  
**What it does:** Each source (Tavily, SerpAPI, Reddit, NewsAPI result) gets its own synthesis call. `gpt-4o-mini` is used here intentionally to keep per-source cost low while running many in parallel.  
**Estimated cost per source call:** ~$0.001–$0.003 (GPT-4o-mini — correct model choice)

---

### 19. Deep Research — Final Multi-Source Synthesis
**File:** `src/app/api/research/deep/route.ts`  
**Function:** `anthropic.messages.create()`  
**Model:** `claude-sonnet-4-20250514` ← **⚠️ STALE MODEL STRING**  
**Trigger:** After all per-source calls complete, final synthesis  
**What it does:** Takes all source syntheses and produces a unified research report.  
**Estimated cost per call:** ~$0.05–$0.15 (Sonnet)

> 🚨 **Bug flag:** Model string `claude-sonnet-4-20250514` is an old version ID. Should be updated to `claude-sonnet-4-6` to use the current model and ensure consistent API availability.

---

### 20. Content Studio
**File:** `src/app/api/content-studio/route.ts`  
**Function:** `anthropic.messages.create()`  
**Model:** `claude-sonnet-4-6`  
**Trigger:** Manual — Scott clicks Generate in Content Studio (newsletter, curriculum guide, product description)  
**Estimated cost per call:** ~$0.03–$0.10 (Sonnet)  
**Volume:** Occasional. ~5–15/month.

---

### 21. Curriculum Factory Worker — Pass 1 (Gandalf)
**File:** `worker/src/jobs/curriculum-factory.ts`  
**Function:** `callCouncilMember("gandalf", ...)`  
**Model:** `claude-sonnet-4-6`  
**max_tokens:** 4096  
**What it does:** Creates complete scope & sequence from zero — units, lessons, pacing, style hints, energy levels, standards codes, key concepts, big ideas. The creative foundation everything else builds on.  
**Why Sonnet:** Only full-pass creation from zero in the pipeline. No compromise.  
**Estimated tokens:** ~8K–15K input (system prompt + curriculum context + national standards), ~4K output  
**Estimated cost:** ~$0.08–$0.12

---

### 22. Curriculum Factory Worker — Pass 2 (Data)
**File:** `worker/src/jobs/curriculum-factory.ts`  
**Function:** `callCouncilMember("data", ...)`  
**Model:** `claude-sonnet-4-6`  
**max_tokens:** 4096  
**What it does:** Systematic audit of Gandalf's draft — checks standards coverage, pacing math, prerequisite sequencing, monotone style/energy patterns. Produces numbered findings list.  
**Why Sonnet:** Standards alignment checking requires precise pattern recognition across the full scope. Haiku misses things.  
**Estimated tokens:** ~12K–20K input (Gandalf draft + audit system prompt), ~2K output  
**Estimated cost:** ~$0.07–$0.11

---

### 23. Curriculum Factory Worker — Pass 3 (Polgara)
**File:** `worker/src/jobs/curriculum-factory.ts`  
**Function:** `callCouncilMember("polgara", ...)`  
**Model:** `claude-sonnet-4-6`  
**max_tokens:** 4096  
**What it does:** Synthesizes Gandalf + Data critique into the final production-ready curriculum document. Child-first editorial lens. This output (`finalScopeAndSequence`) is what the human reads and what feeds Pass 6 extraction.  
**Why Sonnet:** Editorial synthesis + "does this actually serve the child?" judgment — this is the pass Scott would read and trust. No downgrade.  
**Estimated tokens:** ~16K–25K input (Gandalf + Data critique + system prompt), ~4K output  
**Estimated cost:** ~$0.09–$0.14

---

### 24. Curriculum Factory Worker — Pass 4 (Earl)
**File:** `worker/src/jobs/curriculum-factory.ts`  
**Function:** `callWithOpenAI("earl", ..., "gpt-5.4")`  
**Model:** `gpt-5.4`  
**What it does:** Operational viability — build order, revenue timeline, minimum viable version, go/no-go recommendation. Earl's direct, blunt voice.  
**Why GPT-5.4:** This is a genuinely great model split. Earl's character — terse, no-nonsense operational thinking — maps well to GPT-5.4's style vs. Claude's more elaborate responses. Also intentionally demonstrates multi-provider architecture.  
**Estimated cost:** ~$0.06–$0.14

---

### 25. Curriculum Factory Worker — Pass 5 (Beavis & Butthead)
**File:** `worker/src/jobs/curriculum-factory.ts`  
**Function:** `callWithOpenAI("beavis", ..., "gpt-5-mini")`  
**Model:** `gpt-5-mini`  
**What it does:** Binary COOL/SUCKS/MEH verdict per unit. Energy flow check. Would a real kid care about this? Low-stakes output — no reasoning depth required.  
**Why GPT-5-mini:** Perfect model-to-task match. B&B produce short, blunt takes. `gpt-5-mini` is capable of this and 10–15× cheaper than Sonnet.  
**Estimated cost:** ~$0.003–$0.008

---

### 26. Curriculum Factory Worker — Pass 6 (JSON Extraction)
**File:** `worker/src/jobs/curriculum-factory.ts`  
**Function:** `extractStructuredOutput()`  
**Model:** `claude-sonnet-4-6`  
**What it does:** Converts Polgara's markdown curriculum document into validated SomersSchool pipeline JSON (`structuredOutput`). Enforces canonical subject labels, computes pacing math, ensures explicit `is_review_lesson` flags, validates schema.  
**Why Sonnet:** Precise structured extraction from rich prose. Haiku struggles with complex multi-level JSON schemas reliably.  
**Estimated cost:** ~$0.07–$0.11

> **Total cost per curriculum job:** ~$0.41–$0.66 (4 × Sonnet + 1 × GPT-5.4 + 1 × GPT-5-mini)

---

### 27. Python Council Worker — CrewAI Agents (LEGACY PATH)
**File:** `council-worker/agents/gandalf.py`, `data_officer.py`, `polgara.py`, `earl.py`, `beavis.py`  
**Model:** ⚠️ **UNKNOWN — NO `llm=` PARAMETER SET IN ANY AGENT**  
**Default behavior:** CrewAI ≥0.28 defaults to `OPENAI_MODEL_NAME` env var → falls back to `gpt-4o`  
**What it does:** Same 5-pass Council session as the TS worker, but via Python CrewAI framework with tool access (search, Supabase read, curriculum context).  
**Exception:** Pass 6 JSON extraction directly calls `claude-sonnet-4-6` via Anthropic SDK  
**Status:** This is the LEGACY path. The TypeScript Railway worker (`worker/src/jobs/curriculum-factory.ts`) is the primary production path.

> 🚨 **Action required:** Check Railway Python worker env for `OPENAI_MODEL_NAME`. If unset, it's hitting `gpt-4o` by default at $3.25/$15 per MTok — significantly more expensive than intended and possibly using a deprecated model.

---

## Cost Summary by Category

| Category | Model(s) | Est. Daily Cost | Main Driver |
|---|---|---|---|
| Chat (solo, active use) | GPT-5.4 default | $0.60–$3.00/day | Context-heavy system prompts |
| Extract-learnings | GPT-5.4 | $0.10–$0.80/day | Fires on EVERY message |
| Council mode (active use) | Sonnet × 3 + GPT-5.4 + GPT-5-mini | $0.75–$4.50/day | 5 parallel calls per exchange |
| Daily brief | Sonnet + Haiku | $0.09–$0.19/day | Once daily, fixed |
| Intel sessions | Sonnet + Haiku + Sonnet | $0.15–$0.41/session | Manual trigger |
| Email pipeline | Haiku + Sonnet | $0.03–$0.08/day | Once daily, fixed |
| Curriculum factory | Sonnet × 4 + GPT-5.4 + GPT-5-mini | $0.41–$0.66/job | Per job |
| YouTube tools | Sonnet | $0.05–$0.18/call | Manual |
| YouTube transcript | Gemini 2.5 Flash | **$0.00** (free tier) | Fixed free tier |
| Research ingest | GPT-5.4 × 2 | $0.06–$0.18/item | Manual |
| Social generation | Sonnet | $0.05–$0.12/batch | Weekly cron |
| Content studio | Sonnet | $0.03–$0.10/call | Manual |

**Estimated monthly total (light usage):** $20–$60/month  
**Estimated monthly total (active daily use):** $80–$200/month  
**Single biggest lever:** Extract-learnings running on GPT-5.4.

---

## Model Swap Feasibility Analysis

### Swap 1: Extract-Learnings GPT-5.4 → GPT-5-mini ✅ RECOMMENDED
**Impact:** Highest-priority swap. Fires on every single chat message.  
**Current cost:** ~$0.005–$0.016/call  
**Swapped cost:** ~$0.0003–$0.001/call  
**Savings:** 15–20× reduction  
**Risk level:** LOW. This is a simple JSON extraction from a short conversation window (6 messages). The task is:
- Is there a new preference/decision in the last 3 exchanges?
- If yes, format it as a short JSON entry.  

GPT-5-mini handles structured extraction from short contexts reliably. Claude Haiku 4.5 also works. The 512-token output cap means there's no room for model quality to matter much anyway.  
**Recommendation:** Swap to `gpt-5-mini`. Or `claude-haiku-4-5` if you want to consolidate to one provider.

---

### Swap 2: Intel Haiku Verification `max_tokens: 4000 → 1500` ✅ EASY WIN
**Impact:** Cuts output cost on the verification pass by ~60%.  
**What happens:** The verification pass checks the Sonnet analysis against source content. It corrects claims and adjusts scores — it doesn't create new analysis. 4000 tokens is the primary analysis cap; the verification rarely needs that much room.  
**Risk level:** VERY LOW. Just change the number.  
**Recommendation:** Change `max_tokens: 4000` to `max_tokens: 1500` in Step 3.

---

### Swap 3: Deep Research Final Synthesis — Fix Stale Model String ✅ REQUIRED
**File:** `src/app/api/research/deep/route.ts`  
**Current:** `model: "claude-sonnet-4-20250514"`  
**Should be:** `model: "claude-sonnet-4-6"`  
**Risk:** If Anthropic deprecates the old model ID, this route silently breaks. Zero cost change — it's the same model, just the current canonical ID.  
**Recommendation:** Fix immediately.

---

### Swap 4: Python Council Worker — Set `OPENAI_MODEL_NAME` ✅ REQUIRED
**Problem:** 5 CrewAI agents have no `llm=` parameter. CrewAI defaults to `gpt-4o` if `OPENAI_MODEL_NAME` is unset.  
**What to do:** In Railway Python worker env, set `OPENAI_MODEL_NAME=gpt-4o-mini`  
**Or better:** Add `llm=` parameter to each agent definition pointing to the intended model.  
**Risk of doing nothing:** Unknown cost hitting `gpt-4o` ($3.25/$15 per MTok) instead of a specified cheaper model.

---

### Swap 5: Research Ingest GPT-5.4 → GPT-4o-mini 🟡 CONSIDER
**Files:** `src/app/api/research/route.ts` (both calls)  
**Current model:** `gpt-5.4`  
**Why it was chosen:** Comprehensive extraction quality — better tagging, richer summaries.  
**Swap to:** `gpt-4o-mini` ($0.15/$0.60 per MTok)  
**Savings:** ~20× reduction per ingest  
**Risk level:** MEDIUM. Research ingest summary quality would decrease somewhat — shorter summaries, potentially less insightful tags. But this is a data-entry task, not a reasoning task.  
**Recommendation:** Test on 10 ingests and compare summaries. If quality holds, swap. If not, use `claude-haiku-4-5` as a middle ground ($0.80/$4 per MTok — 6× cheaper than GPT-5.4, better at longer context than GPT-4o-mini).

---

### Swap 6: Daily Brief Sonnet → Target Haiku for Generation 🔴 NOT RECOMMENDED
**Why not:** The brief requires synthesizing 40–60+ items across RSS, GitHub, daily.dev, plus deeply contextual business knowledge to identify what actually matters. This is high-stakes filtering. Haiku at this complexity level produces noticeably worse prioritization and misses cross-track collision signals.  
**Better approach:** Keep Sonnet for generation. The $0.09–$0.19/day cost is already low.

---

### Swap 7: Council Chat Members Sonnet → Lower Tier 🔴 NOT RECOMMENDED
**Why not:** Council mode is an intentional premium experience. The whole value proposition is multi-perspective high-quality reasoning. Downgrading Gandalf/Data/Polgara to Haiku would visibly degrade the quality of responses. Earl on GPT-5.4 and B&B on GPT-5-mini are already correctly tiered.  
**Exception:** If Council mode gets heavy use and costs spike, consider routing Data (auditor) to Haiku — structured auditing with numbered findings is where Haiku performs best relative to the task.

---

### Swap 8: YouTube Transcript Gemini → Keep Gemini ✅ STAY
**Why stay:** Gemini 2.5 Flash handles YouTube video natively (multimodal) and is currently FREE at Scott's usage level. The only alternative (Whisper-1) requires yt-dlp audio download which is blocked by YouTube from Railway IPs. Nothing else comes close.  
**If free tier exceeded:** Gemini 2.5 Flash paid tier is ~$0.075/MTok, still cheap for video. A 20-min video runs ~289K tokens → ~$0.02/transcript.

---

### Swap 9: Intel Main Analysis Haiku → Sonnet 🟡 CONTEXT DEPENDENT
**The current setup is correct** — Sonnet for primary analysis (where quality matters most), Haiku for verification (cross-checking, not originating). Don't swap.  
**Potential Gemini route:** Gemini 2.5 Flash could theoretically replace the Sonnet Intel analysis call (native URL fetching, 1M context). Would save ~$0.09–$0.18/session. Not recommended currently — structured JSON output from Gemini is less reliable than Sonnet, and Intel output drives actionable decisions.

---

### Swap 10: Groq for Internal Non-Student Tasks 🟢 VALID OPTION
**Where Groq could work:** Any Chapterhouse call that is purely internal ops (no student data, no Anna's book content) and where latency/cost matter more than top-tier reasoning.  
**Candidates:**
- Extract-learnings (if not switching to GPT-5-mini — Groq Llama 3.3 70B is ~4000× cheaper than GPT-5.4)
- Research ingest synthesis
- Email digest generation (low-stakes daily summary)

**Hard constraint:** Groq CANNOT process student content (SomersSchool). Chapterhouse has no student data *today*, so all current calls would technically qualify. But if any SomersSchool lesson or student content gets ingested (e.g., via YouTube curriculum tools), that call must use Anthropic or Azure-tier providers.  
**Recommendation:** Groq is a valid option for extract-learnings and email digest. Plan carefully — if a student-related conversation triggers extract-learnings (when SomersSchool teachers/students eventually use Chapterhouse spin-offs), the Groq call would be a data protection violation. Probably safer to use GPT-5-mini.

---

## Action Items — Priority Order

| Priority | Action | File | Effort | Savings |
|---|---|---|---|---|
| 🔴 P1 | Fix stale model string `claude-sonnet-4-20250514` → `claude-sonnet-4-6` | `research/deep/route.ts` | 1 min | Prevents silent breakage |
| 🔴 P1 | Set `OPENAI_MODEL_NAME` in Railway Python worker env | Railway dashboard | 5 min | Stops unknown cost on `gpt-4o` default |
| 🟡 P2 | Swap extract-learnings to `gpt-5-mini` | `extract-learnings/route.ts` | 2 min | 15–20× reduction on highest-volume call |
| 🟡 P2 | Reduce Intel Haiku verification `max_tokens: 4000 → 1500` | `intel/route.ts` | 1 min | ~60% output cost reduction on Step 3 |
| 🟢 P3 | Test research ingest with `claude-haiku-4-5` — compare summary quality | `research/route.ts` | 30 min test | ~6× reduction if quality holds |
| 🔵 P4 | Add Langfuse instrumentation to all calls | Multiple files | 2–3 days | Enables real-cost measurement vs estimates |

---

## Langfuse Integration Note

**The estimates in this document are approximations.** Real token counts depend on actual context sizes at runtime (founder_notes size, brief length, email volume, etc.) which vary significantly.

To get actual measured costs, wire Langfuse into every AI call:
```typescript
import Langfuse from "langfuse";
const langfuse = new Langfuse();
const trace = langfuse.trace({ name: "extract-learnings", userId: "scott" });
const generation = trace.generation({
  name: "fact-extraction",
  model: "gpt-5-mini",
  input: prompt,
});
// ... call AI ...
generation.end({ output: result, usage: { input: tokensIn, output: tokensOut } });
```

Keys are in `.env.master`. This is the actual production cost data — all estimates above are educated guesses until Langfuse is wired.

**Per the locked architectural decision:** Wire Langfuse into every AI-calling app BEFORE charging customers.
