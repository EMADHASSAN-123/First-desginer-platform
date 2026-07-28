-- Supabase SQL to create the profiles table and allow full access
-- Run this in the Supabase SQL Editor.

create table if not exists public.profiles (
  id text primary key,
  profile_name text,
  profile_title text,
  profile_location text,
  profile_member_since text,
  profile_bio text,
  profile_image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

grant select, insert, update, delete on table public.profiles to anon;
grant select, insert, update, delete on table public.profiles to authenticated;

create policy if not exists "profiles_select_all"
  on public.profiles
  for select
  using (true);

create policy if not exists "profiles_insert_all"
  on public.profiles
  for insert
  with check (true);

create policy if not exists "profiles_update_all"
  on public.profiles
  for update
  using (true)
  with check (true);

create policy if not exists "profiles_delete_all"
  on public.profiles
  for delete
  using (true);
