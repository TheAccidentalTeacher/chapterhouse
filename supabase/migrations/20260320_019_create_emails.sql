-- Migration 019: Persistent email storage with AI categorization
-- Emails sync'd from IMAP are stored here once, then never re-fetched.
-- Claude Haiku categorizes each email and produces a 1-sentence summary.
-- A daily digest is generated from these records and stored in context_files
-- so the chat system always has a current view of Scott's inbox.

-- ── Categories enum ────────────────────────────────────────────────────────────
-- Ordinal mapping for urgency display color:
--   spam         → zinc   (discard)
--   newsletter   → slate  (low signal)
--   notification → slate  (system pings)
--   vendor       → amber  (medium — supplier/service)
--   media        → amber  (press / podcast outreach)
--   sales_inquiry→ green  (revenue signal — NCHO/SomersSchool)
--   customer     → green  (user / buyer contact)
--   order        → green  (Shopify / Stripe order notifications)
--   internal     → blue   (yourself, Anna, ops)
--   other        → zinc   (uncategorized / edge cases)

-- ── Emails table ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emails (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID         REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- IMAP identity
  uid              INTEGER      NOT NULL,
  -- IMAP message UID — stable per mailbox

  -- Envelope
  subject          TEXT         NOT NULL DEFAULT '(no subject)',
  from_name        TEXT,
  from_address     TEXT         NOT NULL,
  to_address       TEXT,
  received_at      TIMESTAMPTZ  NOT NULL,
  has_attachment   BOOLEAN      NOT NULL DEFAULT false,
  is_read          BOOLEAN      NOT NULL DEFAULT false,

  -- Body
  snippet          TEXT,
  -- First ~500 chars of plain-text body — used for search and Haiku context

  text_body        TEXT,
  -- Full plain-text body (may be large)

  html_body        TEXT,
  -- Full HTML body (may be very large — stored but not used in AI prompts)

  -- AI fields (populated by /api/email/categorize)
  category         TEXT         CHECK (category IN (
                                  'spam', 'vendor', 'sales_inquiry', 'customer',
                                  'newsletter', 'notification', 'internal',
                                  'order', 'media', 'other'
                                )),
  ai_summary       TEXT,
  -- 1-sentence Haiku summary of what this email is about

  action_required  BOOLEAN      DEFAULT false,
  -- true if Haiku thinks Scott needs to respond or act

  urgency          SMALLINT     DEFAULT 0 CHECK (urgency BETWEEN 0 AND 5),
  -- 0=none, 1=low, 2=medium, 3=high, 4=very high, 5=critical

  ai_processed_at  TIMESTAMPTZ,
  -- when Haiku last processed this email

  -- Full-text search (auto-computed, never set manually)
  search_vector    TSVECTOR     GENERATED ALWAYS AS (
    to_tsvector(
      'english',
      coalesce(subject, '') || ' ' ||
      coalesce(from_name, '') || ' ' ||
      coalesce(from_address, '') || ' ' ||
      coalesce(snippet, '')
    )
  ) STORED,

  created_at       TIMESTAMPTZ  DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  DEFAULT NOW(),

  -- Each IMAP UID is unique per user
  UNIQUE (user_id, uid)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS emails_user_received_idx
  ON emails (user_id, received_at DESC);

CREATE INDEX IF NOT EXISTS emails_user_category_idx
  ON emails (user_id, category, received_at DESC);

CREATE INDEX IF NOT EXISTS emails_user_action_idx
  ON emails (user_id, action_required, urgency DESC)
  WHERE action_required = true;

CREATE INDEX IF NOT EXISTS emails_search_idx
  ON emails USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS emails_ai_pending_idx
  ON emails (user_id, ai_processed_at)
  WHERE ai_processed_at IS NULL;

-- ── Updated-at trigger ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER emails_updated_at
  BEFORE UPDATE ON emails
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ── RLS: users see only their own emails ───────────────────────────────────────
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own their emails" ON emails
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Realtime: enable for inbox sync notifications ─────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE emails;

-- ── document_type extension: add email_daily to context_files ─────────────────
-- The email digest cron saves a daily .md summary to context_files with
-- document_type='email_daily' and inject_order=5. This makes it auto-flow
-- into the getSystemPrompt() assembly that feeds every chat call.
-- No schema change needed — document_type is TEXT NOT NULL DEFAULT 'copilot_instructions'
-- and accepts any value. We just document the convention here.
--
-- email_daily record shape:
--   document_type  = 'email_daily'
--   inject_order   = 5
--   is_active      = true (only most recent day's digest is active)
--   content        = markdown .md digest of all emails for the day
--
-- The digest cron deactivates any prior email_daily records before
-- inserting the new one (same-type deactivation, same pattern as dreamer docs).

COMMENT ON TABLE emails IS 'Persisted IMAP emails with AI categorization. Synced daily by /api/cron/email-digest. Categorized by Claude Haiku. Digest at document_type=email_daily in context_files (inject_order=5).';
