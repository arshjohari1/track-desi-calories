import { GoalsIcon } from "~/components/dashboard/icons";

export default function GoalsPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <GoalsIcon className="size-7" />
      </span>
      <h1 className="text-2xl font-bold tracking-tight">Goals</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Set calorie targets and track your progress over time. This feature is
        coming soon.
      </p>
    </div>
  );
}
