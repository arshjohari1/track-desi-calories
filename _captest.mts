// Temporary — tests cheap vision models for image + structured-output capability.
import { readFileSync } from "node:fs";
import { createGateway, generateObject } from "ai";
import { z } from "zod";

const envFile = readFileSync(".env.local", "utf8");
const key = envFile.match(/AI_GATEWAY_API_KEY=(.+)/)?.[1]?.trim();
if (!key) throw new Error("no key");

const gateway = createGateway({ apiKey: key });
const bytes = readFileSync(process.argv[2]);
const dataUrl = `data:image/jpeg;base64,${bytes.toString("base64")}`;

const schema = z.object({
  dishName: z.string(),
  isSouthAsian: z.boolean(),
  questions: z.array(
    z.object({ label: z.string(), options: z.array(z.string()) }),
  ),
});

// cheapest-first (input+output per 1M): glm-4.6v-flash $0, nova-lite $0.30,
// gpt-5-nano $0.45, gemini-2.5-flash-lite $0.50
const candidates = [
  "zai/glm-4.6v-flash",
  "amazon/nova-lite",
  "openai/gpt-5-nano",
  "google/gemini-2.5-flash-lite",
];

for (const id of candidates) {
  try {
    const { object, usage } = await generateObject({
      model: gateway(id),
      schema,
      system:
        "Identify the food and produce 3-6 follow-up questions to estimate macros. Always ask portion. For South Asian food ask about ghee/oil.",
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Identify this dish and give follow-up questions.",
            },
            { type: "image", image: dataUrl },
          ],
        },
      ],
    });
    console.log(
      `✅ ${id} | dish="${object.dishName}" southAsian=${object.isSouthAsian} qs=${object.questions.length} | tokens in/out=${usage.inputTokens}/${usage.outputTokens}`,
    );
  } catch (err: unknown) {
    const e = err as {
      data?: { error?: { message?: string } };
      message?: string;
    };
    const msg = e.data?.error?.message ?? e.message ?? String(err);
    console.log(`❌ ${id} | ${msg.slice(0, 140)}`);
  }
}
