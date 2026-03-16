-- Add youtube_transcript to the jobs.type CHECK constraint
-- March 15, 2026

ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_type_check;

ALTER TABLE jobs ADD CONSTRAINT jobs_type_check
  CHECK (type IN ('curriculum_factory', 'research_batch', 'council_session', 'social_batch', 'youtube_transcript'));
