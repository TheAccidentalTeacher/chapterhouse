# Email System Upgrade — Guiding Document
*Audit completed March 28, 2026. 17 files read, 12 issues catalogued.*

---

## System Overview

Three IMAP accounts managed via `src/lib/email-client.ts`:
- **NCHO Mailcow** — `scott@nextchapterhomeschool.com`, port 993 TLS
- **Gmail personal** — `scosom@gmail.com`, port 993
- **Gmail NCHO workspace** — port 993

AI models: Claude Sonnet 4.6 (digest), Claude Haiku 4.5 (categorization + draft replies)

Cron: `0 0 * * *` midnight UTC → sync → categorize → digest → saved to `context_files` (inject_order=5) → auto-flows into every chat

---

## Issue Registry

---

### 🔴 RED — Fix First

---

#### Step 1 — Gmail sync 0-insertions mystery
**File:** `src/app/api/email/sync/route.ts`
**Symptom:** `fetchedCount > 0` for Gmail accounts but `inserted = 0`. Emails never land in Supabase.
**Likely causes:**
- Parse errors silently swallowed on Gmail message format
- All rows deduped as already-existing (UNIQUE constraint on `user_id, email_account, uid`) but upsert still reports 0
- Gmail IMAP seq-number vs UID mismatch — Gmail uses UIDs in the SEQ range differently than Mailcow
- `text_body`/`html_body` field extraction failing on Gmail MIME structure
**Fix plan:** Add verbose diagnostic logging to the fetch → parse → upsert chain. Run `/api/email/test` for Gmail accounts. Trace the exact dedup path. Check if `listMessages()` returns SEQ or UIDs for Gmail and whether the upsert conflict key matches what's actually stored.
**Status:** ⬜ Not started

---

#### Step 2 — SMTP TLS hardcoded `rejectUnauthorized: false`
**File:** `src/lib/smtp.ts` (line ~17)
**Symptom:** `tls.rejectUnauthorized` is hardcoded `false` — unconditionally accepts invalid certs in production.
**Fix:** Change to `rejectUnauthorized: !(process.env.NCHO_TLS_SKIP_VERIFY === 'true')` — same pattern already used in `email-client.ts`. The env var exists; SMTP just never checked it.
**Status:** ⬜ Not started

---

### 🟡 AMBER — Fix Next

---

#### Step 3 — Auto-ingest 1-hour window too narrow
**File:** `src/app/api/email/auto-ingest/route.ts`
**Symptom:** Auto-ingest runs after categorize (which runs after sync). The 1-hour cutoff means emails synced in the morning miss the afternoon categorize run — they're already older than 1 hour by the time they get processed.
**Fix:** Extend cutoff from 1 hour to 24 hours. Or replace fixed window with "emails where `ingested_to_research = false` AND `ai_processed_at IS NOT NULL`" — flag-based instead of time-based ensures no emails are ever skipped regardless of timing.
**Status:** ⬜ Not started

---

#### Step 4 — Auto-ingest race condition (SELECT before INSERT not atomic)
**File:** `src/app/api/email/auto-ingest/route.ts`
**Symptom:** Both passes check `ingested_to_research` / `ingested_to_opportunity` flags, then upsert. Between SELECT and UPDATE, a concurrent call could process the same email twice — duplicate research items or opportunities.
**Fix:** Use `UPDATE emails SET ingested_to_research = true WHERE id = $1 AND ingested_to_research = false RETURNING id` as the claim step. Only proceed with insertion if the UPDATE returns a row. Eliminates the race.
**Status:** ⬜ Not started

---

#### Step 5 — Auto-ingest urgency filter inconsistency
**File:** `src/app/api/email/auto-ingest/route.ts`
**Symptom:** Pass 1 (newsletters → research) filters `urgency >= 1`. Pass 2 (sales/customer → opportunities) has no urgency filter — ingests everything regardless of urgency score.
**Fix:** Either add `urgency >= 1` to Pass 2 (consistent with Pass 1) or remove the filter from Pass 1 (ingest all categorized emails regardless of urgency). Decide which is the intended behavior and standardize.
**Decision needed:** ⚠️ SCOTT DECIDES — should low-urgency sales inquiries auto-ingest as opportunities?
**Status:** ⬜ Not started

---

#### Step 6 — Send route session-only auth (no cron/API support)
**File:** `src/app/api/email/send/route.ts`
**Symptom:** `/api/email/send` only accepts session-based auth. Can't be called from cron, Railway worker, or any server-to-server context (e.g., auto-sending a drafted reply).
**Fix:** Import and use `requireAuth()` from `src/lib/email-auth.ts` — already supports both session and CRON_SECRET Bearer token. One-line swap.
**Status:** ⬜ Not started

---

#### Step 7 — Email brief source is NCHO-only (Gmail excluded from daily brief)
**File:** `src/lib/sources/email.ts`
**Symptom:** The email source for daily brief generation only fetches from the `ncho` account. Gmail personal and Gmail NCHO workspace emails never appear in the brief — even if they contain higher-signal items.
**Fix:** Update `sources/email.ts` to iterate `getConfiguredAccounts()` (already exported from `email-client.ts`) and fetch from all configured accounts, then merge and sort by received_at before returning.
**Status:** ⬜ Not started

---

#### Step 8 — No sent email logging
**File:** `src/app/api/email/send/route.ts`
**Symptom:** When a reply is sent via SMTP, nothing is recorded in Supabase. There's no audit trail of what was sent, to whom, when, or which email it was in reply to.
**Fix:** After successful SMTP send, upsert a row to the `emails` table with a synthetic `email_account = 'sent'` (or add a `direction` column: `inbound` / `outbound`). Minimum fields: `from_address`, `to_address`, `subject`, `snippet`, `sent_at`, `in_reply_to_uid`.
**Status:** ⬜ Not started

---

#### Step 9 — Spam never cleaned up
**File:** `src/components/email-inbox.tsx` + `src/app/api/email/sync/route.ts`
**Symptom:** Emails categorized as `spam` stay in the database indefinitely. No delete button, no auto-purge, no archival. The table grows without bound.
**Fix options:**
  - A: Auto-delete rows with `category = 'spam'` on the next sync run (add to end of sync handler)
  - B: Add a "Delete" button to the spam tab in the UI that deletes the row from Supabase
  - C: Both — UI button for manual, auto-purge for older spam (e.g., spam older than 7 days auto-deleted on sync)
**Decision needed:** ⚠️ SCOTT DECIDES — keep spam for review or auto-delete?
**Status:** ⬜ Not started

---

### 🟢 YELLOW — Nice to Have

---

#### Step 10 — Draft reply cache has no force-regenerate option
**File:** `src/app/api/email/draft-reply/route.ts`
**Symptom:** Draft replies are cached for 24 hours. If the AI generates a bad draft, there's no way to regenerate without waiting for the cache to expire or manually clearing the DB field.
**Fix:** Accept a `?force=true` query param. If present, skip the cache check and always generate a fresh draft, overwriting the stored one.
**Status:** ⬜ Not started

---

#### Step 11 — `/api/email/messages` hardcoded to NCHO
**File:** `src/app/api/email/messages/route.ts`
**Symptom:** The live IMAP inbox endpoint always connects to the `ncho` account. No way to view live Gmail inbox through this route.
**Fix:** Accept an `?account=` query param (values: `ncho`, `gmail_personal`, `gmail_ncho`). Default to `ncho` for backward compatibility. Pass the account to `getImapClient(account)`.
**Status:** ⬜ Not started

---

#### Step 12 — `hasAttachment` always false for persisted emails
**File:** `src/app/api/email/persisted/[uid]/route.ts`
**Symptom:** When restoring an email from Supabase, `has_attachment` is populated at sync time. But the persisted route doesn't surface actual attachment metadata — the field is set but the attachment content/filenames are never stored or returned.
**Fix (minimal):** At minimum, set `has_attachment = true` correctly during sync when a MIME part with `Content-Disposition: attachment` is detected. Current sync may be missing this check.
**Status:** ⬜ Not started

---

## Build Order

```
Step 1  → Gmail sync diagnosis (unblocks all Gmail-dependent features)
Step 2  → SMTP TLS security fix (2-line change, do immediately)
Step 3  → Auto-ingest window (flag-based instead of time-based)
Step 4  → Auto-ingest race condition (atomic claim pattern)
Step 5  → Auto-ingest urgency consistency (SCOTT DECIDES first)
Step 6  → Send route auth (one-line fix)
Step 7  → Gmail in daily brief (needs Step 1 resolved first)
Step 8  → Sent email logging (can do anytime)
Step 9  → Spam cleanup (SCOTT DECIDES first)
Step 10 → Draft cache force-regenerate
Step 11 → /messages account param
Step 12 → hasAttachment at sync time
```

---

## Key Files Reference

| File | Lines | Purpose |
|---|---|---|
| `src/lib/email-client.ts` | 351 | IMAP abstraction, 3 accounts |
| `src/lib/email-auth.ts` | 50 | Dual-path auth (session + CRON_SECRET) |
| `src/lib/smtp.ts` | 50 | SMTP send via Mailcow port 465 |
| `src/lib/sources/email.ts` | 140 | Email→daily brief data source (NCHO only) |
| `src/app/api/email/sync/route.ts` | 230 | IMAP → Supabase, 7-day window |
| `src/app/api/email/categorize/route.ts` | 260 | Haiku batch categorization (10/call) |
| `src/app/api/email/auto-ingest/route.ts` | 140 | Email → research items / opportunities |
| `src/app/api/email/send/route.ts` | 40 | SMTP send with reply headers |
| `src/app/api/email/draft-reply/route.ts` | 150 | Haiku draft gen, 24h cache |
| `src/app/api/email/messages/route.ts` | 15 | Live IMAP inbox (NCHO hardcoded) |
| `src/app/api/email/persisted/[uid]/route.ts` | 65 | Fetch full email from Supabase |
| `src/app/api/cron/email-digest/route.ts` | 379 | Full pipeline cron |
| `src/components/email-inbox.tsx` | 950+ | Dual-mode inbox UI |
| `src/components/email-action-banner.tsx` | 90 | Home page action banner |

---

## Decisions Needed Before Building

| Step | Question |
|---|---|
| Step 5 | Should low-urgency (urgency = 0) sales inquiry emails auto-ingest as opportunities? |
| Step 9 | Keep spam for manual review, or auto-delete after N days? |

---

*Last updated: March 28, 2026*
