-- Migration 033: Remove deprecated brand/platform values from social tables
-- Phase 1 active brands: ncho, somersschool, scott_personal (alana_terry fully deferred to Phase 2)
-- Phase 1 active platforms: facebook, instagram, linkedin (threads/tiktok/youtube/pinterest deferred)

-- Remove any existing rows with deprecated values before tightening constraints.
-- Chapterhouse is single-user/private — safe to hard-delete these.
DELETE FROM social_posts WHERE brand = 'alana_terry';
DELETE FROM social_posts WHERE platform IN ('threads', 'tiktok', 'youtube', 'pinterest');
DELETE FROM social_accounts WHERE brand = 'alana_terry';
DELETE FROM social_accounts WHERE platform IN ('threads', 'tiktok', 'youtube', 'pinterest');
DELETE FROM brand_voices WHERE brand = 'alana_terry';

-- social_accounts: narrow brand CHECK
ALTER TABLE social_accounts DROP CONSTRAINT IF EXISTS social_accounts_brand_check;
ALTER TABLE social_accounts ADD CONSTRAINT social_accounts_brand_check
  CHECK (brand IN ('ncho', 'somersschool', 'scott_personal'));

-- social_accounts: narrow platform CHECK
ALTER TABLE social_accounts DROP CONSTRAINT IF EXISTS social_accounts_platform_check;
ALTER TABLE social_accounts ADD CONSTRAINT social_accounts_platform_check
  CHECK (platform IN ('facebook', 'instagram', 'linkedin'));

-- social_posts: narrow brand CHECK
ALTER TABLE social_posts DROP CONSTRAINT IF EXISTS social_posts_brand_check;
ALTER TABLE social_posts ADD CONSTRAINT social_posts_brand_check
  CHECK (brand IN ('ncho', 'somersschool', 'scott_personal'));

-- social_posts: narrow platform CHECK
ALTER TABLE social_posts DROP CONSTRAINT IF EXISTS social_posts_platform_check;
ALTER TABLE social_posts ADD CONSTRAINT social_posts_platform_check
  CHECK (platform IN ('facebook', 'instagram', 'linkedin'));
