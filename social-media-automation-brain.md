# SOCIAL MEDIA AUTOMATION — CHAPTERHOUSE BUILD SPEC
## Architecture Document: Complete Feature Implementation Plan
**Version 2.0 — March 14, 2026**

> **How to use this file:** Drop into Chapterhouse chat. This is a BUILD SPEC. Read the existing codebase first, then build every file listed here. Match Chapterhouse conventions exactly — same TypeScript patterns, same Supabase client usage (`getSupabaseServiceRoleClient` from `@/lib/supabase-server`), same Tailwind 4 styling as existing pages/components.

---

## 1. EXISTING CODEBASE CONTEXT

Before building anything, understand what already exists. The social media feature plugs INTO these:

### Existing Patterns to Follow

**Jobs system:**
- `supabase/migrations/20260313_008_create_jobs.sql` — `jobs` table schema
- `src/app/api/jobs/create/route.ts` — insert job → QStash → Railway worker
- `src/app/api/jobs/[id]/route.ts` — fetch job status
- `worker/src/jobs/router.ts` — switch on `type` to dispatch to handler
- `worker/src/lib/progress.ts` — `updateProgress(jobId, pct, message, status)` 
- Supabase Realtime on `jobs` table — UI gets live progress for free

**Review queue UI:**
- `src/app/review-queue/page.tsx` — existing pattern for approve/reject UI
- Uses `ActionBtn` component (approve/reject/default variants), `loggedFetch`, `logEvent`

**API route pattern:**
```typescript
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 503 });
  // ... zod validation ... 
  // ... supabase insert/update ...
  return Response.json({ ... }, { status: 200 });
}
```

**Navigation:**
- `src/lib/navigation.ts` — `navigationGroups` array, add new group or item
- Status values: `"live" | "partial" | "planned"`

**Content Studio (closest existing analog):**
- `src/app/api/content-studio/route.ts` — Claude generation with brand voice in system prompt
- `src/app/content-studio/page.tsx` — the UI that calls it

---

## 2. FEATURE OVERVIEW

**What we're building:** A social media automation system inside Chapterhouse that:
1. Generates posts for 3 brands × 3 platforms using Claude Sonnet 4.6
2. Puts them in a review queue (Scott/Anna approve, edit, or reject each post)
3. Approved posts get pushed to Buffer API → scheduled/published
4. Buffer analytics get pulled back → displayed per post
5. Shopify webhook triggers auto-generation on new NCHO products

**What it replaces:** Sintra (~$49/month, 250 credit cap, broken image repetition, single-brand limit)

**What it does NOT do:** Auto-post without human approval. The human gate is a feature.

---

## 3. DATABASE MIGRATIONS

### Migration 010: `social_accounts` table

**File:** `supabase/migrations/20260314_010_create_social_accounts.sql`

```sql
-- Social accounts: Buffer profile IDs per brand+platform combination
-- Populated manually via Settings > Social Accounts after connecting Buffer

CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  brand TEXT NOT NULL CHECK (brand IN ('ncho', 'somersschool', 'alana_terry', 'scott_personal')),
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'threads', 'tiktok', 'youtube', 'pinterest')),
  buffer_profile_id TEXT NOT NULL,  -- returned by GET /v1/profiles.json from Buffer API
  display_name TEXT NOT NULL,       -- human-readable e.g. "NCHO Facebook Page"
  is_active BOOLEAN NOT NULL DEFAULT true,

  UNIQUE (brand, platform)
);

ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users only" ON social_accounts
  FOR ALL USING (auth.role() = 'authenticated');

CREATE TRIGGER social_accounts_updated_at
  BEFORE UPDATE ON social_accounts
  FOR EACH ROW EXECUTE FUNCTION update_jobs_updated_at(); -- reuse existing trigger fn
```

---

### Migration 011: `social_posts` table

**File:** `supabase/migrations/20260314_011_create_social_posts.sql`

```sql
-- Social posts: generated + queued posts, with review state and Buffer tracking

CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Which generation job created this batch
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,

  -- Post identity
  brand TEXT NOT NULL CHECK (brand IN ('ncho', 'somersschool', 'alana_terry', 'scott_personal')),
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'threads', 'tiktok', 'youtube', 'pinterest')),
  
  -- Content (what Claude generated)
  post_text TEXT NOT NULL,
  image_brief TEXT,                -- description for image generation
  hashtags TEXT[] DEFAULT '{}',
  generation_prompt TEXT,          -- full system+user prompt sent to Claude (for autoresearch loop)

  -- Edit history — every manual edit pushes the previous version here
  edit_history JSONB[] DEFAULT '{}',

  -- Review state lifecycle: pending_review → approved | rejected → scheduled → published | failed
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'approved', 'rejected', 'scheduled', 'published', 'failed')),

  -- Scheduling
  scheduled_for TIMESTAMPTZ,      -- when to publish (set by Scott on approval)
  
  -- Buffer tracking
  buffer_profile_id TEXT,         -- which Buffer channel (from social_accounts)
  buffer_update_id TEXT,          -- ID returned by Buffer after scheduling
  published_at TIMESTAMPTZ,       -- filled when Buffer confirms publication

  -- Analytics (pulled back from Buffer)
  buffer_stats JSONB DEFAULT '{}'  -- { likes, comments, shares, clicks, reach }
);

CREATE INDEX social_posts_status_idx ON social_posts(status);
CREATE INDEX social_posts_brand_idx ON social_posts(brand);
CREATE INDEX social_posts_job_id_idx ON social_posts(job_id);
CREATE INDEX social_posts_scheduled_for_idx ON social_posts(scheduled_for);

-- Realtime so the review UI updates live when generation completes
ALTER PUBLICATION supabase_realtime ADD TABLE social_posts;

ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users only" ON social_posts
  FOR ALL USING (auth.role() = 'authenticated');

CREATE TRIGGER social_posts_updated_at
  BEFORE UPDATE ON social_posts
  FOR EACH ROW EXECUTE FUNCTION update_jobs_updated_at();
```

---

### Migration 012: Extend `jobs.type` CHECK constraint

**File:** `supabase/migrations/20260314_012_add_social_batch_job_type.sql`

```sql
-- Add social_batch to the jobs.type enum
-- Supabase/Postgres: drop and recreate the CHECK constraint

ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_type_check;

ALTER TABLE jobs ADD CONSTRAINT jobs_type_check
  CHECK (type IN ('curriculum_factory', 'research_batch', 'council_session', 'social_batch'));
```

---

## 4. ENVIRONMENT VARIABLES

Add to `.env.local` and Vercel dashboard:

```bash
# Buffer API
BUFFER_ACCESS_TOKEN=         # OAuth token from Buffer dashboard → Account → Apps
BUFFER_CLIENT_ID=            # Only needed if building OAuth flow; skip for now (use personal token)

# Shopify webhook (for auto-trigger on new product)
SHOPIFY_WEBHOOK_SECRET=      # Shopify Admin → Notifications → Webhooks → Signing secret
```

---

## 5. API ROUTES

### 5.1 Generate Posts

**File:** `src/app/api/social/generate/route.ts`

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { z } from "zod";

const generateSchema = z.object({
  brands: z.array(z.enum(["ncho", "somersschool", "alana_terry", "scott_personal"])),
  platforms: z.array(z.enum(["facebook", "instagram", "linkedin"])),
  count_per_combo: z.number().int().min(1).max(7).default(3),
  topic_seed: z.string().optional(), // e.g. "new product: Saxon Math 5/4"
  job_id: z.string().uuid().optional(), // if triggered by a job
});

// Brand voice is embedded here — not a separate context doc
// Claude uses this as the system prompt
const BRAND_VOICE_SYSTEM = `
You are a social media content generator for three brands owned by Scott and Anna Somers.
Return ONLY valid JSON — no markdown, no explanation, no preamble.

BRAND RULES:

ncho (Next Chapter Homeschool Outpost — Shopify homeschool store):
- Audience: homeschool moms 30-45, faith-adjacent, overwhelmed by curriculum choices.
- Always say "your child" — never "your student."  
- Core message emotional layer: "For the child who doesn't fit in a box."
- Core message practical layer: "Your one-stop homeschool shop."
- Convicted, not curious. She's already decided to homeschool. Write to conviction.
- Voice: warm, specific, teacher's-eye-view. Not corporate. Not cheerful filler.
- Never use: explore, journey, spiritually curious, leverage, synergy, student.
- Facebook: 2-4 sentences. Hook → child → product → CTA. Max 400 chars.
- Instagram: first line is the hook (must work as standalone). 3-5 sentences total. 3-5 hashtags.

somersschool (secular homeschool SaaS course platform):
- ALL SECULAR. Zero faith language, ever. Alaska Statute 14.03.320 compliance.
- Visible progress is the product. Lead with what the child gets to SHOW.
- Voice: confident teacher who knows his craft. Specific over general.
- LinkedIn: counterintuitive first line, 3 short paragraphs, light CTA.
- Instagram: lesson preview or win showcase. Bold and clean.
- Never use: spiritual, faith, Christian, explore your beliefs, student (use "child").

alana_terry (Anna Somers — Christian fiction author + "Praying Christian Women" podcast):
- Write as a woman (Anna's voice, not Scott's).
- Personal, vulnerable. Story-forward. Faith is assumed, never preachy.
- Community: readers and listeners are friends, not audiences. 
- Facebook/Instagram only. LinkedIn does not apply.
- Book posts: question readers are asking → character/theme connection → CTA.
- Podcast posts: episode's most arresting insight → 2 sentences context → "new episode live."

PLATFORM FORMAT RULES:
- facebook: conversational, 2-4 sentences, CTA at end, no hashtags
- instagram: punchy, first 125 chars must stand alone, 3-5 hashtags on separate line
- linkedin: professional, first 210 chars is the hook, white space between paragraphs, no hashtags

OUTPUT FORMAT — return a JSON array of post objects:
[
  {
    "brand": "ncho",
    "platform": "facebook",
    "post_text": "...",
    "hashtags": [],
    "image_brief": "What the image should show, color palette, dimensions needed"
  }
]
`.trim();

export async function POST(req: Request) {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 503 });

  let body: unknown;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const { brands, platforms, count_per_combo, topic_seed, job_id } = parsed.data;

  const userPrompt = `Generate ${count_per_combo} social media post(s) for each of these brand+platform combinations:
${brands.flatMap(b => platforms.map(p => `- brand: ${b}, platform: ${p}`)).join("\n")}
${topic_seed ? `\nContent seed / topic: ${topic_seed}` : ""}

Return a flat JSON array. One object per brand+platform combination per post.
Total objects expected: ${brands.length * platforms.length * count_per_combo}`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let posts: Array<{ brand: string; platform: string; post_text: string; hashtags: string[]; image_brief?: string }>;
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: BRAND_VOICE_SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
    });

    const rawText = response.content[0].type === "text" ? response.content[0].text : "";
    // Strip any accidental markdown fences
    const clean = rawText.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    posts = JSON.parse(clean);

    if (!Array.isArray(posts)) throw new Error("Response was not an array");
  } catch (err) {
    console.error("[social/generate] Claude error:", err);
    return Response.json({ error: "Generation failed", detail: String(err) }, { status: 500 });
  }

  // Insert all posts into social_posts with status pending_review
  const rows = posts.map(p => ({
    brand: p.brand,
    platform: p.platform,
    post_text: p.post_text,
    hashtags: p.hashtags ?? [],
    image_brief: p.image_brief ?? null,
    generation_prompt: userPrompt,
    job_id: job_id ?? null,
    status: "pending_review" as const,
  }));

  const { data, error } = await supabase.from("social_posts").insert(rows).select();

  if (error) {
    console.error("[social/generate] DB insert error:", error);
    return Response.json({ error: "Failed to save posts" }, { status: 500 });
  }

  return Response.json({ posts: data, count: data.length }, { status: 201 });
}
```

---

### 5.2 Posts CRUD

**File:** `src/app/api/social/posts/route.ts`

```typescript
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

// GET /api/social/posts — fetch posts by status and/or brand
export async function GET(req: Request) {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");   // e.g. "pending_review", "approved"
  const brand = searchParams.get("brand");

  let query = supabase
    .from("social_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (brand) query = query.eq("brand", brand);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ posts: data });
}
```

**File:** `src/app/api/social/posts/[id]/route.ts`

```typescript
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { z } from "zod";

// PATCH /api/social/posts/[id] — edit post text (saves old version to edit_history)
// DELETE /api/social/posts/[id] — reject (sets status = rejected)

const patchSchema = z.object({
  post_text: z.string().min(1).optional(),
  image_brief: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  scheduled_for: z.string().datetime().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 503 });

  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  // Fetch current version first — we'll push it to edit_history
  const { data: current } = await supabase.from("social_posts").select("*").eq("id", id).single();
  if (!current) return Response.json({ error: "Post not found" }, { status: 404 });

  const newHistoryEntry = {
    post_text: current.post_text,
    edited_at: new Date().toISOString(),
  };
  const updatedHistory = [...(current.edit_history ?? []), newHistoryEntry];

  const { data, error } = await supabase
    .from("social_posts")
    .update({ ...parsed.data, edit_history: updatedHistory })
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ post: data });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 503 });

  const { id } = await params;
  const { error } = await supabase
    .from("social_posts")
    .update({ status: "rejected" })
    .eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
```

---

### 5.3 Approve → Push to Buffer

**File:** `src/app/api/social/posts/[id]/approve/route.ts`

```typescript
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { z } from "zod";

const approveSchema = z.object({
  scheduled_for: z.string().datetime(),  // ISO string — when to publish
  buffer_profile_id: z.string(),          // from social_accounts table
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 503 });

  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = approveSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const { scheduled_for, buffer_profile_id } = parsed.data;

  // Fetch the post
  const { data: post } = await supabase.from("social_posts").select("*").eq("id", id).single();
  if (!post) return Response.json({ error: "Post not found" }, { status: 404 });
  if (post.status !== "pending_review") return Response.json({ error: "Post is not pending review" }, { status: 409 });

  // Push to Buffer API
  const bufferToken = process.env.BUFFER_ACCESS_TOKEN;
  if (!bufferToken) return Response.json({ error: "BUFFER_ACCESS_TOKEN not configured" }, { status: 503 });

  // Assemble post text — include hashtags if they exist
  const fullText = post.hashtags?.length
    ? `${post.post_text}\n\n${post.hashtags.join(" ")}`
    : post.post_text;

  const bufferPayload = {
    profile_ids: [buffer_profile_id],
    text: fullText,
    scheduled_at: scheduled_for,
  };

  let bufferUpdateId: string;
  try {
    const bufferRes = await fetch("https://api.bufferapp.com/1/updates/create.json", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Bearer ${bufferToken}`,
      },
      body: new URLSearchParams({
        "profile_ids[]": buffer_profile_id,
        text: fullText,
        scheduled_at: scheduled_for,
      }),
    });

    if (!bufferRes.ok) {
      const detail = await bufferRes.text();
      console.error("[social/approve] Buffer API error:", detail);
      return Response.json({ error: "Buffer API rejected the post", detail }, { status: 502 });
    }

    const bufferData = await bufferRes.json();
    bufferUpdateId = bufferData.updates?.[0]?.id ?? bufferData.update?.id;
    if (!bufferUpdateId) throw new Error("Buffer returned no update ID");

  } catch (err) {
    console.error("[social/approve] Buffer request failed:", err);
    return Response.json({ error: "Buffer request failed", detail: String(err) }, { status: 502 });
  }

  // Update post status in Supabase
  const { data, error } = await supabase
    .from("social_posts")
    .update({
      status: "scheduled",
      scheduled_for,
      buffer_profile_id,
      buffer_update_id: bufferUpdateId,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ post: data, buffer_update_id: bufferUpdateId });
}
```

---

### 5.4 Buffer Accounts

**File:** `src/app/api/social/accounts/route.ts`

```typescript
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { z } from "zod";

// GET — list all configured social accounts
export async function GET() {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 503 });

  const { data, error } = await supabase
    .from("social_accounts")
    .select("*")
    .eq("is_active", true)
    .order("brand", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ accounts: data });
}

// POST — add a social account manually (paste in the Buffer profile ID)
const addSchema = z.object({
  brand: z.enum(["ncho", "somersschool", "alana_terry", "scott_personal"]),
  platform: z.enum(["facebook", "instagram", "linkedin", "threads", "tiktok", "youtube", "pinterest"]),
  buffer_profile_id: z.string().min(1),
  display_name: z.string().min(1),
});

export async function POST(req: Request) {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 503 });

  let body: unknown;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = addSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await supabase.from("social_accounts").upsert(parsed.data).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ account: data }, { status: 201 });
}
```

---

### 5.5 Buffer Profiles Sync

**File:** `src/app/api/social/accounts/sync/route.ts`

Calls Buffer's `GET /v1/profiles.json` and returns the list — Scott pastes profile IDs into the accounts setup UI.

```typescript
export async function GET() {
  const bufferToken = process.env.BUFFER_ACCESS_TOKEN;
  if (!bufferToken) return Response.json({ error: "BUFFER_ACCESS_TOKEN not set" }, { status: 503 });

  const res = await fetch("https://api.bufferapp.com/1/profiles.json", {
    headers: { Authorization: `Bearer ${bufferToken}` },
  });

  if (!res.ok) {
    const detail = await res.text();
    return Response.json({ error: "Buffer API error", detail }, { status: 502 });
  }

  const profiles = await res.json();
  // Return simplified list: id, service (platform), service_username
  const simplified = profiles.map((p: { id: string; service: string; service_username: string; formatted_service: string }) => ({
    buffer_profile_id: p.id,
    platform: p.service,
    display_name: `${p.formatted_service} — ${p.service_username}`,
  }));

  return Response.json({ profiles: simplified });
}
```

---

### 5.6 Analytics Pull

**File:** `src/app/api/social/analytics/route.ts`

Pulls Buffer stats for published posts and saves them back to `social_posts.buffer_stats`.

```typescript
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

export async function POST() {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 503 });

  const bufferToken = process.env.BUFFER_ACCESS_TOKEN;
  if (!bufferToken) return Response.json({ error: "BUFFER_ACCESS_TOKEN not set" }, { status: 503 });

  // Get all posts with a buffer_update_id that haven't been analytics-updated recently
  const { data: posts } = await supabase
    .from("social_posts")
    .select("id, buffer_update_id, buffer_profile_id")
    .eq("status", "published")
    .not("buffer_update_id", "is", null);

  if (!posts?.length) return Response.json({ updated: 0 });

  let updated = 0;
  for (const post of posts) {
    try {
      const res = await fetch(
        `https://api.bufferapp.com/1/updates/${post.buffer_update_id}.json`,
        { headers: { Authorization: `Bearer ${bufferToken}` } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const stats = data.update?.statistics ?? {};

      await supabase
        .from("social_posts")
        .update({ buffer_stats: stats })
        .eq("id", post.id);
      updated++;
    } catch {
      // skip individual failures — log in production
    }
  }

  return Response.json({ updated });
}
```

---

### 5.7 Shopify Webhook — New Product Trigger

**File:** `src/app/api/webhooks/shopify-product/route.ts`

When NCHO adds a new product on Shopify, auto-trigger an NCHO post generation batch.

```typescript
import crypto from "crypto";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { Client } from "@upstash/qstash";

export async function POST(req: Request) {
  // Verify Shopify webhook signature
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook secret not configured", { status: 503 });

  const rawBody = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256");
  const expectedHmac = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  if (hmac !== expectedHmac) {
    return new Response("Unauthorized", { status: 401 });
  }

  const product = JSON.parse(rawBody);
  const productTitle = product.title as string;
  const productType = product.product_type as string;

  // Create a social_batch job — the Railway worker will call /api/social/generate
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return new Response("DB unavailable", { status: 503 });

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      type: "social_batch",
      label: `NCHO product launch: "${productTitle}"`,
      input_payload: {
        trigger: "shopify_new_product",
        brands: ["ncho"],
        platforms: ["facebook", "instagram"],
        count_per_combo: 3,
        topic_seed: `New NCHO product: ${productTitle}${productType ? ` (${productType})` : ""}`,
      },
      status: "queued",
    })
    .select()
    .single();

  if (error || !job) return new Response("Failed to create job", { status: 500 });

  // Trigger via QStash
  const qstashToken = process.env.QSTASH_TOKEN;
  const workerUrl = process.env.RAILWAY_WORKER_URL;
  if (qstashToken && workerUrl) {
    const qstash = new Client({ token: qstashToken });
    await qstash.publishJSON({
      url: `${workerUrl}/process-job`,
      body: { jobId: job.id, type: "social_batch", payload: job.input_payload },
      retries: 3,
    });
  }

  return new Response("OK", { status: 200 });
}
```

---

## 6. WORKER EXTENSION

### Extend the Railway TypeScript Worker

**File:** `worker/src/jobs/social-batch.ts` — new file

```typescript
import { updateProgress } from "../lib/progress";

export interface SocialBatchPayload {
  trigger: string;
  brands: string[];
  platforms: string[];
  count_per_combo: number;
  topic_seed?: string;
}

export async function runSocialBatch(jobId: string, payload: SocialBatchPayload) {
  const baseUrl = process.env.CHAPTERHOUSE_URL ?? "https://chapterhouse.vercel.app";

  await updateProgress(jobId, 10, "Triggering social post generation...", "running");

  const res = await fetch(`${baseUrl}/api/social/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, job_id: jobId }),
  });

  if (!res.ok) {
    const detail = await res.text();
    await updateProgress(jobId, 0, `Generation API failed: ${res.status}`, "failed", undefined, detail);
    return;
  }

  const { count } = await res.json();
  await updateProgress(jobId, 100, `Generated ${count} posts — pending review`, "completed", { count });
}
```

**File:** `worker/src/jobs/router.ts` — add the new case:

```typescript
// In the switch statement, add:
case "social_batch":
  await runSocialBatch(jobId, payload as unknown as SocialBatchPayload);
  break;
```

Also add to the imports at top:
```typescript
import { runSocialBatch, type SocialBatchPayload } from "./social-batch";
```

---

## 7. QStash CRON — Weekly Batch Generation

**File:** `src/app/api/cron/social-weekly/route.ts`

Runs every Sunday at 20:00 Alaska time (Monday 05:00 UTC).

```typescript
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { Client } from "@upstash/qstash";

export async function GET(req: Request) {
  // Verify cron secret to prevent unauthorized triggers
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 503 });

  const { data: job } = await supabase
    .from("jobs")
    .insert({
      type: "social_batch",
      label: `Weekly social batch — week of ${new Date().toLocaleDateString()}`,
      input_payload: {
        trigger: "weekly_cron",
        brands: ["ncho", "somersschool", "alana_terry"],
        platforms: ["facebook", "instagram", "linkedin"],
        count_per_combo: 2,
      },
      status: "queued",
    })
    .select()
    .single();

  if (!job) return Response.json({ error: "Job creation failed" }, { status: 500 });

  const qstashToken = process.env.QSTASH_TOKEN;
  const workerUrl = process.env.RAILWAY_WORKER_URL;

  if (qstashToken && workerUrl) {
    const qstash = new Client({ token: qstashToken });
    await qstash.publishJSON({
      url: `${workerUrl}/process-job`,
      body: { jobId: job.id, type: "social_batch", payload: job.input_payload },
    });
  }

  return Response.json({ jobId: job.id });
}
```

**Register in `vercel.json`:**
```json
{
  "crons": [
    { "path": "/api/cron/daily-brief", "schedule": "0 3 * * *" },
    { "path": "/api/cron/social-weekly", "schedule": "0 5 * * 1" }
  ]
}
```

---

## 8. UI PAGES

### 8.1 Social Hub Page

**File:** `src/app/social/page.tsx`

This is the main page. Three tabs: Review Queue | Calendar | Accounts.

```tsx
"use client";
import { useState } from "react";
import { PageFrame } from "@/components/page-frame";
import { SocialReviewQueue } from "@/components/social-review-queue";
import { SocialGeneratePanel } from "@/components/social-generate-panel";
import { SocialAccountsPanel } from "@/components/social-accounts-panel";
import { Send, Calendar, Settings2, Plus } from "lucide-react";

const TABS = [
  { id: "queue", label: "Review Queue", icon: Send },
  { id: "generate", label: "Generate", icon: Plus },
  { id: "accounts", label: "Accounts", icon: Settings2 },
];

export default function SocialPage() {
  const [activeTab, setActiveTab] = useState("queue");

  return (
    <PageFrame
      title="Social Media"
      description="Generate, review, and schedule posts across all three brands."
    >
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border/50 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition
              ${activeTab === tab.id
                ? "bg-accent/10 text-foreground border-b-2 border-accent"
                : "text-muted hover:text-foreground"
              }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "queue" && <SocialReviewQueue />}
      {activeTab === "generate" && <SocialGeneratePanel />}
      {activeTab === "accounts" && <SocialAccountsPanel />}
    </PageFrame>
  );
}
```

---

### 8.2 Review Queue Component

**File:** `src/components/social-review-queue.tsx`

This is the core UI. Displays pending posts grouped by brand. Each card: post text (editable inline), image brief, platform badge, approve/edit/reject buttons, scheduled_for datetime picker.

Design it following the same `ActionBtn` pattern as `src/app/review-queue/page.tsx`. 

Key behaviors:
- **Load:** `GET /api/social/posts?status=pending_review` on mount
- **Realtime:** Subscribe to Supabase Realtime on `social_posts` table — new pending posts appear instantly when a generation job completes
- **Approve flow:** Show a small inline form with datetime picker + Buffer account dropdown → `POST /api/social/posts/[id]/approve`
- **Edit flow:** Clicking post_text makes it an editable textarea → PATCH on blur
- **Reject:** DELETE call → status = rejected → post disappears from queue
- **Group by brand:** Show NCHO posts first, then SomersSchool, then Alana Terry
- **Platform badge:** Color-coded pill: Facebook=blue, Instagram=pink, LinkedIn=slate

Brand badge colors:
- ncho: `amber` 
- somersschool: `red`
- alana_terry: `purple`
- scott_personal: `slate`

Platform badge colors:
- facebook: `blue`
- instagram: `pink`
- linkedin: `sky`

---

### 8.3 Generate Panel Component

**File:** `src/components/social-generate-panel.tsx`

Simple form:
- Checkbox group: brands (ncho, somersschool, alana_terry)
- Checkbox group: platforms (facebook, instagram, linkedin)
- Number input: posts per combo (1–7, default 2)
- Textarea: topic seed (optional, e.g. "new product: Saxon Math 5/4")
- Submit → `POST /api/social/generate` → success toast with post count → user switches to Review Queue tab

---

### 8.4 Accounts Panel Component

**File:** `src/components/social-accounts-panel.tsx`

Two-step setup helper:
1. **Sync from Buffer** button → calls `GET /api/social/accounts/sync` → shows available Buffer profiles in a table (profile_id, platform, display_name)
2. **Add account** form → user picks brand + platform + pastes profile_id + display_name → `POST /api/social/accounts`
3. **Active accounts table** → lists current `social_accounts` rows

---

### 8.5 Register in Navigation

**File:** `src/lib/navigation.ts` — add to the existing structure:

```typescript
// Add Send import to the lucide imports at top
import { ..., Send } from "lucide-react";

// Add to a new "Publishing" group, or add to the existing "Creative" group:
{
  label: "Social",
  href: "/social",
  description: "Generate, review, and schedule posts across all three brands.",
  icon: Send,
  tooltip: {
    summary: "AI-powered social media automation. Claude generates posts for NCHO, SomersSchool, and Alana Terry across Facebook, Instagram, and LinkedIn. Posts go into a review queue — nothing publishes without your approval. Approved posts push directly to Buffer for scheduling.",
    features: [
      "Generate a week of posts for all brands in one click",
      "Review queue: approve, edit, or reject each post individually",
      "One-click push to Buffer → scheduled on your connected accounts",
      "Shopify webhook: new NCHO product triggers automatic post generation",
      "Weekly cron auto-generates a new batch every Sunday evening",
    ],
    tips: [
      "Set up Buffer accounts first (Accounts tab) before approving any posts",
      "Use topic seed for product launches — e.g. 'new product: Saxon Math 5/4'",
      "Generated posts include an image brief — use that to run Image Generation Studio",
    ],
  },
  status: "live" as const,
}
```

---

## 9. BUFFER SETUP (ONE-TIME, MANUAL)

Buffer doesn't require OAuth for personal use tokens. Steps:

1. Go to `buffer.com` → Free account → Connect Facebook Page (NCHO), Instagram Business (NCHO), LinkedIn (SomersSchool). Free tier is exactly 3 channels — perfect fit.
2. Go to `buffer.com/developers` → Create App → copy Personal Access Token
3. Add `BUFFER_ACCESS_TOKEN` to `.env.local` and Vercel environment variables
4. In Chapterhouse `/social` → Accounts tab → click "Sync from Buffer" → add each channel with brand mapping:
   - `ncho` + `facebook` → NCHO Facebook profile ID
   - `ncho` + `instagram` → NCHO Instagram profile ID  
   - `somersschool` + `linkedin` → SomersSchool LinkedIn profile ID

---

## 10. BUILD ORDER

Build in this sequence. Each step is independently testable before the next.

| # | What | Files | Test |
|---|---|---|---|
| 1 | DB migrations | migrations 010, 011, 012 | Run in Supabase dashboard → confirm tables exist |
| 2 | Generate endpoint | `api/social/generate/route.ts` | `curl -X POST` with test payload → confirm posts in DB |
| 3 | Posts CRUD | `api/social/posts/route.ts`, `[id]/route.ts` | GET returns posts, PATCH saves edit |
| 4 | Accounts API + sync | `api/social/accounts/route.ts` + sync | Add test account, confirm in DB |
| 5 | Approve endpoint | `api/social/posts/[id]/approve/route.ts` | Approve a post → confirm in Buffer queue |
| 6 | Worker extension | `worker/src/jobs/social-batch.ts` + router update | Create `social_batch` job → worker picks up → posts appear |
| 7 | Social page UI | `app/social/page.tsx` + all components | Full UI flow: generate → review → approve |
| 8 | Navigation | `lib/navigation.ts` | Social appears in sidebar |
| 9 | Cron | `api/cron/social-weekly/route.ts` + vercel.json | Trigger manually → confirm job created |
| 10 | Shopify webhook | `api/webhooks/shopify-product/route.ts` | Test with Shopify webhook simulator |

---

## 11. WHAT THIS REPLACES (SINTRA)

| Sintra Feature | Our Equivalent | Advantage |
|---|---|---|
| Soshie generates posts | `/api/social/generate` + Claude | Unlimited, custom brand voice, no credit cap |
| Weekly approval queue | Review Queue component | Same UX; data stays in Chapterhouse |
| Auto-posts FB/IG/LinkedIn | Buffer API via approve endpoint | Buffer handles scheduling, retry logic, analytics |
| Brain AI memory | BRAND_VOICE_SYSTEM constant in route | Consistent every call; no re-training sessions |
| One brand per workspace | `brand` column — all three brands in one system | No per-brand cost multiplication |
| 250 credits/month | Claude API — unlimited at cost-per-token | ~$0.003 per generation batch ($0/month fixed cost) |
| Soshie image gen (repetition bug) | Image Generation Studio (`/creative-studio`) + image_brief field | Explicit brief per post; no repeated images |

---

## 12. FUTURE EXTENSIONS (NOT IN THIS BUILD)

- **ManyChat integration:** Instagram comment-trigger DM automation. Wire in when NCHO has real Instagram engagement volume. Separate feature, separate API routes.
- **Make.com webhook receiver:** `POST /api/webhooks/make` — receive Make.com scenario triggers (e.g., RSS → generate). Low priority — the Shopify webhook + cron cover the automation surface for now.
- **Analytics dashboard:** Performance tab on `/social` showing top posts by engagement. Requires 30+ days of published post data to be useful. Add in Month 2.
- **Content recycling:** Flag high-performing posts (buffer_stats.likes > threshold) → "Recycle" button in review queue → generates a reformatted version. Add in Month 3.
- **FeedHive migration:** If Buffer's automation triggers feel too thin, FeedHive has webhook-based conditional posting ("post gets 50 likes → add follow-up comment"). Same Buffer API profile IDs should transfer.

---

---

# PART 2: PERPLEXITY-STYLE ANSWER ENGINE — CHAPTERHOUSE BUILD SPEC
## Feature: "Ask" — Live Web Search + AI Synthesis with Inline Citations

---

## 1. WHAT THIS IS

An answer engine inside Chapterhouse. Instead of getting a list of links, Scott types a question and gets:
- A synthesized AI answer in 5–15 seconds
- Inline `[1][2][3]` citation numbers that are clickable links to sources
- The sources listed below the answer with excerpts
- 3 follow-up question suggestions
- The conversation continues — ask follow-ups, answers reference prior context

**The technical stack:** Tavily search → Claude synthesis with citations → streaming response → citation rendering in UI.

---

## 2. WHAT'S ALREADY BUILT (DO NOT REBUILD)

Read `src/app/api/research/deep/route.ts` before touching anything.

**Already exists and works:**
- `orchestrateSearch(query, sources, maxResults)` — runs Tavily + SerpAPI + Reddit + NewsAPI + Internet Archive in parallel
- `synthesizeResults(query, results, depth)` — calls Claude with numbered source summaries, gets back `[1][2][3]`-cited synthesis
- The `deep` depth mode already produces a full cited research report
- `research_items` table for saving found sources
- `src/app/research/page.tsx` — research UI already exists

**What's missing:**
1. A **streaming** answer route (current deep route is non-streaming — you wait for the full response)
2. A **chat-style UI** — question → answer appears word-by-word, sources appear below
3. **Citation rendering** — parse `[1]` in the answer text and render as clickable superscript links
4. **Follow-up questions** — 3 suggestions after each answer
5. **Conversation continuity** — follow-ups have context of prior Q&A
6. A dedicated **`/ask` page** (or a new tab on `/research`) with this UX

---

## 3. THE NEW API ROUTE — Streaming Answer

**File:** `src/app/api/research/ask/route.ts`

This is a new route alongside the existing `/api/research/deep`. It's stream-first — the answer starts appearing immediately.

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { orchestrateSearch } from "@/lib/search-orchestrator";

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { query, history } = body as {
    query: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
  };

  if (!query || query.length < 3 || query.length > 500) {
    return Response.json({ error: "query must be 3–500 characters" }, { status: 400 });
  }

  // Step 1: Search — use Tavily only for speed (50–500ms vs 2–5s for full multi-source)
  const { results } = await orchestrateSearch(query, ["tavily"], 6);

  // Build numbered source context for Claude
  const sourceContext = results
    .slice(0, 6)
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content?.slice(0, 800) ?? ""}`)
    .join("\n\n---\n\n");

  const SYSTEM = `You are a precise research assistant for Scott Somers — a middle school teacher in Alaska building a homeschool education business.

Answer the user's question directly and concisely. Cite sources inline using [1], [2], [3] notation whenever you draw from them.

After your answer, on a new line, output exactly:
FOLLOW_UP_1: [a natural follow-up question]
FOLLOW_UP_2: [a natural follow-up question]
FOLLOW_UP_3: [a natural follow-up question]

Sources available:
${sourceContext}

Rules:
- Lead with the direct answer. No preamble like "Great question!" or "Based on the sources..."
- Use [n] citations inline, not at the end of paragraphs
- If sources don't contain enough to answer, say so directly
- Keep answers under 400 words unless the question requires depth
- Cite at minimum 2 sources if they're relevant`;

  // Build message history — last 6 turns to stay within context
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [];
  if (history?.length) {
    messages.push(...history.slice(-6));
  }
  messages.push({ role: "user", content: query });

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Step 2: Stream the response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // First chunk: send the sources metadata immediately so the UI can render them
      // while the answer streams in
      const sourceMeta = results.slice(0, 6).map((r, i) => ({
        index: i + 1,
        title: r.title,
        url: r.url,
        excerpt: r.content?.slice(0, 200) ?? "",
        source: r.source,
      }));
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "sources", sources: sourceMeta })}\n\n`)
      );

      // Stream the answer
      let fullText = "";
      try {
        const claudeStream = await anthropic.messages.stream({
          model: "claude-sonnet-4-5",
          max_tokens: 1024,
          system: SYSTEM,
          messages,
        });

        for await (const event of claudeStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            fullText += event.delta.text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "delta", text: event.delta.text })}\n\n`)
            );
          }
        }

        // Parse out follow-up questions from the end of fullText
        const followUpRegex = /FOLLOW_UP_\d+:\s*(.+)/g;
        const followUps: string[] = [];
        let match;
        while ((match = followUpRegex.exec(fullText)) !== null) {
          followUps.push(match[1].trim());
        }

        // Strip follow-up lines from the displayed answer
        const cleanAnswer = fullText.replace(/FOLLOW_UP_\d+:.*$/gm, "").trim();

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "done", followUps, fullAnswer: cleanAnswer })}\n\n`
          )
        );
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", message: String(err) })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

---

## 4. UI PAGE

**File:** `src/app/ask/page.tsx`

This is a standalone page. Clean, focused — just the question box and the answer. Not cluttered with research controls.

```tsx
"use client";
import { useRef, useState } from "react";
import { PageFrame } from "@/components/page-frame";
import { AnswerDisplay } from "@/components/answer-display";
import { Search, ArrowRight, Loader2 } from "lucide-react";

type Source = {
  index: number;
  title: string;
  url: string;
  excerpt: string;
  source: string;
};

type Turn = {
  question: string;
  answer: string;
  sources: Source[];
  followUps: string[];
};

export default function AskPage() {
  const [query, setQuery] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamingAnswer, setStreamingAnswer] = useState("");
  const [streamingSources, setStreamingSources] = useState<Source[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function ask(q: string) {
    if (!q.trim() || streaming) return;
    setStreaming(true);
    setStreamingAnswer("");
    setStreamingSources([]);

    // Build history from prior turns for context
    const history = turns.flatMap(t => [
      { role: "user" as const, content: t.question },
      { role: "assistant" as const, content: t.answer },
    ]);

    const res = await fetch("/api/research/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q, history }),
    });

    if (!res.body) { setStreaming(false); return; }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullAnswer = "";
    let sources: Source[] = [];
    let followUps: string[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value).split("\n");
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const event = JSON.parse(line.slice(6));
          if (event.type === "sources") {
            sources = event.sources;
            setStreamingSources(sources);
          } else if (event.type === "delta") {
            fullAnswer += event.text;
            // Only show the answer portion (strip FOLLOW_UP lines while streaming)
            setStreamingAnswer(fullAnswer.replace(/FOLLOW_UP_\d+:.*$/gm, "").trim());
          } else if (event.type === "done") {
            fullAnswer = event.fullAnswer;
            followUps = event.followUps ?? [];
          }
        } catch { /* skip malformed lines */ }
      }
    }

    setTurns(prev => [...prev, { question: q, answer: fullAnswer, sources, followUps }]);
    setQuery("");
    setStreaming(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  return (
    <PageFrame title="Ask" description="Ask anything. Get a cited answer from live web sources.">
      {/* Prior turns */}
      <div className="flex flex-col gap-8 mb-8">
        {turns.map((turn, i) => (
          <AnswerDisplay
            key={i}
            question={turn.question}
            answer={turn.answer}
            sources={turn.sources}
            followUps={turn.followUps}
            onFollowUp={q => ask(q)}
          />
        ))}
        {/* Streaming turn */}
        {streaming && (streamingAnswer || streamingSources.length > 0) && (
          <AnswerDisplay
            question={query || "..."}
            answer={streamingAnswer}
            sources={streamingSources}
            followUps={[]}
            streaming
          />
        )}
      </div>

      {/* Input */}
      <div className="sticky bottom-6">
        <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/95 backdrop-blur px-4 py-3 shadow-lg">
          <Search size={16} className="text-muted shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && ask(query)}
            placeholder="Ask anything — searches the web, cites sources..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted/60 outline-none"
            disabled={streaming}
            autoFocus
          />
          <button
            onClick={() => ask(query)}
            disabled={!query.trim() || streaming}
            className="shrink-0 rounded-xl bg-accent/20 border border-accent/30 p-1.5 text-accent hover:bg-accent/30 disabled:opacity-40 transition"
          >
            {streaming ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
          </button>
        </div>
      </div>
    </PageFrame>
  );
}
```

---

## 5. CITATION RENDERING COMPONENT

**File:** `src/components/answer-display.tsx`

This component does the critical work: parsing `[1]` in raw text and turning it into a clickable superscript that links to the source URL.

```tsx
import { ExternalLink, ChevronRight } from "lucide-react";

type Source = {
  index: number;
  title: string;
  url: string;
  excerpt: string;
  source: string;
};

type Props = {
  question: string;
  answer: string;
  sources: Source[];
  followUps: string[];
  streaming?: boolean;
  onFollowUp?: (q: string) => void;
};

// SOURCE_COLORS: subtle platform-specific tints
const SOURCE_COLOR: Record<string, string> = {
  tavily: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  serpapi: "bg-violet-500/10 border-violet-500/20 text-violet-400",
  reddit: "bg-orange-500/10 border-orange-500/20 text-orange-400",
  newsapi: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  "internet-archive": "bg-amber-500/10 border-amber-500/20 text-amber-400",
};

// Parse answer text and replace [N] with clickable superscript citations
function renderWithCitations(text: string, sources: Source[]) {
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[(\d+)\]$/);
    if (match) {
      const num = parseInt(match[1]);
      const source = sources.find(s => s.index === num);
      if (source) {
        return (
          <a
            key={i}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent/20 border border-accent/30 text-accent text-[10px] font-bold mx-0.5 hover:bg-accent/40 transition align-super"
            title={source.title}
          >
            {num}
          </a>
        );
      }
    }
    // Render newlines as line breaks
    return <span key={i}>{part.split("\n").map((line, j, arr) => (
      <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
    ))}</span>;
  });
}

export function AnswerDisplay({ question, answer, sources, followUps, streaming, onFollowUp }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* Question */}
      <div className="flex gap-3 items-start">
        <div className="shrink-0 w-6 h-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-xs font-bold mt-0.5">
          ?
        </div>
        <p className="text-foreground font-medium text-base">{question}</p>
      </div>

      {/* Sources strip — appears immediately while answer streams */}
      {sources.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pl-9">
          {sources.map(s => (
            <a
              key={s.index}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition hover:opacity-80 ${SOURCE_COLOR[s.source] ?? "bg-muted/10 border-border text-muted"}`}
            >
              <span className="font-bold">[{s.index}]</span>
              <span className="opacity-80 max-w-[120px] truncate">{s.title}</span>
              <ExternalLink size={9} />
            </a>
          ))}
        </div>
      )}

      {/* Answer with inline citations */}
      <div className="pl-9 text-sm text-foreground/90 leading-relaxed">
        {answer ? (
          <>{renderWithCitations(answer, sources)}</>
        ) : (
          <span className="text-muted animate-pulse">Searching...</span>
        )}
        {streaming && <span className="ml-1 inline-block w-1.5 h-4 bg-accent/60 animate-pulse rounded-sm align-text-bottom" />}
      </div>

      {/* Follow-up questions */}
      {followUps.length > 0 && onFollowUp && (
        <div className="pl-9 flex flex-col gap-1.5 pt-1">
          {followUps.map((q, i) => (
            <button
              key={i}
              onClick={() => onFollowUp(q)}
              className="flex items-center gap-2 text-xs text-muted hover:text-foreground transition text-left group"
            >
              <ChevronRight size={12} className="shrink-0 text-accent/60 group-hover:text-accent transition" />
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 6. NAVIGATION ENTRY

**File:** `src/lib/navigation.ts` — add to the Command Center group alongside Daily Brief and Home:

```typescript
// Add Search import to lucide imports
import { ..., Search } from "lucide-react";

// Add to "command" group items:
{
  label: "Ask",
  href: "/ask",
  description: "Live web search with AI-synthesized cited answers.",
  icon: Search,
  tooltip: {
    summary: "Perplexity-style answer engine. Ask any question — Chapterhouse searches the web with Tavily, synthesizes an answer with Claude Sonnet 4.6, and renders inline [1][2][3] citations linked to real sources. Follow-up questions maintain conversation context. Faster and more focused than opening a browser.",
    features: [
      "Live Tavily web search on every query — always current, not trained knowledge",
      "Streaming answer starts appearing in ~1 second while sources load",
      "Inline [N] citations are clickable links to the exact source",
      "3 follow-up question suggestions after every answer",
      "Conversation context — follow-ups know what was asked before",
      "Source badges color-coded by origin (Tavily, Reddit, NewsAPI, etc.)",
    ],
    tips: [
      "For broad research topics, use /research/deep — it hits 5 sources and saves to your research queue",
      "Ask is optimized for fast Q&A — use it instead of opening a browser for quick lookups",
      "Follow-up questions are the real power — ask the obvious question, then drill down",
    ],
  },
  status: "live" as const,
}
```

---

## 7. HOW IT DIFFERS FROM EXISTING `/research` PAGE

| Feature | `/research` (existing) | `/ask` (new) |
|---|---|---|
| UX | Form: query → wait → full report | Chat: question → streaming answer |
| Speed | 5–15 seconds (multi-source) | 1–3 seconds (Tavily-only) |
| Sources | 5 sources (Tavily+SerpAPI+Reddit+NewsAPI+Archive) | 6 Tavily results |
| Output | Full research report, saved to Supabase | Inline cited answer, conversational |
| Follow-ups | No | Yes — 3 suggestions per answer |
| Use case | Deep research sessions, saved to queue | Quick Q&A, competitive lookups, fast facts |
| Saves to DB | Yes — auto-saves to `research_items` | No (by design — keep it fast) |

They coexist. Use `/ask` for "what is X?" and `/research` deep mode for "give me a full report on X."

---

## 8. BUILD ORDER

| # | What | Files | Test |
|---|---|---|---|
| 1 | Ask API route | `api/research/ask/route.ts` | `curl -X POST -d '{"query":"test"}' → SSE stream with sources + delta + done events` |
| 2 | AnswerDisplay component | `components/answer-display.tsx` | Test with mock data — confirm `[1]` renders as superscript link |
| 3 | Ask page | `app/ask/page.tsx` | Full flow: type question → streaming answer appears → citations clickable |
| 4 | Follow-up questions | Wired in AnswerDisplay + page state | Click follow-up → new question fires with history |
| 5 | Navigation | `lib/navigation.ts` | "Ask" appears in sidebar |

---

*Part 2 complete. All file paths relative to `C:\Users\Valued Customer\OneDrive\Desktop\WEBSITES\Brand guide`.*
*The existing `orchestrateSearch` and Tavily key are already wired — the ask route is a thin layer on top of what's there.*
*Build Part 1 (social media) and Part 2 (ask) independently — no shared dependencies.*
