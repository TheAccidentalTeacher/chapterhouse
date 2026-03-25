# Production Pipeline Overhaul — Brainstorm Session
*Started March 21, 2026. Living document — updated each round.*

---

## ⚡ THE NORTH STAR (Updated March 22, Round 2)

**Scott is not building a social media scheduler. Scott is building his own ToonBee/Leonardo.**

The Creative Studio is not "pick a provider and wire it up." It is a **self-hosted, character-consistent, multi-provider AI image + video generation system** that lives inside Chapterhouse and does everything ToonBee, Leonardo, and similar platforms do — but built for Scott's exact brands, characters, and workflows.

Key characters that need consistency engines:
- **Gimli** — 125-lb malamute mascot, K-5 curriculum explainer, whiteboard-style
- **Scott avatar** — handled by HeyGen (separate, not this studio)
- Potentially others as brands grow

This reframes EVERYTHING. Social posts are one output type. Lesson assets, PDF covers, thumbnails, brand imagery are equally valid outputs from the same engine.

---

## The Target Loop (still valid, but Creative Studio is much bigger than this)
```
TRIGGER (Shopify product / cron / manual seed)
  → Content Studio (Claude generates posts: 3 brands × 3 platforms)
  → Creative Studio (image_brief → multi-provider engine → character-consistent image)
  → Review Queue (post + image held; nothing auto-publishes)
  → Tasks (approved → Buffer/publishing API → live)
  → Analytics (engagement returns to social_posts table)
```

---

## Locked Decisions (from brief)
- Buffer API for scheduling (GraphQL, not REST)
- ~~Leonardo.ai → FLUX.1-Kontext-pro → gpt-image-1 image waterfall~~ **SUPERSEDED** — see Round 2 revelation below
- Character consistency engine: **Replicate 3-tier** (LoRA via `character.lora_model_id` → flux-dev bridge via `character.reference_images` → flux-schnell fallback). Leonardo.ai remains a selectable provider in Creative Studio but is NOT the default and NOT the character consistency engine.
- Brand voice moves from hardcoded route → Supabase `context_files`
- `SHOPIFY_WEBHOOK_SECRET` must be set before Shopify trigger is live
- Migration 012: extend `jobs.type` CHECK constraint (blocking issue)
- Azure AI Content Safety groundedness check inline on review cards

---

## Open Questions Log
*(Questions answered here as session progresses)*

---

## Decisions Made This Session

- **Creative Studio is Phase 1.** Everything else waits. Image gen, video gen, voice gen comes before social pipeline specifics.
- **No posts have ever been published.** The whole pipeline is greenfield. Nothing is live end-to-end yet.
- **Buffer is unknown to Scott.** Need to evaluate whether Buffer is even the right scheduling tool — it was added by a chatbot and Scott has no account. Re-evaluate before building more against it.
- **NCHO store goes live THIS WEEK** (pending bank info). Shopify trigger is urgent, not future.
- **Brand voice must be editable without a deploy.** This is confirmed as a real need, not theoretical.
- **Gimli voice / social specifics** are downstream of Creative Studio — park them for now.

---

## Concepts Explained

### What is Buffer?
Buffer is a social media scheduling tool. You connect your Facebook/Instagram/LinkedIn pages to it, then instead of posting directly to each platform, you send posts to Buffer and it publishes them at the time you choose. It acts as a single dashboard for scheduling across multiple platforms.

How it fits the pipeline: the code currently sends approved posts FROM the Review Queue TO Buffer via their API, and Buffer handles the actual publishing. If you don't have a Buffer account or don't want to use it, we rip that out and replace it with direct platform APIs — but those are much harder to maintain. Buffer is worth $0/mo on their free tier (3 channels).

**Verdict:** You need to either (a) set up a free Buffer account and connect your brand channels, or (b) decide on an alternative (Meta Business API directly, etc.). This is a setup task, not a code task.

### What is a Shopify Webhook Secret?
When Anna adds a product to the NCHO Shopify store, Shopify can automatically fire an HTTP request to Chapterhouse saying "a new product was just added." That's a webhook. The secret is a password Shopify attaches to the request so Chapterhouse knows the message is really from Shopify and not someone faking it. Without the secret set, we can't securely receive that trigger.

**Verdict:** One env var to set (`SHOPIFY_WEBHOOK_SECRET`). 10-minute setup in Shopify Admin → Settings → Notifications → Webhooks. Critical to do this week since the store goes live this week.

---

## Phase Plan Draft
*(Built up over the session — starts empty)*

---

## Round 1 — Answers (March 21, 2026)

| Q | Answer |
|---|---|
| Q1 — Last time you published a post | Never. Pipeline is greenfield. Broader than just social. |
| Q2 — Buffer account? | Doesn't know what Buffer is. Added by chatbot. No account. Needs evaluation. |
| Q3 — Shopify trigger urgency | URGENT. Bank info arriving this week → store live this week. Anna adding products today. |
| Q4 — Leonardo.ai API key? | Not answered yet — Round 2 |
| Q5 — Brand voice pain point real? | Yes. Always wanting to change it. Must be editable without deploy. |
| Q6 — Review Queue ever used? | Not answered directly. Implied: no. |
| Q7 — Gimli voice clone | Parked. Not the focus right now. |
| Q8 — Top priority studio | **Creative Studio** × 6. Clear #1 by a mile. |

---

## Round 2 — Answers (March 22, 2026)

| Q | Answer |
|---|---|
| Q9 — API keys in hand | ALL of them. GPT Image 1, Stability AI, Flux, Leonardo, Gemini, Replicate, and more. Leonardo as "default" is a chatbot artifact — not a real decision. ALL providers are on the table. |
| Q10 — Gimli reference art | Not answered yet — becomes Round 3 focus |
| Q11 — Output types beyond social | Course thumbnails, PDF covers, lesson assets, brand imagery, YouTube thumbnails — all of it |
| Q12 — Video generation | HeyGen = Scott avatar only. What else? Unknown yet — this is a research question for the session. |
| Q13 — Anna in Chapterhouse? | Anna has access but doesn't use it. Scott-only for now. |
| Q14 — NCHO product images | Publisher-supplied. Not an AI gen use case. |
| Q15 — Cloudinary connected? | Unknown. Probably not wired. See Cloudinary Primer below. |
| Q16 — Budget ceiling | Not a constraint. Best tools over cheapest tools. |
| **Core revelation** | **Goal = build a self-hosted ToonBee/Leonardo inside Chapterhouse. Not use those services — replace them.** |

---

## Cloudinary Primer — What It Is and Why It Matters

**What Cloudinary is:**
Cloudinary is a cloud media CDN (Content Delivery Network) and transformation service. Think of it as a smart image/video host. You upload an image once, and Cloudinary stores it at a permanent URL. But it also lets you do things to that image on-the-fly via URL parameters — resize it, crop it, convert it to WebP, add watermarks, adjust quality — without touching the original file.

**Why we use it:**
- Generated AI images need a permanent home. A URL from GPT Image 1 or Stability AI expires in minutes/hours. Cloudinary gives the image a URL that lives forever.
- One image, infinite sizes. Store once at full resolution; request `w_400` in the URL and Cloudinary serves a 400px version automatically. This matters for social cards vs. thumbnail vs. full-size hero.
- It's already in the stack (account `dpn8gl54c`). The Creative Studio already has a "Save to CDN" button that's supposed to push to Cloudinary — but currently has a bug (silent failure fixed in Migration 021).

**The security model:**
- Cloudinary account credentials: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — these live in `.env.master` and Vercel env vars. Never expose `API_SECRET` to the browser. All uploads go server-side.
- Upload presets: Cloudinary lets you create "unsigned upload presets" for browser-side uploads — a scoped permission that allows uploads without the API secret. Safe for user-generated content; not needed for server-side generation pipeline.
- Danger: if `CLOUDINARY_API_SECRET` leaks (git push accident), anyone can upload, delete, or transform media in your account. Rotate immediately via cloudinary.com dashboard if it ever gets exposed.
- No sensitive data in images: don't store student work, PII, or private documents in Cloudinary. It's for brand assets and generated content only.

**How it fits Creative Studio:**
`Generate image → upload to Cloudinary server-side → store `cloudinary_url` in `generated_images` table → UI displays from Cloudinary URL → image available for all downstream uses (social post card, lesson asset, PDF cover) forever.`

**What "wired up" looks like:**
The `generated_images` table (Migration 021) has a `cloudinary_url` column. The `/api/images/save` route is supposed to upload to Cloudinary and write that URL back to the row. The bug (silent failure) was fixed in Session 24. Whether the actual Cloudinary env vars are set in Vercel is unknown — this is a 5-minute check.

---

## Round 3 — Answers (March 22, 2026)

| Q | Answer |
|---|---|
| Q17 — Consistency level | **Full character identity.** Not just style. "Gimli standing next to Big Ben" — same dog, same face, placed in any scene. |
| Q18 — Fine-tune vs. reference injection | **Both.** Both approaches available in the system. Fine-tune for deep consistency; reference injection for quick generation. |
| Q19 — Other characters | 10, 20, 50+ characters over time. This is a full character management system, not just Gimli. |
| Q20 — Gimli moving / video | Built into the stack, not locked to ToonBee or Kling. Keep building, stay flexible. Research needed on best approach. |
| Q21 — Creative Studio UI model | **All of them.** Prompt box + template-driven + character-first. Build all modes. Think outside the box. |
| Q22 — Where images live | Supabase `generated_images` table + Cloudinary URL. Must be viewable, searchable, browsable. |
| Q23 — Brand visual identity | NCHO: earthy/warm (olive, rose, teal + red/white primary). SomersSchool: bold red/white/clean. Alana Terry: purple/lavender. |
| Q24 — Character Library | **YES × 1000.** This is a core feature, not an add-on. |

---

## Locked Decisions (Updated March 22, Round 3)

- **Creative Studio = Scott's self-hosted ToonBee/Leonardo.** Not a wrapper around those services — a replacement.
- **Character Library is a first-class feature** — named characters, reference images, style settings, reusable across all generation.
- **Character consistency = identity-level** (same face/body in any scene), not just style-level.
- **Both LoRA fine-tuning AND reference injection** — both approaches supported, clearly documented so Scott knows when to use which.
- **Character count = unbounded.** System designed for 50+ characters from day one. Gimli is character #1.
- **All generation modes:** free prompt, template-driven (social post / lesson thumbnail / PDF cover / etc.), character-first (pick character → describe scene).
- **Generated images:** Supabase `generated_images` table + Cloudinary permanent URL. Browsable in UI.
- **Gimli video/animation:** built into the stack, provider-agnostic. Not locked to any single API.
- **Alana Terry visual identity:** purple/lavender. Not a current build priority.
- **Leonardo as "default" is retired.** Provider selection is based on task + consistency requirements, not habit.

---

## Round 4 — Answers (March 22, 2026)

| Q | Answer |
|---|---|
| Q25 — Gimli reference images | **Exist already — ToonBee-generated 3D cartoon malamute.** Can upload immediately as starting point. "Any malamute works — we pick the best one and use it forever." |
| Q26 — LoRA fine-tuning | Reluctant but willing if required. Primary goal: something that works reliably every time. Has A1111 locally but not connected to this project. |
| Q27 — Character library data model | Baseline (name, description, reference images, LoRA model ID, style tags, brand) is fine. |
| Q28 — Who writes scene descriptions | **Claude.** Scott types a rough prompt → Claude expands it into a full, detailed scene description → that goes to the image model. |
| Q29 — Templates editable? | **Both.** Defaults hardcoded in app; editable from UI for when platforms change rules. |
| Q30 — Gimli video pipeline | Still → animated clip is fine. Works = shipped. |
| Q31 — Image library searchable? | (Not directly answered — carried to Round 5) |
| Q32 — Feature name | Practical over clever. "Character Library" works fine. |

---

## 🚨 MAJOR UNLOCK — Round 4 (March 22, 2026)

**Scott doesn't just want to USE a ToonBee replacement. He wants to BUILD one and SELL it.**

This Creative Studio is a potential standalone product — not just a personal Chapterhouse tool. That changes the architecture requirement from "good enough for me" to "good enough to ship to customers." Built for Scott first, productized second. Every decision from here should be made with "could this be a product?" in the back of our minds.

---

## Locked Decisions (Updated March 22, Round 4)

- **Gimli reference images exist** — ToonBee 3D cartoon malamute. Upload and use as character seed immediately.
- **LoRA if required** — not preferred but accepted if it's the only path to reliable consistency.
- **Claude enhances every image prompt** — Scott types rough intent → Claude builds full scene description → image model receives polished prompt. No raw prompts to image APIs.
- **Templates: default hardcoded + UI-editable.** Platform rule changes (Instagram no-text, etc.) don't require a deploy.
- **Still → animated clip pipeline** accepted for Gimli video.
- **Feature name: "Character Library"** — practical and clear.
- **This may become a product.** Build it right.

---

## Round 5 — Answers (March 22, 2026)

| Q | Answer |
|---|---|
| Q33 — Product intention | **Not productizing. "I want to BE ToonBee" = eliminate the middleman for his own use.** No commercial plans for this feature. Build to commercial quality, use personally. |
| Q34 — Local A1111 models | Flux XL + other downloaded models. Local only, not connected to Chapterhouse. |
| Q35 — APIs used | Used pretty much all of them. Goal: all available in the UI, flip between them, lock in on whichever wins. |
| Q36 — Claude prompt enhancement | Confirmed: Character Library record → Claude reads it + user's rough prompt → Claude builds detailed scene description → image model receives polished prompt. |
| Q37 — Kling/Runway | Neither API tested. Both are research-only at this point. No Runway account. |
| Q38 — Template formats | Trust Gandalf. |
| Q39 — Text-in-image | **Generate image without text → overlay text as a separate layer.** This is the right architecture. Two options: (a) Cloudinary text overlay via URL transform parameter, (b) Canvas/HTML compositing in the browser. Cloudinary is the better choice — no extra code, just URL parameters. |
| Q40 — Productized? | **NO.** "Way outside my niche." Personal use only. BUT built to commercial quality. "Commercially viable even though I'm not doing it commercially." |

---

## 🔒 FINAL LOCKED POSITION ON SCOPE

This Creative Studio is **Scott's private production infrastructure.** Not a product. Not multi-tenant. No SaaS ambitions here. That simplifies the architecture dramatically — no usage limits, no billing per user, no isolation between accounts. Build fast, build excellent, build for one user.

---

## Text Overlay Architecture (Locked March 22)

**Two-layer approach:**
1. Generate image without any text (cleaner, more reliable across all providers)
2. Overlay text via Cloudinary transformation URL: `l_text:[font]:[text]/[positioning]` appended to the `cloudinary_url` — no extra API calls, no code, just a URL parameter

This means: every generated image is saved to Cloudinary clean → when displaying with text (social post caption, lesson title, etc.) the URL is constructed with the text overlay parameters on-the-fly. The original clean image is always preserved.

---

## Locked Decisions (Updated March 22, Round 5)

- **NOT a product.** Personal infrastructure only. Simplifies everything.
- **All image providers available in UI.** User can switch. System eventually learns which provider wins for which output type.
- **Text overlay = Cloudinary URL transformation.** Images generated clean; text added as Cloudinary URL parameter.
- **Character Library drives Claude prompt enhancement.** Claude reads the character record, takes the rough user prompt, outputs a full detailed scene description before any image API is called.
- **Kling and Runway are research items** — neither API tested. Video generation is a Phase 2 concern.

---

## Round 6 — Answers (March 22, 2026)

| Q | Answer |
|---|---|
| Q41 — Provider routing | "Just make it work. Go big. If in doubt go big." → Full provider selection UI + automatic routing. Both modes. No minimalism. |
| Q42 — Character consistency | LoRA IS required. Download Gimli images from ToonBee → use as LoRA training set. Reference injection as Phase 1 bridge while LoRA trains. |
| Q43 — Additional image columns | Confirmed: add `character_id`, `template_id`, `provider_used`, `prompt_enhanced`. |
| Q44 — Character Library schema | Confirmed. Make room to go bigger. |
| Q45 — Timeline | **This pipeline is NOT for the NCHO store launch.** NCHO goes live this week independently. **This whole build is for SomersSchool launch.** Revenue target: before August 2026. |
| Q47 — Creative Studio tested? | **NEVER.** Has not generated a single image in Chapterhouse's Creative Studio. Exists in code but untested. |
| Q48 — Voice Studio priority | **Equally important.** "This is all ONE BIG BUILD for this area. Not a bunch of little builds." The Production Pipeline is a unified system — Creative, Voice, Content, Review all move together. |

---

## 🔒 CRITICAL CLARIFICATION — Round 6

**This is ONE unified Production Pipeline build, targeting SomersSchool launch before August 2026.**
- NCHO store going live this week = independent, not dependent on this pipeline
- Voice Studio is not an afterthought — it is equal in priority to Creative Studio
- The entire Production tab overhaul ships as one coherent system, not a series of disconnected improvements
- Creative Studio has NEVER been exercised — the existing code base needs to be verified before anything is built on top of it

---

## Locked Decisions (Final — March 22, Round 6)

- **Build target: SomersSchool launch.** Not NCHO. August 2026 deadline.
- **ONE build, not many.** All six studios move together as a unified system.
- **Creative Studio is untested.** First task before any new feature: run the existing code and find out what works.
- **LoRA fine-tuning is required** for Gimli. Use ToonBee images as training set. Reference injection bridges the gap until the LoRA is trained.
- **Go big, always.** When in doubt, build more capacity not less.
- **Voice Studio = equal priority** to Creative Studio. Lesson narration + social audio both required.

---

## Round 7 — SomersSchool Build Reality (Q49–56)

*(March 23, 2026 — SomersSchool codebase fully audited. Answers below synthesized from audit + session.)*

| Q | Answer |
|---|---|
| Q49 — What does a single lesson actually need? | See full breakdown below. Short version: Bundle JSON + slide images + audio MP3 + 7 HeyGen videos + worksheet PDF. |
| Q50 — How many courses at launch? | 52-course catalog goal (13 grades × 4 subjects). **Today: sci-g1 is the only course with all 24 bundles + audio complete.** ela-g1 has scope-sequence JSON only (no bundles). Everything else is empty. |
| Q51 — Whose voice/face narrates? | HeyGen Mr. S avatar = Scott's digital twin for video. ElevenLabs 10-voice rotation pool for TTS audio (currently deprecated in player — HeyGen MP4 embedded audio is the live system). |
| Q52 — Social media for SomersSchool launch | *Not yet answered — moved to Round 8* |
| Q53 — Why does Review Queue exist? | **"Because children."** "I need to make sure with my own human eyes that what shows up is actually good information, not some video that's disguised as AI." Non-negotiable. Safety + quality gate. This is a product constraint, not a feature request. |
| Q54 — Current Creative Studio UI | **Working and well-built.** 4 providers wired (GPT Image 1, Stability AI, Flux/Replicate, Leonardo.ai). Has generated actual images. Images tab, Sounds tab, Video tab all present. "Really good start." Video generation is the gap — that's the big missing piece. |
| Q55 — Brand voice editable before August? | **NEVER hardcode brand voice. Ever.** "Living and breathing throughout everything." Always editable by Scott or Anna, at any time. AI can suggest but Scott/Anna decide. "Suggestive at best." |
| Q56 — "Done" defined | **"Done is when I can create an entire set of images and videos based on something that I need for the course that I'm creating."** Course-first creation. Not social, not random art. I'm building a lesson → Chapterhouse generates all its assets. |

---

### 🗺️ SomersSchool Course Structure — Audit Findings (March 23, 2026)

**The big picture: Chapterhouse is upstream. CoursePlatform is downstream.**

```
Chapterhouse (council pipeline)
  → produces: scope-sequence/{courseId}.json
  → ingested by: CoursePlatform scripts/ingest-scope-sequence.js
  → drives: all downstream content generation
```

**Catalog:** 52 courses (13 grades × 4 subjects: ELA, Math, Science, Social Studies)  
**Structure per course:** 4 units × 6 lessons = 24 lesson bundles  
**Lesson bundle = the atom of the entire content system** — one JSON file per lesson, self-contained

**Per-Lesson Asset Requirements:**

| Asset | Format | Storage | Tool | Status (sci-g1) |
|---|---|---|---|---|
| Bundle JSON | `.json` | `data/bundles/{id}.json` | `generate-bundle.js` (Claude Opus) | ✅ 24/24 complete |
| Slide images | `.jpg/.png` | Cloudinary CDN | `generate-slide-images.mjs` (GPT Image 1 ~$0.02/image, ~$0.50/lesson) | ✅ 24/24 complete |
| Audio narration | `.mp3` | `data/audio/{id}.mp3` | `generate-audio.js` (ElevenLabs or OpenAI TTS) | ✅ 24/24 complete (but deprecated in player) |
| HeyGen videos (7) | `.mp4` | Cloudinary CDN | HeyGen portal → `upload-media.mjs` | ❌ 2/24 lessons done (14 of 168 videos) |
| Worksheet PDF | `.pdf` | `data/exports/{id}/` | `generate-worksheet-pdf.js` (PDFKit) | ✅ 24/24 complete |

**The HeyGen bottleneck is stark:**
- 7 videos per lesson × 24 lessons = **168 videos for sci-g1 alone**
- Currently: only 2 lessons have HeyGen videos complete (u1-l01, u2-l01)
- HeyGen is a manual process: export scripts → paste into HeyGen portal → download MP4 → rename → upload to Cloudinary
- KaraokePlayer cannot render a lesson without its HeyGen MP4s
- This is the single biggest blocker to having a playable course

**The dual audio situation:**
- System A (old): ElevenLabs/OpenAI TTS → MP3 per lesson. All 24 exist for sci-g1. **Currently deprecated** — HeyGen MP4 has the narration audio embedded; running both created a double-playback bug.
- System B (current): HeyGen avatar video audio is what the student hears. Slide overlays are synced to this via KaraokePlayer.
- The MP3 files still exist as a fallback/backup. Not playing in the student-facing app.

**The 5-stage production pipeline (from CONTENT_PIPELINE.md):**

| Stage | Tool | Time | Output |
|---|---|---|---|
| 1 — Unit Outline | `generate-unit-outline.js` (Claude) | ~20 min | `data/outlines/{id}.json` — **⚠️ HUMAN REVIEW REQUIRED** |
| 2 — Generate Bundles | `generate-bundle.js` (Claude Opus) | ~2 min × 6 = ~12 min | `data/bundles/{id}.json` (schema-validated) |
| 2b — Slide Images | `generate-slide-images.mjs` (GPT Image 1) | ~10 min | Images uploaded to Cloudinary, URLs back-written to bundle |
| 3 — Verify Bundles | `verify-bundle.js` (Gemini + Grok dual-check) | ~12 min | Pass/fail + `meta.verified` flag |
| 4 — Cross-Check Unit | `cross-check-unit.js` (no API calls) | ~1 min | Consistency report across all 6 bundles |
| 5 — Export | `export-bundle.js` (PDFKit + ElevenLabs) | ~18 min | Worksheet PDF + audio MP3 |
| **Total per unit:** | | **~73 min** | All non-HeyGen assets complete |
| 6 — HeyGen Videos | Manual | Days | 168 MP4s for sci-g1 alone |

**What ships to the student (KaraokePlayer runtime order):**
```
1. Intro video (HeyGen MP4) + timed slide overlays
2. Section 1 video + slides → mini-game
3. Section 2 video + slides → mini-game
4. Section 3 video + slides → mini-game
5. Section 4 video + slides → mini-game
6. Section 5 video + slides → mini-game
7. Vocabulary flashcards
8. Quiz (5 questions, 85% pass threshold)
9. Lesson complete + celebration video
```
**Total: 7 HeyGen MPs × 24 lessons × 4 units = 168 videos to produce for one course.**

**Current state at launch:**
- sci-g1: all bundles + images + worksheets ✅ | HeyGen videos ❌ (154 of 168 missing)
- ela-g1: scope-sequence JSON only — everything else unbuilt
- All other 50 courses: empty

**The implication for the production pipeline build:**
The pipeline needs to help with HeyGen or find a way around the bottleneck. 168 manual video sessions before a single course is fully playable is the constraint that determines whether August 2026 is achievable.

---

### 🔒 Round 7 — Final Locked Decisions

- **Creative Studio works today.** 4 providers, Images tab generates real images (confirmed GPT Image 1 live). Sounds and Video tabs exist. Video generation is the current gap — it's present in the UI but the backend needs serious work.
- **Brand voice = NEVER hardcoded. EVER.** AI suggests voice, Scott/Anna override at any time. This means brand voice lives in Supabase `context_files`, editable from the UI. No exceptions.
- **"Done" = course-first creation.** The pipeline is complete when Scott can pick a course + lesson, click generate, and get all the assets that lesson needs. Social media is a side effect, not the goal. The course is the goal.

---

## Creative Studio — What the Screenshots Reveal

*(March 22, 2026 — confirmed from UI screenshots)*

**What's working right now:**
- 4 providers selectable: GPT Image 1 (best for photorealistic scenes), Stability AI (controllable art styles, curriculum illustrations), Flux/Replicate (fast, high-quality — **character consistency engine**), Leonardo.ai (one of four selectable providers; NOT the character consistency engine)
- Size options: Square 1024, Landscape 1280×720, Portrait 768×1024, Wide 1792×1024
- Generated Images section stores results with prompt + provider badge + Copy URL
- GPT Image 1 confirmed working — generated a real image in session
- Images | Sounds | Video tabs all present

**What the Video tab needs:**
Unknown — the tab exists but video generation backend is the stated gap. Round 8 investigates this.

**Provider tooltip descriptions (from screenshots):**
- GPT Image 1: "Best for text-in-images and photorealistic scenes"
- Stability AI: "Controllable art styles, curriculum illustrations"
- Flux (Replicate): "Fast, high-quality generation via Flux Schnell"
- Flux/Replicate: **LoRA via Replicate** (production character consistency — Gimli) — 3-tier: LoRA → flux-dev bridge → flux-schnell
- Leonardo.ai: selectable provider, no longer the character consistency engine

---

### Round 7 — Remaining Questions (Q54–56)

**Gandalf asks:**

---

**Q54 — The Moment of Truth** *(Answered — see Round 7 table above)*

**Q55 — Brand Voice** *(Answered — see Round 7 table above)*

**Q56 — Define "Done"** *(Answered — see Round 7 table above)*

---

## Round 8 — Video Tab + Phase Plan Refinement (Q57–60)

| Q | Answer |
|---|---|
| Q57 — Video tab current state | **HeyGen wrapper and nothing else.** Avatar ID field, Voice ID field, Dimensions, Script textarea, "Generate Video" button. The form works — it's wired to the HeyGen API — but it's architecturally locked to HeyGen exclusively. No other video providers. No character concept. Just a HeyGen ID form. This is the problem. |
| Q58 — HeyGen: automate or replace? | **Replace the architecture. Keep HeyGen temporarily.** HeyGen is expensive per-API-call. The batch process is tedious and time-consuming. ToonBee is even worse — 45 minutes per video. Neither is sustainable. The Video tab must become a multi-provider, character-driven video generation system. HeyGen stays as one available provider while better alternatives are built in. The Avatar ID / Voice ID concept gets replaced by the Character Library. |
| Q59 — Course Asset Dashboard | **Yes — exactly that.** Lesson grid, 5 status dots, Generate All Missing button. That's the interface. |
| Q60 — Social: required for August or bonus? | **REQUIRED FOR APRIL.** "In April, we need to get the social media pipeline up and running." This is not Phase 6. This is Phase 1 or 2. The Phase Plan just got reordered. |

### 🚨 Phase Plan Reorder — April Is the Social Deadline

The timeline just changed completely:
- **April 2026** = Social media pipeline live and running
- **August 2026** = Course asset pipeline (images + video) complete

Social is no longer the last phase. It is the first deliverable with a hard date. Everything else adjusts.

---

### 🔒 Round 8 — New Locked Decisions

- **Video tab must be rebuilt.** Not extended — rebuilt. The HeyGen-only form is replaced with a character-first, multi-provider video generation system.
- **HeyGen stays as a provider option**, not the only option and not the architecture.
- **Social media pipeline = April deadline.** Hard date. Not a bonus. Reorders the build.
- **ToonBee is retired as a workflow.** 45 minutes per video is not viable. The system must beat this.
- **Video generation providers to evaluate:** Kling AI, Runway Gen-3, Pika Labs, Luma AI, D-ID (all significantly cheaper/faster than HeyGen per clip)

---

### Round 8 — Remaining Questions

*(Gandalf asks — finishing Round 8)*

---

**Q59 — Course Asset Dashboard (answered)**

Here's what I mean by "Course Asset Dashboard." Tell me if this is what you want:

You open Chapterhouse and click "Course Production." You see a list of your courses. You click "Science Grade 2."

Now you see a grid — 24 rows, one per lesson. Each row looks like this:

```
Lesson 1: What Is Science?
  [Bundle ✅]  [Slide Images ✅]  [Audio ✅]  [Videos ❌ 0/7]  [Worksheet ✅]
                                                              → [Generate Videos]

Lesson 2: The Scientific Method  
  [Bundle ✅]  [Slide Images ✅]  [Audio ✅]  [Videos ❌ 0/7]  [Worksheet ✅]
                                                              → [Generate Videos]
```

At the top: one button — **"Generate All Missing"** — which kicks off everything that shows a red mark, for all 24 lessons, as a background batch job.

You click it. Walk away. Come back and check progress. When it's done, all 24 lessons are green. You review a couple, approve them from Review Queue, and they're live in CoursePlatform.

**Is that the interface you're imagining? Or does it look different in your head?**

> **✅ ANSWER (Round 8):** Yes — exactly that. That's the interface.

---

**Q61 — Social Pipeline by April: Version A, B, or C?**

> **✅ ANSWER (Round 8):** **Version C.** Full loop. Shopify trigger → generate → approve → Buffer auto-publishes. The whole thing.

---

**Q62 — Video for social by April or August only?**

> **✅ ANSWER (Round 8):** **This whole section needs to be done, completely done, in a week. About 4 hours a day, 5 days, vibe coding.**
>
> Social + video + Character Library + Course Asset Dashboard + course video pipeline — all of it — in one 20-hour sprint.

This determines whether the Video tab rebuild is April work or August work.


This determines whether the Video tab rebuild is April work or August work.

---

## Phase Plan — v0.2
*(Updated March 22, 2026. Reordered after Round 8: Social = April hard deadline. Course pipeline = August hard deadline.)*

**Two hard deadlines:**
- **April 2026** — Social media pipeline live (generate → approve → post for all 3 brands)
- **August 2026** — Course asset pipeline complete (images + video for every lesson per course)

**Contract ends May 24.** ~5 weeks split-attention to hit April. 12 weeks full-time after that to hit August.

---

### Phase 0 — Smoke Test (2 days) — DO THIS WEEK

*Don't build on broken ground. Verify every studio first.*

- [ ] Test all 4 image providers: GPT Image 1 (confirmed), Stability AI, Flux/Replicate, Leonardo (unconfirmed)
- [ ] Test Sounds tab — Freesound search / preview / download
- [ ] Test Video tab — paste a real Avatar ID + script → does "Generate Video" actually return anything?
- [ ] Verify Cloudinary env vars in Vercel + confirm images save to `generated_images.cloudinary_url`
- [ ] Test Voice Studio — ElevenLabs TTS → MP3 download
- [ ] Document findings: what works / what fails / what's wired but untested

**Exit criteria:** No surprises in Phase 1. Every studio's real state known.

---

### Phase 1 — Brand Voice → Supabase (1 day) — MARCH, BEFORE APRIL WORK

*Brand voice must be editable before any social generation is trustworthy.*

- [ ] `brand_voices` table: `id, brand (ncho|somersschool|alana_terry), voice_description TEXT, tone_guidelines TEXT, forbidden_words TEXT[], updated_at`
- [ ] Seed from current hardcoded route strings for all 3 brands
- [ ] Brand Voice editor UI (Settings): one editable card per brand. Save on blur.
- [ ] Wire Content Studio + Social generate routes to pull from Supabase, not hardcoded strings

**Exit criteria:** Anna edits "SomersSchool" voice in the UI. The next generated piece of content uses her edit. Zero code deploys required.

---

### Phase 2 — Social Pipeline (2–3 weeks) — APRIL DEADLINE

*The April deliverable. Minimum version determined by Q61 answer.*

**Core tasks:**
- [ ] Social generate: Claude writes posts using brand voice from Supabase (Phase 1 prereq)
- [ ] Review Queue: posts land here, editable inline, approve/reject
- [ ] Shopify webhook: new NCHO product → auto-generate launch posts → Review Queue
- [ ] Buffer OR manual-copy fallback — decided after Q61 answer

**Exit criteria:** Generate 3 NCHO posts. Approve 2. They publish (or copy-paste ready). Reject 1. Under 5 minutes total. Brand voice came from Supabase — Anna could have written it.

---

### Phase 3 — Character Library (3–4 days) — APRIL/MAY

*The consistency engine. Everything downstream — social images, lesson slides, videos — benefits from this. Build it as soon as social baseline is live.*

- [ ] `characters` table: `id, name, description, brand, reference_images TEXT[], primary_reference_url, style_tags TEXT[], lora_model_id, preferred_provider`
- [ ] Add `character_id`, `template_id`, `provider_used`, `prompt_enhanced` to `generated_images`
- [ ] Claude prompt enhancer middleware: rough user intent + character record → detailed scene description → image API
- [ ] Character Library page: grid of characters by brand, per-character reference image display
- [ ] Character-first generation flow in Creative Studio: pick character → describe scene → generate
- [ ] Upload Gimli ToonBee images as character seed #1

**Exit criteria:** Select Gimli. Type "explaining photosynthesis at a chalkboard." Get a cartoon malamute at a chalkboard — same visual identity as the ToonBee references, every time.

---

### Phase 4 — Video Tab Rebuild (2–3 weeks) — MAY/JUNE (post-contract)

*Replace the HeyGen-only form. The new video studio is character-first and multi-provider.*

**Current form (replaced):**
```
Avatar ID | Voice ID | Script textarea → Generate Video (HeyGen only)
```

**New form:**
```
[Character: Gimli ▼] [Describe the scene] [Duration: 15s | 30s | 60s]
[Provider: Kling AI | Runway | Pika | D-ID | HeyGen]
[Narration script (auto-generated or typed)]
→ Generate Video → lands in Review Queue
```

**Providers to evaluate and wire (recommended order):**
1. **Kling AI** — subscription model, cross-scene character consistency, best cost/volume ratio
2. **D-ID** — talking head from image + ElevenLabs audio, significantly cheaper than HeyGen per video, same use case
3. **Runway Gen-3** — text+image-to-video, high quality, credit-based
4. **Pika Labs** — fast API, good for short clips
5. **HeyGen** — stays as one provider option, no longer the architecture

**Tasks:**
- [ ] Evaluate Kling AI API: test character reference image → video clip with Gimli reference
- [ ] Evaluate D-ID API: static character image + ElevenLabs MP3 audio → talking head video
- [ ] Build new Video tab UI
- [ ] Wire top 2-3 providers via Railway worker (async job → Cloudinary upload → Review Queue)
- [ ] Video review Queue: generated videos held for approval before download/use in courses

**Exit criteria:** Select Gimli. Write a 15-second scene. Pick Kling AI. Hit Generate. A Gimli clip appears in Review Queue in minutes — not 45 minutes. Cost: cents, not dollars.

---

### Phase 5 — Course Asset Dashboard + Slide Images (1 week) — JUNE/JULY

*The production interface for courses. "Pick a course, see what's missing, generate it."*

**The interface:**
```
Course Production → [Science Grade 2 ▼]

Lesson 1: What Is Science?
  [Bundle ✅] [Images ✅] [Audio ✅] [Videos ❌ 0/7] [Worksheet ✅]

Lesson 2: The Scientific Method
  [Bundle ✅] [Images ❌] [Audio ✅] [Videos ❌ 0/7] [Worksheet ✅]

                              [▶ Generate All Missing]
```

**Tasks:**
- [ ] Course Production section in Chapterhouse nav
- [ ] `GET /api/course-assets/status?course=sci-g2` — reads all bundle rows from CoursePlatform Supabase, returns per-lesson asset coverage (bundle ✅/❌, slide images ✅/❌, audio ✅/❌, videos count, worksheet ✅/❌)
- [ ] `POST /api/course-assets/generate-slides` — batch image generation as Railway background job
- [ ] Bundle write-back: generated Cloudinary image_urls written to CoursePlatform `bundles` table via `PATCH /api/course-assets/bundle/[id]` ✅ **route already built**
- [ ] "Generate All Missing" parent + N child jobs with Realtime progress

**Exit criteria:** Select sci-g2. Click "Generate All Missing Slide Images." Come back in ~30 minutes. All 24 lessons show Images ✅. KaraokePlayer can render every slide.

---

### Phase 6 — Course Video Pipeline (JULY/AUGUST)

*Apply Phase 4 video generation to course production. Defeat the 168-videos bottleneck.*

**The flow:**
```
Select lesson in Course Asset Dashboard → "Generate Video Set"
  → lesson script split into 7 segments by type (intro/section-1..5/conclusion)
  → 7 video generation jobs queued (chosen provider from Phase 4)
  → async: generate → upload Cloudinary → update bundle JSON video_urls
  → Videos ✅ 7/7 in dashboard
  → KaraokePlayer renders lesson in CoursePlatform
```

**Tasks:**
- [ ] Video generation job type in Railway worker (uses Phase 4 provider)
- [ ] 7-segment script splitter (parse bundle JSON sections → one script per video)
- [ ] Bundle JSON video URL write-back
- [ ] Batch video generation for full course (staggered, rate-limit aware)
- [ ] Video landing in Review Queue before going live to students

**Exit criteria:** 168 sci-g1 videos generated as one batch job. No HeyGen portal. No copy-paste. Videos reviewed in Review Queue → approved → KaraokePlayer renders every lesson. sci-g1 is fully playable by a real student.

---

### Phase 7 — Voice Studio Narration (alongside Phase 6)

- [ ] Narration tab: pick lesson → ElevenLabs generates MP3 from bundle script → Cloudinary + bundle meta update
- [ ] Voice assignment: grade/subject → ElevenLabs voice ID mapping in UI
- [ ] Batch narration: all 24 lessons in one job

---

### Build Order — Locked Sequence

```
Phase 0   Smoke test — verify every provider actually works before building on them
Phase 1   Brand voice → Supabase — gates all AI content generation
Phase 2   Social pipeline Version C — Shopify trigger → approve → Buffer   ← HARD DEADLINE: APRIL
Phase 3   Character Library — Gimli seed, prompt enhancer, character-first image gen
Phase 4   Video tab rebuild — Kling AI first, then D-ID, HeyGen stays as option
Phase 5   Course Asset Dashboard + batch slide images — status grid, Generate All Missing
Phase 6   Course video pipeline — 168 sci-g1 videos as one batch job             ← HARD DEADLINE: AUGUST
Phase 7   Voice Studio narration — ElevenLabs bulk narration, runs alongside Phase 6
```

**Everything gates on the phase before it.** Phase 3 needs Phase 1 (brand voice DB) and unlocks Phases 4–7. Phase 5 needs Phase 3 (Gimli character) for slide generation. Phase 6 needs Phase 4 (video provider wired). Order is the constraint, not time.

**Biggest risk — Phase 1:** Brand voice migration. If the DB seeding breaks the hardcoded routes, social generation breaks. Test carefully before Phase 2.

**Biggest risk — Phase 4:** Kling AI character consistency with Gimli reference images. If Kling AI doesn't hold visual identity across clips, fall back to D-ID (talking head from static image + audio) and flag for re-evaluation.



### 🔒 Round 8 — Final Locked Decisions (Q59–62)

- **Course Asset Dashboard confirmed.** Lesson grid, 5 status dots, Generate All Missing button. That's the UI.
- **Version C social pipeline.** Shopify webhook → generate → Review Queue → Buffer auto-publish. No shortcuts.
- **Video tab rebuild is not August work.** It is Phase 4, comes right after Character Library.
- **Build order confirmed:** Social pipeline → Character Library → Video tab → Course Asset Dashboard → Course video pipeline → Voice narration.

---

## Phase Plan — v0.4 (Build Order)
*(Updated March 23, after Round 9. Time estimates removed — order is the constraint, not calendar. Each step gates the next.)*

**Build each step. Verify the exit criteria. Move to the next one. That's it.**

---

### Step 1 — Foundation
*Smoke test everything. Brand voice editable. No surprises going into Step 2.*

**Smoke Test:**
- [ ] Open every Creative Studio tab — document what works vs broken vs placeholder
- [ ] Test all 4 image providers — GPT Image 1 (confirmed), Stability AI, Flux/Replicate, Leonardo (unconfirmed)
- [ ] Test Video tab — confirm HeyGen wrapper, document exact API fields, call the API once with a test script
- [ ] Verify Cloudinary env var in Vercel + `generated_images.cloudinary_url` saves on image generation
- [ ] Test Voice Studio — ElevenLabs TTS → MP3 download
- [ ] Quick `/api/social/generate` call — does it work end-to-end?

**Brand Voice → Supabase:**
- [ ] `brand_voices` table migration — `id, brand CHECK(ncho|somersschool|alana_terry), voice_description, tone_guidelines, forbidden_words TEXT[]`
- [ ] Seed from current hardcoded strings for all 3 brands
- [ ] Brand Voice editor in Settings — 3 cards, editable, save on blur
- [ ] Wire `/api/content-studio/` and `/api/social/generate` to pull from Supabase, not hardcoded strings

**Exit Step 1:** Content Studio generates content using Anna-editable brand voice. Three `brand_voices` rows in Supabase. Every studio's real state documented.

---

### Step 2 — Social Pipeline Core
*Posts generate, land in Review Queue, get approved, publish to Buffer.*

**Review Queue audit + hardening:**
- [ ] Generate 3 test posts (one per brand) using Step 1's Supabase brand voices
- [ ] Walk through the full approve/reject flow in Review Queue — fix any bugs from smoke test
- [ ] Inline text edit works. Datetime picker works. Buffer channel selector works.

**Buffer integration:**
- [ ] Confirm all 3 Buffer channels mapped to brands (NCHO, SomersSchool, Alana Terry)
- [ ] `POST /api/social/posts/[id]/approve` → GraphQL `createPost` mutation → Buffer schedules → confirm post queued in Buffer dashboard
- [ ] Test the full loop: generate → Review Queue → approve → check Buffer

**Exit Step 2:** Generate 3 posts. Approve all 3. They're scheduled in Buffer. Brand voice came from Supabase.

---

### Step 3 — Social Version C + Character Library
*Shopify trigger live. Gimli exists.*

**Shopify webhook (Version C):**
- [ ] Confirm `SHOPIFY_WEBHOOK_SECRET` is set in Vercel env
- [ ] Test `POST /api/webhooks/shopify-product` with a fake payload — HMAC verify → posts generated → Review Queue populated
- [ ] Add a real test product in NCHO Shopify admin → confirm posts appear in Review Queue within 60 seconds

**Social pipeline is fully automated after this step.**

**Character Library MVP:**
- [ ] `characters` table migration — `id, name, brand, description, reference_images TEXT[], primary_reference_url, style_tags TEXT[], lora_model_id, preferred_provider`
- [ ] `/api/characters/` CRUD routes
- [ ] Upload Gimli ToonBee reference images to Cloudinary as character #1
- [ ] Character picker in Creative Studio Images tab — select character → Claude reads character record + builds enhanced prompt → image API

**Exit Step 3:** Add an NCHO product in Shopify → posts appear in Review Queue automatically without touching Chapterhouse. Select Gimli in Creative Studio, describe a scene, get a Gimli-consistent image.

---

### Step 4 — Video Tab Rebuild
*HeyGen Avatar ID form is gone. Character-first, multi-provider video studio is in.*

**Provider evaluation (do this first — determines what gets wired):**
- [ ] Test Kling AI API — character reference image → animated clip. Document: cost, generation time, character consistency quality.
- [ ] Test D-ID API — Gimli reference image + ElevenLabs audio → talking head video. Document: cost, generation time, quality.
- [ ] **Provider order:** Kling AI first (animated clips — primary use case for Gimli). D-ID second (talking head fallback). HeyGen third (Scott-avatar only, already wired, don't touch).

**Video tab rebuild:**
- [ ] Remove old form (`Avatar ID | Voice ID | Script → Generate`)
- [ ] New form:
  ```
  [Character: Gimli ▼]   [Describe the scene]
  [Duration: 15s | 30s | 60s]   [Provider: Kling AI | D-ID | HeyGen]
  [Narration script — auto-generated from scene or typed manually]
  → Generate Video
  ```
- [ ] Video generation = Railway async job (same pattern as YouTube transcript worker)
- [ ] Job progress via Supabase Realtime
- [ ] Video lands in Review Queue when done — watch, approve, download

**Exit Step 4:** Select Gimli. Describe a scene. Pick Kling AI. Hit Generate. Video appears in Review Queue. The HeyGen Avatar ID form is gone permanently.

---

### Step 5 — Course Asset Dashboard + Batch Slides
*See every lesson's asset status. One button generates everything missing.*

**Pre-step config (not build work — just run these before starting):**
- [ ] Run `scripts/migrate-bundles-to-supabase.mjs` in CoursePlatform repo
- [ ] Set `BUNDLE_SOURCE=supabase` in CoursePlatform Vercel env
- [ ] Set `COURSE_SUPABASE_URL` + `COURSE_SUPABASE_SERVICE_ROLE_KEY` + `REPLICATE_API_TOKEN` in Railway worker env

**Course Asset Dashboard:**
- [ ] New section in nav: "Course Production"
- [ ] `GET /api/course-assets/status?course=sci-g2` — reads CoursePlatform Supabase `bundles` table, returns per-lesson coverage (bundle ✅/❌, slide images ✅/❌, audio ✅/❌, videos count, worksheet ✅/❌)
- [ ] Dashboard UI — course picker dropdown, 24-row lesson grid, 5 status dots per row
- [ ] "Generate All Missing" button

**Batch slide image generation:**
- [ ] `POST /api/course-assets/generate-slides` → Railway batch job → one image generation job per missing slide
- [ ] Claude uses Gimli character (from Step 3 Character Library) for relevant slides
- [ ] Images upload to Cloudinary → `image_urls` written back to CoursePlatform `bundles` table via `PATCH /api/course-assets/bundle/[id]` ✅ already built
- [ ] Realtime progress in Course Asset Dashboard — dots go green as jobs complete

**Exit Step 5:** Select sci-g2. Click "Generate All Missing Slide Images." Come back later. All 24 lessons show Images ✅. KaraokePlayer can render every slide.

---

### The Build Sequence

```
Step 1  Foundation: smoke test + brand voice → Supabase       gates Step 2
Step 2  Social core: Review Queue + Buffer integration         gates Step 3
Step 3  Social Version C (Shopify) + Character Library        ← SOCIAL April DEADLINE
Step 4  Video tab rebuild: Kling AI → D-ID → HeyGen (order)   gates Step 6
Step 5  Course Asset Dashboard + batch slide generation        gates Step 6
Step 6  Course video pipeline: 168 sci-g1 videos batch job    ← COURSE AUGUST DEADLINE
Step 7  Voice Studio narration: alongside Step 6
```

**Three build risks (in order of likelihood):**
1. **Step 3 Shopify webhook** — code is wired, but `SHOPIFY_WEBHOOK_SECRET` may not be set. Confirm in Vercel env before starting Step 3.
2. **Step 4 Kling AI** — character consistency via reference image is the whole gamble. If Kling AI doesn't hold Gimli's visual identity across clips, D-ID becomes the primary (talking head from static image + audio). Both get evaluated before the rebuild starts.
3. **Step 5 config** — bundle write-back is already built (Supabase + `PATCH /api/course-assets/bundle/[id]`). Risk is missing env vars in Railway worker: `COURSE_SUPABASE_URL`, `COURSE_SUPABASE_SERVICE_ROLE_KEY`, `REPLICATE_API_TOKEN`. These are config steps, not code steps.

---

## Round 9 — Sprint Architecture (Q63–66)

*(Gandalf asks — the last questions before we start building)*

---

**Q63 — Scope: does course video batch belong in the sprint or is it a separate phase?**

> **✅ DECISION LOCKED:** Course video pipeline is **Step 6 — a proper phase in the build order**, not a stretch goal. It comes after Step 4 (video provider wired) and Step 5 (bundle write-back working). The sequence is complete when all 168 sci-g1 videos are generated, reviewed, and KaraokePlayer renders every lesson end-to-end. That is the definition of done.

---

**Q64 — Bundle write-back: How does Chapterhouse update CoursePlatform files?**

> **✅ DECISION LOCKED (implemented):** **Option C — Supabase as source of truth.**
>
> `scripts/migrate-bundles-to-supabase.mjs` in CoursePlatform migrates all bundle flat files → `bundles` table. Both apps read from the same CoursePlatform Supabase DB. Chapterhouse writes image/audio URLs back via `PATCH /api/course-assets/bundle/[id]` (built in Chapterhouse). CoursePlatform reads bundles via `BUNDLE_SOURCE=supabase` env var toggle.
>
> **What still needs to happen on Day 5:** Run `scripts/migrate-bundles-to-supabase.mjs` in CoursePlatform, set `BUNDLE_SOURCE=supabase` in CoursePlatform Vercel env, set `COURSE_SUPABASE_URL` + `COURSE_SUPABASE_SERVICE_ROLE_KEY` in Railway worker env. The code is built — it's a config step, not a build step.

---

**Q65 — Video provider evaluation order?**

> **✅ DECISION LOCKED:** **Kling AI first, D-ID second, HeyGen stays as-is.**
>
> - **Kling AI** — animated character clips from reference image. Primary use case for Gimli (K-5 animated explainers). Wire this first.
> - **D-ID** — reference image + audio → talking head video. Same use case as HeyGen but cheaper. Wire this second as the fallback / Scott-avatar alternative.
> - **HeyGen** — already wired, already working for Scott avatar. Don't touch it. It's just one more option in the provider dropdown.
>
> Both Kling AI and D-ID get evaluated at the start of Step 4 before any rebuild happens. If Kling AI fails character consistency, D-ID becomes primary.

---

**Q66 — Build order priority?**

> **✅ DECISION LOCKED:** The sequence IS the priority order. Build in order. Keep going.
>
> 1. Foundation + brand voice (Step 1) — gates everything
> 2. Social pipeline (Steps 2–3) — April deadline
> 3. Character Library (Step 3) — gates all image/video gen downstream
> 4. Video tab rebuild (Step 4) — gates course video pipeline
> 5. Course Asset Dashboard + batch slides (Step 5) — gates final batch run
> 6. Course video pipeline (Step 6) — August deadline
> 7. Voice narration (Step 7) — alongside Step 6
>
> Nothing gets skipped. If something takes longer than expected, the next step starts when the previous one's exit criteria are met.

---

## ToonBee BeeGuide — UX Research Notes (March 24, 2026)

*Live session documentation from app.toonbee.ai. Purpose: inform Phase 4 (Video Tab Rebuild) UX design — specifically what Chapterhouse needs to replicate and where it should surpass ToonBee.*

### Scott's ToonBee Project History

7 existing projects at time of research, all 3D Pixar style, Landscape 16:9. Credit balance: 226.4.

| Project | Created | Scenes | Style |
|---|---|---|---|
| Gimli's Sound Quest | 3 days ago | 7 scenes | 3D Pixar |
| Galactic Learning Quest | Mar 14 | 4 scenes | 3D Pixar |
| gimli | Mar 13 | 1 scene | — |
| Garden Whispers | Mar 11 | 7 scenes | 3D Pixar |
| Gimli's Dino Odyssey | Mar 10 | 6 scenes | 3D Pixar |
| Gimli's Butterfly Tale | Mar 10 | 4 scenes | 3D Pixar |

Pattern: all Gimli, all 3D Pixar, all landscape. Scott has already validated the character + style combination across 6 multi-scene projects.

---

### ToonBee Creation Modes

At project creation, two paths:

- **BeeGuide** — AI-powered creation. Asks clarifying questions, develops story structure, then generates. This is the recommended path and the one Scott tested.
- **BeeStudio** — Full manual control. Direct scene editing. No AI assistance.

---

### BeeGuide Workflow — 6 Steps

ToonBee shows a persistent 6-step progress bar at the top of every screen:

```
Your Story → Review → Characters → Images → Voice & Music → Videos
```

**Step 1 — Your Story:**
- Text area (up to 3000 chars). Prompt entered: "I want to create a video of Gimli becoming a ninja and fighting nazis" (70 chars)
- AI scores your prompt in real time with a green banner: "Great! Your prompt looks good — Add more details like emotions or visual style for even better results."
- Settings on this screen:
  - **Aspect Ratio:** Landscape 16:9 (selected, FREE) | Portrait 9:16 (paid) | Square 1:1 (paid)
  - **Number of Scenes:** slider 1–49, default 7
  - **Style:** 22 styles across tabs (All Styles | Animated | Illustration | Fine Art | Contemporary). Free tier: **3D Pixar** only. All others (Paper Craft, Animated 3D, Low Poly, Anime, Storybook, Disney, and 16 more) are PRO tier.

**Step 2 — Review (BeeGuide quiz):**
Starts with a choice modal:
- **"Refine & Improve"** — Answer a few questions (recommended ⭐). Leads to 9-question story quiz.
- **"Start Directly"** — Process as-is. Skips all questions.

After selecting "Refine & Improve": loading screen ("Analyzing your idea — Preparing questions to enhance your story"), ~2-3 seconds, then the 9-question quiz begins.

---

### The BeeGuide 9-Question Story Quiz

Questions are context-specific — AI generated them from "Gimli becoming a ninja and fighting nazis." Each question has:
- A/B/C/D multiple choice options (AI-generated, specific to your prompt)
- "Or type your own" freeform text field at the bottom
- Back button to return to previous question
- Purple accent on selected answer

Questions follow a narrative arc: **motivation → origin → villain motivation → ally → weapon → climax → twist → conclusion → final details**

| Q | Question Asked | Scott's Selection |
|---|---|---|
| 1/9 | What is Gimli's motivation for becoming a ninja? | **A:** To seek revenge on the Nazis for attacking his homeland |
| 2/9 | How does Gimli acquire his ninja skills? | **D:** He is chosen by a spirit of a long-lost ninja clan to carry on their legacy |
| 3/9 | What motivates Gimli to fight against the nazis? | (options: steal dwarven treasures / destroy enchanted lands / personal vendetta / seek dark powers; selection not captured) |
| 4/9 | Who is Gimli's unexpected ally in his mission? | (options: time-traveling elf / orc turned against evil / mysterious human spy / dragon who owes Gimli a life debt; selection not captured) |
| 5/9 | What unique weapon does Gimli wield as a ninja? | **A** highlighted: A battle axe that transforms into a katana |
| 6/9 | What is the climax of the battle between Gimli and the nazis? | **D:** A battle in the heart of a volcano about to erupt |
| 7/9 | What unexpected twist occurs during the story? | **B:** The nazis are being controlled by a dark sorcerer |
| 8/9 | How does the story conclude for Gimli? | (options: leader of peacekeeping force / returns home as hero / travels world helping others / opens ninja school; selection not captured) |
| **9/9** | **"Any other important details?"** — Optional freeform field. Placeholder: *"E.g., 'Focus on humor', 'Include a plot twist at the end', 'Keep the tone professional'..."* | (optional — user types anything or skips) |

After Q9: **"✨ Generate Script →"** button → "Creating Your Masterpiece — Creating script outline..." loading screen (purple wand icon, progress bar, ~10-30 seconds) → drops into the **Review Storyboard** step.

---

### What This Reveals About ToonBee's Architecture

**What ToonBee does well:**
- **Progressive disclosure** — 6-step pipeline surfaces the right decision at the right moment (style before scenes, story before characters, characters before images). Never overwhelming.
- **The style picker is step 1** — users commit to visual identity before writing a word. This is correct.
- **Scene count is a setting, not an afterthought** — 1–49 slider, default 7 for a "full" video. Good default for a lesson (~3–5 min at ~25 seconds/scene).
- **BeeGuide quiz forces narrative structure** — even for someone who "just wants a quick video," the 9 questions produce a story with a beginning, middle, and end. The questions are the plot framework.
- **A/B/C/D + "type your own"** — never blocks creative intent while still guiding users who don't know what they want.

**Where ToonBee falls short (Chapterhouse's opening):**
- **ToonBee doesn't know Gimli.** The 9 questions ask general hero-story questions. None of them reference that Gimli is a 125-lb Alaskan malamute who is cross-eyed when annoyed and obstinate. ToonBee generates questions as if Gimli could be any character. Chapterhouse reads the actual Character Library record.
- **45 minutes per project.** This is the whole problem. ToonBee's workflow is beautiful but too slow for production volume. 168 sci-g1 videos × 45 minutes = not viable.
- **No curriculum awareness.** ToonBee has no concept of learning objectives, grade levels, or lesson structure. It tells stories — not lessons.
- **Style = PRO paywall.** Only 3D Pixar is free. Every interesting style (Anime, Storybook, Disney, etc.) requires a paid upgrade.
- **No batch mode.** Each project is a standalone manual workflow.

---

### Phase 4 Design Implications

**What Chapterhouse should replicate:**
- The 6-step pipeline structure (scene picker → characters → images → voice → video → review)
- Style picker at the start (visual identity decision before scene writing)
- Scene count control (1–49, default 7 for a lesson)
- Narrative arc structure (even for curriculum content: hook → explanation → example → check → close)
- Loading state between steps ("Analyzing your idea...") — sets expectations, feels intentional
- Per-scene character assignment — scenes can have different character combinations
- "Copy Script" button on the Review step — always let the user export what was generated
- Style-reference-as-consistency mechanism — when generating a new character, pick an existing character as the visual style anchor

**What Chapterhouse should replace:**
- The 9-question quiz → Claude reads the Character Library record and generates the full scene list automatically. No quiz required. Scott describes the lesson topic; Claude generates 7 Gimli-consistent scenes. User can edit any scene before generating.
- ToonBee's per-session bottleneck → Chapterhouse generates in Railway async jobs, multiple lessons in parallel
- ToonBee PRO paywall for styles → Chapterhouse uses whichever Replicate/Kling model is already configured per character

**The comparative advantage in one sentence:**
ToonBee makes great one-off cartoon videos. Chapterhouse makes 168 curriculum-aligned Gimli videos for a full course, automatically, while Scott sleeps.

---

### ToonBee BeeGuide — Remaining Steps (Continued from Screenshots, March 24, 2026)

#### Step 2 — Review Your Storyboard

After "Creating Your Masterpiece" loading completes, the Review step shows the full generated storyboard:

- Header: "Review Your Storyboard — 7 scenes • 3 characters"
- "Show Prompts" link (reveals the full image prompts for each scene)
- **Project Source | Copy Idea | Copy Script** toolbar — Copy Script exports the entire narration script as text

**Characters section** — ToonBee auto-detected 3 characters from the story: Gimli, Ninja Master, Time-Traveling Elf. Each character card shows:
- Character portrait (Gimli had one from prior projects — auto-populated ✓ Ready)
- Ninja Master and Time-Traveling Elf: "Add character image" with Library / Upload options, "Skip this to auto-generate using AI in the next step"
- "+ Add Character" button for extras

**Scenes section** — 7 scene cards with:
- One-line narration text per scene (cinematic, short). Examples:
  - Scene 1: *"High in the misted peaks, he chose discipline over destiny, and began again."*
  - Scene 2: *"Under a silent master, he learned to move like smoke and strike like stone."*
  - Scene 3: *"When his meteor-forged blades finally obeyed, the coming fight stopped feeling impossible."*
- Character avatar icons showing which characters appear in each scene
- Edit (pencil) and delete (trash) icons per scene
- "Drag scenes to reorder" affordance
- "+ None assigned" prompt on scenes with no character yet

"Next Step: Generate Characters" button proceeds.

**Auto-generated project name:** ToonBee named the project **"Mist Dojo Vendetta"** — it created a cinematic title from the story content automatically.

---

#### Step 3 — Generate Characters

Two states captured:

**Before generation (1/3 ready):**
- Gimli: ✓ Ready (had image from prior project, shown)
- Ninja Master: "Generate or add image" → Generate / Library / Upload buttons
- Time-Traveling E...: same options
- "Skip this to auto-generate using AI in the next step" note on empty cards

**Generate Character modal (for Ninja Master):**
- **"Image Reference As Style"** — critical feature. Two options:
  - "No Image Refer..." (blank) — use a style preset instead
  - "Gimli" (with thumbnail ✓ selected) — use Gimli's visual style as the consistency anchor for this new character
- Orange banner: *"✨ The new image will match the style of the selected character. Select 'No Image Reference' to select a visual style instead."*
- Image Prompt (editable): full cinematic portrait description of Ninja Master ("elderly human male martial arts master, lean and wiry build, late 60s to 70s, tan skin, sharp cheekbones, calm piercing eyes, long silver hair tied into a topknot...")
- Generate costs **1 credit**

**After generation (3/3 ready):**
- Gimli: ✓ Ready — husky/malamute in colorful flower garden, 3D Pixar style
- Ninja Master: ✓ Ready — dark ninja figure in dim interior
- Time-Traveling E...: ✓ Ready — armored female warrior, silver-haired

**"Select Existing Character" library modal** — when clicking Library button to pull from prior projects:
- Search bar: "Search by name or project..."
- Yellow banner: "Only characters in the same aspect ratio as your project will be shown"
- Shows ALL characters across ALL projects, grid view:
  - Mischievous Squirrel (Gimli's Sound Quest)
  - Cartoon Cat / Middle-aged man (Gimli's Sound Quest, Galactic Learning Quest) — bald professor type
  - Gimli × 2 — one from each prior project (slight variation between them)
  - **scott** (from "gimli" project) — a real photo of Scott himself, bald, beard, dark background
  - Additional professor/teacher characters visible below
- Confirms: ToonBee builds a cross-project character library over time. Reuse is built-in.

---

#### Step 4 — Generate Scene Images

**Before generation:**
- "Generate All Images" button (badge: **7cr** = 1 credit per image × 7 scenes)
- Each scene card has: image placeholder, upload icon, "Generate" button, image prompt (truncated), character avatars

**During/after generation:**
- Most scenes: "Ready" green badge with generated image
- Scene 3: "Failed" orange badge with retry button
- "Generate Failed Images (1)" button prominently shown — regenerate only the failed scenes, not the whole batch

**After all complete:**
- "Images Complete — All images have been generated." success screen (blue checkmark icon)
- Yellow note: "You can add new scenes or remove scenes, by going to the Review step. Regenerate individual images via the button on each scene card."

**Credit cost:** 7 images × 1cr each = **7 credits total**. Not per provider — image generation cost is separate from video generation.

---

#### Step 5 — Voice & Music Studio

- **"Generate Voice & Music — 0/7 voiceovers"**

**Choose Your Narrator** (scrollable row of voice cards):
| Voice | Description |
|---|---|
| Clara (selected ✓) | Warm and friendly female voice |
| Marcus | Deep and authoritative male voice |
| Austin | Soft and soothing storyteller |
| Zara | Bright and energetic |
| Patrick | Classic narrator voice |
| + more (scroll right) | — |

**Speaking Style** (pill toggles): Standard • Warm & Friendly • Professional • Energetic • Calm • Dramatic • **Educational** • Podcast  
Freeform text area below: "Speak in a serious, cinematic tone with calm intensity and clear pacing."

**"Generate Voiceovers (7)"** → 7 credits, generates narration for all 7 scenes at once.

**Background Music section:**
- Style presets: Standard (selected) • Cinematic • Upbeat • Lo-Fi • Emotional • Tech • Peaceful • Jazz • Retro
- AI generates a description: *"Cinematic hybrid score: taiko drums, low strings, airy chorus, subtle synth pulses, rising tension into percussive action, then warm resolved chords."* 
- "Generate Music" button (credit cost not shown in screenshot) + "Upload Music" button (bring your own)

**Scenes shown below** with auto-generated voiceover text per scene (ready for individual editing).

**Credit cost estimate:** 7 voiceovers × 1cr = **7 credits** (based on pattern from images step).

---

#### Step 6 — Generate Videos

**"Generate Videos — 0/7 videos"**

**Provider selection dropdown** — full list with credit costs:

| Provider | Type | Credits/video | Notes |
|---|---|---|---|
| **WAN - Fast, Affordable** | Free | ⚡ 3.0 | Selected by default ✓ |
| Hailuo 2.3 Fast | Free | ⚡ 6.0 | Recommended |
| Seedance 1 PRO fast | Free | ⚡ 6.0 | Recommended |
| Seedance 1.5 PRO | Free | ⚡ 8.0 | Top Choice - Great Quality |
| PixVerse 5 | PRO | ⚡ 12.0 | PRO tier required |
| **Kling 2.1** | PRO | ⚡ 14.0 | PRO tier required |
| Grok | PRO | ⚡ 15.0 | Has Sound Effects - Top Quality |

**Per-project cost math:**
- WAN (default): 7 videos × 3cr = **21 credits/project**
- Kling 2.1: 7 videos × 14cr = **98 credits/project** (~2.3 projects from Scott's 226 credit balance)
- At 168 sci-g1 videos: WAN = **504 credits total** | Kling 2.1 = **2,352 credits total**

**Scene list with video prompts** — AI generated a video motion description per scene (different from the image prompt). Examples:
- Scene 1: *"...the secluded dojo nestled among ancient trees. Mist drifts steadily between trunks and over the roofline..."*
- Scene 2: *"A gentle push in toward the training pair as the elderly robot master performs one smooth, controlled sequence of hand and foot movements, then side-steps..."*
- Scene 3: *"A slow dolly in as the dwarf warrior performs a short, precise dagger drill: one controlled cross-slice, a tight pivot, then both blades return to a guarded..."*

Each scene has a separate IMAGE prompt and a separate VIDEO MOTION prompt — two layers of AI direction.

---

#### BeeStudio — The Video Editor

After all assets are generated, ToonBee drops into a full NLE-style editor:

- **Project name:** "Mist Dojo Vendetta" (auto-generated, editable)
- **Status:** `RESEARCH • Auto-saved`
- **Top bar:** Characters (3) | Background Music | Export button

**Main viewport:** Full-width scene preview (1280×720 landscape). Scene 1 shows the cinematic dojo image with mist — photorealistic, dark/moody atmosphere even in "3D Pixar" style.

**Right panel — Inspector (Scene 1):**
- Scene Image (✓ Ready dropdown)
- Scene Video (expandable)
- Voice Settings (expandable)
- **CONTENT section:**
  - Script & Captions
  - Text & Image Layers
- **TIMING & EFFECTS section:**
  - Scene Duration: **6.0s** (default — editable)
  - Scene Image Effects
  - End Of Scene Transition

**Bottom timeline:**
- 7 scene thumbnails in sequence
- Total: **7 scenes • ~42s** (7 scenes × 6.0s default)
- "Add Scene" button at end
- Playback controls: ← | ▶ | →

**Top search bar:** "Ask anything about ToonBee..." — in-app AI help

**Export button** — orange, top right — final render to video file.

---

### Revised Phase 4 Design Implications (Complete Picture)

Now that the full 6-step pipeline is documented, the Phase 4 rebuild has a complete reference model.

**Credit economics — key insight:**
ToonBee's WAN model (3cr/video) makes 168 sci-g1 videos cost ~504 credits. At ToonBee pricing, that's a real spend. For Chapterhouse, the equivalent is Replicate compute costs — check if WAN model is available via Replicate API before defaulting to Kling.

**Kling 2.1 is PRO tier on ToonBee (14cr)** — this is why it was expensive in Scott's testing. If Chapterhouse calls the Kling API directly (not through ToonBee), per-second billing likely undercuts ToonBee's credit markup significantly.

**The dual-prompt system is worth replicating:**
- Image prompt → what the scene looks like (static)
- Video motion prompt → how the camera/scene moves (dynamic)
Claude should generate both, separately, for every scene in the course pipeline.

**Scene duration default = 6.0s per scene, 7 scenes = 42s total video.**
For a curriculum lesson, 7 scenes × 6s = 42s introduction video. That's correct for a hook/intro. Full lesson sections would need longer (15–30s per scene).

**The Character Library cross-project reuse is the sleeper feature.**
ToonBee remembers every character Scott has ever created across all projects. When starting a new project, you pull from that history. Scott's Gimli has already appeared in 6 projects — each one slightly refining the visual. Chapterhouse's `characters` table plus `reference_images[]` is the architectural equivalent, but it needs to surface reuse proactively ("You've used Gimli in 6 prior projects — use the same reference?").

**The style-reference-for-new-characters feature should ship with Phase 3.**
When generating a new character (e.g., a student character for a lesson), the user should be able to select Gimli as the style reference so the new character lives in the same visual world. This is the `imagePrompts[0]` pattern in Leonardo or the `image` reference in Replicate flux-dev — it's already half-wired.




