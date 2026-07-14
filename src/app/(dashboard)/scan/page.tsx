import { ScanFlow } from "./scan-flow";

export default function ScanPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Scan Meal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a photo and let AI estimate the macros — with a special focus
          on South Asian home cooking.
        </p>
      </div>
      <ScanFlow />
    </div>
  );
}
