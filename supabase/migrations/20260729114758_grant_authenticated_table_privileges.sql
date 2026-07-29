-- Grant the `authenticated` role table-level DML on our public tables.
--
-- Postgres checks table privileges *before* row-level security. Current
-- Supabase versions set default privileges for the public schema that give
-- anon/authenticated only TRUNCATE/REFERENCES/TRIGGER/MAINTAIN — not
-- SELECT/INSERT/UPDATE/DELETE. So a table created by a migration on a fresh
-- project has working RLS policies that can never be reached: every request
-- fails with "permission denied for table ..." (SQLSTATE 42501) before a policy
-- is ever consulted.
--
-- Older Supabase projects were created with permissive schema defaults, which
-- is why this never surfaced on an existing deployment — but any new project,
-- CI database, or local `supabase db reset` produces an app that can't read or
-- write anything. These grants make every environment behave the same.
--
-- This does NOT widen row access: RLS is enabled on all three tables with
-- granular per-operation policies, and those still decide which rows a user can
-- touch. Grants are the coarse gate; policies are the fine one. `anon` is
-- deliberately left out — no policy targets it.

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.meals to authenticated;
grant select, insert, update, delete on public.kitchen_dishes to authenticated;

-- Do the same for tables added later, so the next migration doesn't reintroduce
-- the same silent breakage. Applies only to tables created by this role in this
-- schema; every such table must still enable RLS (see .claude/rules/supabase.md).
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
