# Supabase Migration Notes

This folder contains SQL migrations for Chapterhouse.

## Current migration

- `migrations/20260307_001_initial_chapterhouse.sql`

It creates the MVP core tables:
- `documents`
- `sources`
- `briefs`
- `research_items`
- `tasks`
- `settings`

It also:
- enables RLS
- creates authenticated full-access policies (internal alpha posture)
- adds update timestamp triggers
- seeds one published Daily Brief record for read-path validation

## Apply migration (Supabase dashboard)

1. Open your Supabase project SQL editor.
2. Paste and run the migration SQL file.
3. Confirm tables and policies exist.
4. Open Chapterhouse `/daily-brief` and verify source badge reads `Supabase`.

## Next migration targets

- add user/workspace ownership constraints
- add stricter role policies
- add indexes after query patterns stabilize
