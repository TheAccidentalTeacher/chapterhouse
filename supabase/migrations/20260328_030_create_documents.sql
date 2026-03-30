-- Migration 030: Create documents table for Documents Studio
--
-- Stores AI-generated documents from the Documents Studio tab.
-- 14 doc types: prd, arch-doc, blog-post, landing-copy, spec,
--   session-close, campaign-brief, positioning, launch-checklist,
--   market-sizing, feedback-synthesis, study-guide, report, brainstorm
--
-- Run in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS documents (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title         TEXT        NOT NULL,
  doc_type      TEXT        NOT NULL CHECK (doc_type IN (
                              'prd', 'arch-doc', 'blog-post', 'landing-copy',
                              'spec', 'session-close', 'campaign-brief',
                              'positioning', 'launch-checklist', 'market-sizing',
                              'feedback-synthesis', 'study-guide', 'report', 'brainstorm'
                            )),
  content       TEXT        NOT NULL DEFAULT '',
  input_params  JSONB,
  council_used  BOOLEAN     NOT NULL DEFAULT false,
  word_count    INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS documents_user_type_idx
  ON documents (user_id, doc_type, created_at DESC);

CREATE INDEX IF NOT EXISTS documents_user_created_idx
  ON documents (user_id, created_at DESC);

-- RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own documents"
  ON documents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Realtime (so UI can detect when a save completes)
ALTER PUBLICATION supabase_realtime ADD TABLE documents;
