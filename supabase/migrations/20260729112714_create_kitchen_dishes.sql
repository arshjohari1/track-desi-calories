-- Create the kitchen_dishes table: one row per dish a user has saved for
-- re-logging. Each row is a *snapshot* of a completed scan — the macros the AI
-- produced, the portion they describe, and the prep answers that led to them —
-- so logging a repeat meal is one tap and costs no AI calls.
--
-- The macro columns mirror meals exactly (same precision, same non-negative
-- checks), because logging a dish copies these values straight across.
-- prep_answers is empty for dishes saved from the logs view, where the original
-- questions are no longer around; those dishes fall back to assumptions.

create table if not exists public.kitchen_dishes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  -- Which flow the snapshot came from: a plate photo or a nutrition label.
  source text not null check (source in ('photo', 'label')),
  cuisine text,
  is_south_asian boolean not null default false,
  -- Data URL of the display-sized thumbnail (~320px JPEG), copied onto each
  -- meal logged from this dish.
  thumb_url text,
  -- The portion this snapshot represents, shown on the log button so the user
  -- always sees exactly what they're recording.
  serving_summary text,
  calories numeric(7, 1) not null check (calories >= 0),
  protein numeric(6, 1) not null default 0 check (protein >= 0),
  carbs numeric(6, 1) not null default 0 check (carbs >= 0),
  fat numeric(6, 1) not null default 0 check (fat >= 0),
  fiber numeric(6, 1) not null default 0 check (fiber >= 0),
  sugar numeric(6, 1) not null default 0 check (sugar >= 0),
  confidence text check (confidence in ('low', 'medium', 'high')),
  -- [{ "question": "...", "answer": "..." }] from the scan's follow-up
  -- questions, rendered as read-only context on the dish card.
  prep_answers jsonb not null default '[]',
  assumptions text[] not null default '{}',
  tip text,
  times_logged integer not null default 0 check (times_logged >= 0),
  last_logged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.kitchen_dishes enable row level security;

-- One dish per name per user, case- and whitespace-insensitive. Keeps the
-- kitchen browsable and gives the save flow a clean "you already saved this"
-- branch instead of silently creating near-duplicates.
create unique index if not exists kitchen_dishes_user_name_idx
  on public.kitchen_dishes (user_id, lower(btrim(name)));

-- The dashboard rail and the kitchen grid both read a user's dishes ordered by
-- most recently logged.
create index if not exists kitchen_dishes_user_last_logged_idx
  on public.kitchen_dishes (user_id, last_logged_at desc nulls last);

-- RLS: a user may only ever read or manage their own dishes. Granular policies,
-- one per operation for the authenticated role. No anon access.
create policy "Users can view their own kitchen dishes"
  on public.kitchen_dishes
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own kitchen dishes"
  on public.kitchen_dishes
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own kitchen dishes"
  on public.kitchen_dishes
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own kitchen dishes"
  on public.kitchen_dishes
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
