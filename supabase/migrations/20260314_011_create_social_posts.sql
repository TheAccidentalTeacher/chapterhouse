-- Social posts: generated + queued posts, with review state and Buffer tracking
-- March 14, 2026

CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Which generation job created this batch
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,

  -- Post identity
  brand TEXT NOT NULL CHECK (brand IN ('ncho', 'somersschool', 'alana_terry', 'scott_personal')),
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'threads', 'tiktok', 'youtube', 'pinterest')),

  -- Content (what Claude generated)
  post_text TEXT NOT NULL,
  image_brief TEXT,                -- description for image generation
  hashtags TEXT[] DEFAULT '{}',
  generation_prompt TEXT,          -- full prompt sent to Claude (for autoresearch loop)

  -- Edit history — every manual edit pushes the previous version here
  edit_history JSONB[] DEFAULT '{}',

  -- Review state lifecycle: pending_review → approved | rejected → scheduled → published | failed
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'approved', 'rejected', 'scheduled', 'published', 'failed')),

  -- Scheduling
  scheduled_for TIMESTAMPTZ,      -- when to publish (set by Scott on approval)

  -- Buffer tracking
  buffer_profile_id TEXT,         -- which Buffer channel (from social_accounts)
  buffer_update_id TEXT,          -- ID returned by Buffer after scheduling
  published_at TIMESTAMPTZ,       -- filled when Buffer confirms publication

  -- Analytics (pulled back from Buffer)
  buffer_stats JSONB DEFAULT '{}'  -- { likes, comments, shares, clicks, reach }
);

CREATE INDEX social_posts_status_idx ON social_posts(status);
CREATE INDEX social_posts_brand_idx ON social_posts(brand);
CREATE INDEX social_posts_job_id_idx ON social_posts(job_id);
CREATE INDEX social_posts_scheduled_for_idx ON social_posts(scheduled_for);

-- Realtime so the review UI updates live when generation completes
ALTER PUBLICATION supabase_realtime ADD TABLE social_posts;

ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users only" ON social_posts
  FOR ALL USING (auth.role() = 'authenticated');

CREATE TRIGGER social_posts_updated_at
  BEFORE UPDATE ON social_posts
  FOR EACH ROW EXECUTE FUNCTION update_jobs_updated_at();
