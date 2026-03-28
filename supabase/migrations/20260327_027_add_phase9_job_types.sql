-- Add Phase 9 job types to the jobs.type CHECK constraint
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
  'course_slide_images',
  'generate_character_scenes',
  'train_character_lora',
  'generate_segment_audio',
  'generate_segment_video',
  'lesson_video_pipeline'
));
