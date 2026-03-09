-- Tasks: execution layer for approved work
-- Tasks are created from opportunities, research items, briefs, or manually.
-- They represent concrete things someone needs to do with a clear status machine.

CREATE TABLE IF NOT EXISTS tasks (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT,
  source_type  TEXT,   -- 'opportunity' | 'research' | 'brief' | 'manual'
  source_id    TEXT,   -- UUID of the source row (nullable for manual tasks)
  source_title TEXT,   -- snapshot of source title so tasks are self-contained
  status       TEXT DEFAULT 'open',  -- open | in-progress | blocked | done | canceled
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks (status);
CREATE INDEX IF NOT EXISTS tasks_created_at_idx ON tasks (created_at DESC);

-- Also create founder_notes if it doesn't exist yet (may have been created via UI)
CREATE TABLE IF NOT EXISTS founder_notes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content    TEXT NOT NULL,
  category   TEXT DEFAULT 'general',
  source     TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT now()
);
