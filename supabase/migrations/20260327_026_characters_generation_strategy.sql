-- Migration 026: Add generation_strategy and LoRA training columns to characters table
-- Phase 9 — routes each character to the right generation model
-- generation_strategy = 'kontext' (default) uses FLUX.1 Kontext with hero_image_url as reference
-- generation_strategy = 'lora' fires the trained LoRA/Element UUID in lora_model_id
-- generation_strategy = 'ip_adapter' reserved for future IP-Adapter approach

ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS generation_strategy TEXT DEFAULT 'kontext'
    CHECK (generation_strategy IN ('kontext', 'lora', 'ip_adapter')),
  ADD COLUMN IF NOT EXISTS lora_training_status TEXT DEFAULT 'none'
    CHECK (lora_training_status IN ('none', 'queued', 'training', 'succeeded', 'failed')),
  ADD COLUMN IF NOT EXISTS lora_training_job_id TEXT,
  ADD COLUMN IF NOT EXISTS lora_training_error TEXT;

-- Backfill: ensure all existing rows have explicit value
UPDATE characters SET generation_strategy = 'kontext' WHERE generation_strategy IS NULL;
