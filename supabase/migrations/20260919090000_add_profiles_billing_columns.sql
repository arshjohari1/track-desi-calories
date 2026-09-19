-- Add billing / subscription state to profiles.
--
-- The freemium plan gates AI scans (which cost money) and keeps everything
-- zero-cost free. Premium status is the single flag the scan gate and the
-- history/analytics reads check. It is flipped exclusively by the Stripe
-- webhook (which connects as the service_role and bypasses RLS) — never by the
-- user. See .claude/rules/supabase.md.
--
-- Columns:
--   is_premium            fast boolean the app reads on every gated request
--   stripe_customer_id    ties a profile to its Stripe customer (for the portal
--                         and for locating the row from webhook events)
--   stripe_subscription_id the active subscription, for portal / debugging
--   subscription_status   raw Stripe status (active, trialing, past_due, …)
--   current_period_end    when the paid period ends (renewal or lapse boundary)
--   plan                  'monthly' | 'annual', for display

alter table public.profiles
  add column if not exists is_premium boolean not null default false,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists current_period_end timestamptz,
  add column if not exists plan text check (plan in ('monthly', 'annual'));

-- One Stripe customer maps to one profile. NULLs are distinct in Postgres, so
-- this permits the many not-yet-subscribed rows while enforcing uniqueness once
-- a customer id is set. The webhook looks a profile up by this column.
create unique index if not exists profiles_stripe_customer_idx
  on public.profiles (stripe_customer_id);

-- Guard: the billing columns must never be settable by end users. The existing
-- RLS UPDATE policy lets an authenticated user write their own row, and a
-- WITH CHECK clause cannot compare against the OLD row, so it can't stop someone
-- from flipping is_premium on themselves via the anon key. This BEFORE trigger
-- pins the billing columns for the user-facing roles (authenticated/anon):
--   * INSERT  -> forced to their safe defaults (free, no subscription)
--   * UPDATE  -> forced back to the existing values
-- The service_role (Stripe webhook) and privileged roles (migrations) are
-- exempt, so only trusted server code ever changes these values. It silently
-- pins rather than raising, so normal profile writes (onboarding, settings)
-- keep working untouched.
create or replace function public.guard_profiles_billing()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Trusted roles (service_role webhook, migration/superuser) may write freely.
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.is_premium := false;
    new.stripe_customer_id := null;
    new.stripe_subscription_id := null;
    new.subscription_status := null;
    new.current_period_end := null;
    new.plan := null;
  else
    new.is_premium := old.is_premium;
    new.stripe_customer_id := old.stripe_customer_id;
    new.stripe_subscription_id := old.stripe_subscription_id;
    new.subscription_status := old.subscription_status;
    new.current_period_end := old.current_period_end;
    new.plan := old.plan;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_billing on public.profiles;
create trigger profiles_guard_billing
  before insert or update on public.profiles
  for each row
  execute function public.guard_profiles_billing();
