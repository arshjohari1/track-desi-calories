/**
 * Turns an AI SDK / AI Gateway error into a user-facing message + HTTP status.
 *
 * The SDK wraps retried failures in a RetryError whose real cause sits in
 * `.lastError` / `.errors[]`, so we dig through those to find the underlying
 * status code (e.g. 429 rate limit, 402/403 billing) and map it to something
 * the user can actually act on.
 */
export function describeAiError(err: unknown): {
  status: number;
  message: string;
} {
  const anyErr = err as {
    statusCode?: number;
    type?: string;
    lastError?: { statusCode?: number; type?: string };
    errors?: Array<{ statusCode?: number; type?: string }>;
  };

  const candidates = [
    anyErr?.lastError,
    ...(Array.isArray(anyErr?.errors) ? anyErr.errors : []),
    anyErr,
  ].filter(Boolean) as Array<{ statusCode?: number; type?: string }>;

  const match = candidates.find((e) => typeof e.statusCode === "number");
  const statusCode = match?.statusCode;
  const type = match?.type ?? anyErr?.type;

  if (statusCode === 429 || type === "rate_limit_exceeded") {
    return {
      status: 429,
      message:
        "Vercel's AI Gateway free tier is rate-limiting this model. Wait a minute and try again, or add AI Gateway credits in Vercel to remove the limit.",
    };
  }

  if (
    statusCode === 402 ||
    statusCode === 403 ||
    type === "customer_verification_required"
  ) {
    return {
      status: 402,
      message:
        "AI Gateway billing isn't fully set up. Add a payment method and credits in your Vercel AI Gateway settings, then try again.",
    };
  }

  return {
    status: 502,
    message: "Couldn't reach the AI service. Please try again.",
  };
}
