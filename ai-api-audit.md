# Chapterhouse — Complete AI API Call Audit
*Generated: March 2026. Covers all three deployments: Vercel app (`src/`), Railway worker (`worker/`), Python council-worker (`council-worker/`).*

---

## Audit Key

| Field | Definition |
|---|---|
| **Model** | Exact string passed to API |
| **SDK/Client** | How the call is made |
| **Streaming** | Whether response is streamed (SSE) or awaited in full |
| **max_tokens** | Token cap on the response (≠ input tokens) |
| **Sys prompt** | Rough size of the system prompt |
| **Notes** | Special params, quirks, cost factors |

---

## ⚠️ Key Architecture Facts (Read Before Cost Analysis)

1. **Two OpenAI API styles are in use:**
   - **Vercel routes** use the **Responses API**: `openai.responses.create()` with `instructions:` + `input:` fields and `max_output_tokens:`
   - **Railway worker** uses the **legacy Chat Completions API**: `openai.chat.completions.create()` with `messages:` and `max_tokens:`
   - These are billed at the same rate but behave differently. The Responses API passes chain-of-thought between turns.

2. **Gemini calls are raw REST** — no `@google/generative-ai` SDK. Direct `fetch()` to `generativelanguage.googleapis.com`. The Railway worker uses Gemini; the Vercel app does not.

3. **`extract-learnings`** fires silently after **every single chat message** — it's the highest-frequency call in the app.

4. **Council chat** can fire up to 10 API calls per user message (5 members × main + rebuttal rounds), though `selectMembers()` reduces this to 3 calls for short queries (<15 words).

5. **Curriculum factory** = exactly 6 API calls per job, always.

---

## PART 1 — VERCEL APP (`src/app/api/`)

---

### #1 — Solo Chat

| Attribute | Value |
|---|---|
| **File** | `src/app/api/chat/route.ts` |
| **Route** | `POST /api/chat/` |
| **Task** | Primary internal AI assistant — research, drafting, commands, Q&A |
| **Model** | Dynamic — passed from request body. Default: `gpt-5.4`. Supported: any OpenAI or Anthropic model string. |
| **SDK/Client** | OpenAI `responses.create({stream:true})` for OpenAI models; Anthropic `messages.stream()` for Claude models |
| **Streaming** | ✅ Yes — SSE |
| **max_tokens** | Not hardcoded — uses API default (model-specific) |
| **Sys prompt** | VERY LARGE — `FALLBACK_SYSTEM_PROMPT` (~80 lines) + `APP_ARCHITECTURE_BLOCK` (~50 lines) + live Supabase context injected via `buildLiveContext()` (brief, research items, founder notes, intel, opportunities, pushed context docs, email digest, push log, dismissed signals) |
| **Notes** | `/dismiss` and `/undismiss` commands bypass the AI entirely (direct DB write, no token cost). URL detection in user message triggers SSRF-protected page fetch (up to 12K chars added as context). Email intent detection triggers email table query. `extract-learnings` fires in parallel on every message (see #4). |

---

### #2 — Council Mode Chat (up to 10 calls per message)

| Attribute | Value |
|---|---|
| **File** | `src/app/api/chat/council/route.ts` |
| **Route** | `POST /api/chat/council/` (SSE stream) |
| **Task** | Multi-member Council of the Unserious responses — 5 AI personas respond in sequence, then rebut each other |
| **Streaming** | ✅ Yes — SSE |
| **Sys prompt per member** | LARGE — each member has dedicated persona system prompt (~30-50 lines) |

**Per-member call breakdown:**

| Member | Model | SDK | max_tokens (main) | max_tokens (rebuttal) | Notes |
|---|---|---|---|---|---|
| **Gandalf** | `claude-sonnet-4-6` | Anthropic `messages.stream()` | 1500 | 300 | Always fires |
| **Data** | `claude-sonnet-4-6` | Anthropic `messages.stream()` | 1500 | 300 | Always fires |
| **Polgara** | `claude-sonnet-4-6` | Anthropic `messages.stream()` | 1500 | 300 | Always fires |
| **Earl** | `gpt-5.4` | OpenAI `responses.create({stream:true})` | 1500 | 300 | Always fires |
| **Beavis & Butthead** | `gpt-5-mini` | OpenAI `responses.create({stream:true})` | 1500 | — | No rebuttal round |

**Selection logic:** `selectMembers()` — queries < 15 words trigger 3-member mode (Gandalf/Data/Polgara only). Queries > 40 words or complex questions trigger all 5. Technical questions skip Earl and B&B.

**Maximum calls per user message:** 5 main + 4 rebuttal = 9 calls (B&B skips rebuttal). Minimum: 3 main + 2 rebuttal = 5 calls.

---

### #3 — Daily Brief Generation (2 calls)

| Attribute | Value |
|---|---|
| **File** | `src/app/api/briefs/generate/route.ts` |
| **Route** | `POST /api/briefs/generate/` (also triggered by Vercel cron `GET /api/cron/daily-brief/` at 3:00 UTC) |
| **Task** | Generate daily intelligence brief from RSS + GitHub + daily.dev + email sources |
| **Streaming** | ❌ No — non-streaming |

**Call A — Brief generation:**

| Field | Value |
|---|---|
| **Model** | `claude-sonnet-4-6` |
| **SDK** | Anthropic `messages.create()` |
| **max_tokens** | 2048 |
| **Sys prompt** | VERY LARGE — `SYSTEM_PROMPT` (~100 lines): 3 business tracks with full details, JSON output schema (all brief sections), section scoring rules, brand voice rules, days-remaining context |
| **User prompt** | Dynamically assembled: `founderMemoryBlock` (up to 30 notes) + `researchBlock` (up to 20 items) + `opportunitiesBlock` (up to 8 items) + `knowledgeSummaryBlock` + live RSS/GitHub/daily.dev feed data |

**Call B — Track impact scoring:**

| Field | Value |
|---|---|
| **Model** | `claude-haiku-4-5` |
| **SDK** | Anthropic `messages.create()` |
| **max_tokens** | 1024 |
| **Sys prompt** | MEDIUM — `scoreTrackImpacts()` system (~20 lines): scoring schema for NCHO/SomersSchool/BibleSaaS 0-3, collision detection rules |
| **Input** | Generated brief JSON → score every item against 3 tracks; items ≥2 on 2+ tracks get `collision_note` |
| **Cost** | ~$0.002/brief for this pass |

---

### #4 — Extract Learnings (fires after EVERY chat message)

| Attribute | Value |
|---|---|
| **File** | `src/app/api/extract-learnings/route.ts` |
| **Route** | `POST /api/extract-learnings/` |
| **Task** | Silent background call — extracts new facts and dismiss signals from the most recent conversation exchange; saves to `founder_notes` |
| **Model** | `gpt-5.4` |
| **SDK/Client** | OpenAI `responses.create()` (Responses API) |
| **Streaming** | ❌ No |
| **max_output_tokens** | 512 |
| **Sys prompt** | "You output only valid JSON arrays. No markdown fences. No explanation." |
| **Input** | Last 6 messages (3 exchanges) formatted as Scott/Chapterhouse dialogue |
| **Notes** | ⚠️ **HIGHEST FREQUENCY CALL IN THE APP** — fires on every single chat message. Detects natural-language dismiss intent ("ignore/irrelevant/skip") → saves as `{category: 'dismissed'}`. Returns array of `{content, category}` facts. |

---

### #5 — Agentic Auto-Research

| Attribute | Value |
|---|---|
| **File** | `src/app/api/research/auto/route.ts` |
| **Route** | `POST /api/research/auto/` |
| **Task** | Analyze individual web content snippets from Tavily search results; returns structured research item metadata |
| **Model** | `gpt-5.4` |
| **SDK/Client** | OpenAI `responses.create()` (Responses API) |
| **Streaming** | ❌ No |
| **max_output_tokens** | 512 |
| **Instructions** | "You output only valid JSON. No markdown fences." |
| **Input** | Web content (up to 3000 chars) + source URL + Scott's business context |
| **Output** | `{title, summary, verdict, tags}` — one call per URL in the Tavily batch |
| **Notes** | Called once per URL; a typical agentic research session may fire this 3-10 times. |

---

### #6 — YouTube Curriculum Analyzer

| Attribute | Value |
|---|---|
| **File** | `src/app/api/youtube/analyze/route.ts` |
| **Route** | `POST /api/youtube/analyze/` |
| **Task** | Convert YouTube transcript to one of 8 curriculum output types: quiz, lesson-plan, vocabulary, discussion, DOK-project, graphic-organizer, guided-notes, full-analysis |
| **Model** | `claude-sonnet-4-6` (all output types) |
| **SDK/Client** | Anthropic `messages.create()` via `getAnthropic()` |
| **Streaming** | ❌ No |
| **Sys prompt** | None — all context in user message |

**max_tokens by output type:**

| Output Type | max_tokens | temperature |
|---|---|---|
| quiz | 4096 | 0.7 |
| vocabulary | 4096 | 0.7 |
| discussion | 4096 | 0.8 |
| lesson-plan | 4096 | 0.7 |
| dok-project | 4096 | 0.7 |
| guided-notes | 4096 | 0.7 |
| graphic-organizer | **6000** | 0.7 |
| full-analysis | **8192** | 0.7 |

**Notes:** Prompt is built dynamically by `buildPrompt(outputType, ...)` — several hundred lines of prompt templates covering 4 note styles (cornell/outline/fillinblank/guided), 6 organizer types, 4 DOK levels; optional add-ons (reading passage ~30 lines, exit ticket ~15 lines). Inputs: `videoTitle`, `transcript`, `outputType`, `options` (gradeLevel, numMultipleChoice, numShortAnswer, numTrueFalse, numFillInBlank, difficulty, dokLevel, includeSocratic, includeDebate, noteStyle, organizerType, projectType, duration, includeReading, includeExitTicket).

---

### #7 — Content Studio

| Attribute | Value |
|---|---|
| **File** | `src/app/api/content-studio/route.ts` |
| **Route** | `POST /api/content-studio/` |
| **Task** | AI content generation in 3 modes: newsletter/campaign, curriculum guide, product description |
| **Model** | `claude-sonnet-4-6` |
| **SDK/Client** | Anthropic `messages.create()` |
| **Streaming** | ❌ No |
| **max_tokens** | 1500 |
| **Sys prompt** | None — brand voice + instructions included in user message via prompt builders |
| **Notes** | 3 prompt builders: `buildNewsletterPrompt()`, `buildCurriculumGuidePrompt()`, `buildProductDescriptionPrompt()`. Brand voice block is ~10 lines inline. |

---

### #8 — Dreams / Earl AI Review

| Attribute | Value |
|---|---|
| **File** | `src/app/api/dreams/ai-review/route.ts` |
| **Route** | `POST /api/dreams/ai-review/` |
| **Task** | Earl Harbinger reviews all dream seeds and suggests promote/dismiss/hold/merge actions |
| **Model** | `claude-sonnet-4-6` |
| **SDK/Client** | Anthropic `messages.create()` |
| **Streaming** | ❌ No |
| **max_tokens** | **4096** |
| **Sys prompt** | MEDIUM (~10 lines) — Earl persona, May 2026 deadline, suggest-only (never auto-applies) |
| **Input** | All seeds in structured format + active dreams context |
| **Notes** | Returns JSON array of suggestions: `{seed_id, action, rationale}`. Scott approves each individually. Never auto-modifies the database. |

---

### #9 — Intel Analysis (3 calls per session)

| Attribute | Value |
|---|---|
| **File** | `src/app/api/intel/route.ts` |
| **Route** | `POST /api/intel/`, `POST /api/intel/process/`, `POST /api/intel/publishers-weekly/`, `GET /api/cron/intel-fetch/` |
| **Task** | 4-step intelligence processing pipeline: fetch URLs → primary analysis → verification → Council synthesis |
| **Streaming** | ❌ No — all three calls non-streaming |

**Call A — Primary Intel Analysis (Step 2):**

| Field | Value |
|---|---|
| **Model** | `claude-sonnet-4-6` |
| **SDK** | Anthropic `messages.create()` |
| **max_tokens** | **4000** |
| **Sys prompt** | LARGE — `INTEL_SYSTEM_PROMPT` (business impact scoring rules, affected-repo tagging, proposed seed generation, JSON output schema) |
| **Input** | Fetched URL content (up to 20 URLs, concatenated) + extra_content (optional paste) |

**Call B — Verification Pass (Step 3):**

| Field | Value |
|---|---|
| **Model** | `claude-haiku-4-5` |
| **SDK** | Anthropic `messages.create()` |
| **max_tokens** | **4000** |
| **Sys prompt** | LARGE — `VERIFICATION_SYSTEM_PROMPT` (cross-checks claims against source content, adds verification_warnings) |
| **Input** | Original source content (up to 30K chars) + Step 2 JSON output |

**Call C — Council of the Unserious Synthesis (Step 4):**

| Field | Value |
|---|---|
| **Model** | `claude-sonnet-4-6` |
| **SDK** | Anthropic `messages.create()` |
| **max_tokens** | 1400 |
| **Sys prompt** | LARGE — `COUNCIL_SYNTHESIS_PROMPT` (all 5 members respond in voice: Gandalf/Data/Polgara/Earl/B&B) |
| **Input** | Session date + summary + findings list + proposed seeds |
| **Notes** | Non-fatal — if this call fails, Intel report is still saved and returned without commentary. |

---

### #10 — Social Media Post Generation

| Attribute | Value |
|---|---|
| **File** | `src/app/api/social/generate/route.ts` |
| **Route** | `POST /api/social/generate/` |
| **Task** | Generate social media posts for 3 brands × 3 platforms |
| **Model** | `claude-sonnet-4-6` |
| **SDK/Client** | Anthropic `messages.create()` via `new Anthropic({apiKey:...})` |
| **Streaming** | ❌ No |
| **max_tokens** | **4096** |
| **Sys prompt** | LARGE — `BRAND_VOICE_SYSTEM` (~50 lines): brand voice rules for NCHO / SomersSchool / Alana Terry + platform format rules (facebook/instagram/linkedin) + JSON array output schema |
| **Input** | brands[], platforms[], count_per_combo (1-7), topic_seed (optional) |
| **Notes** | Returns flat JSON array, one object per brand+platform+post combo. Strips markdown fences from response before JSON.parse(). |

---

### #11 — Email Categorization

| Attribute | Value |
|---|---|
| **File** | `src/app/api/email/categorize/route.ts` |
| **Route** | `POST /api/email/categorize/` |
| **Task** | Batch-classify uncategorized emails into categories (spam/vendor/sales_inquiry/customer/newsletter/notification/internal/order/media/other) + urgency scoring + action detection |
| **Model** | `claude-haiku-4-5` |
| **SDK/Client** | Anthropic `messages.create()` via `getAnthropic()` |
| **Streaming** | ❌ No |
| **max_tokens** | 1024 |
| **Sys prompt** | `CATEGORIZE_SYSTEM_PROMPT` (size: medium, ~20-30 lines — category definitions, urgency scale 0-5, JSON output schema) |
| **Input** | Batch of up to 10 emails per call (uid, from_name, from_address, subject, snippet) |
| **Notes** | Processes up to 30 emails per invocation in batches of 10. Each batch = 1 API call. So up to 3 Haiku calls per `/categorize` request. Results: `{uid, category, ai_summary, action_required, urgency}` |

---

### #12 — Email Digest Generation

| Attribute | Value |
|---|---|
| **File** | `src/app/api/cron/email-digest/route.ts` |
| **Route** | `GET /api/cron/email-digest/` (cron: `0 0 * * *` — midnight UTC) |
| **Task** | Generate daily email digest in markdown; save to `context_files` (inject_order=5) for auto-injection into chat |
| **Model** | `claude-sonnet-4-6` |
| **SDK/Client** | Anthropic `messages.create()` via `getAnthropic()` |
| **Streaming** | ❌ No |
| **max_tokens** | 2000 |
| **Sys prompt** | `DIGEST_SYSTEM_PROMPT` (MEDIUM — outputs .md digest with action-required section, category groups) |
| **Input** | Today's emails grouped by category: uid, subject, from, ai_summary, action_required flag, urgency |
| **Notes** | Runs after sync + categorize steps. Falls back to auto-generated markdown if Claude fails. Deactivates previous `email_daily` context_files before inserting new one. |

---

### #13 — Knowledge Summarizer

| Attribute | Value |
|---|---|
| **File** | `src/app/api/summarize/route.ts` |
| **Route** | `POST /api/summarize/` |
| **Task** | Distill a tag-grouped set of research items into permanent knowledge bullets (3-6 bullets per tag group) |
| **Model** | `claude-sonnet-4-6` |
| **SDK/Client** | Anthropic `messages.create()` via `getAnthropic()` |
| **Streaming** | ❌ No |
| **max_tokens** | 600 |
| **Sys prompt** | None — context included in user message |
| **Input** | Research items grouped by tag (title, summary, verdict per item). At least 2 items per group required. |
| **Notes** | One API call per tag group. Prompt includes explicit instruction: "Write concrete facts, NOT vague summaries." Each call processes one tag group only. |

---

## PART 2 — RAILWAY WORKER (`worker/src/jobs/`)

---

### #14 — Curriculum Factory (6 calls per job)

| Attribute | Value |
|---|---|
| **File** | `worker/src/jobs/curriculum-factory.ts` |
| **Route** | `POST /process-job` (Railway Express server, triggered by QStash) |
| **Task** | 6-pass Council of the Unserious curriculum scope & sequence generation |
| **Streaming** | ❌ No — all passes non-streaming (background job) |

**Pass breakdown:**

| Pass | Member | Model | SDK/Client | max_tokens | System Prompt |
|---|---|---|---|---|---|
| 1 — draft | Gandalf | `claude-sonnet-4-6` | Anthropic `messages.create()` | 4096 | `COUNCIL_PROMPTS["gandalf"]` — LARGE (~40 lines): Scott's mirror, structural rules (variable units, N+1 pacing, style/energy requirements) |
| 2 — audit | Data | `claude-sonnet-4-6` | Anthropic `messages.create()` | 4096 | `COUNCIL_PROMPTS["data"]` — LARGE (~35 lines): standards coverage, pacing math verification, structural checks |
| 3 — finalize | Polgara | `claude-sonnet-4-6` | Anthropic `messages.create()` | 4096 | `COUNCIL_PROMPTS["polgara"]` — LARGE (~40 lines): child-first lens, narrative arc, structural PRESERVE requirements |
| 4 — ops | Earl | `gpt-5.4` | OpenAI `chat.completions.create()` *(legacy style)* | 4096 | `COUNCIL_PROMPTS["earl"]` — MEDIUM (~25 lines): operational viability, build order, revenue path |
| 5 — engagement | Beavis | `gpt-5-mini` | OpenAI `chat.completions.create()` *(legacy style)* | 4096 | `COUNCIL_PROMPTS["beavis"]` — MEDIUM (~20 lines): COOL/SUCKS/MEH verdict per unit, energy flow, style variety check |
| 6 — extract JSON | (tool) | `claude-sonnet-4-6` | Anthropic `messages.create()` | **8192** | `"You output only valid JSON. No markdown fences, no commentary, no explanation."` |

**Pass 6 extra detail:** Extraction prompt is ~70 lines including: full JSON schema template with canonical field names, structural rules, lesson variety rules, content rules (all secular, Alaska Statute 14.03.320). Post-extraction fixup runs in code (no AI): canonical subject label, `schema_version`, `generated_at`, `generated_by`, `is_review_lesson` on every lesson, pacing math correction, sequential lesson renumbering, `total_lessons`/`total_units` recomputation.

**⚠️ API style difference:** Passes 4-5 use `openai.chat.completions.create()` (legacy Chat Completions API), NOT the Responses API used in Vercel routes. Same billing but different call shape (`messages:[]` + `max_tokens:` vs `input:` + `max_output_tokens:`).

---

### #15 — YouTube Transcript Worker (3 AI calls, serial fallback)

| Attribute | Value |
|---|---|
| **File** | `worker/src/jobs/youtube-transcript.ts` |
| **Route** | `POST /process-job` (Railway, triggered by QStash when Vercel fast path fails) |
| **Task** | Extract YouTube video transcript via 4-tier fallback: yt-dlp subtitles → Gemini verbatim → audio download + STT → Gemini analysis |
| **Streaming** | ❌ No |

**Tier 6 — Gemini Verbatim Transcript (primary production path):**

| Field | Value |
|---|---|
| **Model** | `gemini-2.5-flash` |
| **SDK/Client** | Raw REST `fetch()` to `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=...` |
| **maxOutputTokens** | **16384** |
| **temperature** | 0.1 |
| **timeout** | 180 seconds |
| **Input** | YouTube URL as `fileData.fileUri` (Gemini watches the actual video) + text instruction for `[MM:SS] timestamp` verbatim transcript |
| **Notes** | This is the call that actually works in production (~77s for 20-min video, ~21K chars). Preceded by YouTube Data API metadata validation to guard against hallucinations. |

**Tier 5 — Gemini Educational Analysis (last-resort fallback):**

| Field | Value |
|---|---|
| **Model** | `gemini-2.5-flash` |
| **SDK/Client** | Raw REST `fetch()` same endpoint |
| **maxOutputTokens** | **8192** |
| **temperature** | 0.2 |
| **timeout** | 90 seconds |
| **Input** | YouTube URL as `fileData.fileUri` + 7-section structured analysis prompt (~30 lines): CONTENT SUMMARY / KEY TOPICS / KEY VOCABULARY / LEARNING OBJECTIVES / VISUAL ELEMENTS / SPEAKER NOTES / TIMELINE |
| **Notes** | Flagged as `gemini-analysis` source in DB — UI shows warning badge. Not verbatim transcript. Structured educational breakdown used as fallback. |

**Tier 3 — OpenAI Whisper (audio transcription fallback):**

| Field | Value |
|---|---|
| **Model** | `whisper-1` |
| **SDK/Client** | Raw REST `fetch()` to `https://api.openai.com/v1/audio/transcriptions` |
| **Response format** | `verbose_json` with `timestamp_granularities: ["segment"]` |
| **File limit** | 24MB WAV max (skips if larger) |
| **timeout** | 180 seconds |
| **Notes** | Called after yt-dlp + ffmpeg download of audio as WAV. In practice, YouTube bot-checking blocks yt-dlp on Railway IPs, so this tier is rarely reached. Not a token-billed call — billed per minute of audio (OpenAI Whisper pricing). |

**Note on Azure Speech SDK (Tier 4):** `transcribeWithAzureSpeech()` also exists using the Azure Cognitive Services Speech SDK (`microsoft-cognitiveservices-speech-sdk`). This is STT (speech-to-text), not a generative AI call — billed separately per audio hour at Azure rates. Tier 4 in the fallback order, also blocked by yt-dlp audio download failure.

---

## PART 3 — PYTHON COUNCIL WORKER (`council-worker/`)

---

### #16 — Extract Structured Output (Python direct call)

| Attribute | Value |
|---|---|
| **File** | `council-worker/tasks/curriculum_session.py`, function `extract_structured_output()` |
| **Route** | Called at end of `run_council_session()` after all 5 CrewAI agent passes complete |
| **Task** | Convert Polgara's finalized markdown into validated SomersSchool pipeline JSON |
| **Model** | `claude-sonnet-4-6` |
| **SDK/Client** | Python Anthropic SDK `anthropic.Anthropic(api_key=...).messages.create()` — direct instantiation (not using CrewAI) |
| **Streaming** | ❌ No |
| **max_tokens** | **8192** |
| **Sys prompt** | `"You output only valid JSON. No markdown fences, no commentary, no explanation."` |
| **Input** | Same extraction prompt as TypeScript worker Pass 6 — full JSON schema template + structural rules + polgara's markdown |
| **Notes** | This is a direct Anthropic SDK call bypassing CrewAI. Called only once per council session. Identical purpose to curriculum-factory.ts Pass 6. |

---

### #17 — CrewAI Agent Passes (5 agents, model from env)

| Attribute | Value |
|---|---|
| **Files** | `council-worker/agents/gandalf.py`, `data_officer.py`, `polgara.py`, `earl.py`, `beavis.py` |
| **Framework** | CrewAI ≥0.28.0 with LiteLLM backend |
| **Task** | Same 5-pass curriculum generation as TypeScript worker (Gandalf → Data → Polgara → Earl → Beavis) |
| **Streaming** | ❌ No |

⚠️ **Model not explicitly set in any agent file.** No `llm=` parameter in any `Agent()` constructor. CrewAI/LiteLLM will use:
- `OPENAI_MODEL_NAME` environment variable if set (e.g. `"gpt-4o"`)
- Otherwise CrewAI default: **`gpt-4o`** (in ≥0.28.0) or `gpt-4` (older versions)
- Could also be configured via `ANTHROPIC_API_KEY` + LiteLLM model prefix if that's set up

**Action required:** Confirm what `OPENAI_MODEL_NAME` (or equivalent) is set to in the Railway Python worker environment. This is the only AI call in the codebase where the exact model string cannot be determined from code alone.

**Agent system prompt sources (embedded in agents, not separate system prompt field):**

| Agent | `role` field | Prompt source |
|---|---|---|
| Gandalf | "Creator and Curriculum Architect" | `goal` (~40 lines structural rules) + `backstory` (~20 lines character) |
| Data | "Curriculum Auditor and Analyst" | `goal` (~30 lines structural checks) + `backstory` (~15 lines) |
| Polgara | "Content Director and Curriculum Editor" | `goal` (~30 lines + PRESERVE requirements) + `backstory` (~20 lines) |
| Earl | "Operations Commander" | `goal` (~20 lines) + `backstory` (~20 lines), has `SupabaseReadTool` + `CurriculumContextTool` |
| Beavis | "Engagement Stress Tester" | `goal` (~25 lines) + `backstory` (~20 lines), no tools |

**Tools:**
- Gandalf: `SearchTool`, `CurriculumContextTool`, `SupabaseReadTool`
- Data: `SearchTool`, `SupabaseReadTool`
- Polgara: none
- Earl: `CurriculumContextTool`, `SupabaseReadTool`
- Beavis: none

---

## SUMMARY TABLES

### By Provider

| Provider | Routes | Calls per Request | Models Used |
|---|---|---|---|
| **Anthropic** | chat, council (Gandalf/Data/Polgara), briefs (×2), extract-learnings*, research/auto*, youtube/analyze, content-studio, dreams/ai-review, intel (×3), social/generate, email/categorize, email-digest, summarize, worker curriculum (passes 1-3+6), council-worker Python | 1–10 | `claude-sonnet-4-6`, `claude-haiku-4-5` |
| **OpenAI** | chat, council (Earl/B&B), extract-learnings, research/auto, worker curriculum (passes 4-5), youtube-transcript (Whisper) | 1–5 | `gpt-5.4`, `gpt-5-mini`, `whisper-1` |
| **Google Gemini** | worker youtube-transcript | 1–2 (fallback tiers) | `gemini-2.5-flash` (raw REST) |
| **CrewAI default** | council-worker Python agents | 5 (one per agent) | `gpt-4o` or env-configured |

*Note: extract-learnings and research/auto use OpenAI Responses API, not Anthropic.

### Highest Token Cost Calls (watch these)

| Call | Model | max_tokens | Frequency | Risk |
|---|---|---|---|---|
| `extract-learnings` | `gpt-5.4` | 512 output | **Every chat message** | High volume × GPT-5.4 rate |
| Curriculum factory Pass 6 | `claude-sonnet-4-6` | 8192 | Per job | High output cap |
| Council-worker extract | `claude-sonnet-4-6` | 8192 | Per Python session | Same as above |
| Intel Call B (Haiku verify) | `claude-haiku-4-5` | 4000 | Per intel session | Large input (30K chars) |
| Intel Call A (Sonnet analysis) | `claude-sonnet-4-6` | 4000 | Per intel session | Large input |
| YouTube Gemini verbatim | `gemini-2.5-flash` | 16384 | Per YouTube job | Input: 289K tokens/20-min video |
| Dreams AI review | `claude-sonnet-4-6` | 4096 | On demand | Could be large if many seeds |
| Social generate | `claude-sonnet-4-6` | 4096 | On demand / Monday cron | Multiple posts per call |

### Calls That Don't Use a System Prompt

| Route | Reason |
|---|---|
| `content-studio` | Brand voice in user message |
| `youtube/analyze` | Full context in user message |
| `summarize` | Scott context in user message |

---

## FINDINGS & RECOMMENDATIONS

1. **`extract-learnings` fires on every chat message** — consider a frequency limiter (fire every 3rd message or only when the conversation produces ≥ 1 meaningful exchange). At 100 chat messages/day × `gpt-5.4` input + output tokens, this adds up.

2. **Intel Call B (`claude-haiku-4-5`) has `max_tokens: 4000`** — same cap as Call A (Sonnet). This is generous for a verification pass. Consider `max_tokens: 2000` — verification mostly produces warnings and corrections, not new content.

3. **CrewAI agent model is unknown from code** — this is the only "mystery" model in the codebase. Check Railway Python worker env for `OPENAI_MODEL_NAME`. If it's `gpt-4o`, the 5-agent session costs significantly more than the TypeScript equivalent which uses Claude Sonnet.

4. **YouTube Gemini verbatim**: `maxOutputTokens: 16384` at `temperature: 0.1` — this is intentionally high to handle long lectures. Gemini 2.5 Flash pricing is very competitive vs alternatives. The 289K input tokens per 20-min video is the cost driver here, not the output.

5. **Two OpenAI API styles**: The Railway worker uses legacy `chat.completions.create()` while Vercel uses the Responses API. This isn't a cost difference today, but worth standardizing when refactoring the worker.

6. **No streaming anywhere except** `/api/chat/` (solo) and `/api/chat/council/`. All background routes are correctly non-streaming.
