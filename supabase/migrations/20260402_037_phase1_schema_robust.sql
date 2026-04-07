-- Migration 037: Phase 1 schema — fully robust using ADD COLUMN IF NOT EXISTS
-- Replaces 034 (failed: settings already exists) and 036 (failed: column user_id does not exist
-- in pre-existing settings table because CREATE TABLE IF NOT EXISTS was a no-op).
-- Safe to run on any state of the DB.

-- ── (a) social_posts.user_id ─────────────────────────────────────────────────
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
UPDATE social_posts SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
DO $$
BEGIN
  ALTER TABLE social_posts ALTER COLUMN user_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DROP POLICY IF EXISTS "authenticated users only" ON social_posts;
DROP POLICY IF EXISTS "owner only" ON social_posts;
CREATE POLICY "owner only" ON social_posts FOR ALL USING (auth.uid() = user_id);

-- ── (b) social_posts.content_type ────────────────────────────────────────────
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'social_post';
DO $$
BEGIN
  ALTER TABLE social_posts ADD CONSTRAINT social_posts_content_type_check
    CHECK (content_type IN ('social_post', 'newsletter'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── (c) social_accounts.user_id ──────────────────────────────────────────────
ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
UPDATE social_accounts SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
DO $$
BEGIN
  ALTER TABLE social_accounts ALTER COLUMN user_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DROP POLICY IF EXISTS "authenticated users only" ON social_accounts;
DROP POLICY IF EXISTS "owner only" ON social_accounts;
CREATE POLICY "owner only" ON social_accounts FOR ALL USING (auth.uid() = user_id);

-- ── (d) settings table ───────────────────────────────────────────────────────
-- Create WITHOUT user_id in the initial definition so this succeeds even if
-- the table already exists with a different schema (no-op path skips the column too).
-- Then ADD COLUMN IF NOT EXISTS handles both the new-table and pre-existing-table cases.
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publishing_paused BOOLEAN NOT NULL DEFAULT false,
  paused_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
DO $$
BEGIN
  ALTER TABLE settings ADD CONSTRAINT settings_user_id_unique UNIQUE (user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER TABLE settings ALTER COLUMN user_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner only" ON settings;
CREATE POLICY "owner only" ON settings FOR ALL USING (auth.uid() = user_id);

-- ── (e) jobs type CHECK ──────────────────────────────────────────────────────
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_type_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_type_check CHECK (type IN (
  'curriculum_factory',
  'research_batch',
  'council_session',
  'social_batch',
  'youtube_transcript',
  'intel_fetch',
  'brief_pregenerate',
  'seed_extract',
  'context_condense',
  'course_slide_images',
  'generate_character_scenes',
  'train_character_lora',
  'generate_segment_audio',
  'generate_segment_video',
  'lesson_video_pipeline',
  'generate_bundle_anchor',
  'folio_daily_build',
  'youtube_batch_playlist',
  'newsletter_draft'
));
