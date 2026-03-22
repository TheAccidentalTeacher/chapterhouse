-- Migration 021: Generated images history table
-- Stores every image generated via /api/images/generate so the Creative Studio
-- has a history panel and Cloudinary CDN saves can be tracked back to their
-- originating generation.
--
-- Insert path:  /api/images/generate  → inserts row on successful generation
-- Update path:  /api/images/save      → sets cloudinary_url when saved to CDN
--
-- This table was referenced by both routes since Session 7 but the migration
-- was never created — both routes wrapped the DB call in try/catch so the
-- failure was silent. This migration fixes that gap.

CREATE TABLE IF NOT EXISTS generated_images (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID         REFERENCES auth.users(id) ON DELETE CASCADE,
  -- nullable: generation routes use service-role key, user_id injected when available

  -- Generation parameters
  prompt         TEXT         NOT NULL,
  provider       TEXT         NOT NULL CHECK (provider IN ('openai', 'stability', 'replicate', 'leonardo')),
  model          TEXT,
  width          INTEGER,
  height         INTEGER,

  -- URLs
  image_url      TEXT         NOT NULL,
  -- Original URL returned by the provider (may be temporary/expiring)

  cloudinary_url TEXT,
  -- Permanent CDN URL — set by /api/images/save after upload to Cloudinary
  -- NULL until user explicitly saves

  -- Extra provider-specific data
  metadata       JSONB        DEFAULT '{}',
  -- e.g. { style, negativePrompt, seed, revised_prompt }

  created_at     TIMESTAMPTZ  DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS generated_images_user_idx
  ON generated_images (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS generated_images_provider_idx
  ON generated_images (provider, created_at DESC);

-- Index used by /api/images/save to UPDATE by image_url
CREATE INDEX IF NOT EXISTS generated_images_image_url_idx
  ON generated_images (image_url);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own their generated images" ON generated_images
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
-- user_id IS NULL clause: service-role inserts without explicit user context
-- still readable/owned by the session user once user_id is set on update.

-- ── Realtime (optional — for live history panel) ──────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE generated_images;
