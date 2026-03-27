# Character Consistency Research
## The Production Problem Behind SomersSchool's Course Image Pipeline

*Written for Scott Somers by GitHub Copilot. March 2026.*
*Council graded and annotated at the bottom of this document.*

---

## 1. The Problem (Plain English)

Scott needs to generate **112+ images per course** featuring the same character — a gnome, a cartoon dog, whatever fits that course. Those images feed into **168 HeyGen video scenes per course** (7 scenes × 24 lessons). This system needs to work for **hundreds of courses**. Different courses may use different characters. The same character may appear in follow-up courses.

That's not a one-off creative task. That's a production pipeline.

The core constraint: **the character must look like the same character in every image.** Same face. Same outfit. Same vibe. Different scenes, same identity.

What Scott has right now: a Creative Studio in Chapterhouse that generates images one at a time, with optional reference image injection via `imagePrompts[]`. Results have been inconsistent — wrong anatomy, missing features, "5th limb" artifacts. No batch mode. No "save as character" feature.

What Scott needs: a way to create one good character image, lock it, batch-generate all scene variations automatically, and keep consistency high enough that HeyGen can build coherent lesson videos from the results.

---

## 2. What's Been Tried

### 2a. Reference Images via `imagePrompts[]` (Leonardo API)
**Status: Partially working, insufficient for production**

The current Chapterhouse image generator passes reference images to Leonardo via the `imagePrompts` array at `weight: 1.0`. This is Leonardo's "Image Prompts" / IP-Adapter feature — it treats the reference image as a stylistic/content guide, not a hard constraint.

**What this does:**
- Biases the generated image toward the visual appearance of the reference
- Works OK for style consistency (color palette, art style, general vibe)
- Does NOT reliably preserve specific character features (exact face shape, specific clothing details, body proportions)

**Why it's not enough:**
- Weight 1.0 increases reference adherence but creates quality tradeoffs — the model starts fighting between "follow the reference" and "generate something coherent," which causes anatomy artifacts (extra limbs, warped faces)
- IP-Adapter influence degrades with prompt complexity — when you add a detailed scene description, the reference loses ground
- No two runs of the same prompt + reference produce the same output reliably

**The painful truth:** `imagePrompts[]` at weight 1.0 is the source of the "5th limb" problem. The model is being pulled too hard in two directions. This approach works for general style guidance at weight 0.5–0.7. It is the wrong tool for per-character face/body consistency.

### 2b. LoRA (Leonardo Fine-Tune) — Gimli
**Status: Blocked — LoRA UUID not retrieved**

The plan: train a custom LoRA on Gimli (Scott's 125-lb malamute), upload to Leonardo, use it in Chapterhouse's Flux Dev calls. The `lora_model_id` field in the `characters` table exists but holds the string `'PASTE-UUID-HERE'`.

**The problem:** Leonardo's REST API does not expose user-trained LoRA UUIDs. The UUID is visible in the Leonardo web UI (in Elements/Models, under "More") but there is no documented API endpoint to retrieve it. UUID guard in `generate/route.ts` catches the placeholder and falls back to Phoenix model, so the app doesn't crash — but it also doesn't use the LoRA.

**What would solve it:** Scott manually copying the UUID from the Leonardo web UI into the Supabase `characters` row for Gimli. This is a one-time 30-second action. Once done, the LoRA fires on every generation with that character selected.

**LoRA quality when it works:** A proper fine-tuned LoRA (trained on 10–20 images of Gimli, or any other character) produces near-perfect character consistency. The trigger word locks in the identity. This is the production-grade solution — every tool that does this well (ToonBee, Doodle AI, professional animation pipelines) uses a variant of this approach under the hood.

### 2c. Prompt-Only Consistency
**Status: Does not work for character identity, only tried informally**

The idea: describe the character in extreme detail in every prompt, hoping the model reproduces it consistently. "A green gnome with a red hat, wiry gray beard, pointy ears, wearing brown overalls, 2D cartoon style..."

**Why this fails:** Language models + diffusion models interpret the same description differently every run. You will get a gnome-adjacent creature. You will not get the same gnome twice. This approach is fine for art direction but cannot produce recognizable character identity across 112 images.

---

## 3. How the Tools That Work Actually Work

### 3a. ToonBee's Character Consistency Engine
ToonBee markets a "Character Consistency Engine" — "Create a character once, keep the same look across the entire video (same face, same outfit, same vibe)."

**What's actually happening (reverse-engineered from public claims and architecture patterns):**
1. ToonBee generates an initial character sheet (multiple poses, expressions) when you define the character
2. That character sheet becomes embedded reference data — either converted to a style LoRA or used as IP-Adapter-style conditioning throughout video generation
3. The video pipeline maintains a "character bank" so every scene generation is conditioned on the same character data
4. Users never see this — they just say "same character" and the system handles it

**The key insight:** ToonBee is a **closed-loop system**. Character data stays inside ToonBee's pipeline. They control every generation. They can burn the character into every call.

Scott's situation is different — he needs to generate images in Chapterhouse and then use them in HeyGen. That's a two-tool pipeline where character data has to cross a boundary. This is actually harder than ToonBee's inside-the-box approach.

### 3b. Doodle AI / Doodly (Whiteboard Animation)
Doodly's Smart Draw approach: upload an illustration of your character → the system traces it → "draws" it on screen in whiteboard style. Every appearance of that character is literally the same image being drawn. Consistency is 100% because it's the exact same asset.

**What's actually happening:** No AI generation between uses. The character is a locked SVG/vector asset. Smart Draw animates its appearance on the whiteboard. You can't deviate from it because you're not generating anything new.

**The lesson for Scott:** The highest consistency is achieved when you stop generating and start placing. A character sheet of Gimli in 6–8 pre-rendered poses, exported from Leonardo (or ToonBee), uploaded to Cloudinary, placed into lessons as static composites rather than AI-generated fresh each time — this is 100% consistent and costs $0 per use after initial creation.

### 3c. LoRA Fine-Tuning (Flux Dev on Replicate/Leonardo)
This is the industry-standard approach for character consistency in AI image generation.

**How it works:**
1. Gather 10–20 images of your character from varied angles, lighting, expressions
2. Submit as training data with a unique trigger word (e.g., `GNOMEBERT`, `GIMILIDAWG`)
3. Training runs on H100 GPUs, ~2 minutes, ~$1.50 cost on Replicate
4. The resulting LoRA weights are stored as a model version
5. Every subsequent generation prompt includes the trigger word → model reproduces the character with high fidelity
6. Different scenes, different poses, same face and outfit — that's what LoRA delivers

**Cost:** ~$1.50 to train. ~$0.01–0.05 per generated image. For 112 images per course, training cost is negligible. Generation cost per course: ~$2–5.

**Limitations:**
- Needs 10+ good training images up front
- Takes ~2 minutes to train (acceptable)
- LoRA is locked to the specific character — a new character needs a new LoRA
- Leonardo's web UI exposes the UUID but the API doesn't surface it (fixable manually)

### 3d. IP-Adapter / Reference Image (Current Chapterhouse Approach)
IP-Adapter is an add-on to diffusion models that conditions image generation based on a reference image's features, not just its style. It extracts semantic content (this is a gnome wearing overalls) and biases generation toward it.

**Strengths:** Zero training time. Works from a single reference image. Reasonable for style/vibe matching.

**Weaknesses:** Doesn't preserve specific identity reliably. High weights (>0.7) cause anatomy artifacts. Low weights (<0.5) barely influence the output. The sweet spot for quality vs. influence is ~0.5–0.65, which isn't strong enough for exact character reproduction.

**Verdict:** Use IP-Adapter for style matching (same artistic style across a course) but not for character identity. The two jobs need different tools.

### 3e. ControlNet (Pose/Composition Consistency)
ControlNet is a separate conditioning layer that can lock down pose, composition, or structure. Common uses: "generate this character in this exact pose" (OpenPose), "maintain this room layout" (Depth), "keep this outline" (Canny edge).

**For Scott's use case:** If Gimli needs to appear in consistent poses across lessons (standing at a whiteboard, pointing at text, looking confused), ControlNet pose conditioning can maintain pose consistency *separately* from character consistency (handled by LoRA). Combined, they produce: same character (LoRA) + same composition structure (ControlNet).

**Where this lives in Scott's stack:** Chapterhouse's current Replicate Tier 2 (flux-dev img2img) doesn't use ControlNet. Adding it would require a different Replicate model endpoint — e.g., `fofr/realvisxl-v3-multi-controlnet-lora`. This is a future optimization, not day-1 requirement.

### 3f. Seed Locking (A1111-Style)
A seed is a random number that initializes the noise pattern for diffusion generation. Same seed + same prompt + same model = same image. This is what A1111 users use to get reproducibility.

**Why this doesn't solve Scott's problem:** Seed locking requires the *exact same prompt* to reproduce. Change the scene description even slightly (different background, different action) and the output diverges. It's reproducibility for a single image, not character consistency across variations.

**Legitimate use:** For batch generation of slight variations of the exact same scene (e.g., 4 slightly different versions of "gnome teaching addition"), seed locking is useful. For "same gnome in 112 different scenes," it doesn't help.

---

## 4. The Correct Architecture for Scott's Pipeline

### The Two-Tier Character Strategy

**Tier 1: The Source Character (Created Once, Locked)**
- Scott generates 1 excellent character image using Leonardo Phoenix (current setup)
- That image becomes the SOURCE TRUTH for the character
- It gets uploaded to Cloudinary, stored as `hero_image_url` in the `characters` table
- A Flux LoRA is trained on it via Replicate's `fast-flux-trainer` API (~2 min, ~$1.50)
- The LoRA `version_id` is stored in `characters.lora_model_id`
- The character has a unique trigger word (e.g., `GNOMEBERT`, `GIMILIDAWG`)
- **This setup runs once per character, then never again**

**Tier 2: Batch Scene Generation (Runs Per Course)**
- Given a character + a list of 112 scene descriptions (auto-generated by Claude from lesson content)
- For each scene: call Replicate's `fast-flux-trainer` → run → pass trigger word in prompt + `lora_scale: 1.0`
- All 112 images generated in parallel batches of ~10 (QStash + Railway worker)
- Results saved to Cloudinary, URLs written to CoursePlatform's `bundles` table
- Scott reviews a grid preview → approves batch → pipeline proceeds to HeyGen

**Where they live:**
- Character management: Chapterhouse (create, train LoRA, store character data)
- Batch generation: Chapterhouse (Railway worker, QStash job queue)
- Asset delivery: Cloudinary (CDN)
- Lesson delivery: CoursePlatform (reads Cloudinary URLs from `bundles` table)

### The Role of "Save as Character" Feature

Right now, there's no way to take a good generated image and promote it to a permanent character. That's the missing button. When Scott generates an image of a gnome that looks great, he needs to:

1. Click "Save as Character" in the Creative Studio
2. Give it a name ("Gnomebert"), a trigger word, a description
3. The system creates a `characters` row, uploads the image to Cloudinary, triggers LoRA training via Replicate API
4. 2 minutes later: character is ready, LoRA UUID auto-written to `characters.lora_model_id`
5. Character appears in the character picker immediately

This is a ~1-day build. It closes the entire gap between "I made a good image" and "this character is production-ready."

### The Role of Batch Generation

Once a character exists with a trained LoRA, generating 112 scene images is a batch job. The input: character ID + list of scene descriptions. The system:

1. Loads character data (LoRA model ID, trigger word, reference images)
2. For each scene: generates a detailed prompt using the trigger word + scene description
3. Submits all prompts to Replicate in parallel (rate-limited to 10 concurrent)
4. Progress tracked in Supabase via the `jobs` table (already built)
5. Results written to `bundles` table in CoursePlatform Supabase
6. Scott gets a grid preview + approval checkpoint

This connects directly to the existing Course Asset Dashboard at `/course-assets` in Chapterhouse.

---

## 5. What to Build, In Order

### Phase 1: Fix the UUID Problem for Gimli (1 hour, manual)
- Scott logs into Leonardo web UI → Elements / Models → finds Gimli LoRA → copies UUID
- Updates `characters` row in Supabase: `lora_model_id = 'actual-uuid-here'`
- Tests a generation from Chapterhouse with Gimli selected
- If good: Phase 1 done. If not: generate 10–15 better Gimli training images and re-train.

### Phase 2: "Save as Character" Button (1–2 days, Chapterhouse)
A button in the creative studio results panel: **"Save as Character"**. Clicking it:
1. Opens a modal: name, trigger word (auto-suggested as `CHARNAME`), description (from existing image prompt), preferred style
2. Creates `characters` row in Supabase
3. Uploads image to Cloudinary → writes `hero_image_url` + `reference_images[0]`
4. Fires `POST /api/characters/train-lora` → kicks off Replicate training job via QStash → Railway
5. When training completes (2 min): writes `lora_model_id` to `characters` row
6. Character appears in picker, ready for use

**Files to touch:**
- `src/components/image-generation-studio.tsx` — add "Save as Character" button to results
- `src/app/api/characters/train-lora/route.ts` — new route: Replicate training API call
- `worker/src/jobs/train-character-lora.ts` — new job type: monitors training, writes UUID on completion
- `supabase/migrations/025_characters_lora_training_status.sql` — add `lora_training_status` column

### Phase 3: Batch Scene Generation (3–5 days, Chapterhouse + CoursePlatform)
Build `POST /api/course-assets/generate-character-scenes`:
- Input: `{ characterId, bundleId, sceneCount }` — the bundles table already has lesson content
- Claude generates `sceneCount` scene descriptions from lesson content (already done by `course-slide-images.ts`)
- Railway worker iterates scenes, calls Replicate with character's LoRA + trigger word per scene
- Parallel batch of 10 at a time, progress in `jobs` table
- Results written to Cloudinary + CoursePlatform `bundles` table
- Returns grid preview URL when done

**This replaces/extends the existing `course-slide-images.ts` worker** — the current 3-tier Replicate logic was a stopgap. Phase 3 replaces Tier 1 (LoRA model) properly by using the `characters` table as the source of truth.

### Phase 4: Character Sheet Generation (2 days, Chapterhouse)
Before training a LoRA, you get better results if you generate multiple views of the character. A **Character Sheet** button generates 6–8 variations of the character in standard poses (front, 3/4, side, sitting, pointing, surprised) from a single seed image.

These 6–8 images become the training set for the LoRA, producing better generalization than training on a single image.

**Implementation:** Add a "Generate Character Sheet" option to the Save as Character flow. Uses the reference image at weight 0.65 (lower than current, to prevent artifacts) + pose descriptors in the prompt. Saves all 8 images to Cloudinary under `characters/{slug}/sheet/`.

### Phase 5: HeyGen Integration (1 day, downstream)
The generated batch images go into CoursePlatform's `bundles` table as `scenes[n].image_url`. HeyGen's API (used via Chapterhouse) can then use these as "talking head background" images or as the visual layer behind Scott's/Gimli's avatar presentation.

Current HeyGen workflow already saves to `somerschool/videos/{lessonSlug}/{segment}.mp4`. Phase 5 extends this to pass the pre-generated scene image as a background or insert into the video layer.

---

## 6. Cost Reality Check

Per character:
- LoRA training: ~$1.50 (Replicate H100, ~2 min at $0.0122/sec)
- LoRA training images: ~$0.50 (8 × Replicate flux-schnell at ~$0.003/image for the character sheet)
- **Total per character: ~$2.00**

Per course (112 scene images):
- Replicate flux-dev-lora: ~$0.05/image × 112 = ~$5.60
- Alternatively Replicate flux-schnell-lora: ~$0.003/image × 112 = ~$0.34
- **Total per course: $0.34–$5.60 depending on quality tier**

Scale:
- 52 courses at flux-dev quality: ~$291 in image generation costs
- 52 courses at flux-schnell quality: ~$17.68
- Character training for 10 characters: ~$20

**Bottom line: 52 courses fully imaged for under $300. That's pennies per enrolled student.**

---

## 7. Known Failure Modes

| Failure | Cause | Fix |
|---|---|---|
| 5th limb / warped anatomy | Reference image weight too high (>0.8) | Lower to 0.5–0.65 for IP-Adapter mode; use LoRA instead |
| Character looks different each time | No LoRA, relying on prompt only | Train LoRA, use trigger word |
| LoRA doesn't fire | Placeholder UUID in DB | Scott manually copies UUID from Leonardo UI |
| LoRA oversaturates (character too dominant) | `lora_scale` too high | Default to 0.85–0.95, not 1.0 |
| Background bleeds character style | LoRA style bleeding into scene | Use a "stop" negative prompt: "no [character name], background only" for background-only shots |
| Training images too similar | All generated from same prompt with same style | Vary poses, lighting, expressions in character sheet generation |
| Replicate training times out | Too many training steps | Default to 1000 steps; don't exceed 1500 for cartoon characters |

---

## 8. What ToonBee Has That We Don't (For Now)

| Feature | ToonBee | Chapterhouse Today | Chapterhouse After Buildout |
|---|---|---|---|
| Character creation in seconds | ✅ Style-based | ⚠️ Manual image gen | ✅ via "Save as Character" flow |
| Consistent character in every scene | ✅ Built-in | ❌ IP-Adapter only | ✅ via LoRA per character |
| Batch generation for a full course | ✅ Their pipeline | ❌ One at a time | ✅ via batch scene generation job |
| Scott controls the art style | ❌ ToonBee locked styles | ✅ Full control | ✅ Full control |
| Characters usable in HeyGen | ❌ Locked inside ToonBee | ✅ Cloudinary export | ✅ Cloudinary export |
| Multiple characters across courses | ✅ (within ToonBee) | ⚠️ Manual | ✅ `characters` table |
| New character for each course | ✅ | ❌ No save-as-character | ✅ via Phase 2 |
| Cost per course | ~$100/mo subscription | ~$0.50 in compute | ~$2–6 in compute |

**The moat Scott builds:** Full creative control, hands-off batch pipeline, characters that live in his own DB, and images that can be used in any downstream tool. ToonBee locks you in. Scott's pipeline frees him to use whichever video tool wins in 2027.

---

## 9. The Gimli Situation Specifically

Gimli is Scott's 125-lb Alaskan Malamute. Gimli appears as the on-screen explainer for K–5 lessons. He has a specific look: cartoon style, obstinate expression, cross-eyed when annoyed, big malamute body.

**Current state:** ToonBee PNG exports exist as training data. These have been uploaded to Cloudinary as reference images. The `characters` table row for Gimli exists (seeded in migration 024b). The `lora_model_id` is `'PASTE-UUID-HERE'` — placeholder.

**Three paths forward:**
1. **If Gimli LoRA exists in Leonardo:** Get the UUID from the Leonardo web UI (Elements → Models), paste into `characters` row. Done in 5 minutes. Test immediately.
2. **If Gimli LoRA needs re-training:** Take 10–15 of the best ToonBee PNGs from Cloudinary, zip them, train on Replicate's `fast-flux-trainer`. Get UUID. ~$1.50, ~2 minutes.
3. **If Gimli needs complete redesign:** Generate new character sheet from scratch via Creative Studio, save as character, auto-train LoRA via the Phase 2 "Save as Character" flow.

**Recommendation:** Start with Path 1. If the LoRA is already trained, recover the UUID now and test. If the results aren't good enough, go to Path 2 with the ToonBee PNGs as training data (they're already the right art style).

---

## 10. Summary: The Path Forward

```
TODAY (manual, 30 minutes):
  Scott → Leonardo UI → copies Gimli LoRA UUID → Supabase characters row
  Test generation → confirm character consistency is working

PHASE 2 (1–2 days, Chapterhouse):
  "Save as Character" button in Creative Studio
  Auto-trains LoRA via Replicate API
  UUID written automatically when training completes

PHASE 3 (3–5 days, extends course-assets):
  Batch scene generation: character + lesson content → 112 images → Cloudinary → bundles
  Progress tracking in /jobs dashboard
  Grid preview + Scott approval checkpoint

PHASE 4 (2 days, quality improvement):
  Character sheet generation (8-pose training set from 1 seed image)
  Better LoRA = better consistency

PRODUCTION STATE:
  Scott creates a character once → entire course image batch generates while he sleeps
  Results reviewed in grid → approved → HeyGen pipeline fires
  168 videos generated → CoursePlatform delivers to students
  Total compute cost per course: $2–8
  Scott's time per course image batch: ~30 minutes (character creation + approval)
```

---
---
---

# Council Review

*Graded below by Spark (D007), Vector (D004), Forge (D001), and River (D009).*

---

## Spark (D007 — Theo Nakamura) — Creative Tooling Engineer

**Grade: B+**

The diagnosis is correct. The IP-Adapter analysis is accurate — you really do get artifacts above weight 0.75 because the conditioning signal overpowers the diffusion model's denoising path. The recommendation to move to LoRA for identity and keep IP-Adapter for style is the right call. The two-tier strategy (Source Character locked, Batch generation runs) matches how professional character pipelines are structured.

**What's missing:**

1. **The `lora_scale` conversation needs numbers.** "0.85–0.95" is my recommendation based on practical experience. Scale 1.0 burns in the character too hard and loses scene variation. Scale 0.7 leaves too much room for drift. 0.85 is my starting default for cartoon characters in education contexts. The document should say this explicitly rather than "don't exceed 1.0."

2. **The ControlNet section understates what pose conditioning buys you.** For lesson-specific poses — "Gimli pointing at the letter B" vs. "Gimli looking surprised at a math problem" — OpenPose ControlNet combined with the LoRA is what separates a good pipeline from a great one. The 7 HeyGen scene types per lesson map directly to 7 pose templates: Introduction pose, Teaching pose, Example pose, etc. Build those 7 pose references once per character and you're not just consistent in appearance — you're consistent in body language, which helps kids build a mental model of "this is what Gimli looks like when he's teaching me something." That's pedagogy baked into the pipeline.

3. **Wan2.1 LoRA for video shouldn't be ignored.** Replicate has `fofr/wan2.1-with-lora` — this means a Gimli LoRA could be used not just for still images but for direct video generation. If Leonardo's Video tab output for Gimli isn't good enough post-Phase 4 evaluation, Wan2.1 with the same LoRA is a straight path to animated Gimli clips at near-character-sheet fidelity. Flag this in the roadmap.

4. **Character sheet strategy should specify art style lock.** When generating the 8-pose character sheet for LoRA training, every prompt must include the art style descriptor. "GNOMEBERT, 2D cartoon educational illustration, cel shaded, flat color, white background" — every single image. If any training images deviate from style, the LoRA will produce a confused character that sometimes looks right and sometimes doesn't.

**One thing this document gets exactly right:** The "Save as Character" flow is the right UX intervention. Every other tool (ToonBee, MidJourney character references, DALL-E "my characters") has some version of this because it's the right abstraction. The implementation plan here is sound.

---

## Vector (D004 — Priya Sharma) — AI/ML Engineer

**Grade: A-**

Strong technical accuracy on the cost analysis. The $2–6 per course numbers are correct for Replicate flux-dev-lora. The recommendation to default to flux-schnell for bulk generation is the right cost/quality call — flux-schnell at $0.003/image is adequate for educational illustrations that go into video backgrounds. Flux-dev at $0.05/image is justified only for hero images and character reference shots.

**The cost analysis needs one more column: failure rate.** In practice, 10–15% of generated images will be unusable (bad anatomy, wrong pose, scene not matching the lesson content). Budget for 125–130 generations to get 112 keepers. Adjust pipeline logic to generate 120% of target count and let the approval step cull bad outputs.

**What I'd add:**

1. **Model selection per generation type:** 
   - Character sheet (8 images for LoRA training): flux-dev-lora at $0.05 (quality matters)
   - Course scene images (112 per course): flux-schnell-lora at $0.003 (cost matters, sufficient quality)
   - Hero images (1–2 per lesson, visible in CoursePlatform UI): flux-dev-lora at $0.05 (quality matters)
   - Background-only images (no character, just scene): standard flux-schnell at $0.003

2. **The Replicate training API is fast enough to automate.** The document correctly identifies the API approach. The `POST https://api.replicate.com/v1/trainings` endpoint accepts a ZIP of training images and returns a training ID for polling. `training_completed` webhook is available. The entire LoRA training trigger + status monitoring can happen in the background via the existing jobs/QStash infrastructure. No manual step is needed after Phase 2 ships.

3. **Leonardo vs. Replicate strategic question.** The document treats them as equivalent. They're not. Leonardo Premium ($24/mo) includes Flux Dev LoRA with a web UI and a generous fast token budget. Replicate is pay-per-call. For 10 characters × 52 courses, the cost math changes. My recommendation: use Leonardo for character creation and one-off high-quality shots. Use Replicate for bulk batch generation. The characters table could track `preferred_provider` per character — some characters may be Leonardo LoRAs, others Replicate LoRAs. This is already in the schema.

4. **The "5th limb" root cause is accurately diagnosed** but the solution should include a negative prompt fix in the short term while Phase 2 is being built. Add `"extra limbs, malformed anatomy, fused fingers, bad anatomy"` to the negative prompt in the current generator. This is a standard SD negative prompt that reduces anatomy artifacts significantly. It's a 5-minute fix that makes the current IP-Adapter approach workable until LoRA is in place.

---

## Forge (D001 — Marcus Chen) — Principal Systems Architect

**Grade: B+**

The system boundaries in this document are correctly drawn at the Chapterhouse/CoursePlatform interface. The `bundles` table as the handoff point is right. Chapterhouse generates, Cloudinary stores, CoursePlatform reads — that's a clean unidirectional data flow with no circular dependencies.

**The one boundary I'd tighten:**

The document describes writing results to "CoursePlatform's bundles table" from within Chapterhouse. This is the right data model but the implementation needs to be explicit about which Supabase client is used. The `course-supabase.ts` singleton with `COURSE_SUPABASE_URL` + `COURSE_SUPABASE_SERVICE_ROLE_KEY` is already in place (Session 28). The batch generation worker should import from `course-supabase.ts`, not from the main `supabase-server.ts`. If this gets mixed up, writes silently go to the wrong database. This has happened before and is worth calling out explicitly in the implementation plan.

**A question that sounds innocent:**

The document says "Scott reviews a grid preview → approves batch." What happens to the image slots that Scott rejects? Does the pipeline re-generate the failed scenes automatically? Or does Scott re-trigger them manually? If it's manual, you'll have partial bundles — some lesson scenes present, some missing — and HeyGen will either fail or fall back to something ugly.

This needs a defined failure-handling contract: **rejected images should auto-queue for regeneration**, not require manual re-triggering. The jobs system supports this (just create a new child job for each rejected scene). Build this contract into Phase 3 scope.

**On the LoRA UUID problem:** The manual UUID copy from Leonardo UI is the right short-term fix. But the long-term solution is Replicate LoRA training (Phase 2) — then the UUID is written programmatically and this human step disappears. The document correctly sequences these. Good.

**Architecture note for Phase 2:** The `train-character-lora` worker should poll for training completion, not just fire-and-forget. Replicate's training API returns a training ID. The worker should poll `GET /v1/trainings/{id}` every 30 seconds until `status === 'succeeded'`, then extract `output.weights` URL and dereference it to a model version ID — that's the UUID that goes into `characters.lora_model_id`. If the worker just fires and forgets, there's no automated path from "training complete" to "UUID in database." Design the polling loop explicitly.

---

## River (D009 — River Torres) — Full-Stack Rapid Prototyper

**Grade: A-**

This is a buildable plan. The phases are right-sized. Phase 2 ("Save as Character") is the linchpin and it should ship first — everything else flows from it. The rest of the phases are sequenced correctly.

**Before anything else, do the negative prompt fix.** Five minutes. Put `"extra limbs, malformed anatomy, fused fingers, bad anatomy, extra fingers, missing limbs"` in the negative prompt for the current IP-Adapter generator. This is not a strategic fix, it's a duct-tape fix, and that's fine. It makes the current pipeline tolerable while Phase 2 is being built.

**On Phase 2 scope:** Keep it tight. The modal should ask for three things only: name, trigger word (pre-filled as `NAME_TRIGGER`), and whether to start LoRA training now or later. Don't add art style dropdowns, character description fields, or pose prompt templates to the modal. That's Phase 4 territory. Ships in a day, not a week.

**The approval grid is the most important UX decision in Phase 3.** When 120 images come back, Scott is looking at a grid of thumbnails. The interaction needs to be: click to reject (turns red), click to approve (stays green), "Regenerate Rejected" button, "Approve All Passing" bulk action. That's it. Don't build a full image editor into the approval flow. Scott's job is approve/reject/regenerate, not fine-tune individual images.

**Two files to read before building Phase 2:**
- `worker/src/jobs/course-slide-images.ts` — the current 3-tier Replicate logic. Phase 2 LoRA training should be a new job type at the same level. Don't extend `course-slide-images.ts` — create `worker/src/jobs/train-character-lora.ts` as a sibling.
- `src/app/api/characters/route.ts` — the character CRUD is already built. The `train-lora` endpoint should be a new sub-route (`/api/characters/[id]/train-lora/`) not a top-level route.

**One thing nobody's said:** The Gimli UUID fix is 30 minutes of Scott's time and it unblocks everything. Do it today. Before building Phase 2. Before anything else. Log into Leonardo, find the UUID, paste it into Supabase. That single action will tell you whether the LoRA produces production-quality Gimli or needs re-training. The answer changes the scope of Phase 4 significantly.

**Shipping order:**
1. Negative prompt fix → deploy (5 min, today)
2. Scott copies Gimli UUID → tests generation (30 min, today)
3. Phase 2: Save as Character (1–2 days)
4. Phase 3: Batch generation (3–5 days)
5. Phase 4: Character sheet generator (2 days, only if LoRA quality needs improvement)
6. Phase 5: HeyGen wiring (1 day)

Total time to a fully automated pipeline: **7–11 days from today.**

---

## Council Consensus

All four council members agree on the core diagnosis: **LoRA is the right tool, IP-Adapter is the wrong tool for character identity.** The two-tier strategy (locked Source Character + batch Scene Generation) is the right architecture. The build order is: Gimli UUID fix → negative prompt fix → Phase 2 → Phase 3 → Phase 4 → Phase 5.

**The one thing to do today, right now, before anything else:**
Add `"extra limbs, malformed anatomy, fused fingers, bad anatomy"` to the negative prompt in `src/app/api/images/generate/route.ts`. Commit and deploy. Then Scott logs into Leonardo and retrieves the Gimli LoRA UUID.

Those two actions unblock everything. Build the rest in order.

