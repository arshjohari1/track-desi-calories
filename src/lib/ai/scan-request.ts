import { z } from "zod";

/**
 * Shared request validation for the meal-scan API routes.
 * The client compresses photos to ~1024px JPEG before upload, so real payloads
 * are well under 1 MB; the cap is a generous safety limit, not the expected size.
 */

const IMAGE_DATA_URL_RE = /^data:image\/(jpeg|jpg|png|webp|heic|heif);base64,/;

// Leave room for JSON fields below Vercel's 4.5 MB request-body ceiling.
const MAX_IMAGE_CHARS = 3_500_000;

const imageDataUrl = z
  .string()
  .max(MAX_IMAGE_CHARS, "That image is too large — try a smaller photo.")
  .refine(
    (v) => IMAGE_DATA_URL_RE.test(v),
    "Expected a base64-encoded image (JPEG, PNG, WebP, or HEIC).",
  );

export const analyzeRequestSchema = z.object({
  image: imageDataUrl,
});

export const labelRequestSchema = z.object({
  image: imageDataUrl,
});

export const estimateRequestSchema = z.object({
  image: imageDataUrl,
  analysis: z.object({
    dishName: z.string().min(1).max(200),
    cuisine: z.string().max(120),
    isSouthAsian: z.boolean(),
  }),
  answers: z
    .array(
      z.object({
        question: z.string().max(1000),
        answer: z.string().max(2000),
      }),
    )
    .max(12),
});
