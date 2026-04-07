-- Migration 034: Phase 1 schema delta
-- (a) user_id on social_posts — multi-tenancy foundation
-- (b) content_type on social_posts — differentiates social posts from newsletter drafts
-- (c) user_id on social_accounts — multi-tenancy foundation
-- (d) settings table — publishing_paused flag (OI-10 resolution)
-- (e) jobs CHECK constraint updated: adds youtube_batch_playlist + newsletter_draft

-- ── (a) user_id on social_posts ──────────────────────────────────────────────
ALTER TABLE social_posts ADD COLUMN user_id UUID REFERENCES auth.users(id);
UPDATE social_posts SET user_id = (SELECT id FROM auth.users LIMIT 1);
ALTER TABLE social_posts ALTER COLUMN user_id SET NOT NULL;
DROP POLICY IF EXISTS "authenticated users only" ON social_posts;
CREATE POLICY "owner only" ON social_posts FOR ALL USING (auth.uid() = user_id);

-- ── (b) content_type on social_posts ─────────────────────────────────────────
ALTER TABLE social_posts
  ADD COLUMN content_type TEXT NOT NULL DEFAULT 'social_post'
  CHECK (content_type IN ('social_post', 'newsletter'));

-- ── (c) user_id on social_accounts ───────────────────────────────────────────
ALTER TABLE social_accounts ADD COLUMN user_id UUID REFERENCES auth.users(id);
UPDATE social_accounts SET user_id = (SELECT id FROM auth.users LIMIT 1);
ALTER TABLE social_accounts ALTER COLUMN user_id SET NOT NULL;
DROP POLICY IF EXISTS "authenticated users only" ON social_accounts;
CREATE POLICY "owner only" ON social_accounts FOR ALL USING (auth.uid() = user_id);

-- ── (d) settings table ────────────────────────────────────────────────────────
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  publishing_paused BOOLEAN NOT NULL DEFAULT false,
  paused_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner only" ON settings FOR ALL USING (auth.uid() = user_id);

-- ── (e) jobs type CHECK — adds youtube_batch_playlist + newsletter_draft ──────
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
  'youtube_batch_playlist',
  'newsletter_draft'
));
