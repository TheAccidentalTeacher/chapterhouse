-- Phase 1 — Context Layer
-- Creates the context_files table: stores the large structured context document per user.
-- This replaces the hardcoded SYSTEM_PROMPT in chat/route.ts.
-- Scott starts by pasting his copilot-instructions.md into Settings → Context.
-- The system loads it as the base of every chat system prompt at runtime.

CREATE TABLE IF NOT EXISTS context_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Identity
  name TEXT NOT NULL DEFAULT 'Primary Context',
  description TEXT,

  -- Content
  content TEXT NOT NULL DEFAULT '',

  -- Metadata
  last_exported_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS context_files_user_id_idx ON context_files(user_id);
CREATE INDEX IF NOT EXISTS context_files_active_idx ON context_files(user_id, is_active);

-- RLS
ALTER TABLE context_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own their context files" ON context_files
  FOR ALL USING (auth.uid() = user_id);

-- Auto-update updated_at on every write (reuses the function from migration 008)
CREATE TRIGGER context_files_updated_at
  BEFORE UPDATE ON context_files
  FOR EACH ROW EXECUTE FUNCTION update_jobs_updated_at();
