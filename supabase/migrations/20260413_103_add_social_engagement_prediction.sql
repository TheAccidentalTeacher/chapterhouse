-- Phase 25A: Social performance prediction + engagement data
ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS engagement_data JSONB,
  ADD COLUMN IF NOT EXISTS predicted_score FLOAT;

COMMENT ON COLUMN social_posts.engagement_data IS '{reach, clicks, likes, comments, shares, fetched_at}';
COMMENT ON COLUMN social_posts.predicted_score IS 'AI-predicted engagement score 0-100';
