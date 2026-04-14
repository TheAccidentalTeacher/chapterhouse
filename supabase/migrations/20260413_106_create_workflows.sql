-- Phase 28B: Composable AI Workflows
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]',
  trigger_type TEXT CHECK (trigger_type IN ('manual', 'cron', 'webhook')) DEFAULT 'manual',
  trigger_config JSONB DEFAULT '{}',
  run_count INT DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT CHECK (last_run_status IN ('success', 'failed', 'partial')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workflows_owner" ON workflows FOR ALL USING (auth.uid() = user_id);

CREATE INDEX workflows_user_idx ON workflows(user_id);
CREATE INDEX workflows_active_idx ON workflows(is_active) WHERE is_active = true;
