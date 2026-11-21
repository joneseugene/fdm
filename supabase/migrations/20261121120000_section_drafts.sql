-- =====================================================================
-- Drafts and review for page sections.
--
-- site_sections holds what the public site shows (published). Editors save
-- work-in-progress here instead; publishing copies it to site_sections and
-- deletes the draft. One shared draft per section.
--
--   draft      saved, not yet sent for review
--   in_review  sent for review; a publisher can publish it or send it back
-- =====================================================================

create table public.section_drafts (
  key           text primary key,
  data          jsonb not null,
  status        text not null default 'draft' check (status in ('draft', 'in_review')),
  updated_at    timestamptz not null default now(),
  updated_by    uuid references public.users (id) on delete set null,
  submitted_at  timestamptz,
  submitted_by  uuid references public.users (id) on delete set null,
  -- Set when a reviewer sends the draft back with a reason.
  review_note   text
);

create trigger section_drafts_touch before update on public.section_drafts
  for each row execute function public.touch_updated_at();

-- Server-only, like every other table.
alter table public.section_drafts enable row level security;
revoke all on public.section_drafts from anon, authenticated;
grant all on public.section_drafts to service_role;

-- Content Managers send their work for review unless allowed to publish.
-- (Super Admins and Church Admins can always publish.)
alter table public.users add column can_publish boolean not null default false;
