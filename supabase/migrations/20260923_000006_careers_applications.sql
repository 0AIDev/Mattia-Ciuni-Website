-- Careers applications. Apply with the Supabase service role only.
create table if not exists public.careers_applications (
  id uuid primary key default gen_random_uuid(),
  job_slug text not null,
  full_name text not null,
  email text not null,
  email_hash text not null,
  country_timezone text not null,
  github_url text,
  portfolio_url text,
  artifact_link text not null,
  artifact_description text not null,
  motivation text not null,
  cv_filename text not null,
  cv_path text,
  email_verified boolean not null default false,
  verification_token text,
  verification_expires_at timestamptz,
  ip_hash text,
  status text not null default 'pending'
    check (status in ('pending', 'reviewing', 'shortlisted', 'interview', 'rejected', 'hired')),
  submitted_at timestamptz not null default timezone('utc', now()),
  constraint careers_full_name_length check (char_length(full_name) between 2 and 120),
  constraint careers_email_length check (char_length(email) between 3 and 254),
  constraint careers_country_length check (char_length(country_timezone) between 2 and 160),
  constraint careers_artifact_description_length check (char_length(artifact_description) between 300 and 6000),
  constraint careers_motivation_length check (char_length(motivation) between 200 and 4000),
  constraint careers_cv_filename_length check (char_length(cv_filename) between 5 and 255)
);

create index if not exists careers_applications_job_idx
  on public.careers_applications (job_slug);
create index if not exists careers_applications_email_hash_idx
  on public.careers_applications (email_hash);
create index if not exists careers_applications_status_idx
  on public.careers_applications (status);
create unique index if not exists careers_applications_email_job_idx
  on public.careers_applications (lower(email), job_slug);

alter table public.careers_applications enable row level security;

comment on table public.careers_applications is 'Private Careers applications. Access is server-only through the Supabase service role; applicants never query this table.';
comment on column public.careers_applications.verification_token is 'SHA-256 hash of a one-time email token, never the raw token.';
comment on column public.careers_applications.email_hash is 'SHA-256 email hash with the server-only careers salt for operational deduplication.';
comment on column public.careers_applications.cv_path is 'Private storage path for the applicant CV.';

insert into storage.buckets (id, name, public)
values ('careers-cvs', 'careers-cvs', false)
on conflict (id) do nothing;
