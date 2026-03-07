create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  role text not null,
  status text not null default 'core' check (status in ('core', 'active', 'archived')),
  content_markdown text,
  source_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text,
  source_type text not null default 'article',
  published_at timestamptz,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.briefs (
  id uuid primary key default gen_random_uuid(),
  brief_date date not null default current_date,
  title text not null default 'Daily Brief',
  summary text,
  sections jsonb not null default '[]'::jsonb,
  source_count integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.research_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.sources(id) on delete set null,
  title text not null,
  verdict text,
  confidence text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  details text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done', 'archived')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_at timestamptz,
  linked_brief_id uuid references public.briefs(id) on delete set null,
  linked_research_item_id uuid references public.research_items(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
before update on public.documents
for each row execute procedure public.set_updated_at();

drop trigger if exists sources_set_updated_at on public.sources;
create trigger sources_set_updated_at
before update on public.sources
for each row execute procedure public.set_updated_at();

drop trigger if exists briefs_set_updated_at on public.briefs;
create trigger briefs_set_updated_at
before update on public.briefs
for each row execute procedure public.set_updated_at();

drop trigger if exists research_items_set_updated_at on public.research_items;
create trigger research_items_set_updated_at
before update on public.research_items
for each row execute procedure public.set_updated_at();

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row execute procedure public.set_updated_at();

drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at
before update on public.settings
for each row execute procedure public.set_updated_at();

alter table public.documents enable row level security;
alter table public.sources enable row level security;
alter table public.briefs enable row level security;
alter table public.research_items enable row level security;
alter table public.tasks enable row level security;
alter table public.settings enable row level security;

drop policy if exists "authenticated documents full access" on public.documents;
create policy "authenticated documents full access"
on public.documents
for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated sources full access" on public.sources;
create policy "authenticated sources full access"
on public.sources
for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated briefs full access" on public.briefs;
create policy "authenticated briefs full access"
on public.briefs
for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated research full access" on public.research_items;
create policy "authenticated research full access"
on public.research_items
for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated tasks full access" on public.tasks;
create policy "authenticated tasks full access"
on public.tasks
for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated settings full access" on public.settings;
create policy "authenticated settings full access"
on public.settings
for all
to authenticated
using (true)
with check (true);

insert into public.briefs (brief_date, title, summary, sections, source_count, status)
values (
  current_date,
  'Daily Brief — Seeded Chapterhouse Record',
  'This seeded brief confirms the first persistence path from Supabase into the Daily Brief screen.',
  '[
    {
      "title": "Urgent Changes",
      "items": [
        {
          "headline": "Supabase persistence path is active for Daily Brief",
          "whyItMatters": "The app can now render published brief records from the database instead of mock-only content.",
          "score": "High",
          "sources": 1
        }
      ]
    },
    {
      "title": "Build Momentum",
      "items": [
        {
          "headline": "Next step is auth + write path for creating new briefs",
          "whyItMatters": "Read-path is complete; write-path is the next milestone for a full vertical slice.",
          "score": "Medium",
          "sources": 1
        }
      ]
    }
  ]'::jsonb,
  2,
  'published'
)
on conflict do nothing;
