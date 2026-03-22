-- Email Intelligence Upgrade — Session 25
-- Adds columns for auto-ingest tracking, opportunity linking, and draft reply caching.
-- No new tables — everything routes to existing tables.

-- 1. Link opportunities back to their source email
ALTER TABLE opportunities 
  ADD COLUMN IF NOT EXISTS source_email_id UUID REFERENCES emails(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS opportunities_source_email_idx 
  ON opportunities(source_email_id);

-- 2. Prevent re-ingesting the same email to research_items
ALTER TABLE emails 
  ADD COLUMN IF NOT EXISTS ingested_to_research BOOLEAN DEFAULT false;

-- 3. Prevent re-creating the same opportunity from the same email
ALTER TABLE emails 
  ADD COLUMN IF NOT EXISTS ingested_to_opportunity BOOLEAN DEFAULT false;

-- 4. Cache AI-generated draft replies so they don't need to be regenerated
ALTER TABLE emails 
  ADD COLUMN IF NOT EXISTS draft_reply TEXT;

-- 5. Track when the draft was generated (for staleness checks)
ALTER TABLE emails 
  ADD COLUMN IF NOT EXISTS draft_generated_at TIMESTAMPTZ;
