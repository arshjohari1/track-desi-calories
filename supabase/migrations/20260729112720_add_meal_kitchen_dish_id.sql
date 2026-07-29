-- Record which kitchen dish a meal was logged from, when it came from one.
--
-- Nothing reads this column yet. It exists because "was this meal a repeat?" is
-- history that can't be reconstructed after the fact — without the column, that
-- signal is lost permanently for every meal logged before we want it. It stays
-- out of the meal read path, so it costs nothing until something needs it.
--
-- on delete set null: deleting a saved dish must never delete or orphan the
-- meals already logged from it. Those days' totals stay intact.

alter table public.meals
  add column if not exists kitchen_dish_id uuid
    references public.kitchen_dishes (id) on delete set null;

-- Partial: only the minority of meals that came from the kitchen are indexed.
create index if not exists meals_kitchen_dish_id_idx
  on public.meals (kitchen_dish_id)
  where kitchen_dish_id is not null;
