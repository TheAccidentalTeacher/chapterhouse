-- Migration 044: knowledge_nodes table
-- Stores extracted insights from newsletter emails + manual notes.
-- Nodes with is_active=true are injected into chat and Council context.

CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Organisation
  folder TEXT NOT NULL DEFAULT 'general',
  subfolder TEXT,

  -- Content
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',

  -- Provenance
  source_type TEXT NOT NULL DEFAULT 'manual',
  -- e.g. 'manual', 'email_newsletter', 'chat', 'intel'
  source_ref TEXT,
  -- e.g. "TLDR | 2026-04-13 | gmail_personal:5821"

  -- Context promotion
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  inject_order INTEGER NOT NULL DEFAULT 100,

  -- Optional tagging
  tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[]
);

-- Auto-update updated_at on every write (reuses the trigger function from the jobs table)
CREATE TRIGGER knowledge_nodes_updated_at
  BEFORE UPDATE ON knowledge_nodes
  FOR EACH ROW EXECUTE FUNCTION update_jobs_updated_at();

-- For folder filtering in list queries
CREATE INDEX knowledge_nodes_folder_idx ON knowledge_nodes(folder);

-- For fast context injection queries (is_active=true only)
CREATE INDEX knowledge_nodes_active_idx ON knowledge_nodes(is_active);

-- Enable Realtime so the Knowledge page updates live when nodes are toggled
ALTER PUBLICATION supabase_realtime ADD TABLE knowledge_nodes;
