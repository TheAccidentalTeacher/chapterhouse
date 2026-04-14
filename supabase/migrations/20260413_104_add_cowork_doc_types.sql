-- Phase 26: Add 6 Cowork Feature Bridge doc types + close academic_paper gap
-- This is ADDITIVE — all existing doc types remain valid
-- Also adds 'academic_paper' which was in DOC_TYPE_MAP but missing from DB CHECK

ALTER TABLE documents
  DROP CONSTRAINT IF EXISTS documents_doc_type_check;

ALTER TABLE documents
  ADD CONSTRAINT documents_doc_type_check CHECK (
    doc_type IN (
      -- Existing 14 types (PRESERVED — exact slugs from migration 030)
      'prd', 'arch-doc', 'blog-post', 'landing-copy',
      'spec', 'session-close', 'campaign-brief',
      'positioning', 'launch-checklist', 'market-sizing',
      'feedback-synthesis', 'study-guide',
      'report', 'brainstorm',
      -- academic_paper: in DOC_TYPE_MAP since ~Phase 15 but missing from DB CHECK
      'academic_paper',
      -- New Phase 26 types
      'campaign_plan',
      'email_sequence',
      'seo_audit',
      'competitive_brief',
      'status_report',
      'feature_spec'
    )
  );
