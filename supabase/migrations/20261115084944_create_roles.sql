create table public.roles (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique check (key ~ '^[a-z][a-z0-9_]*$'),
  name        text not null,
  description text,
  permissions jsonb not null default '[]'::jsonb,
  is_system   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.roles enable row level security;  -- no policies = server/service role only

insert into public.roles (key, name, description, is_system, permissions) values
  ('super_admin', 'Super Admin', 'Full access to everything', true, '["*"]'),
  ('admin',       'Admin',       'Manage site content and users', true, '[]'),
  ('member',      'Member',      'Standard member', true, '[]')
on conflict (key) do nothing;

-- Carry over any role strings already in users
insert into public.roles (key, name)
select distinct
  lower(regexp_replace(role, '[^a-zA-Z0-9]+', '_', 'g')),
  initcap(role)
from public.users
where role ~ '[a-zA-Z]'
on conflict (key) do nothing;

alter table public.users
  add column role_id uuid references public.roles(id) on delete restrict;

update public.users u
set role_id = r.id
from public.roles r
where r.key = lower(regexp_replace(u.role, '[^a-zA-Z0-9]+', '_', 'g'));

update public.users
set role_id = (select id from public.roles where key = 'member')
where role_id is null;

alter table public.users alter column role_id set not null;
create index users_role_id_idx on public.users(role_id);

-- Protect built-in roles from deletion
create function public.prevent_system_role_delete() returns trigger
language plpgsql as $$
begin
  if old.is_system then
    raise exception 'System role "%" cannot be deleted', old.key;
  end if;
  return old;
end $$;

create trigger roles_protect_system
before delete on public.roles
for each row execute function public.prevent_system_role_delete();