/**
 * Turns an AI SDK / AI Gateway error into a user-facing message + HTTP status.
 *
 * The SDK wraps retried failures in a RetryError whose real cause sits in
 * `.lastError` / `.errors[]`, so we dig through those to find the underlying
 * status code (e.g. 429 rate limit, 402/403 billing).
 *
 * `message` is deliberately generic. These failures are almost all operator
 * problems — gateway rate limits, missing AI Gateway credits — and the previous
 * copy told the user to "add AI Gateway credits in Vercel", which is meaningless
 * advice to someone tracking their dinner and leaks our billing setup. The
 * specific cause goes to `reason`, which callers log server-side, so diagnosing
 * is no harder than before.
 */

/** What the user sees for any AI failure. */
const USER_MESSAGE = "Something went wrong. Please try again!";

// Rate limiting is the one case where a specific message helps the user and
// leaks nothing about our setup — and it's what users hit under per-tier limits.
const RATE_LIMIT_MESSAGE =
  "You're scanning a bit too fast — give it a moment and try again.";

export function describeAiError(err: unknown): {
  status: number;
  message: string;
  /** Operator-facing detail for server logs — never sent to the client. */
  reason: string;
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
      message: RATE_LIMIT_MESSAGE,
      reason:
        "AI Gateway rate limit (429). The free tier is throttling this model — wait, or add AI Gateway credits in Vercel.",
    };
  }

  if (
    statusCode === 402 ||
    statusCode === 403 ||
    type === "customer_verification_required"
  ) {
    return {
      status: 402,
      message: USER_MESSAGE,
      reason: `AI Gateway billing not set up (${statusCode ?? type}). Add a payment method and credits in Vercel AI Gateway settings.`,
    };
  }

  return {
    status: 502,
    message: USER_MESSAGE,
    reason: `Unrecognised AI failure${statusCode ? ` (status ${statusCode})` : ""}. See the logged error above.`,
  };
}
