-- Admin CMS content. Drafts live in Supabase; published JSON is committed to Git
-- by the authenticated admin function and picked up by the static build.
create table if not exists public.admin_content (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('post', 'note', 'feedback', 'page', 'site_copy', 'job')),
  slug text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  title text not null default '',
  description text not null default '',
  body_markdown text not null default '',
  data jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  published_at timestamptz,
  unique (kind, slug)
);

create index if not exists admin_content_status_idx
  on public.admin_content (status, updated_at desc);
create index if not exists admin_content_kind_idx
  on public.admin_content (kind, slug);

alter table public.admin_content enable row level security;

comment on table public.admin_content is
  'Private CMS drafts and published metadata. The browser never receives write access; the admin Function uses the service role.';
comment on column public.admin_content.data is
  'Structured public content payload. body_markdown is the editable source; publish writes its parsed blocks to Git.';
