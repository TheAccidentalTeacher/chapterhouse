-- Migration 020: Multi-account email support
-- Extends the emails table to store messages from multiple mailboxes.
--
-- Problem: IMAP UIDs are local to each mailbox. The same UID integer can appear
-- in both the NCHO Mailcow mailbox and a Gmail mailbox for completely different
-- messages. Without an account discriminator the UNIQUE(user_id, uid) constraint
-- would incorrectly treat them as duplicates.
--
-- Solution: Add an email_account column and re-key the UNIQUE constraint to
-- (user_id, email_account, uid) so UIDs are only unique within a mailbox.
--
-- Supported accounts:
--   ncho           — scott@nextchapterhomeschool.com (Mailcow, self-hosted)
--   gmail_personal — scosom@gmail.com (personal, App Password)
--   gmail_ncho     — additional Gmail account (App Password)
--
-- All existing rows keep email_account = 'ncho' (the DEFAULT) automatically.
-- No data migration needed.

-- ── Step 1: Add column (safe — DEFAULT means no row is left NULL) ──────────────
ALTER TABLE emails
  ADD COLUMN IF NOT EXISTS email_account TEXT NOT NULL DEFAULT 'ncho'
  CHECK (email_account IN ('ncho', 'gmail_personal', 'gmail_ncho'));

-- ── Step 2: Drop the single-mailbox UNIQUE constraint ─────────────────────────
ALTER TABLE emails
  DROP CONSTRAINT IF EXISTS emails_user_id_uid_key;

-- ── Step 3: New UNIQUE constraint — uid is unique per (user + mailbox) ────────
ALTER TABLE emails
  ADD CONSTRAINT emails_user_account_uid_key
  UNIQUE (user_id, email_account, uid);

-- ── Step 4: Index for per-account inbox queries ────────────────────────────────
CREATE INDEX IF NOT EXISTS emails_account_idx
  ON emails (user_id, email_account, received_at DESC);

-- ── Step 5: Update the pending-categorization index (now needs account) ───────
DROP INDEX IF EXISTS emails_ai_pending_idx;
CREATE INDEX IF NOT EXISTS emails_ai_pending_idx
  ON emails (user_id, email_account, ai_processed_at)
  WHERE ai_processed_at IS NULL;
