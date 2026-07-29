-- Re-apply the admin role flag for the owner account.
--
-- 20260705034735_set_admin_role.sql did this once, but it is a *data* migration
-- keyed to an email: it only affects a row that exists at the moment it runs. The
-- original admin account was deleted during early testing and signed up again,
-- so the new auth.users row never got the flag, and the original migration is
-- recorded as applied and will never run a second time. Hence this roll-forward.
--
-- Same fragility applies here: if the account below does not exist when this
-- runs, it updates zero rows. The original failed silently that way, so this one
-- raises a warning instead — a no-op should be visible in the push output, not
-- something you discover later when /admin denies you. A warning rather than an
-- exception, because a missing account shouldn't abort a migration run; on a
-- fresh database (local `db reset`, CI) there is legitimately no such user yet.
--
-- If the account is recreated again, add another migration like this one rather
-- than editing this file.
--
-- app_metadata is server-only and cannot be modified by the user, which is what
-- makes it safe to authorize on (see src/app/(marketing)/admin/page.tsx).

do $$
declare
  updated integer;
begin
  update auth.users
  set raw_app_meta_data =
    coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
  where email = 'arshjohari1@gmail.com';

  get diagnostics updated = row_count;

  if updated = 0 then
    raise warning 'restore_admin_role: no account matched - admin role NOT set.';
  else
    raise notice 'restore_admin_role: admin role set on % account(s).', updated;
  end if;
end;
$$;
