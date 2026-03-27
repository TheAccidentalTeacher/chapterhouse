-- Add course_slide_images to the jobs.type CHECK constraint
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
  'course_slide_images'
));
