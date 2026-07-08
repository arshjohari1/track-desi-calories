import { KitchenIcon } from "~/components/dashboard/icons";

export default function KitchenPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <KitchenIcon className="size-7" />
      </span>
      <h1 className="text-2xl font-bold tracking-tight">Kitchen</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Your saved recipes and spice mixes will live here. Start logging meals
        to build your Kitchen.
      </p>
    </div>
  );
}
