-- Migration 018: Phase 3 — The Intel Workflow
-- Tables: intel_categories, intel_sessions
-- RLS: authenticated users own their rows
-- Realtime: enabled on intel_sessions

-- ── Trigger function ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_intel_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Intel categories table ────────────────────────────────────────────────────
-- User-configurable display categories for Intel report sections.
-- Seeded with defaults on creation (via API).

CREATE TABLE IF NOT EXISTS intel_categories (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),

  name        TEXT         NOT NULL,
  -- e.g., "🔴 Direct Impact", "🟡 Ecosystem Signal"

  color_class TEXT         NOT NULL DEFAULT 'text-red-600 bg-red-50',
  -- Tailwind classes for category color

  emoji       TEXT,
  -- e.g., "🔴", "🟡", "🟠", "🔵"

  description TEXT,
  sort_order  INT          NOT NULL DEFAULT 0,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS intel_categories_user_id_idx ON intel_categories(user_id);

ALTER TABLE intel_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users own their intel categories" ON intel_categories;
CREATE POLICY "users own their intel categories" ON intel_categories
  FOR ALL USING (auth.uid() = user_id);

-- ── Intel sessions table ──────────────────────────────────────────────────────
-- Each Intel run (1–20 URLs, or a PW paste) creates one session row.
-- Processing is tracked via status. Final output stored in processed_output JSONB.

CREATE TABLE IF NOT EXISTS intel_sessions (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID         REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at           TIMESTAMPTZ  DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  DEFAULT NOW(),

  -- Input
  urls                 TEXT[]       NOT NULL DEFAULT '{}',
  -- Array of URLs submitted for this Intel session

  raw_fetched_content  JSONB,
  -- Keyed by URL: { "https://...": "raw text content (truncated)" }

  -- Processing status: pending → fetching → processing → complete | failed
  status               TEXT         NOT NULL DEFAULT 'pending'
                                    CHECK (status IN ('pending', 'fetching', 'processing', 'complete', 'failed')),
  error                TEXT,

  -- Output
  processed_output     JSONB,
  -- IntelOutput JSON object (see schema below)

  seeds_extracted      INT          NOT NULL DEFAULT 0,
  -- How many seeds were auto-proposed and added to dreams table

  -- Metadata
  source_type          TEXT         NOT NULL DEFAULT 'manual'
                                    CHECK (source_type IN ('manual', 'cron', 'publishers_weekly')),

  session_label        TEXT
  -- Human-readable label, e.g., "PW 0316 — March 16 2026"
);

/*
processed_output JSONB follows this TypeScript interface:

interface IntelOutput {
  session_date: string;
  summary: string;
  sections: {
    category_name: string;   // "🔴 Direct Impact" | "🟡 Ecosystem Signal" | "🟠 Community Signal" | "🔵 Background"
    emoji: string;
    items: {
      headline: string;
      detail: string;
      source_url: string;
      source_title?: string;
      impact_score: "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C";
      affected_repos: string[];
      repo_reasoning: Record<string, string>;
      verified: boolean;
    }[];
  }[];
  proposed_seeds: {
    text: string;
    category: string;
    rationale: string;
    source_headline: string;
    dismissed?: boolean;    // set client-side when Scott dismisses
    added?: boolean;        // set when Scott adds to Dreamer
  }[];
  verification_warnings: {
    claim: string;
    source_url: string;
    warning: string;
  }[];
}
*/

CREATE INDEX IF NOT EXISTS intel_sessions_user_id_idx  ON intel_sessions(user_id);
CREATE INDEX IF NOT EXISTS intel_sessions_status_idx   ON intel_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS intel_sessions_created_idx  ON intel_sessions(user_id, created_at DESC);

DROP TRIGGER IF EXISTS intel_sessions_updated_at ON intel_sessions;
CREATE TRIGGER intel_sessions_updated_at
  BEFORE UPDATE ON intel_sessions
  FOR EACH ROW EXECUTE FUNCTION update_intel_sessions_updated_at();

ALTER TABLE intel_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users own their intel sessions" ON intel_sessions;
CREATE POLICY "users own their intel sessions" ON intel_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Realtime — Scott watches session status update live as processing runs
ALTER PUBLICATION supabase_realtime ADD TABLE intel_sessions;
