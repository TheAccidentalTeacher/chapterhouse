-- Phase 20A: Document Export Pipeline
-- Adds export history tracking and HTML content storage to documents table
-- Migration 100 — intentional gap from legacy 001-044 range

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS export_history JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS content_html TEXT;

COMMENT ON COLUMN documents.export_history IS 'Array of {format, exported_at, exported_by} — tracks every export';
COMMENT ON COLUMN documents.content_html IS 'HTML version of content for DOCX conversion via html-to-docx';
