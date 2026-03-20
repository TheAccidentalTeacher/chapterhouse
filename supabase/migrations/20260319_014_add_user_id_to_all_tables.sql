-- Phase 0 — Multi-Tenant Foundation
-- Adds user_id (nullable) to all existing tables so each row can be scoped to a user.
-- After running this migration, backfill existing rows manually:
--   UPDATE briefs SET user_id = '[SCOTT_USER_ID]' WHERE user_id IS NULL;
--   UPDATE founder_notes SET user_id = '[SCOTT_USER_ID]' WHERE user_id IS NULL;
--   UPDATE knowledge_summaries SET user_id = '[SCOTT_USER_ID]' WHERE user_id IS NULL;
--   UPDATE research_items SET user_id = '[SCOTT_USER_ID]' WHERE user_id IS NULL;
--   UPDATE opportunities SET user_id = '[SCOTT_USER_ID]' WHERE user_id IS NULL;
--   UPDATE tasks SET user_id = '[SCOTT_USER_ID]' WHERE user_id IS NULL;
--   UPDATE chat_threads SET user_id = '[SCOTT_USER_ID]' WHERE user_id IS NULL;
--   UPDATE jobs SET user_id = '[SCOTT_USER_ID]' WHERE user_id IS NULL;
-- Get Scott's user_id from: Supabase Dashboard → Authentication → Users

-- briefs
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
DROP INDEX IF EXISTS briefs_user_id_idx;
CREATE INDEX briefs_user_id_idx ON briefs(user_id);

-- founder_notes
ALTER TABLE founder_notes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
DROP INDEX IF EXISTS founder_notes_user_id_idx;
CREATE INDEX founder_notes_user_id_idx ON founder_notes(user_id);

-- knowledge_summaries
ALTER TABLE knowledge_summaries ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
DROP INDEX IF EXISTS knowledge_summaries_user_id_idx;
CREATE INDEX knowledge_summaries_user_id_idx ON knowledge_summaries(user_id);

-- research_items
ALTER TABLE research_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
DROP INDEX IF EXISTS research_items_user_id_idx;
CREATE INDEX research_items_user_id_idx ON research_items(user_id);

-- opportunities
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
DROP INDEX IF EXISTS opportunities_user_id_idx;
CREATE INDEX opportunities_user_id_idx ON opportunities(user_id);

-- tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
DROP INDEX IF EXISTS tasks_user_id_idx;
CREATE INDEX tasks_user_id_idx ON tasks(user_id);

-- chat_threads
ALTER TABLE chat_threads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
DROP INDEX IF EXISTS chat_threads_user_id_idx;
CREATE INDEX chat_threads_user_id_idx ON chat_threads(user_id);

-- jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
DROP INDEX IF EXISTS jobs_user_id_idx;
CREATE INDEX jobs_user_id_idx ON jobs(user_id);

-- Expand jobs type constraint to accept all Phase 1-6 job types.
-- Dropping the old constraint and replacing with a broader one is safe here
-- because existing rows already have valid type values.
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
  'context_condense'
));
