-- Migration 042: Add parent_id to tasks for sub-steps / nested changelog
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS tasks_parent_id_idx ON tasks(parent_id);

COMMENT ON COLUMN tasks.parent_id IS 'NULL = top-level task. SET = sub-step of the referenced parent task.';
