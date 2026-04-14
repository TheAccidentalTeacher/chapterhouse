-- Phase 21A: Outline-first generation + version tracking for agentic editing (21B)
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS outline JSONB,
  ADD COLUMN IF NOT EXISTS version INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN documents.outline IS 'DocumentOutline: {sections: [{id, title, guidance, sort_order}], generated_at, model}';
COMMENT ON COLUMN documents.version IS 'Incremented on each agentic edit (Phase 21B)';
COMMENT ON COLUMN documents.edit_history IS 'Array of {version, instruction, changed_at, model, previous_content}';
