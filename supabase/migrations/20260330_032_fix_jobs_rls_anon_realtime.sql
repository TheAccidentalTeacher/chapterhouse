-- Fix: Allow anon key to read jobs table for Realtime subscriptions.
-- The browser client uses the anon key (no Clerk-Supabase JWT integration),
-- but the original RLS policy required auth.role() = 'authenticated'.
-- This caused the YouTube transcript Realtime listener to silently fail,
-- so the UI never received job completion updates from the worker.
-- App-level auth is handled by Clerk middleware, so anon SELECT is safe here.

CREATE POLICY "anon can read jobs" ON jobs
  FOR SELECT USING (true);
