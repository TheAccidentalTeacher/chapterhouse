-- Migration 029: Change emails.uid from INTEGER to BIGINT
--
-- Root cause of Gmail 0-insertions bug:
--   Gmail assigns IMAP UIDs as large integers that commonly exceed 2,147,483,647
--   (PostgreSQL INTEGER max = 2^31 - 1). When an overflow UID is passed to the
--   upsert, Postgres throws "integer out of range" and the entire batch for that
--   account fails silently — fetchedCount > 0 but inserted = 0.
--
--   NCHO Mailcow assigns UIDs sequentially starting from 1 — never exceeds
--   INTEGER range, so Mailcow always worked fine.
--
-- Fix: ALTER uid to BIGINT (8 bytes, max ~9.2 × 10^18).
--   - Safe: BIGINT is a superset of INTEGER, no data is lost or changed.
--   - The UNIQUE constraint on (user_id, email_account, uid) automatically
--     uses the new type — no constraint rebuild needed.
--   - All existing NCHO rows are unaffected.
--
-- Run in Supabase Dashboard → SQL Editor, then verify:
--   SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'emails' AND column_name = 'uid';
--   -- Expected: bigint

ALTER TABLE emails
  ALTER COLUMN uid TYPE BIGINT;
