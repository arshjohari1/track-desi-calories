import "server-only";

import { createGateway, generateObject } from "ai";
import { z } from "zod";
import { env } from "~/env";

/**
 * AI meal scan — turns a food photo into macros.
 *
 * Two-step flow so the estimate can actually be accurate:
 *   1. `analyzeFoodImage` looks at the photo, identifies the dish, decides
 *      whether it is South Asian, and returns follow-up questions.
 *   2. `estimateMacros` takes the photo + the user's answers and returns the
 *      final per-portion macros.
 *
 * Portion is always asked. South Asian dishes additionally get questions about
 * the factors that swing their macros the most (ghee vs oil and how much,
 * cream/cashew-rich gravies, deep frying, added sugar), because those are
 * invisible in a photo yet can double the calorie count.
 */

// Vercel AI Gateway. A `creator/model` string is routed through the gateway
// automatically; we build an explicit instance so the key comes from our
// validated `env` rather than being read from `process.env` ad hoc.
const gateway = createGateway({ apiKey: env.AI_GATEWAY_API_KEY });

// Multimodal + fast + cheap, with solid structured-output support. Swap for
// "openai/gpt-5.4-nano" here if you'd rather use OpenAI.
const MODEL = "google/gemini-2.5-flash";

/**
 * Build an AI SDK `file` content part from a base64 image data URL. Parses the
 * media type out of the data URL so the part is `{ type: "file", mediaType,
 * data }` — the non-deprecated replacement for the old `image` content part.
 */
function imageFilePart(imageDataUrl: string) {
  const match = /^data:([^;]+);base64,([\s\S]*)$/.exec(imageDataUrl);
  return {
    type: "file" as const,
    mediaType: match?.[1] ?? "image/jpeg",
    data: match?.[2] ?? imageDataUrl,
  };
}

const questionSchema = z.object({
  id: z
    .string()
    .describe("Stable snake_case identifier, e.g. 'portion' or 'cooking_fat'"),
  label: z.string().describe("The question shown to the user"),
  helpText: z
    .string()
    .describe("Short clarifying hint, or an empty string if none is needed"),
  type: z
    .enum(["single", "text"])
    .describe(
      "'single' = pick one of `options`; 'text' = free-form answer (options is empty)",
    ),
  options: z
    .array(z.string())
    .describe(
      "Answer choices for 'single' questions, ordered most→least common. Empty array for 'text'.",
    ),
});

export const analysisSchema = z.object({
  dishName: z.string().describe("Best guess at the dish name"),
  cuisine: z
    .string()
    .describe("Cuisine/region, e.g. 'Punjabi', 'South Indian', 'Italian'"),
  isSouthAsian: z
    .boolean()
    .describe(
      "True if Indian, Pakistani, Bangladeshi, Sri Lankan, or Nepali food",
    ),
  description: z
    .string()
    .describe("One short sentence describing what is on the plate"),
  visibleItems: z
    .array(z.string())
    .describe("Distinct food items you can see in the photo"),
  confidence: z.enum(["low", "medium", "high"]),
  questions: z
    .array(questionSchema)
    .describe("3–6 follow-up questions needed to estimate macros accurately"),
});

export const macrosSchema = z.object({
  dishName: z.string(),
  servingSummary: z
    .string()
    .describe("Human-readable portion, e.g. '1 medium bowl (~250 g)'"),
  calories: z.number().describe("Total kcal for the portion"),
  protein: z.number().describe("Grams of protein for the portion"),
  carbs: z.number().describe("Grams of carbohydrate for the portion"),
  fat: z.number().describe("Grams of fat for the portion"),
  fiber: z.number().describe("Grams of fiber for the portion"),
  confidence: z.enum(["low", "medium", "high"]),
  assumptions: z
    .array(z.string())
    .describe("Key assumptions behind the estimate (fats, portion, etc.)"),
  tip: z
    .string()
    .describe("One short, friendly note or tip about the estimate"),
});

export type FoodAnalysis = z.infer<typeof analysisSchema>;
export type FoodMacros = z.infer<typeof macrosSchema>;
export type ScanQuestion = z.infer<typeof questionSchema>;

const ANALYZE_SYSTEM = `You are a nutrition expert who specializes in estimating the macros of home-cooked food from photos, with deep expertise in South Asian cooking (Indian, Pakistani, Bangladeshi, Sri Lankan, Nepali).

Your job in this first step is NOT to give macros yet. Instead:
1. Identify the dish and everything visible on the plate.
2. Decide whether the food is South Asian.
3. Produce a short list of follow-up questions (3–6) that you genuinely need to estimate the macros accurately.

Rules for the questions:
- ALWAYS include exactly one question about PORTION / serving size, phrased for what the person can see on their own plate. Offer concrete, comparative options (e.g. cups, pieces, palm/fist size, or grams).
- For SOUTH ASIAN food, the biggest hidden macro drivers are cooking fats and richness. Include questions covering the ones relevant to THIS dish, such as:
  - Which cooking fat and how much (ghee, butter, oil, or minimal/none) — ghee and oil dramatically raise calories.
  - Richness of the gravy/curry (cream, malai, cashew/almond paste, coconut milk, yogurt) vs a light/tomato-based one.
  - Whether it is deep-fried, shallow-fried, or not fried (samosa, pakora, puri, fried chicken, etc.).
  - Added sugar/syrup for sweets and chai.
  - Whether roti/naan is brushed with ghee/butter, or rice is plain vs fried/biryani.
- For NON–South Asian food, focus on portion plus the main hidden macro drivers (added oil/butter, dressings/sauces, cheese, cooking method).
- Only ask about factors that actually apply to the dish in the photo. Never ask more than 6 questions.
- Prefer 'single' choice questions with quick options. Use 'text' only when a free-form answer is clearly better.
- Keep every question answerable in a few seconds by a normal person looking at their meal.`;

const ESTIMATE_SYSTEM = `You are a nutrition expert estimating the macros of a meal from a photo plus the user's answers to follow-up questions.

- Use the photo AND the answers together. The answers about cooking fat (ghee/oil/butter), gravy richness, frying, sugar, and portion should meaningfully change your numbers — take them seriously, especially for South Asian food where ghee and oil are major calorie sources.
- Estimate macros for the PORTION the user indicated, not per 100 g.
- Be realistic and honest. Home-cooked South Asian food is often cooked in more fat than restaurant nutrition labels suggest.
- Return whole-number-ish grams and calories (rounding is fine). Keep protein/carbs/fat/fiber internally consistent with the calories.
- List the key assumptions you made. Give a confidence level that reflects how much the photo + answers pin down the real value.`;

/** Step 1 — identify the dish and produce follow-up questions. */
export async function analyzeFoodImage(imageDataUrl: string) {
  const { object } = await generateObject({
    model: gateway(MODEL),
    schema: analysisSchema,
    system: ANALYZE_SYSTEM,
    temperature: 0.2,
    // Fail fast on rate limits instead of hammering the quota 3×.
    maxRetries: 1,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Here is a photo of my meal. Identify it and give me the follow-up questions you need to estimate its macros accurately.",
          },
          imageFilePart(imageDataUrl),
        ],
      },
    ],
  });

  return object;
}

/** Step 2 — combine the photo + answers into a final macro estimate. */
export async function estimateMacros(
  imageDataUrl: string,
  analysis: Pick<FoodAnalysis, "dishName" | "cuisine" | "isSouthAsian">,
  answers: { question: string; answer: string }[],
) {
  const answerBlock = answers
    .map((a) => `- ${a.question}\n  Answer: ${a.answer || "(not specified)"}`)
    .join("\n");

  const { object } = await generateObject({
    model: gateway(MODEL),
    schema: macrosSchema,
    system: ESTIMATE_SYSTEM,
    temperature: 0.2,
    // Fail fast on rate limits instead of hammering the quota 3×.
    maxRetries: 1,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Dish: ${analysis.dishName} (${analysis.cuisine}${
              analysis.isSouthAsian ? ", South Asian" : ""
            }).

The user answered these follow-up questions:
${answerBlock}

Using the photo and these answers, estimate the macros for this portion.`,
          },
          imageFilePart(imageDataUrl),
        ],
      },
    ],
  });

  return object;
}
