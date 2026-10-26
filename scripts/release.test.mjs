import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");

// Exercise the actual server modules with isolated configuration and clients.
// No live database records, payments, or AI requests are created by these tests.
function loadSource(relativePath, overrides = {}, globals = {}) {
  const filename = path.resolve(root, relativePath);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(
    source,
    {
      module,
      exports: module.exports,
      console,
      URL,
      Request,
      Response,
      ...globals,
      require(id) {
        if (Object.hasOwn(overrides, id)) return overrides[id];
        if (id === "server-only") return {};
        if (id.startsWith("~/") || id.startsWith(".")) {
          const location = id.startsWith("~/")
            ? path.join(root, "src", id.slice(2))
            : path.resolve(path.dirname(filename), id);
          return loadSource(`${location}.ts`, overrides, globals);
        }
        return require(id);
      },
    },
    { filename },
  );
  return module.exports;
}

function subscription(challenge) {
  return loadSource("src/lib/billing/subscription.ts", {
    "~/env": { env: { CHALLENGE_EDITION: challenge ? "true" : "false" } },
  });
}

test("Challenge edition unlocks access without reading or changing billing records", async () => {
  const state = await subscription(true).fetchSubscription(
    {
      from() {
        throw new Error("Challenge access must not depend on billing tables");
      },
    },
    "judge-user",
  );
  assert.equal(state.isPremium, true);
  assert.equal(state.isChallengeEdition, true);
  assert.equal(state.stripeCustomerId, null);
});

test("missing user identity never receives Challenge entitlement", async () => {
  const state = await subscription(true).fetchSubscription({}, "");
  assert.equal(state.isPremium, false);
});

test("normal edition retains free access when billing lookup fails", async () => {
  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: null,
            error: { message: "unavailable" },
          }),
        }),
      }),
    }),
  };
  const state = await subscription(false).fetchSubscription(client, "user");
  assert.equal(state.isPremium, false);
  assert.equal(state.isChallengeEdition, false);
});

test("normal edition preserves paid subscriptions", async () => {
  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { is_premium: true, plan: "annual" },
            error: null,
          }),
        }),
      }),
    }),
  };
  const state = await subscription(false).fetchSubscription(client, "user");
  assert.equal(state.isPremium, true);
  assert.equal(state.isChallengeEdition, false);
  assert.equal(state.plan, "annual");
});

function scanGate(isPremium, count) {
  const query = {
    select: () => query,
    eq: () => query,
    gte: () => query,
    lt: async () => ({ count, error: null }),
    // biome-ignore lint/suspicious/noThenProperty: Supabase query builders are thenable; this mock matches that interface.
    then(resolve) {
      resolve({ count, error: null });
    },
  };
  const module = loadSource("src/lib/billing/scan-metering.ts", {
    "./subscription": { fetchSubscription: async () => ({ isPremium }) },
    "~/lib/supabase/admin": {},
  });
  return module.gateScan({ from: () => query }, "judge", "America/Los_Angeles");
}

test("full-access accounts can scan beyond both daily and fair-use thresholds", async () => {
  const gate = await scanGate(true, 500);
  assert.equal(gate.allowed, true);
  assert.equal(gate.limit, null);
});

test("normal free tier still blocks the third daily scan", async () => {
  const gate = await scanGate(false, 2);
  assert.equal(gate.allowed, false);
  assert.equal(gate.reason, "daily_limit");
});

test("Challenge checkout refuses payments before reaching Stripe", async () => {
  const route = loadSource("src/app/api/stripe/checkout/route.ts", {
    "~/env": { env: { CHALLENGE_EDITION: "true" } },
    "~/lib/billing/subscription": {},
    "~/lib/stripe": {
      getStripe() {
        throw new Error("Stripe must not be called");
      },
    },
    "~/lib/supabase/server": {},
  });
  const response = await route.POST(
    new Request("https://example.com/api/stripe/checkout", { method: "POST" }),
  );
  assert.equal(response.status, 403);
  assert.equal((await response.json()).code, "challenge_edition");
});

test("scan requests reject payloads exceeding the production upload budget", () => {
  const { analyzeRequestSchema, estimateRequestSchema } = loadSource(
    "src/lib/ai/scan-request.ts",
  );
  assert.equal(
    analyzeRequestSchema.safeParse({ image: "data:image/jpeg;base64,YQ==" })
      .success,
    true,
  );
  assert.equal(
    analyzeRequestSchema.safeParse({
      image: `data:image/jpeg;base64,${"a".repeat(3_500_000)}`,
    }).success,
    false,
  );
  assert.equal(
    estimateRequestSchema.safeParse({
      image: "data:image/jpeg;base64,YQ==",
      analysis: { dishName: "Dal", cuisine: "Indian", isSouthAsian: true },
      answers: [{ question: "Portion?", answer: "x".repeat(2001) }],
    }).success,
    false,
  );
});

test("unreadable HEIC photos are rejected before upload", async () => {
  class FileReader {
    readAsDataURL() {
      this.result = "data:image/heic;base64,YQ==";
      this.onload();
    }
  }
  class Image {
    set src(_value) {
      this.onerror();
    }
  }
  const { fileToCompressedDataUrl } = loadSource(
    "src/lib/scan-client.ts",
    {},
    { FileReader, Image },
  );
  await assert.rejects(
    fileToCompressedDataUrl({ size: 10 }),
    /JPEG, PNG, or WebP/,
  );
  await assert.rejects(
    fileToCompressedDataUrl({ size: 26_000_000 }),
    /under 25 MB/,
  );
});

test("successful sign-in only redirects to paths on this app", async () => {
  const route = loadSource("src/app/auth/callback/route.ts", {
    "~/lib/supabase/server": {
      createClient: async () => ({
        auth: { exchangeCodeForSession: async () => ({ error: null }) },
      }),
    },
  });
  for (const next of [
    "https://other.example",
    "//other.example",
    "/\\other.example",
    "//[",
  ]) {
    const response = await route.GET(
      new Request(
        `https://example.com/auth/callback?code=valid&next=${encodeURIComponent(next)}`,
      ),
    );
    assert.equal(
      response.headers.get("location"),
      "https://example.com/dashboard",
    );
  }
  const response = await route.GET(
    new Request(
      "https://example.com/auth/callback?code=valid&next=%2Fscan%3Fmode%3Dlabel",
    ),
  );
  assert.equal(
    response.headers.get("location"),
    "https://example.com/scan?mode=label",
  );
});

test("signup handles both immediate sessions and email confirmation", async () => {
  for (const session of [null, { access_token: "test-only" }]) {
    const actions = loadSource("src/app/auth/actions.ts", {
      "next/navigation": {
        redirect(location) {
          throw new Error(location);
        },
      },
      "~/lib/supabase/server": {
        createClient: async () => ({
          auth: { signUp: async () => ({ data: { session }, error: null }) },
        }),
      },
    });
    const data = new FormData();
    data.set("email", "test@example.com");
    data.set("password", "test-only");
    await assert.rejects(actions.signup(data), (error) =>
      session
        ? error.message === "/dashboard"
        : error.message.startsWith("/login?message="),
    );
  }
});

test("Trends dates stay consecutive through California daylight-saving changes", () => {
  const { recentDateParams, parseDateParam, endOfDay, startOfDay } =
    loadSource("src/lib/date.ts");
  const zone = "America/Los_Angeles";
  const fall = recentDateParams(zone, 30, new Date("2026-11-02T07:30:00Z"));
  assert.equal(fall.length, 30);
  assert.equal(new Set(fall).size, 30);
  assert.equal(fall[0], "2026-10-03");
  assert.equal(fall.at(-1), "2026-11-01");
  const spring = recentDateParams(zone, 3, new Date("2027-03-15T07:30:00Z"));
  assert.equal(spring.join(","), "2027-03-13,2027-03-14,2027-03-15");
  const transition = parseDateParam("2026-11-01", zone);
  assert.equal(
    (endOfDay(zone, transition) - startOfDay(zone, transition)) / 3_600_000,
    25,
  );
  assert.equal(parseDateParam("2026-02-30", zone), null);
});

test("label scaling handles grams, fractional portions, and unknown pack sizes", () => {
  const { computeFactor, scaleMacros, deriveWholePack } =
    loadSource("src/lib/label.ts");
  const factor = computeFactor({
    mode: "grams",
    grams: 75,
    servings: 1,
    servingSizeGrams: 50,
  });
  assert.equal(factor, 1.5);
  const result = scaleMacros(
    { calories: 200, protein: 8, carbs: 30, fat: 6, fiber: 4, sugar: 5 },
    factor,
  );
  assert.equal(result.calories, 300);
  assert.equal(result.protein, 12);
  assert.equal(scaleMacros({ calories: 200 }, Number.NaN).calories, 0);
  assert.equal(
    deriveWholePack({
      servingsPerContainer: null,
      netWeightGrams: null,
      servingSizeGrams: 50,
    }),
    null,
  );
});

test("CSV export escapes commas, quotes, newlines, and formula-like meal names", async () => {
  const names = [
    "Dal, rice",
    'Paneer "special"',
    "Two\nlines",
    '=HYPERLINK("https://example.com")',
    "  +1+1",
    "@SUM(1)",
    "-1+1",
  ];
  const route = loadSource("src/app/api/export/meals/route.ts", {
    "~/lib/supabase/server": {
      createClient: async () => ({
        auth: { getUser: async () => ({ data: { user: { id: "test" } } }) },
      }),
    },
    "~/lib/billing/subscription": {
      fetchSubscription: async () => ({ isPremium: true }),
    },
    "~/lib/timezone": { getUserTimeZone: async () => "America/Los_Angeles" },
    "~/lib/meals": {
      fetchMeals: async () =>
        names.map((name) => ({
          eatenAt: "2026-10-26T12:00:00Z",
          dishName: name,
          calories: 200,
          protein: 8,
          carbs: 30,
          fat: 6,
          fiber: 4,
          sugar: 5,
        })),
    },
  });
  const response = await route.GET();
  assert.equal(response.status, 200);
  const csv = await response.text();
  assert.ok(csv.includes('"Dal, rice"'));
  assert.ok(csv.includes('"Paneer ""special"""'));
  assert.ok(csv.includes('"Two\nlines"'));
  assert.ok(csv.includes(`"'=HYPERLINK(""https://example.com"")"`));
  for (const value of ["'  +1+1", "'@SUM(1)", "'-1+1"])
    assert.ok(csv.includes(value));
  assert.equal(response.headers.get("cache-control"), "no-store");
});
