-- =====================================================================
-- Admin + CMS for the FDMG landing page.
--
-- Auth is native (the app hashes passwords and issues its own tokens), so
-- Supabase is only the data store. Every table has RLS enabled with no
-- policies: the anon/public key can read nothing. All access goes through
-- the server with the service-role key, after the app's own checks.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Users ----------
create table public.users (
  id                    uuid primary key default gen_random_uuid(),
  email                 text not null,
  -- Names are filled in by the invitee when they accept the invitation.
  first_name            text not null default '',
  last_name             text not null default '',
  other_name            text,
  -- Their position in the church (Pastor, Secretary, …) — free text.
  church_role           text,
  -- super_admin: everything, incl. users and email settings.
  -- church_admin: website content and messages.
  role                  text not null default 'church_admin' check (role in ('super_admin', 'church_admin')),
  -- invited: has not accepted yet. blocked: may not sign in.
  status                text not null default 'invited' check (status in ('active', 'invited', 'blocked')),
  password_hash         text,
  failed_login_attempts integer not null default 0,
  locked_until          timestamptz,
  last_login_at         timestamptz,
  password_changed_at   timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz
);

-- One live account per email; soft-deleted rows don't block re-inviting.
create unique index users_email_live_key on public.users (lower(email)) where deleted_at is null;

-- ---------- Sessions (refresh tokens are stored hashed) ----------
create table public.auth_sessions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users (id) on delete cascade,
  token_hash          text not null unique,
  previous_token_hash text,
  persistent          boolean not null default false,
  expires_at          timestamptz not null,
  rotated_at          timestamptz,
  revoked_at          timestamptz,
  last_used_at        timestamptz,
  user_agent          text,
  ip                  text,
  created_at          timestamptz not null default now()
);
create index auth_sessions_user_idx on public.auth_sessions (user_id);
create index auth_sessions_prev_hash_idx on public.auth_sessions (previous_token_hash);

-- ---------- Password reset / invitation links (single use) ----------
create table public.password_reset_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users (id) on delete cascade,
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- ---------- Invitation codes (6 digits, emailed; stored hashed) ----------
create table public.invite_codes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users (id) on delete cascade,
  code_hash   text not null,
  expires_at  timestamptz not null,
  attempts    integer not null default 0,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index invite_codes_user_idx on public.invite_codes (user_id, created_at desc);

-- ---------- App settings (e.g. SMTP; secrets are encrypted by the app) ----------
create table public.app_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.users (id) on delete set null
);

-- ---------- Landing page content ----------
-- One row per page section (hero, about, services, ...). `data` is validated
-- by the app's zod schemas (features/content/schemas.ts) before it is saved.
create table public.site_sections (
  key         text primary key,
  data        jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.users (id) on delete set null
);

-- ---------- Contact form submissions ----------
create table public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text,
  message     text not null,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index contact_messages_created_idx on public.contact_messages (created_at desc);

-- ---------- Rate limits (per hashed IP, fixed window) ----------
create table public.rate_limits (
  key           text primary key,
  window_start  timestamptz not null,
  hits          integer not null
);

create or replace function public.hit_rate_limit(
  p_key text, p_limit integer, p_window_seconds integer
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql set search_path = '' as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window interval := make_interval(secs => p_window_seconds);
  r public.rate_limits;
begin
  insert into public.rate_limits as rl (key, window_start, hits)
  values (p_key, v_now, 1)
  on conflict (key) do update set
    hits = case when rl.window_start + v_window <= v_now then 1 else rl.hits + 1 end,
    window_start = case when rl.window_start + v_window <= v_now then v_now else rl.window_start end
  returning * into r;

  if random() < 0.01 then
    delete from public.rate_limits where window_start < v_now - interval '1 day';
  end if;

  return query select
    r.hits <= p_limit,
    greatest(0, ceil(extract(epoch from (r.window_start + v_window - v_now))))::integer;
end $$;

-- ---------- updated_at ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger users_touch before update on public.users
  for each row execute function public.touch_updated_at();
create trigger site_sections_touch before update on public.site_sections
  for each row execute function public.touch_updated_at();
create trigger app_settings_touch before update on public.app_settings
  for each row execute function public.touch_updated_at();

-- ---------- Lock everything down (server-only access) ----------
alter table public.users                 enable row level security;
alter table public.auth_sessions         enable row level security;
alter table public.password_reset_tokens enable row level security;
alter table public.site_sections         enable row level security;
alter table public.contact_messages      enable row level security;
alter table public.rate_limits           enable row level security;
alter table public.invite_codes          enable row level security;
alter table public.app_settings          enable row level security;

revoke all on public.users, public.auth_sessions, public.password_reset_tokens,
  public.site_sections, public.contact_messages, public.rate_limits,
  public.invite_codes, public.app_settings
  from anon, authenticated;
revoke execute on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;

-- ---------- Public image bucket ----------
-- Uploaded images are re-encoded by the app (WebP) and stored under random,
-- never-reused names, so they are cached for a year by browsers and CDNs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
