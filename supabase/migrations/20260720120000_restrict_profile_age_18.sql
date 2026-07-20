-- Restrict the profile age range to adults (18+). The calorie-target formula
-- (Mifflin-St Jeor) is only validated for adults, and the app is not intended
-- for minors. The upper bound stays at 120 as a sanity cap. This rolls the
-- check constraint forward instead of editing the original create_profiles
-- migration.
--
-- Note: if any existing profile has age < 18, adding the validating constraint
-- will fail — resolve those rows first (this is intentional; minors shouldn't
-- have a profile).

alter table public.profiles
  drop constraint if exists profiles_age_check;

alter table public.profiles
  add constraint profiles_age_check check (age between 18 and 120);
