-- Migration 017: Phase 2 — The Dreamer System
-- Tables: dreams, dream_log
-- RLS: authenticated users own their rows
-- Realtime: enabled on dreams

-- ── Dream status enum ────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE dream_status AS ENUM (
    'seed',       -- Raw idea, not yet evaluated
    'active',     -- Scott has promoted this — it's intentionally in motion
    'building',   -- Actively being built right now
    'shipped',    -- Done and deployed
    'archived',   -- Not deleted — just not active. Recoverable.
    'dismissed'   -- Consciously set aside. Different from archived.
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ── Dreams table ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dreams (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID         REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at     TIMESTAMPTZ  DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  DEFAULT NOW(),

  -- Content
  text           TEXT         NOT NULL,
  notes          TEXT,                         -- Scott's annotations / context

  -- Classification
  status         dream_status NOT NULL DEFAULT 'seed',
  category       TEXT         NOT NULL DEFAULT 'general',
  -- Suggested values: product, curriculum, marketing, tech, personal, ncho, somersschool, biblesaas

  -- Priority (0-100, higher = more important)
  priority_score INT          NOT NULL DEFAULT 50
                              CHECK (priority_score BETWEEN 0 AND 100),

  -- Provenance — where did this seed come from?
  source_type    TEXT,        -- 'chat', 'brief', 'intel', 'manual', 'ai_review', 'push_api'
  source_label   TEXT,        -- Human-readable: "Added during chat on March 19, 2026"

  -- Sort position inside a status column (for drag reorder)
  sort_order     INT          NOT NULL DEFAULT 0,

  -- Timestamps for lifecycle tracking
  promoted_at    TIMESTAMPTZ,    -- When status moved from seed → active
  archived_at    TIMESTAMPTZ     -- When status moved to archived or dismissed
);

CREATE INDEX IF NOT EXISTS dreams_user_id_idx    ON dreams(user_id);
CREATE INDEX IF NOT EXISTS dreams_status_idx     ON dreams(user_id, status);
CREATE INDEX IF NOT EXISTS dreams_category_idx   ON dreams(user_id, category);
CREATE INDEX IF NOT EXISTS dreams_sort_idx       ON dreams(user_id, status, sort_order);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_dreams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dreams_updated_at ON dreams;
CREATE TRIGGER dreams_updated_at
  BEFORE UPDATE ON dreams
  FOR EACH ROW EXECUTE FUNCTION update_dreams_updated_at();

-- RLS
ALTER TABLE dreams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users own their dreams" ON dreams;
CREATE POLICY "users own their dreams" ON dreams
  FOR ALL USING (auth.uid() = user_id);

-- Realtime (Scott watches the Dreamer board update live)
ALTER PUBLICATION supabase_realtime ADD TABLE dreams;

-- ── Dream log table ───────────────────────────────────────────────────────────
-- One entry per day (optional journaling attached to the Dreamer)

CREATE TABLE IF NOT EXISTS dream_log (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID         REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ  DEFAULT NOW(),
  updated_at TIMESTAMPTZ  DEFAULT NOW(),

  entry_date DATE         NOT NULL,
  content    TEXT         NOT NULL,
  mood       TEXT         -- 'energized', 'focused', 'stuck', 'scattered', 'building'
);

CREATE UNIQUE INDEX IF NOT EXISTS dream_log_user_date_idx
  ON dream_log(user_id, entry_date);  -- One entry per user per day

CREATE INDEX IF NOT EXISTS dream_log_user_id_idx ON dream_log(user_id);

DROP TRIGGER IF EXISTS dream_log_updated_at ON dream_log;
CREATE TRIGGER dream_log_updated_at
  BEFORE UPDATE ON dream_log
  FOR EACH ROW EXECUTE FUNCTION update_dreams_updated_at();

ALTER TABLE dream_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users own their dream log" ON dream_log;
CREATE POLICY "users own their dream log" ON dream_log
  FOR ALL USING (auth.uid() = user_id);
