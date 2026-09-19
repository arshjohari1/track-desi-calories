-- Create scan_events: the meter behind the free-tier daily AI-scan limit.
--
-- One row is written per AI scan the user starts, at the analyze/label call —
-- the expensive step. A photo meal scan counts once (metered at analyze so the
-- estimate follow-up never double-counts); a label scan counts once. Kitchen
-- re-logs and manual entries make no AI call and write nothing here.
--
-- "Scans today" = rows since the start of the day in the user's own timezone
-- (see src/lib/date.ts). The premium fair-use backstop counts rows over a
-- rolling window. Rows are an immutable audit log: there are deliberately no
-- UPDATE or DELETE policies, so a user cannot reset their own count. Only the
-- server's service_role (a refund on a failed scan) may remove one.

create table if not exists public.scan_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Which AI flow was charged: a plate photo or a nutrition label.
  type text not null check (type in ('meal', 'label')),
  created_at timestamptz not null default now()
);

alter table public.scan_events enable row level security;

-- The daily/rolling counts filter by user and time, newest first.
create index if not exists scan_events_user_created_idx
  on public.scan_events (user_id, created_at desc);

-- RLS: a user may read and insert only their own events. No UPDATE or DELETE
-- policy exists on purpose — the count is tamper-proof from the client, and
-- deletes (scan refunds) go through the service_role, which bypasses RLS.
create policy "Users can view their own scan events"
  on public.scan_events
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own scan events"
  on public.scan_events
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
