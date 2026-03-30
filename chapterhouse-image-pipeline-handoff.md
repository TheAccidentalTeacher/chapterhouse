# Chapterhouse Image Generation Pipeline — Technical Handoff
## For Migration to CoursePlatform Workspace
*Generated March 2026. Read this entire document before writing code.*

---

## Purpose

This document describes every component of the image generation pipeline currently living in the **Chapterhouse** repository (`C:\Users\Valued Customer\OneDrive\Desktop\WEBSITES\chapterhouse\`). The goal is to provide enough detail for an AI agent working in the **CoursePlatform** repository (`C:\Users\Valued Customer\OneDrive\Desktop\1st-Grade-Science-TEMPLATE\`) to reconstruct or integrate this pipeline without needing access to Chapterhouse source.

**What this pipeline does:** Generates slide images for SomersSchool lesson bundles. Each bundle has 5-20+ slides (intro_slides + section slides). The pipeline reads bundle content from CoursePlatform's Supabase DB, generates images via multiple AI providers, uploads to Cloudinary CDN, and writes the permanent URLs back into the bundle's `content.lesson_script` JSON.

---

## Architecture Overview

```
CoursePlatform Supabase DB                 Chapterhouse Vercel
  (bundles table)                          (API routes)
       │                                        │
       │  ┌─────────────────────────────────────┘
       │  │
       │  ▼
       │  POST /api/course-assets/generate-slides
       │     │
       │     ├─ Validates bundle exists (reads CoursePlatform Supabase)
       │     ├─ Creates job row in Chapterhouse Supabase (jobs table)
       │     └─ Publishes to QStash → Railway worker URL
       │                                    │
       │                                    ▼
       │                            Railway Worker
       │                            (course-slide-images.ts)
       │                                    │
       │                    ┌───────────────┼───────────────┐
       │                    ▼               ▼               ▼
       │              Leonardo AI      Replicate        Cloudinary
       │              (Phoenix/Flux)   (Flux Schnell/   (CDN upload)
       │                               Flux Dev)            │
       │                                                    │
       │◀───────────────────────────────────────────────────┘
       │  (writes image_url back into bundle content JSON)
```

**Two Supabase projects are involved:**
1. **Chapterhouse Supabase** — `jobs` table (job queue), `characters` table (character library), `generated_images` table (generation history)
2. **CoursePlatform Supabase** — `bundles` table (lesson content with slide image URLs)

---

## Environment Variables Required

```bash
# ── AI Image Providers ──
LEONARDO_API_KEY=...           # Leonardo.ai API key (or LEONARDO_AI_API_KEY)
REPLICATE_API_TOKEN=...        # Replicate API token (or REPLICATE_TOKEN)
OPENAI_API_KEY=...             # OpenAI key (for GPT Image 1 provider)
STABILITY_AI_KEY=...           # Stability AI key (or STABILITY_API_KEY, for SDXL)
ANTHROPIC_API_KEY=...          # For Claude Haiku prompt enhancement

# ── Cloudinary CDN ──
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
# Format: cloudinary://{api_key}:{api_secret}@{cloud_name}
# Cloud name: dpn8gl54c

# ── CoursePlatform Supabase (the DB where bundles live) ──
COURSE_SUPABASE_URL=...
COURSE_SUPABASE_SERVICE_ROLE_KEY=...

# ── Chapterhouse Supabase (job queue + character library) ──
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# ── Job Queue (QStash → Railway) ──
QSTASH_TOKEN=...
RAILWAY_WORKER_URL=https://...railway.app
```

---

## Database Schema

### `characters` Table (Chapterhouse Supabase)
Source: `supabase/migrations/20260501_024_create_characters.sql`

```sql
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  slug TEXT NOT NULL UNIQUE,              -- 'gimli', 'scott-avatar'
  name TEXT NOT NULL,                     -- 'Gimli'
  description TEXT NOT NULL DEFAULT '',

  -- Prompt enhancement inputs
  physical_description TEXT NOT NULL DEFAULT '',  -- Injected verbatim into every prompt
  art_style TEXT NOT NULL DEFAULT '',             -- 'Pixar 3D animation style'
  negative_prompt TEXT NOT NULL DEFAULT '',       -- Things to avoid in generation

  -- Reference images for visual consistency
  reference_images TEXT[] NOT NULL DEFAULT '{}',  -- Cloudinary URLs
  hero_image_url TEXT,                            -- Best single reference

  -- Provider/model preferences
  preferred_provider TEXT DEFAULT 'replicate',    -- 'replicate' | 'leonardo' | 'openai'
  lora_model_id TEXT,                             -- Leonardo Element akUUID or Replicate version SHA
  trigger_word TEXT,                              -- LoRA activation word (prepended to prompt)
  generation_strategy TEXT DEFAULT 'kontext',     -- 'kontext' | 'lora' | 'ip_adapter'
  lora_training_status TEXT DEFAULT 'none',       -- 'none' | 'queued' | 'training' | 'succeeded' | 'failed'

  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX characters_slug_idx ON characters(slug);
CREATE INDEX characters_active_idx ON characters(is_active);

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users only" ON characters
  FOR ALL USING (auth.role() = 'authenticated');
```

### Gimli Seed Data
Source: `supabase/migrations/20260501_024b_seed_gimli.sql`

```sql
INSERT INTO characters (slug, name, description, physical_description, art_style, negative_prompt, reference_images, hero_image_url, preferred_provider, is_active)
VALUES (
  'gimli',
  'Gimli',
  'SomersSchool''s K-5 curriculum explainer. 125-lb Alaskan Malamute. Reluctant but competent. Sighs before explaining. Secretly loves teaching.',
  'A large fluffy Alaskan Malamute dog with grey and white fur, stocky muscular build, thick double coat, expressive dark amber eyes, black nose, characteristic malamute facial markings with lighter face mask, sturdy paws, curled tail. He has a slightly grumpy but wise expression. Large and dignified.',
  'Pixar 3D animation style, vibrant colors, soft warm lighting, expressive cartoon face, clean backgrounds, child-friendly illustration, high quality render, detailed fur texture',
  'realistic photo, human, person, scary, dark, horror, deformed, ugly, blurry, low quality, watermark, text overlay',
  ARRAY[
    'https://chapterhouse.vercel.app/Gimli/gimli%20in%20field.png',
    'https://chapterhouse.vercel.app/Gimli/Gimli%20Determined%20.png',
    'https://chapterhouse.vercel.app/Gimli/Gimli%20Superhero.png'
  ],
  'https://chapterhouse.vercel.app/Gimli/Gimli%20Determined%20.png',
  'replicate',
  true
);
```

### `generated_images` Table (Chapterhouse Supabase)
Source: `supabase/migrations/20260321_021_create_generated_images.sql` + columns added by `024`

```sql
CREATE TABLE generated_images (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID         REFERENCES auth.users(id) ON DELETE CASCADE,  -- nullable

  -- Generation parameters
  prompt         TEXT         NOT NULL,
  provider       TEXT         NOT NULL CHECK (provider IN ('openai', 'stability', 'replicate', 'leonardo')),
  model          TEXT,
  width          INTEGER,
  height         INTEGER,

  -- URLs
  image_url      TEXT         NOT NULL,    -- Original provider URL (may expire)
  cloudinary_url TEXT,                     -- Permanent CDN URL (set by /api/images/save)

  -- Extra data
  metadata       JSONB        DEFAULT '{}',

  -- Character tracking (added by migration 024)
  character_id   UUID         REFERENCES characters(id) ON DELETE SET NULL,
  prompt_original TEXT,       -- Raw prompt before enhancement
  prompt_enhanced TEXT,       -- After Claude Haiku enhancement
  enhancement_notes TEXT,     -- What was changed

  created_at     TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX generated_images_user_idx ON generated_images (user_id, created_at DESC);
CREATE INDEX generated_images_provider_idx ON generated_images (provider, created_at DESC);
CREATE INDEX generated_images_image_url_idx ON generated_images (image_url);
CREATE INDEX generated_images_character_idx ON generated_images(character_id);

ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their generated images" ON generated_images
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
```

### `bundles` Table (CoursePlatform Supabase)
This is the target table. Relevant columns:

| Column | Type | Purpose |
|---|---|---|
| `id` | UUID | Primary key — e.g., UUID for `sci-g1-u1-l01` |
| `content` | JSONB | Full lesson content including `lesson_script` with slides |
| `slides_count` | INTEGER | Total number of slides in the bundle |
| `slides_generated` | INTEGER | Number of slides with `image_url` set |
| `audio_generated` | BOOLEAN | Whether audio narration exists |
| `audio_url` | TEXT | Cloudinary audio URL |
| `grade` | INTEGER | Grade level (1-12) |
| `subject_code` | TEXT | 'sci', 'ela', 'mth', 'hst' |
| `title` | TEXT | Bundle title |

The `content.lesson_script` has this structure:
```typescript
interface LessonScript {
  intro?: string;            // Intro narration text
  intro_slides: Slide[];     // Slides shown during intro
  sections: Section[];       // Main content sections
  conclusion?: string;       // Conclusion narration
}

interface Section {
  title?: string;
  script?: string;           // Narration text for this section
  slides: Slide[];
}

interface Slide {
  label: string;             // E.g. "Animals Need Food" — used as prompt seed
  image_url?: string | null; // Cloudinary URL after generation
  prompt_used?: string;      // Full prompt sent to provider (for audit/regen)
  model_used?: string;       // Which provider/model generated this
}
```

The `content` JSONB also stores:
- `content.anchor_image_url` — A single hero image per bundle (grade-themed animal)

---

## Component 1: Prompt Enhancer

**Source:** `src/lib/prompt-enhancer.ts`
**Purpose:** Takes a raw slide label + character data → produces a detailed, consistent image generation prompt via Claude Haiku.

### Full Source Code

```typescript
import Anthropic from "@anthropic-ai/sdk";

export interface CharacterRef {
  slug: string;
  name: string;
  physical_description: string;
  art_style: string;
  negative_prompt: string;
  reference_images: string[];
  trigger_word?: string | null;
}

export interface EnhancedPrompt {
  enhanced: string;
  negative: string;
  notes: string;
  original: string;
}

export async function enhancePrompt(
  rawPrompt: string,
  character?: CharacterRef,
  context?: string,
): Promise<EnhancedPrompt> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      enhanced: rawPrompt,
      negative: character?.negative_prompt ?? "",
      notes: "No ANTHROPIC_API_KEY — prompt returned as-is",
      original: rawPrompt,
    };
  }

  const client = new Anthropic({ apiKey });

  const systemPrompt = character
    ? `You are a professional prompt engineer specializing in consistent character illustration for children's educational content.

CHARACTER: ${character.name}
PHYSICAL DESCRIPTION: ${character.physical_description}
ART STYLE: ${character.art_style}

CRITICAL RULES FOR CHARACTER CONSISTENCY:
1. START your prompt with the COMPLETE physical description verbatim — do not paraphrase it
2. Then describe the scene the user requested
3. Repeat the most visually distinctive features (fur markings, eye color, expression) at least twice
4. Lock the art style explicitly in every sentence — never let the scene override the art style
5. Keep it under 220 words
6. Output ONLY the enhanced prompt text, nothing else

FORMAT: [full physical description], [art style], [scene description with character doing the action], [reinforce key visual features], [art style reinforcement]`
    : `You are a professional prompt engineer specializing in educational content for children.

Your job:
1. Take the user's scene description and expand it into a detailed, vivid image generation prompt
2. Add appropriate atmosphere, lighting, and style details
3. Make it child-friendly and appropriate for educational use
4. Keep it concise — under 200 words
5. Output ONLY the enhanced prompt text, nothing else`;

  const userMessage = context
    ? `Scene: ${rawPrompt}\nContext: ${context}`
    : rawPrompt;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const enhanced =
      response.content[0].type === "text"
        ? response.content[0].text.trim()
        : rawPrompt;

    const notes =
      enhanced.length > rawPrompt.length * 1.5
        ? `Expanded prompt with character details and art style (${rawPrompt.length} → ${enhanced.length} chars)`
        : `Minor refinements applied (${rawPrompt.length} → ${enhanced.length} chars)`;

    // Prepend Leonardo LoRA trigger word when present
    const triggerWord = character?.trigger_word;
    const finalEnhanced = triggerWord ? `${triggerWord}, ${enhanced}` : enhanced;
    const triggerNote = triggerWord ? ` Trigger word '${triggerWord}' prepended for LoRA activation.` : "";

    return {
      enhanced: finalEnhanced,
      negative: character?.negative_prompt ?? "",
      notes: notes + triggerNote,
      original: rawPrompt,
    };
  } catch (err) {
    console.error("[prompt-enhancer] Claude Haiku failed, using raw prompt:", err);
    const triggerWord = character?.trigger_word;
    const fallbackPrompt = triggerWord ? `${triggerWord}, ${rawPrompt}` : rawPrompt;
    return {
      enhanced: fallbackPrompt,
      negative: character?.negative_prompt ?? "",
      notes: `Enhancement failed: ${err instanceof Error ? err.message : "unknown error"}${triggerWord ? ` Trigger word '${triggerWord}' prepended.` : ""}`,
      original: rawPrompt,
    };
  }
}
```

### Key Behaviors
- **Character mode:** Starts prompt with physical_description verbatim, reinforces key visual features 2x, locks art_style in every sentence
- **Non-character mode:** Expands scene with atmosphere/lighting/style
- **LoRA trigger word:** Prepended BEFORE the enhanced prompt (required to activate Leonardo Elements)
- **Fallback:** Returns raw prompt on API error — generation proceeds without enhancement
- **Model:** `claude-haiku-4-5` (cheapest, ~$0.001/call)

---

## Component 2: Course Slide Images Worker

**Source:** `worker/src/jobs/course-slide-images.ts` (625 lines)
**Runs on:** Railway (Express server receiving QStash POST)
**Purpose:** Generates ALL missing slide images for a single bundle.

### Payload Interface

```typescript
interface CourseSlideImagesPayload {
  bundleId: string;
  characterId?: string;       // UUID from characters table
  singleSlide?: {             // Regenerate one slide only
    sectionKey: "intro" | number;
    idx: number;
  };
  model?: "replicate-schnell" | "replicate-dev" | "leonardo" | "gpt-image";
  customPrompt?: string;
  force?: boolean;            // Regenerate ALL slides even if they have images
}
```

### Prompt Template (Auto-Generated)

When no `customPrompt` is provided, the worker builds one from the slide label:

```typescript
function buildSlidePrompt(label: string, grade = 1, subjectCode = "sci"): string {
  const subjectMap: Record<string, string> = {
    sci: "science", ela: "language arts", mth: "mathematics", hst: "social studies",
  };
  const subject = subjectMap[subjectCode] ?? "general education";
  const ageRange = grade <= 2 ? "5-7 year olds" : grade <= 5 ? "8-11 year olds" : "11-14 year olds";
  return (
    `Children's educational illustration for Grade ${grade} ${subject}. ` +
    `Topic: "${label}". ` +
    `Friendly cartoon style, warm bright colors, diverse child characters aged ${ageRange}. ` +
    `Simple clear composition with a single main subject. ` +
    `Flat 2D children's book illustration style. ` +
    `No text, labels, or words in the image. Clean light background.`
  );
}
```

### Three-Tier Provider Selection

The worker selects a provider based on the character configuration:

| Tier | Selection Criteria | Provider | Model | Use Case |
|------|-------------------|----------|-------|----------|
| **1 — LoRA** | `character.lora_model_id` set | Replicate | Custom LoRA version | Identity-level consistency (trained model) |
| **2 — Bridge** | `character.reference_images` set (no LoRA) | Replicate | flux-dev (img2img) | Reference-guided consistency |
| **3 — Free** | No character, or character has neither | Replicate | flux-schnell | Generic educational illustrations |
| **Override** | `payload.model` specified | Per payload | Per payload | Manual provider control |
| **Character pref** | `character.preferred_provider === 'leonardo'` | Leonardo | Phoenix or Flux Dev | Leonardo with LoRA Element |

### Replicate Generation (All 3 Tiers)

```typescript
async function generateImageReplicate(
  prompt: string,
  character?: Character,
  forceModel?: "replicate-schnell" | "replicate-dev"
): Promise<string> {
  const token = process.env.REPLICATE_API_TOKEN ?? process.env.REPLICATE_TOKEN;

  // Tier 1: LoRA model version
  if (character?.lora_model_id && !forceModel) {
    endpoint = "https://api.replicate.com/v1/predictions";
    body = {
      version: character.lora_model_id,     // SHA hash of trained LoRA version
      input: { prompt, width: 1024, height: 1024, num_outputs: 1, lora_scale: 0.85 },
    };
  }
  // Tier 2: flux-dev img2img (reference image injection)
  else if (character?.reference_images?.length && !forceModel) {
    endpoint = "https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions";
    body = {
      input: {
        prompt,
        image: character.reference_images[0],  // First reference image as style anchor
        strength: 0.7,                          // 70% character fidelity
        width: 1024, height: 1024, num_outputs: 1,
      },
    };
  }
  // Tier 3: flux-schnell (fast, free)
  else {
    endpoint = "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions";
    body = { input: { prompt, width: 1024, height: 1024, num_outputs: 1 } };
  }

  // Polling: 60 × 3s = 3 minute timeout
  // Uses `Prefer: wait` header for synchronous completion when possible
}
```

### Leonardo Generation (Character LoRA / Reference Images)

```typescript
async function generateImageLeonardo(prompt: string, character?: Character): Promise<string> {
  const key = process.env.LEONARDO_API_KEY ?? process.env.LEONARDO_AI_API_KEY;

  // Prompt assembly: trigger_word + physical_description + art_style + scene prompt
  const triggerPrefix = character?.trigger_word ? `${character.trigger_word}, ` : "";
  const descPrefix = character?.physical_description
    ? `${character.physical_description}. ${character.art_style ?? ""}. `
    : "";
  const fullPrompt = `${triggerPrefix}${descPrefix}${prompt}`.replace(/\.\s*\./g, ".").trim();

  // Upload reference images to Leonardo's init-images endpoint
  // Returns imagePromptId for injection into generation request
  let imagePrompts: { imagePromptId: string; weight: 0.75 }[] | undefined;
  if (character?.reference_images?.length) {
    const ids = await Promise.all(
      character.reference_images.slice(0, 3).map(url => uploadRefToLeonardo(url, key))
    );
    const valid = ids.filter(Boolean) as string[];
    if (valid.length > 0) {
      imagePrompts = valid.map(imagePromptId => ({ imagePromptId, weight: 0.75 }));
    }
  }

  const genBody: Record<string, unknown> = {
    prompt: fullPrompt,
    width: 1024,
    height: 1024,
    num_images: 1,
    // Model selection: Flux Dev when Element present, Phoenix otherwise
    modelId: character?.lora_model_id
      ? "b2614463-296c-462a-b22d-e6bb4fc6b92b"   // Flux Dev (matches Element training base)
      : "6b645e3a-d64f-4341-a6d8-7a3690fbf042",  // Phoenix (fallback)
    alchemy: true,
    presetStyle: "RENDER_3D",
  };

  // LoRA Element injection — NOT a modelId, goes in elements[] array
  if (character?.lora_model_id) {
    genBody.elements = [{ akUUID: character.lora_model_id, weight: 0.75 }];
  }
  if (imagePrompts) genBody.imagePrompts = imagePrompts;

  // POST to https://cloud.leonardo.ai/api/rest/v1/generations
  // Poll: GET /api/rest/v1/generations/{generationId} every 3s, 60 max
}
```

**Leonardo Reference Image Upload Flow:**
```
1. POST /api/rest/v1/init-images  →  { id, url (presigned S3), fields }
2. Fetch the reference image from its URL
3. POST to presigned S3 URL with form data (fields + file)
4. Use the returned `id` as imagePromptId in generation request
```

### Cloudinary Upload (Used by Both Workers)

```typescript
async function uploadToCloudinary(imageUrl: string, publicId: string): Promise<string> {
  // Parse CLOUDINARY_URL: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
  const match = cloudinaryUrl.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
  const [, apiKey, apiSecret, cloudName] = match;

  const timestamp = Math.floor(Date.now() / 1000);
  // Params MUST be sorted alphabetically for Cloudinary signature
  const paramsToSign = `invalidate=1&overwrite=1&public_id=${publicId}&timestamp=${timestamp}`;
  const signature = createHash("sha1").update(paramsToSign + apiSecret).digest("hex");

  // Upload via form data
  const form = new FormData();
  form.append("file", imageUrl);       // Can be a URL — Cloudinary fetches it
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp.toString());
  form.append("signature", signature);
  form.append("public_id", publicId);
  form.append("overwrite", "true");     // Replace existing asset
  form.append("invalidate", "true");    // Bust CDN cache

  // POST to https://api.cloudinary.com/v1_1/{cloudName}/image/upload
  // Returns: { public_id, version, secure_url, ... }

  // Final URL format with auto-optimization:
  return `https://res.cloudinary.com/${cloudName}/image/upload/q_auto/f_webp/v${version}/${publicId}`;
}
```

**Cloudinary public_id convention for slides:**
- Intro slides: `somerschool/slides/{bundleId}/intro-{idx}`
- Section slides: `somerschool/slides/{bundleId}/section-{sectionNum}-{idx}`
- Anchor images: `somerschool/anchors/{bundleId}`

### Main Worker Flow

```typescript
export async function runCourseSlideImages(jobId: string, payload: CourseSlideImagesPayload) {
  // 1. Look up character from Chapterhouse Supabase (optional)
  // 2. Connect to CoursePlatform Supabase
  // 3. Fetch bundle (id, content, slides_count, slides_generated, grade, subject_code, title)
  // 4. Extract lesson_script from bundle.content
  // 5. Collect slides that need generation:
  //    - singleSlide → just that one
  //    - force → all slides
  //    - default → only slides where image_url is null/missing
  // 6. For each slide:
  //    a. Build prompt (customPrompt or buildSlidePrompt)
  //    b. Select provider (payload override > character preference > default)
  //    c. Generate image
  //    d. Upload to Cloudinary
  //    e. Patch in-memory content (image_url, prompt_used, model_used)
  //    f. Write back to CoursePlatform Supabase after EVERY successful slide
  //       (partial progress survives failures)
  // 7. Final status update with generated count, errors
}
```

**Progress reporting:** Updates `jobs.progress` (0-100) and `jobs.progress_message` in Chapterhouse Supabase. Progress range: 10% start → 95% end, distributed evenly across slides.

**Error handling:** Individual slide failures don't abort the job. Errors are collected and reported. Partial completion is always written back.

---

## Component 3: Bundle Anchor Image Worker

**Source:** `worker/src/jobs/generate-bundle-anchor.ts` (271 lines)
**Purpose:** Generates ONE hero image per bundle using a grade-themed animal.

### Grade → Animal Theme Map

```typescript
const GRADE_ANIMAL_THEMES: Record<number, string> = {
  1:  "a friendly golden retriever puppy wearing a tiny school backpack",
  2:  "a friendly cartoon triceratops dinosaur with big expressive eyes",
  3:  "an adventurous cartoon bear cub carrying a magnifying glass",
  4:  "a curious cartoon owl wearing round glasses",
  5:  "a cheerful cartoon lion cub holding a small pencil",
  6:  "a determined cartoon wolf pup with a compass",
  7:  "a thoughtful cartoon eagle perched on an open book",
  8:  "a clever cartoon dolphin with a pencil tucked behind one fin",
  9:  "a resourceful cartoon fox wearing a small backpack",
  10: "a wise cartoon hawk sitting on top of a globe",
  11: "an ambitious cartoon raven writing with a quill pen",
  12: "a confident cartoon deer in graduation attire",
};
```

### Anchor Prompt Template

```typescript
function buildAnchorPrompt(grade: number, topic: string): string {
  const animal = getAnimalTheme(grade);
  return (
    `A children's educational illustration featuring ${animal}, ` +
    `exploring the concept of "${topic}". ` +
    `3D cartoon render style, RENDER_3D preset. ` +
    `Warm bright colors, clean simple composition, single main subject in frame. ` +
    `Cheerful and child-friendly. Soft studio lighting. ` +
    `No text, words, numbers, or labels anywhere in the image.`
  );
}
```

### Provider Fallback
1. **Leonardo Phoenix** (primary) — `alchemy: false` (fast tokens only), `modelId: 6b645e3a-d64f-4341-a6d8-7a3690fbf042`, `presetStyle: "RENDER_3D"`
2. **Replicate flux-schnell** (fallback) — if Leonardo fails (token exhaustion or timeout)

### Output
- Uploads to Cloudinary as `somerschool/anchors/{bundleId}`
- Writes URL into `bundle.content.anchor_image_url` (JSONB merge)
- Sets `slides_generated = 1` so the dashboard shows green for Images status

---

## Component 4: Image Generation API Route (Interactive Studio)

**Source:** `src/app/api/images/generate/route.ts`
**Purpose:** Multi-provider image generation for the Creative Studio UI. NOT used by the slide worker (which calls providers directly). This is the interactive route for manual single-image generation.

### Request Interface

```typescript
interface GenerateRequest {
  prompt: string;           // 5-2000 characters
  provider: "openai" | "stability" | "replicate" | "leonardo";
  model?: string;
  width?: number;           // default 1024
  height?: number;          // default 1024
  style?: string;
  negativePrompt?: string;
  characterId?: string;     // UUID from characters table
  context?: string;         // e.g. "explaining photosynthesis for 2nd graders"
}
```

### Flow
1. Validate prompt (5-2000 chars) and provider
2. If `characterId` provided → fetch character from Chapterhouse Supabase
3. Run `enhancePrompt()` (Claude Haiku) with character data
4. Build anatomy guard negative prompt when character is selected:
   `"extra limbs, malformed anatomy, fused fingers, bad anatomy, extra fingers, missing limbs, mutated hands, disfigured"`
5. Call provider-specific function
6. Save to `generated_images` table

### Provider Implementations

**OpenAI (GPT Image 1):**
```typescript
const response = await openai.images.generate({
  model: "gpt-image-1",
  prompt,
  n: 1,
  size: "1024x1024" | "1792x1024" | "1024x1792",  // auto-selected from width/height
});
// Returns b64_json or url
```

**Stability AI (SDXL):**
```typescript
// POST https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image
// Dimensions must be divisible by 64
// text_prompts with weight 1 (positive) and weight -1 (negative)
// cfg_scale: 7, steps: 30
```

**Replicate (Flux Schnell / Flux Dev):**
```typescript
// When reference image → use flux-dev with img2img, prompt_strength: 0.45
// Otherwise → flux-schnell (text-to-image)
// Endpoint: https://api.replicate.com/v1/models/{owner}/{name}/predictions
// Polling: every 2s, up to 60 attempts
```

**Leonardo (Phoenix / Flux Dev):**
```typescript
// Reference images uploaded to init-images → imagePromptId with weight 1.0
// LoRA Element: genBody.elements = [{ akUUID: loraModelId, weight: 0.75 }]
// Flux Dev (b2614463-296c-462a-b22d-e6bb4fc6b92b) when Element present
// Phoenix (6b645e3a-d64f-4341-a6d8-7a3690fbf042) otherwise
// Alchemy: true for Phoenix, false for Flux Dev (incompatible)
// Polling: every 2s, GET /api/rest/v1/generations/{generationId}
```

### DB Save

```typescript
await supabase.from("generated_images").insert({
  prompt: enhanced.original,
  prompt_original: enhanced.original,
  prompt_enhanced: enhanced.enhanced,
  enhancement_notes: enhanced.notes,
  character_id: body.characterId ?? null,
  provider,
  model: result.model,
  width, height,
  image_url: result.url,
  metadata: { style: body.style, negativePrompt: finalNegative, context: body.context },
});
```

---

## Component 5: Image Save to Cloudinary API Route

**Source:** `src/app/api/images/save/route.ts`
**Purpose:** Uploads a generated image to Cloudinary CDN and updates the DB record.

```typescript
// POST /api/images/save  { imageUrl, publicId? }
// 1. Parse CLOUDINARY_URL
// 2. Generate SHA-1 signature: folder={folder}&public_id={publicId}&timestamp={timestamp}{apiSecret}
//    (Uses Web Crypto API: crypto.subtle.digest("SHA-1", ...))
// 3. Upload via FormData to https://api.cloudinary.com/v1_1/{cloudName}/image/upload
// 4. Update generated_images.cloudinary_url = result.secure_url
// Returns: { url, publicId, width, height, format, bytes }
```

Note: This route uses Web Crypto API (`crypto.subtle.digest`) for SHA-1, while the worker uses Node's `createHash("sha1")`. Both produce the same result.

---

## Component 6: Characters CRUD API

**Source:** `src/app/api/characters/route.ts` + `src/app/api/characters/[id]/route.ts`

### GET /api/characters
Returns all active characters sorted by name.

### POST /api/characters
Creates a new character. Zod validation:
```typescript
{
  slug: /^[a-z0-9-]+$/,      // Required, max 80
  name: string,               // Required, max 100
  description: string,        // Optional, max 500
  physical_description: string, // Optional, max 2000
  art_style: string,          // Optional, max 1000
  negative_prompt: string,    // Optional, max 1000
  reference_images: string[], // URL array, max 10
  hero_image_url: string?,    // Optional URL
  preferred_provider: "openai" | "stability" | "replicate" | "leonardo",  // default "replicate"
  trigger_word: string?,      // Optional, max 100
  generation_strategy: "kontext" | "lora" | "ip_adapter",  // default "kontext"
}
```

### PATCH /api/characters/[id]
Updates any character field. Also accepts:
- `lora_model_id` — set after LoRA training completes
- `lora_training_status` — "none" | "queued" | "training" | "succeeded" | "failed"
- `is_active` — soft delete via false

### DELETE /api/characters/[id]
Soft delete — sets `is_active = false`.

---

## Component 7: Course Assets API Routes

### GET /api/course-assets/status?course={code}&grade={num}
**Source:** `src/app/api/course-assets/status/route.ts`

Returns all bundles for a course/grade from CoursePlatform Supabase. Selects all columns EXCEPT `content` (too large). Includes `content->>anchor_image_url` (PostgREST JSON extraction).

### POST /api/course-assets/generate-slides
**Source:** `src/app/api/course-assets/generate-slides/route.ts`

Creates a `course_slide_images` job in Chapterhouse Supabase, publishes to QStash → Railway.

```typescript
// Input: { bundleId, characterId?, model?, force? }
// 1. Validate bundle exists in CoursePlatform Supabase
// 2. Insert job (type: "course_slide_images") into Chapterhouse Supabase jobs table
// 3. Publish to QStash → Railway worker
// Returns: { jobId, bundleId, label }
```

### GET /api/course-assets/bundle/[id]
Returns full bundle record including `content` JSONB.

### PATCH /api/course-assets/bundle/[id]
Updates asset status fields: `slides_generated`, `audio_generated`, `audio_url`, `content`.

---

## Component 8: CoursePlatform Supabase Client

**Source:** `src/lib/course-supabase.ts`

```typescript
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function createCourseAdmin(): SupabaseClient {
  if (!client) {
    const url = process.env.COURSE_SUPABASE_URL;
    const key = process.env.COURSE_SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("COURSE_SUPABASE_URL / COURSE_SUPABASE_SERVICE_ROLE_KEY not configured");
    }
    client = createClient(url, key);
  }
  return client;
}
```

---

## Component 9: Course Asset Dashboard UI

**Source:** `src/app/course-assets/page.tsx` (1213 lines)
**Purpose:** Visual dashboard showing all bundles for a course with 5-dot status grid and slide management.

### Key UI Components (All in Same File)

| Component | Purpose |
|---|---|
| `StatusDot` | Green/amber/red dot indicating asset status (bundle, images, audio, video, worksheet) |
| `BundleRow` | One row per bundle with 5 status dots, expand/collapse |
| `BundleSlideGrid` | Grid view of all slides in a bundle with image thumbnails |
| `SlideEditor` | Modal for viewing/editing individual slide prompt and regenerating |
| `AggregateProgressBar` | Overall completion bar across all bundles |
| `CourseAssetsPage` | Main page with course/grade selectors, bundle list, Supabase Realtime |

### Supabase Realtime Subscriptions

The page subscribes to 3 job types in Chapterhouse Supabase:
```typescript
// Watches jobs table for status changes on:
// - course_slide_images
// - generate_character_scenes
// - generate_bundle_anchor
// Auto-refreshes bundle data when a job completes
```

### Status Dot Logic

| Dot | Green When | Amber When | Red When |
|-----|-----------|------------|----------|
| Bundle | `content` exists | — | No content |
| Images | `slides_generated >= slides_count` | `slides_generated > 0 && < slides_count` | `slides_generated === 0` |
| Audio | `audio_generated === true` | — | `audio_generated === false` |
| Video | `videos_generated >= videos_count` | `videos_generated > 0` | `videos_generated === 0` |
| Worksheet | `worksheet_present === true` | — | `worksheet_present === false` |

---

## Leonardo API Reference

### Model IDs
| Model | ID | Use When |
|-------|-----|----------|
| **Phoenix** | `6b645e3a-d64f-4341-a6d8-7a3690fbf042` | Default generations — no LoRA Element |
| **Flux Dev** | `b2614463-296c-462a-b22d-e6bb4fc6b92b` | When LoRA Element is present (same training base) |

### Key Endpoints
```
POST /api/rest/v1/init-images              — Get presigned URL for reference image upload
POST /api/rest/v1/generations              — Create generation
GET  /api/rest/v1/generations/{id}         — Poll for result
```

### Element (LoRA) Injection
```json
{
  "elements": [{ "akUUID": "element-uuid-here", "weight": 0.75 }],
  "modelId": "b2614463-296c-462a-b22d-e6bb4fc6b92b"
}
```
- Elements are NOT modelIds — they go in `elements[]`, not `modelId`
- `akUUID` is the Element identifier from Leonardo
- `modelId` must be Flux Dev when Element is present (same base model Element was trained on)
- `alchemy: true` works with Phoenix only — Flux Dev does not support it

### Reference Image Upload (imagePrompts)
```json
{
  "imagePrompts": [
    { "imagePromptId": "uploaded-image-id", "weight": 0.75 }
  ]
}
```
- Up to 3 reference images
- Weight 0.75 in worker, weight 1.0 in interactive studio (different tuning)

### Style Presets
- `RENDER_3D` — 3D cartoon look matching Gimli's art direction
- Other options: `ILLUSTRATION`, `CINEMATIC`, etc.

---

## Replicate API Reference

### Endpoints
```
POST /v1/predictions                                          — LoRA model (needs version hash)
POST /v1/models/black-forest-labs/flux-dev/predictions        — Flux Dev (img2img or text-only)
POST /v1/models/black-forest-labs/flux-schnell/predictions    — Flux Schnell (fast, free tier)
```

### img2img (Tier 2 — Reference Image)
```json
{
  "input": {
    "prompt": "...",
    "image": "https://reference-image-url",
    "strength": 0.7,
    "width": 1024, "height": 1024
  }
}
```
- `strength` / `prompt_strength`: 0 = exact copy, 1 = pure text generation
- Worker uses 0.7 (70% character fidelity)
- Interactive studio uses 0.45 (more scene variation)

### LoRA (Tier 1)
```json
{
  "version": "sha256-hash-of-trained-lora-version",
  "input": {
    "prompt": "...",
    "lora_scale": 0.85,
    "width": 1024, "height": 1024
  }
}
```

### Polling
- Send `Prefer: wait` header for synchronous completion (up to 60s)
- If not done: poll `prediction.urls.get` every 2-3s, timeout at 3 minutes

---

## Cloudinary Upload Reference

### URL Format
```
cloudinary://API_KEY:API_SECRET@CLOUD_NAME
```
Cloud name: `dpn8gl54c`

### Signed Upload
```typescript
const paramsToSign = `invalidate=1&overwrite=1&public_id=${publicId}&timestamp=${timestamp}`;
const signature = createHash("sha1").update(paramsToSign + apiSecret).digest("hex");
```
Parameters MUST be sorted alphabetically. `invalidate=1` + `overwrite=1` ensure forced regeneration replaces the CDN asset.

### Delivery URL Format
```
https://res.cloudinary.com/{cloudName}/image/upload/q_auto/f_webp/v{version}/{publicId}
```
- `q_auto` — automatic quality optimization
- `f_webp` — automatic WebP format
- `v{version}` — cache-busting version number (MUST come after transformations)

### Public ID Convention
| Asset Type | Public ID Pattern |
|---|---|
| Lesson slides | `somerschool/slides/{bundleId}/intro-{idx}` or `section-{sNum}-{idx}` |
| Anchor images | `somerschool/anchors/{bundleId}` |
| Studio saves | `chapterhouse/{auto-generated}` |

---

## Job System Integration

### Job Types
| Type | Worker Function | Payload |
|------|----------------|---------|
| `course_slide_images` | `runCourseSlideImages()` | `{ bundleId, characterId?, model?, force?, singleSlide?, customPrompt? }` |
| `generate_bundle_anchor` | `runGenerateBundleAnchor()` | `{ bundleId, forceRegen? }` |

### Job Flow
```
Vercel API route
  → INSERT into jobs table (status: 'queued')
  → QStash.publishJSON({ url: RAILWAY_WORKER_URL/process-job, body: { jobId, type, payload } })

Railway Worker
  → Receives POST /process-job
  → Verifies QStash signature (upstash-signature header)
  → Routes to correct job handler based on type
  → Updates progress via updateProgress() → Supabase jobs table
  → Supabase Realtime broadcasts changes to subscribed UIs
```

### Progress Updates
```typescript
async function updateProgress(
  jobId: string,
  progress: number,         // 0-100
  message: string,
  status?: "running" | "completed" | "failed",
  output?: unknown,
  error?: string
)
```

---

## Known Issues / Bugs to Fix

1. **Anatomy negative prompts not applied in worker** — The interactive studio route applies an anatomy guard (`"extra limbs, malformed anatomy..."`) when a character is selected, but the Railway worker does NOT include negative prompts in its generation calls. Replicate's flux models don't support negative prompts natively, but Leonardo does via `negative_prompt` field.

2. **`lora_scale` inconsistency** — Worker uses `lora_scale: 0.85` but this should be validated against actual LoRA training. Too high = rigid/artifacts, too low = identity loss.

3. **Reference image weight discrepancy** — Worker uses `weight: 0.75` for Leonardo imagePrompts, interactive studio uses `weight: 1.0`. The worker value is probably more correct for batch slide generation.

4. **`generation_strategy` column missing from DB** — The characters API accepts `generation_strategy` ("kontext" | "lora" | "ip_adapter") but the migration `024` doesn't create this column. A migration 025 is needed to add it.

---

## Dependencies (npm packages)

### Required for image generation
```json
{
  "@anthropic-ai/sdk": "latest",   // Claude Haiku for prompt enhancement
  "openai": "latest",              // GPT Image 1
  "@supabase/supabase-js": "latest",
  "zod": "latest"
}
```

### Only needed if keeping QStash job system
```json
{
  "@upstash/qstash": "latest"
}
```

### No npm packages needed for:
- Replicate (raw `fetch` to REST API)
- Leonardo (raw `fetch` to REST API)
- Stability AI (raw `fetch` to REST API)
- Cloudinary upload (raw `fetch` + Node `crypto` or Web Crypto)

---

## Migration Strategy Notes

When moving this pipeline to CoursePlatform:

1. **Characters table** can live in CoursePlatform Supabase (same DB as bundles). No cross-DB character lookup needed.
2. **generated_images table** is optional — it's generation history for the Creative Studio. Skip it if only doing batch slide generation.
3. **The prompt enhancer** is a standalone function. Copy `prompt-enhancer.ts` as-is. Only dependency: `@anthropic-ai/sdk`.
4. **The worker logic** (`course-slide-images.ts`) can run as a Next.js API route with `maxDuration: 300` instead of a Railway worker, or keep the Railway worker pattern.
5. **QStash** is optional — you can call the generation logic directly from an API route if you don't need async job queuing.
6. **The interactive studio** (multi-provider `/api/images/generate`) is a Chapterhouse feature. CoursePlatform only needs the batch slide generation path.

---

*This document was generated by reading every source file in the Chapterhouse image pipeline. All code snippets are from the actual codebase as of March 2026.*
