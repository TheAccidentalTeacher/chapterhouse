# Supabase Migration Notes

This folder contains SQL migrations for Chapterhouse.

## Current migration

- `migrations/20260307_001_initial_chapterhouse.sql`
- `migrations/20260307_002_allow_public_read_published_briefs.sql`

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
- allows anon/authenticated read access to `published` briefs for app-shell verification before auth is fully wired

## Apply migration (Supabase dashboard)

1. Open your Supabase project SQL editor.
2. Paste and run `20260307_001_initial_chapterhouse.sql`.
3. Paste and run `20260307_002_allow_public_read_published_briefs.sql`.
4. Verify published brief rows exist with:

```sql
select id, brief_date, title, status, created_at
from public.briefs
where status = 'published'
order by created_at desc;
```

5. Open Chapterhouse `/daily-brief` and verify source badge reads `Supabase`.

## Next migration targets

- add user/workspace ownership constraints
- add stricter role policies
- add indexes after query patterns stabilize
