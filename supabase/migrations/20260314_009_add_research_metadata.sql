-- Add metadata columns to research_items for enriched URL ingestion
ALTER TABLE research_items ADD COLUMN IF NOT EXISTS site_name text;
ALTER TABLE research_items ADD COLUMN IF NOT EXISTS author text;
ALTER TABLE research_items ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE research_items ADD COLUMN IF NOT EXISTS og_image text;
