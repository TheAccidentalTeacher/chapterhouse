-- Phase 23B: Watch URL tracking for content change detection
CREATE TABLE IF NOT EXISTS watch_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  url TEXT NOT NULL,
  label TEXT NOT NULL,
  check_interval TEXT NOT NULL DEFAULT 'daily'
    CHECK (check_interval IN ('daily', 'weekly', 'monthly')),
  last_checked_at TIMESTAMPTZ,
  last_content_hash TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE watch_urls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own watch URLs"
  ON watch_urls FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX watch_urls_active_idx ON watch_urls (is_active) WHERE is_active = true;
