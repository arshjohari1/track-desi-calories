// Temporary — lists models actually available on THIS gateway, with pricing.
import { readFileSync } from "node:fs";
import { createGateway } from "ai";

const envFile = readFileSync(".env.local", "utf8");
const key = envFile.match(/AI_GATEWAY_API_KEY=(.+)/)?.[1]?.trim();
if (!key) throw new Error("AI_GATEWAY_API_KEY not found");

const gateway = createGateway({ apiKey: key });
const { models } = await gateway.getAvailableModels();

type Row = {
  id: string;
  input: number;
  output: number;
  type?: string;
};

type GatewayModel = {
  id: string;
  pricing?: { input?: number | string; output?: number | string };
  modelType?: string;
};

const rows: Row[] = (models as unknown as GatewayModel[]).map((m) => ({
  id: m.id,
  input: Number(m.pricing?.input ?? 0) * 1_000_000,
  output: Number(m.pricing?.output ?? 0) * 1_000_000,
  type: m.modelType,
}));

// Show the cheapest language models by (input + output) so we can eyeball vision-capable ones.
const sorted = rows
  .filter((r) => r.type === "language" || r.type === undefined)
  .sort((a, b) => a.input + a.output - (b.input + b.output));

console.log("id | $in/1M | $out/1M");
for (const r of sorted.slice(0, 40)) {
  console.log(`${r.id} | ${r.input.toFixed(3)} | ${r.output.toFixed(3)}`);
}
