-- Compatibility storage for the existing Pages/KV key format.
-- Run after 20260922_000001_initial_schema.sql.
-- RLS remains enabled with no anon policies. Only server-side service-role
-- requests can access this table.

create table if not exists public.private_kv (
  key text primary key,
  value text not null,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists private_kv_expires_idx
  on public.private_kv (expires_at)
  where expires_at is not null;

create or replace function public.delete_expired_private_kv()
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  removed integer;
begin
  delete from public.private_kv where expires_at is not null and expires_at <= timezone('utc', now());
  get diagnostics removed = row_count;
  return removed;
end;
$$;

drop trigger if exists private_kv_set_updated_at on public.private_kv;
create trigger private_kv_set_updated_at
before update on public.private_kv
for each row
execute function public.set_updated_at();

alter table public.private_kv enable row level security;
comment on table public.private_kv is 'Server-only compatibility storage during the KV to Supabase migration. Values may contain admin session and TOTP state; never expose this table to the browser.';
