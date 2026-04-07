-- Migration 035: Add 'email' as a valid platform for newsletter posts
--
-- Migration 033 set social_posts_platform_check to (facebook, instagram, linkedin).
-- Newsletter posts (content_type = 'newsletter') use platform = 'email'.
-- This extends the constraint to allow that value.
--
-- Note: social_accounts_platform_check is NOT changed here —
-- email is not a social channel and should never appear in social_accounts.

ALTER TABLE social_posts DROP CONSTRAINT IF EXISTS social_posts_platform_check;

ALTER TABLE social_posts
  ADD CONSTRAINT social_posts_platform_check
  CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'email'));
