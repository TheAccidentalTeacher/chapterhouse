-- Jobs table: tracks all background AI jobs
-- Phase 1 — The Job Runner
-- March 13, 2026

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Identity
  type TEXT NOT NULL CHECK (type IN ('curriculum_factory', 'research_batch', 'council_session')),
  label TEXT NOT NULL,

  -- Status lifecycle: queued → running → completed | failed | cancelled
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  progress_message TEXT,

  -- Payload and output
  input_payload JSONB NOT NULL,
  output JSONB,
  error TEXT,

  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  worker_id TEXT,

  -- Optional parent (for batch jobs — child jobs point to parent)
  parent_job_id UUID REFERENCES jobs(id) ON DELETE CASCADE
);

-- Indexes for common query patterns
CREATE INDEX jobs_status_idx ON jobs(status);
CREATE INDEX jobs_type_idx ON jobs(type);
CREATE INDEX jobs_parent_idx ON jobs(parent_job_id);
CREATE INDEX jobs_created_at_idx ON jobs(created_at DESC);

-- Enable Realtime so the /jobs UI gets live progress updates
ALTER PUBLICATION supabase_realtime ADD TABLE jobs;

-- RLS: Chapterhouse is private — authenticated users only (Scott + Anna)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users only" ON jobs
  FOR ALL USING (auth.role() = 'authenticated');

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION update_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_jobs_updated_at();
