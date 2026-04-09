-- Migration 040: Add 'youtube' as a valid platform for social accounts and posts
--
-- Scott confirmed April 8, 2026: TheAccidentalTeacher YouTube channel is connected
-- in Buffer and maps to scott_personal + youtube.
--
-- Migration 038 left social_accounts_platform_check at (facebook, instagram, linkedin, pinterest).
-- Migration 038 left social_posts_platform_check at (facebook, instagram, linkedin, email, pinterest).
-- This migration adds youtube to both.

-- social_accounts: add youtube
ALTER TABLE social_accounts DROP CONSTRAINT IF EXISTS social_accounts_platform_check;
ALTER TABLE social_accounts
  ADD CONSTRAINT social_accounts_platform_check
  CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'pinterest', 'youtube'));

-- social_posts: add youtube
ALTER TABLE social_posts DROP CONSTRAINT IF EXISTS social_posts_platform_check;
ALTER TABLE social_posts
  ADD CONSTRAINT social_posts_platform_check
  CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'email', 'pinterest', 'youtube'));
