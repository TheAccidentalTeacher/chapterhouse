-- Migration 038: Add 'pinterest' as a valid platform for social accounts and posts
--
-- D132 LOCKED (April 4, 2026): Pinterest is the third platform for both NCHO and SomersSchool.
-- Channel structure: NCHO (facebook, instagram, pinterest) + SomersSchool (facebook, instagram, pinterest) = 6 channels.
--
-- Migration 037 left social_accounts_platform_check at (facebook, instagram, linkedin).
-- Migration 035 left social_posts_platform_check at (facebook, instagram, linkedin, email).
-- This migration adds pinterest to both, and removes linkedin from social_accounts
-- (linkedin is no longer part of the 2-brand × 3-platform structure).
--
-- Note: social_posts keeps linkedin in its CHECK so existing linkedin posts aren't invalidated.
-- No existing data is deleted — linkedin rows in social_accounts can be manually cleaned up.

-- social_accounts: add pinterest, keep linkedin for backward compat
ALTER TABLE social_accounts DROP CONSTRAINT IF EXISTS social_accounts_platform_check;
ALTER TABLE social_accounts
  ADD CONSTRAINT social_accounts_platform_check
  CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'pinterest'));

-- social_posts: add pinterest (linkedin and email already present)
ALTER TABLE social_posts DROP CONSTRAINT IF EXISTS social_posts_platform_check;
ALTER TABLE social_posts
  ADD CONSTRAINT social_posts_platform_check
  CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'email', 'pinterest'));
