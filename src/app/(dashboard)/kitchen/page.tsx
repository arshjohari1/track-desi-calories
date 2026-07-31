import Link from "next/link";
import { KitchenIcon, UploadIcon } from "~/components/dashboard/icons";
import { fetchKitchenDishes } from "~/lib/kitchen";
import { createClient } from "~/lib/supabase/server";
import { KitchenDishCard } from "./kitchen-dish-card";

export default async function KitchenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const dishes = await fetchKitchenDishes(supabase, user?.id ?? "");

  if (dishes.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 py-24 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <KitchenIcon className="size-7" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">Kitchen</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Save the meals you eat again and again. After a scan, tap{" "}
          <span className="font-medium text-foreground">Add to Kitchen</span> —
          then re-logging one is a single tap, with no scanning.
        </p>
        <Link
          href="/scan"
          className="mt-1 flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
        >
          <UploadIcon className="size-4" />
          Scan a meal
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kitchen</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {dishes.length} saved {dishes.length === 1 ? "dish" : "dishes"} —
            tap one to log it again, no scan needed.
          </p>
        </div>
        <Link
          href="/scan"
          className="flex h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted sm:h-10"
        >
          <UploadIcon className="size-4" />
          Scan something new
        </Link>
      </div>

      {/* The explicit `grid-cols-1` is load-bearing: without it the base
          breakpoint gets an implicit `auto` track sized to min-content, and a
          card's nowrap serving line stretched the column to 514px inside a
          288px container. `grid-cols-1` compiles to minmax(0, 1fr), which
          clamps it. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dishes.map((dish) => (
          <KitchenDishCard key={dish.id} dish={dish} />
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Each dish stores the macros from the day you scanned it, for the portion
        shown. Eating a very different amount? Scan it instead.
      </p>
    </div>
  );
}
