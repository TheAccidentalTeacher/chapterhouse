-- Brand voices: one row per brand, editable from Settings
-- Phase 1 of the Production Pipeline (March 2026)
-- Replaces the hardcoded BRAND_VOICE_SYSTEM constant in /api/social/generate

CREATE TABLE brand_voices (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ   DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   DEFAULT NOW(),

  -- Identity
  brand           TEXT          NOT NULL CHECK (brand IN ('ncho', 'somersschool', 'alana_terry', 'scott_personal')),
  display_name    TEXT          NOT NULL,

  -- Structured voice fields (for the Settings form)
  audience        TEXT          NOT NULL DEFAULT '',
  tone            TEXT          NOT NULL DEFAULT '',
  rules           TEXT          NOT NULL DEFAULT '',
  forbidden_words TEXT[]        NOT NULL DEFAULT '{}',
  platform_hints  JSONB         NOT NULL DEFAULT '{}',

  -- The assembled system prompt used by the generate route
  full_voice_prompt TEXT        NOT NULL DEFAULT '',

  -- State
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  version         INTEGER       NOT NULL DEFAULT 1,

  UNIQUE (brand)
);

-- set_updated_at() trigger function already exists from migration 001
CREATE TRIGGER set_brand_voices_updated_at
  BEFORE UPDATE ON brand_voices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE brand_voices;

ALTER TABLE brand_voices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users only" ON brand_voices
  FOR ALL USING (auth.role() = 'authenticated');
