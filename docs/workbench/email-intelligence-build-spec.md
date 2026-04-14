# Email Intelligence Upgrade — Build Spec
## Chapterhouse Session 25 — March 21, 2026

> **Goal:** Turn Chapterhouse into Scott's daily email assistant. 100+ emails/day across two accounts. Nothing important gets lost. Newsletter intel gets parsed. Sales and customer emails get tracked. Reply-needed items get surfaced proactively. All of it pullable on demand via chat.

> **Design principle:** *Pullable on request, not pushed into every prompt.* Auto-ingest to `research_items` for high-signal content. Customer/sales emails tracked in `opportunities`. Everything queryable via chat. The brain doesn't get overwhelmed — it gets indexed.

---

## What Already Works (Don't Touch)

| Component | Route | Status |
|---|---|---|
| IMAP sync (sequence numbers) | `POST /api/email/sync` | ✅ Both accounts |
| AI categorization (Haiku 4.5) | `POST /api/email/categorize` | ✅ 10 categories |
| Email search (TSVECTOR) | `GET /api/email/search` | ✅ Full-text + category |
| Daily digest → context_files | `GET /api/cron/email-digest` | ✅ inject_order 5 |
| Chat email awareness | `buildLiveContext()` | ✅ Regex intent detection |
| Inbox UI (Live + AI views) | `/inbox` page | ✅ Working |

---

## Build Plan — 7 Steps

### Step 1: Newsletter Auto-Ingest Route
**New file:** `src/app/api/email/auto-ingest/route.ts`

**What it does:** After categorization runs, this route scans newly categorized emails and auto-ingests high-signal ones to `research_items`.

**Trigger:** Called by the categorize route at the end (chain call), and by the inbox UI "Sync & Categorize" button flow.

**Logic:**
```
1. Query emails WHERE:
   - ai_processed_at >= (now - 1 hour)            // only freshly categorized
   - category IN ('newsletter', 'media')           // high-signal categories
   - urgency >= 1                                  // skip total noise
   - NOT EXISTS in research_items with matching url // dedup

2. For each qualifying email (batch of up to 10):
   - Build a research_items row:
     - url: `email://${email.id}`
     - title: email.subject
     - summary: email.ai_summary (already written by Haiku)
     - verdict: null (will be set on review)
     - tags: [email.category, email.email_account]
     - status: 'review'
   
3. Return { ingested: N, skipped: N }
```

**Cost:** $0 — reuses Haiku's existing `ai_summary`. No additional AI call.

**Why not Sonnet?** The categorize pass already wrote the summary. We're just persisting it to a different table. Newsletter *deep parsing* is Step 5 — that's where the AI cost lives.

---

### Step 2: Sales → Opportunities Auto-Creation
**Modify:** `src/app/api/email/auto-ingest/route.ts` (same route, second pass)

**Logic:**
```
1. Query emails WHERE:
   - ai_processed_at >= (now - 1 hour)
   - category IN ('sales_inquiry', 'customer')
   - NOT EXISTS in opportunities with matching title

2. For each qualifying email:
   - Insert to `opportunities` table:
     - title: email.subject
     - description: email.ai_summary
     - category: email.category === 'sales_inquiry' ? 'inbound_lead' : 'customer_signal'
     - store_score: 0 (to be scored later)
     - curriculum_score: 0
     - content_score: 0
     - status: 'open'
     - action: 'Reply needed'
     - source_email_id: email.id   // ← NEW column, see Step 6

3. Return { opportunities_created: N }
```

**Cost:** $0 — no AI call, just routing existing data.

---

### Step 3: Reply Draft Suggestions
**New file:** `src/app/api/email/draft-reply/route.ts`

**What it does:** Takes an email ID, reads the full email body from Supabase, generates a draft reply via Claude Haiku 4.5.

**Input:** `{ emailId: string }`

**Logic:**
```
1. Fetch email from Supabase (subject, from_name, from_address, text_body, category, ai_summary)
2. Call Haiku with system prompt:
   - "You are drafting a reply for Scott Somers (scott@nextchapterhomeschool.com).
      Scott runs NCHO (homeschool store), SomersSchool (curriculum SaaS), BibleSaaS.
      Be professional, warm, concise. Match the email's formality level.
      If it's a sales inquiry: express interest, ask clarifying questions.
      If it's a customer question: be helpful, specific, empathetic.
      If it's a vendor: be professional, direct.
      Output ONLY the reply body text — no subject line, no greeting preamble beyond 'Hi [Name],'."
3. Return { draft: string, emailId: string }
```

**Model:** Haiku 4.5 — drafts are low-stakes, editable, and speed matters.

**Cost:** ~$0.001 per draft (Haiku is $0.25/MTok input, reply context is ~500 tokens).

**Where it surfaces (3 places):**

**A. Inbox UI** — "Draft Reply" button on the email viewer panel (next to existing Reply button). Click → shows draft in a dismissible panel above the compose area. User can edit → send, or dismiss.

**B. Daily digest** — For `action_required` emails, the digest cron generates a draft for each (max 5) and includes them inline:
```markdown
## ⚡ Action Required (3 items)
- **sales_inquiry** John Smith <john@example.com>: Partnership proposal for Alaska curriculum
  > **Suggested reply:** Hi John, Thank you for reaching out about...
```

**C. Chat** — When user says "draft replies for my emails" or "what should I reply to":
1. `buildLiveContext()` already detects email intent
2. Extend: after injecting inbox summary, also query `action_required = true` emails
3. Include instruction to Claude: "For each action_required email, suggest a brief reply."

---

### Step 4: Action Required Banner on Home Page
**Modify:** `src/app/page.tsx` (or the chat interface component that renders on `/`)

**What it does:** A persistent amber banner at the top of the chat page showing unread action items.

**Logic:**
```typescript
// Fetch on page load + every 5 minutes
const { data } = await supabase
  .from('emails')
  .select('id, subject, from_name, category, urgency')
  .eq('action_required', true)
  .eq('is_read', false)   // unread action items only
  .order('urgency', { ascending: false })
  .limit(5);
```

**UI:**
```
┌─────────────────────────────────────────────────────────────────┐
│ ⚡ 3 emails need your attention                    [View Inbox] │
│ • John Smith: Partnership proposal (sales_inquiry, urgent)      │
│ • Ingram Spark: Invoice #4821 due March 28 (vendor)             │
│ • Parent question about Grade 3 Science (customer)              │
└─────────────────────────────────────────────────────────────────┘
```

**Component:** `EmailActionBanner` — client component, fetches from a new lightweight API route `GET /api/email/action-items` that returns the top 5 unread action-required emails. Auto-refreshes every 5 minutes. Dismissable per-session (not per-email — dismissing hides the banner, refreshing brings it back if items still exist).

**Placement:** Above the chat input area in `src/app/page.tsx`, below the header.

---

### Step 5: Newsletter Deep Parse (TLDR + Others)
**Modify:** `src/app/api/cron/email-digest/route.ts` — extend Step 3.5

**Current state:** The digest cron already extracts TLDR newsletter body text (3 emails, 3000 chars each) and passes it to Sonnet for the digest. But the intel stays trapped in the daily digest markdown — it doesn't become permanent research items.

**New behavior:** After the digest is generated (Step 4 of the cron), add a Step 4.5:

```
Step 4.5: Extract newsletter links → research_items
  
  1. From the TLDR emails already fetched in Step 3.5:
     - Extract all URLs from text_body using regex
     - Filter: only http/https, skip unsubscribe/tracking links (contains
       'unsubscribe', 'click.', 'track.', 'list-manage', 'mailchimp', etc.)
     - Limit: 10 URLs max per cron run

  2. For each URL, POST to /api/research with:
     - url: the extracted URL
     - (This triggers the existing auto-fetch + GPT-5.4 analysis pipeline)
     
  3. Dedup: skip URLs that already exist in research_items
     - Query: SELECT id FROM research_items WHERE url = $1
     - If exists → skip

  4. Rate limit: process URLs sequentially with 1s delay between each
     to avoid hammering external sites
```

**Also expand newsletter detection beyond TLDR:**
```sql
-- Current (TLDR only):
.or("from_address.ilike.%tldr%,subject.ilike.%TLDR%")

-- Expanded (all high-signal newsletters):
.or("from_address.ilike.%tldr%,from_address.ilike.%substack%,from_address.ilike.%morning brew%,from_address.ilike.%daily.dev%,from_address.ilike.%the hustle%,from_address.ilike.%pragmatic%,category.eq.newsletter")
```

BUT: only extract URLs from newsletters with `urgency >= 1` to skip pure spam/noise newsletters.

**Cost estimate:**
- 10 URLs × ~$0.003 per GPT-5.4 analysis = ~$0.03/day
- Sonnet digest cost unchanged (~$0.05/day)
- Total daily email intelligence cost: ~$0.08/day (~$2.40/month)

---

### Step 6: Schema Changes
**New migration:** `supabase/migrations/20260321_022_email_intelligence.sql`

```sql
-- 1. Add source_email_id to opportunities (links opportunity back to email)
ALTER TABLE opportunities 
  ADD COLUMN IF NOT EXISTS source_email_id UUID REFERENCES emails(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS opportunities_source_email_idx 
  ON opportunities(source_email_id);

-- 2. Add ingested_to_research boolean on emails (prevents re-ingestion)
ALTER TABLE emails 
  ADD COLUMN IF NOT EXISTS ingested_to_research BOOLEAN DEFAULT false;

-- 3. Add ingested_to_opportunities boolean on emails
ALTER TABLE emails 
  ADD COLUMN IF NOT EXISTS ingested_to_opportunity BOOLEAN DEFAULT false;

-- 4. Add draft_reply text column on emails (cache generated drafts)
ALTER TABLE emails 
  ADD COLUMN IF NOT EXISTS draft_reply TEXT;

-- 5. Add draft_generated_at timestamp (know when draft was written)
ALTER TABLE emails 
  ADD COLUMN IF NOT EXISTS draft_generated_at TIMESTAMPTZ;
```

**No new tables.** Everything routes to existing tables (`research_items`, `opportunities`, `emails`). The new columns prevent duplicate processing and cache drafts.

---

### Step 7: Wire It All Together
**Modify the call chain so everything fires automatically:**

**A. Categorize route → auto-ingest chain:**
```
POST /api/email/categorize
  → (existing) Haiku categorizes emails
  → (NEW) fire-and-forget POST to /api/email/auto-ingest
  → auto-ingest creates research_items + opportunities
  → marks emails as ingested_to_research / ingested_to_opportunity
```

**B. Daily digest cron → newsletter parse + draft replies:**
```
GET /api/cron/email-digest
  → Step 1: Sync
  → Step 2: Categorize (which triggers auto-ingest via chain)
  → Step 3: Load emails
  → Step 3.5: TLDR + newsletter body extraction (EXPANDED)
  → Step 4: Generate digest via Sonnet (INCLUDES draft replies for action items, max 5)
  → Step 4.5: (NEW) Extract newsletter URLs → POST /api/research for each
  → Step 5: Save to context_files
```

**C. Inbox UI → enhanced Sync & Categorize button:**
```
handleSyncCategorize():
  → POST /api/email/sync
  → POST /api/email/categorize  (auto-ingest fires inside)
  → switch to AI view
  → fetchCategorized()
```
No change needed — auto-ingest is triggered inside categorize.

**D. Chat → reply draft command:**
```
buildLiveContext() when email intent detected:
  → (existing) query last 20 emails → inject summary
  → (NEW) if action_required items exist, add instruction:
    "Scott has [N] emails needing replies. If he asks for drafts, 
     generate suggested replies for each action_required email."
```

---

## File Change Summary

| File | Action | What Changes |
|---|---|---|
| `src/app/api/email/auto-ingest/route.ts` | **NEW** | Newsletter → research_items, sales/customer → opportunities |
| `src/app/api/email/draft-reply/route.ts` | **NEW** | Haiku draft reply for any email by ID |
| `src/app/api/email/action-items/route.ts` | **NEW** | Lightweight GET: top 5 unread action-required emails |
| `src/app/api/email/categorize/route.ts` | **MODIFY** | Add fire-and-forget call to auto-ingest at end |
| `src/app/api/cron/email-digest/route.ts` | **MODIFY** | Expand newsletter detection, add URL extraction → research, add draft replies in digest |
| `src/app/api/chat/route.ts` | **MODIFY** | Extend `buildLiveContext()` with action-required count + draft instruction |
| `src/components/email-inbox.tsx` | **MODIFY** | Add "Draft Reply" button on MessageViewer, draft display panel |
| `src/components/email-action-banner.tsx` | **NEW** | Amber banner component for home page |
| `src/app/page.tsx` | **MODIFY** | Import and render EmailActionBanner above chat |
| `supabase/migrations/20260321_022_email_intelligence.sql` | **NEW** | 5 column additions to existing tables |

---

## Build Order

```
1. Migration 022 (schema) .......... 5 min
   → Run in Supabase Dashboard immediately

2. Auto-ingest route ............... 15 min
   → POST /api/email/auto-ingest
   → Newsletter → research_items
   → Sales/customer → opportunities
   → Dedup flags on emails table

3. Wire auto-ingest into categorize  5 min
   → Add fire-and-forget at end of categorize route

4. Draft reply route ............... 10 min
   → POST /api/email/draft-reply
   → Haiku 4.5, cached to emails.draft_reply

5. Action items route + banner ..... 10 min
   → GET /api/email/action-items
   → EmailActionBanner component
   → Wire into page.tsx

6. Inbox UI draft button ........... 10 min
   → "Draft Reply" button on MessageViewer
   → Draft display panel above compose area

7. Digest cron enhancements ........ 15 min
   → Expand newsletter source detection
   → URL extraction → /api/research
   → Include draft replies in Action Required section

8. Chat context enhancement ........ 5 min
   → Extend buildLiveContext() action-required block

9. Test end-to-end ................. ~10 min
   → Manual sync → verify auto-ingest → verify banner → verify drafts
```

**Total estimated build: ~85 minutes of focused coding.**

---

## Cost Model

| Component | Model | Frequency | Cost |
|---|---|---|---|
| Categorize | Haiku 4.5 | Every sync (~100 emails/day) | ~$0.01/day |
| Draft replies | Haiku 4.5 | ~5 action items/day | ~$0.005/day |
| Newsletter URL analysis | GPT-5.4 | ~10 URLs/day | ~$0.03/day |
| Daily digest | Sonnet 4.6 | 1x/day | ~$0.05/day |
| **Total** | | | **~$0.095/day (~$2.85/month)** |

---

## What This Gives You When Done

1. **Open Chapterhouse →** amber banner says "3 emails need replies" with subjects
2. **Click "View Inbox" →** see categorized emails, click one with action_required
3. **Click "Draft Reply" →** Haiku writes a suggested reply, you edit and send
4. **Ask in chat:** "what should I reply to today?" → gets full action-required list with suggested replies
5. **Newsletter intel auto-ingests** to research library — shows up in daily briefs, product intelligence, chat context
6. **Sales inquiries auto-create** opportunity cards — tracked in product intelligence pipeline
7. **Customer emails tracked** as opportunities — nothing falls through the cracks
8. **Daily digest** now includes draft replies inline for action items
9. **Both accounts** (Gmail + NCHO) get full treatment — Gmail newsletters stop being lost

---

## What This Does NOT Do (Future)

- Email threading/conversation grouping (complex, not needed yet)
- Auto-reply without human approval (dangerous, not wanted)
- Customer PII in research_items (customer emails → opportunities only, not research)
- Real-time push notifications (banner polls every 5 min, good enough)
- Email forwarding rules / auto-labeling (Gmail does this natively)
