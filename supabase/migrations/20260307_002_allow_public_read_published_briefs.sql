drop policy if exists "public can read published briefs" on public.briefs;
create policy "public can read published briefs"
on public.briefs
for select
to anon, authenticated
using (status = 'published');
