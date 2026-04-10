-- Migration 043: Fix tasks table schema mismatch
-- 
-- Root cause: Migration 001 created `tasks` with old schema
--   (status CHECK: 'todo', 'in_progress', 'done', 'archived')
-- Migration 005 was a no-op (CREATE TABLE IF NOT EXISTS on existing table).
-- Result: live DB has wrong CHECK constraint + missing columns from 005.
--
-- This migration:
--   (a) Adds columns that 005 defined but never applied
--   (b) Migrates existing status values to the new vocabulary
--   (c) Drops the old constraint and adds the correct one
--   (d) Adds parent_id if not present (from 042)

-- ── (a) Add missing columns from migration 005 ───────────────────────────────
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source_type TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source_id TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source_title TEXT;

-- ── (b) Add parent_id from migration 042 (safe if already exists) ────────────
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE;

-- ── (c) Migrate legacy status values to current vocabulary ───────────────────
UPDATE tasks SET status = 'open'        WHERE status = 'todo';
UPDATE tasks SET status = 'in-progress' WHERE status = 'in_progress';
UPDATE tasks SET status = 'done'        WHERE status = 'done';   -- no-op, same value
UPDATE tasks SET status = 'canceled'    WHERE status = 'archived';

-- ── (d) Replace the old CHECK constraint ─────────────────────────────────────
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check1;

ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('open', 'in-progress', 'blocked', 'done', 'canceled'));

-- ── (e) Fix the status DEFAULT to match the new vocabulary ───────────────────
ALTER TABLE tasks ALTER COLUMN status SET DEFAULT 'open';
