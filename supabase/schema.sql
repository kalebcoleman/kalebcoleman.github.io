-- Free Builder cloud builds: free Supabase project schema.
-- Run this in the Supabase SQL editor. The browser uses the public anon key;
-- Row Level Security below is what keeps one user's builds private.

create extension if not exists pgcrypto;

create table if not exists public.builds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  code text not null check (char_length(code) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists builds_user_updated_idx
  on public.builds (user_id, updated_at desc);

create or replace function public.touch_build_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists builds_touch_updated_at on public.builds;
create trigger builds_touch_updated_at
  before update on public.builds
  for each row execute function public.touch_build_updated_at();

alter table public.builds enable row level security;

drop policy if exists "Users read their own builds" on public.builds;
create policy "Users read their own builds"
  on public.builds for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert their own builds" on public.builds;
create policy "Users insert their own builds"
  on public.builds for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update their own builds" on public.builds;
create policy "Users update their own builds"
  on public.builds for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete their own builds" on public.builds;
create policy "Users delete their own builds"
  on public.builds for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.builds to authenticated;
