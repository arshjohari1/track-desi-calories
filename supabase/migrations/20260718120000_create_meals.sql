-- Create the meals table: one row per logged meal scan. Stores the AI-estimated
-- macros plus the client-compressed photo as a data URL, so the dashboard,
-- recent meals, and the logs view can render the meal without a separate storage
-- bucket. eaten_at drives "today" totals and day grouping in the logs view.

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  dish_name text not null,
  serving_summary text,
  cuisine text,
  is_south_asian boolean not null default false,
  -- Data URL of the compressed meal photo (client shrinks it to ~1024px JPEG).
  image_url text,
  calories numeric(7, 1) not null check (calories >= 0),
  protein numeric(6, 1) not null default 0 check (protein >= 0),
  carbs numeric(6, 1) not null default 0 check (carbs >= 0),
  fat numeric(6, 1) not null default 0 check (fat >= 0),
  fiber numeric(6, 1) not null default 0 check (fiber >= 0),
  confidence text check (confidence in ('low', 'medium', 'high')),
  assumptions text[] not null default '{}',
  tip text,
  eaten_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.meals enable row level security;

-- Composite index for the app's core access pattern: a user's meals, newest
-- first, optionally filtered to "since the start of today".
create index if not exists meals_user_eaten_at_idx
  on public.meals (user_id, eaten_at desc);

-- RLS: a user may only ever read or manage their own meals. Granular policies,
-- one per operation for the authenticated role. No anon access.
create policy "Users can view their own meals"
  on public.meals
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own meals"
  on public.meals
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own meals"
  on public.meals
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own meals"
  on public.meals
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
