-- The Folio: daily synthesized intelligence snapshot
-- One entry per day, built from ALL source tables, synthesized by Claude Sonnet.
-- Injected into every chat session as the "what happened since we last spoke" block.

CREATE TABLE folio_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date DATE UNIQUE NOT NULL,

  -- The main narrative — full synthesis, NOT aggressively compressed.
  -- Starts with priority (manually-added) items, then broader intelligence.
  -- ~800–1500 words. Rendered as Markdown in the UI.
  narrative TEXT NOT NULL DEFAULT '',

  -- Condensed version for chat injection (~300 words).
  -- This is what gets injected into buildLiveContext().
  summary TEXT NOT NULL DEFAULT '',

  -- Single most important thing Scott should do TODAY.
  -- Injected FIRST in system prompt, before everything else.
  top_action TEXT,

  -- Per-track signals extracted from the day's intelligence.
  -- {ncho: ["...", "..."], somersschool: ["...", "..."], biblesaas: ["..."]}
  track_signals JSONB NOT NULL DEFAULT '{}'::JSONB,

  -- Manually-added items get flagged here with priority.
  -- These are always surfaced first in the narrative and summary.
  -- Array of {content, source, type}
  priority_items JSONB NOT NULL DEFAULT '[]'::JSONB,

  -- How much raw data was ingested to build this entry.
  -- {founder_notes: 12, dreams: 5, research: 8, emails: 3, briefs: 1, intel: 2, ...}
  source_counts JSONB NOT NULL DEFAULT '{}'::JSONB,

  -- Build metadata
  build_duration_ms INT,
  model_used TEXT DEFAULT 'claude-sonnet-4-6',
  tokens_used INT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX folio_entries_date_idx ON folio_entries (entry_date DESC);

-- Enable Realtime (so the viewer page updates when a build completes)
ALTER PUBLICATION supabase_realtime ADD TABLE folio_entries;

-- RLS: authenticated users only
ALTER TABLE folio_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users only" ON folio_entries
  FOR ALL USING (auth.role() = 'authenticated');
