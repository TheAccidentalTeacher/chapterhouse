-- Phase 28A: AI Columns / Row-Level Enrichment
-- Adds enrichment_data JSONB to dreams, intel_sessions, social_posts
-- Merge-safe: enrichment_data = enrichment_data || jsonb_build_object(...)

ALTER TABLE dreams ADD COLUMN IF NOT EXISTS enrichment_data JSONB DEFAULT '{}';
ALTER TABLE intel_sessions ADD COLUMN IF NOT EXISTS enrichment_data JSONB DEFAULT '{}';
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS enrichment_data JSONB DEFAULT '{}';
