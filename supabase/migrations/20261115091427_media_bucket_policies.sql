create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    join public.roles r on r.id = u.role_id
    where u.id = auth.uid()
      and u.status = 'active'
      and r.key in ('super_admin', 'admin')
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create policy "media admin insert" on storage.objects
for insert to authenticated
with check (bucket_id = 'media' and public.is_admin());

create policy "media admin update" on storage.objects
for update to authenticated
using (bucket_id = 'media' and public.is_admin())
with check (bucket_id = 'media' and public.is_admin());

create policy "media admin delete" on storage.objects
for delete to authenticated
using (bucket_id = 'media' and public.is_admin());