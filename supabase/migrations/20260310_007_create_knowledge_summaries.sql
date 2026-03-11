-- knowledge_summaries: one row per tag, updated by /api/summarize
-- Groups research_items by their primary tag and stores a Claude-generated
-- compressed summary. Injected into brief generation and chat context.

CREATE TABLE IF NOT EXISTS knowledge_summaries (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tag        TEXT        NOT NULL UNIQUE,
  summary    TEXT        NOT NULL,
  item_count INTEGER     NOT NULL DEFAULT 0,
  item_ids   UUID[]      NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row-level security: readable by authenticated users, writable by service role only
ALTER TABLE knowledge_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read knowledge_summaries"
  ON knowledge_summaries FOR SELECT
  TO authenticated
  USING (true);
