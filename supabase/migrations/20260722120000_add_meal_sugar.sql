-- Add a sugar macro to meals.
--
-- Sugar (a subset of total carbohydrate) is the dominant macro in desserts and
-- many packaged snacks, so we track it alongside the others. Nullable on
-- purpose: meals logged before this column existed simply have no sugar value
-- and are treated as 0 in daily totals.

alter table public.meals
  add column if not exists sugar numeric;
