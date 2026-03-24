-- Migration 024: Character Library
-- Creates the characters table for reusable AI characters (Gimli, Scott avatar, etc.)
-- Also extends generated_images with character tracking columns

CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Identity
  slug TEXT NOT NULL UNIQUE,          -- e.g. 'gimli', 'scott-avatar'
  name TEXT NOT NULL,                 -- e.g. 'Gimli'
  description TEXT NOT NULL DEFAULT '',  -- Human-readable description

  -- Character reference for prompt enhancement
  physical_description TEXT NOT NULL DEFAULT '',  -- Injected into every prompt
  art_style TEXT NOT NULL DEFAULT '',             -- e.g. 'Pixar 3D animation style'
  negative_prompt TEXT NOT NULL DEFAULT '',       -- Things to avoid

  -- Reference images for img2img consistency
  reference_images TEXT[] NOT NULL DEFAULT '{}',  -- Cloudinary URLs
  hero_image_url TEXT,                            -- Best single reference image

  -- Provider preferences
  preferred_provider TEXT DEFAULT 'replicate',  -- 'replicate' | 'leonardo' | 'openai'

  -- LoRA training (future — trained on reference images for perfect consistency)
  lora_model_id TEXT,  -- Replicate model ID after training, e.g. 'scottsom/gimli-lora'

  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Index for fast lookup by slug
CREATE INDEX characters_slug_idx ON characters(slug);
CREATE INDEX characters_active_idx ON characters(is_active);

-- RLS: authenticated users only (Chapterhouse is private)
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users only" ON characters
  FOR ALL USING (auth.role() = 'authenticated');

-- ── Extend generated_images ────────────────────────────────────────────────────
-- Add character tracking and prompt provenance to existing image records

ALTER TABLE generated_images
  ADD COLUMN IF NOT EXISTS character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS prompt_original TEXT,    -- Raw prompt before enhancement
  ADD COLUMN IF NOT EXISTS prompt_enhanced TEXT,    -- After Claude Haiku enhancement
  ADD COLUMN IF NOT EXISTS enhancement_notes TEXT;  -- What the enhancer changed

CREATE INDEX IF NOT EXISTS generated_images_character_idx ON generated_images(character_id);

-- Enable Realtime (inherits from existing generated_images Realtime config)
-- Characters table is not high-frequency, no Realtime needed
