-- Focus Board + Scratchpad tables
-- Migration 039 — Focus Board for home page

-- Working list items (capped at 10 in application layer)
CREATE TABLE focus_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  source TEXT CHECK (source IN ('manual', 'folio', 'brief', 'dream')) DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX focus_items_user_idx ON focus_items(user_id);
ALTER TABLE focus_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users only" ON focus_items
  FOR ALL USING (auth.role() = 'authenticated');

-- Scratchpad (one row per user, upsert pattern)
CREATE TABLE scratch_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  content TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE scratch_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users only" ON scratch_notes
  FOR ALL USING (auth.role() = 'authenticated');
