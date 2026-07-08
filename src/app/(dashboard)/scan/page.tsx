import { ScanIcon } from "~/components/dashboard/icons";

export default function ScanPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <ScanIcon className="size-7" />
      </span>
      <h1 className="text-2xl font-bold tracking-tight">Scan Meal</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Upload a photo of your meal to get an accurate calorie count. This
        feature is coming soon.
      </p>
    </div>
  );
}
