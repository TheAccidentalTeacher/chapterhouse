-- Phase 1.1 — Multi-document context layer
-- The context system moves from one active file per user to multiple named documents per user.
-- This lets Chapterhouse hold copilot_instructions + dreamer + extended_context as separate
-- editable documents that are all concatenated (in inject_order) into every chat system prompt.
--
-- New columns:
--   document_type  — named slot: copilot_instructions | dreamer | extended_context | intel | custom
--   inject_order   — controls the order documents are assembled into the system prompt (lower = first)
--
-- The API now deactivates only same-type docs before inserting a new version (not all active docs).
-- getSystemPrompt() fetches all active docs for the user, orders by inject_order, concatenates.

-- Add new columns (safe to run even if column already exists)
ALTER TABLE context_files
  ADD COLUMN IF NOT EXISTS document_type TEXT NOT NULL DEFAULT 'copilot_instructions',
  ADD COLUMN IF NOT EXISTS inject_order INT NOT NULL DEFAULT 1;

-- Stamp existing rows as copilot_instructions (order 1)
UPDATE context_files
  SET document_type = 'copilot_instructions', inject_order = 1
  WHERE document_type = 'copilot_instructions';  -- no-op but idempotent

-- Index for efficient typed lookups per user
CREATE INDEX IF NOT EXISTS context_files_type_idx ON context_files (user_id, document_type, is_active);
