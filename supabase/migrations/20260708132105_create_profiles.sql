-- Create the profiles table to store onboarding data captured when a user
-- first creates their account. One row per auth user. Body metrics are stored
-- canonically in metric units (cm, kg) regardless of the units entered in the
-- UI so the calorie engine has a single source of truth. daily_calorie_target
-- is derived from the other fields (Mifflin-St Jeor BMR x activity x goal) and
-- cached here so the app can read it without recomputing.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  goal text not null check (goal in ('lose', 'maintain', 'gain')),
  sex text not null check (sex in ('male', 'female')),
  age integer not null check (age between 13 and 120),
  height_cm numeric(5, 1) not null check (height_cm between 50 and 275),
  weight_kg numeric(5, 1) not null check (weight_kg between 20 and 500),
  activity_level text not null check (
    activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')
  ),
  daily_calorie_target integer check (daily_calorie_target > 0),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- RLS: a user may only ever see and manage their own profile row. Granular
-- policies, one per operation for the authenticated role. No anon access.
create policy "Users can view their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Keep updated_at fresh on every update.
create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_profiles_updated_at();
