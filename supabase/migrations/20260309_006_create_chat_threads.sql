-- Chat threads — persistent, renameable, per-owner conversations
-- Each thread stores full message history as JSONB
CREATE TABLE IF NOT EXISTS chat_threads (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL DEFAULT 'New chat',
  owner       TEXT NOT NULL DEFAULT 'scott',  -- 'scott' | 'anna' | 'shared'
  messages    JSONB NOT NULL DEFAULT '[]'::jsonb,
  model       TEXT DEFAULT 'gpt-5.4',
  pinned      BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_threads_owner_idx ON chat_threads (owner);
CREATE INDEX IF NOT EXISTS chat_threads_updated_at_idx ON chat_threads (updated_at DESC);
CREATE INDEX IF NOT EXISTS chat_threads_pinned_idx ON chat_threads (pinned DESC, updated_at DESC);
