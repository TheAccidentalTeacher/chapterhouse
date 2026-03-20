-- =============================================================
-- Chapterhouse — Phase 0 Backfill
-- Run this ONCE in Supabase Dashboard → SQL Editor
-- after running migrations 014 and 015.
--
-- STEP 1: Replace the email address on the next line with yours.
-- STEP 2: Run the whole block.
-- That's it.
-- =============================================================

DO $$
DECLARE
  scott_id UUID;
BEGIN
  -- Look up Scott's user UUID by email (change this to your email)
  SELECT id INTO scott_id
  FROM auth.users
  WHERE email = 'scott@somers.com'
  LIMIT 1;

  IF scott_id IS NULL THEN
    RAISE EXCEPTION 'No user found with that email. Check Authentication → Users in Supabase dashboard.';
  END IF;

  RAISE NOTICE 'Found user id: %', scott_id;

  -- Tag every existing row in every table as belonging to Scott
  UPDATE briefs             SET user_id = scott_id WHERE user_id IS NULL;
  UPDATE founder_notes      SET user_id = scott_id WHERE user_id IS NULL;
  UPDATE knowledge_summaries SET user_id = scott_id WHERE user_id IS NULL;
  UPDATE research_items     SET user_id = scott_id WHERE user_id IS NULL;
  UPDATE opportunities      SET user_id = scott_id WHERE user_id IS NULL;
  UPDATE tasks              SET user_id = scott_id WHERE user_id IS NULL;
  UPDATE chat_threads       SET user_id = scott_id WHERE user_id IS NULL;
  UPDATE jobs               SET user_id = scott_id WHERE user_id IS NULL;

  RAISE NOTICE 'Backfill complete. All existing rows are now tagged with user_id = %', scott_id;
END $$;
