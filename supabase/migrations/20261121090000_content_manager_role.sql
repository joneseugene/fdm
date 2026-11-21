-- =====================================================================
-- Content Manager role + per-user content access.
--
-- Roles the app uses (users.role):
--   super_admin     everything, incl. all users and email settings
--   church_admin    content, messages, and Content Manager accounts
--   content_manager website content only — all sections, or just the
--                   sections listed in users.content_sections
-- =====================================================================

alter table public.users drop constraint users_role_check;
alter table public.users add constraint users_role_check
  check (role in ('super_admin', 'church_admin', 'content_manager'));

-- Sections a Content Manager may edit. NULL = all sections.
-- Ignored for the other roles (they can edit everything).
alter table public.users add column content_sections text[];

-- The app identifies roles by users.role and never sets role_id, so new
-- users could not be added while it was required.
alter table public.users alter column role_id drop not null;
