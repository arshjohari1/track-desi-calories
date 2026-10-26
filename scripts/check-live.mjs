import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";
import { createClient } from "@supabase/supabase-js";
import ts from "typescript";

// Opt-in integration check: creates two disposable accounts in the configured
// project, exercises real application functions, and deletes those accounts.
// It never reads or modifies another user's private records.
const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
const env = process.env;
assert.ok(env.SUPABASE_SERVICE_ROLE_KEY, "Missing Supabase service-role key");
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const client = (key) =>
  createClient(env.NEXT_PUBLIC_SUPABASE_URL, key, options);
const admin = client(env.SUPABASE_SERVICE_ROLE_KEY);
const primary = client(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const secondary = client(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const testUserIds = [];
let activeClient = primary;
const modules = new Map();

function loadSource(filename) {
  const absolute = path.resolve(root, filename);
  if (modules.has(absolute)) return modules.get(absolute);
  const source = ts.transpileModule(readFileSync(absolute, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const module = { exports: {} };
  modules.set(absolute, module.exports);
  const overrides = {
    "server-only": {},
    "~/env": { env: { ...env, CHALLENGE_EDITION: "true" } },
    "~/lib/supabase/server": { createClient: async () => activeClient },
    "~/lib/supabase/admin": { createAdminClient: () => admin },
    "~/lib/timezone": { getUserTimeZone: async () => "America/Los_Angeles" },
    "next/cache": { revalidatePath() {} },
  };
  vm.runInNewContext(
    source,
    {
      module,
      exports: module.exports,
      console,
      URL,
      Request,
      Response,
      AbortSignal,
      setTimeout,
      clearTimeout,
      Buffer,
      require(id) {
        if (Object.hasOwn(overrides, id)) return overrides[id];
        if (id.startsWith("~/") || id.startsWith(".")) {
          const location = id.startsWith("~/")
            ? path.join(root, "src", id.slice(2))
            : path.resolve(path.dirname(absolute), id);
          return loadSource(`${location}.ts`);
        }
        return require(id);
      },
    },
    { filename: absolute },
  );
  return module.exports;
}

async function createTestUser(target) {
  const email = `release-${randomUUID()}@example.invalid`;
  const password = randomUUID();
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  assert.equal(created.error, null, created.error?.message);
  const id = created.data.user.id;
  testUserIds.push(id);
  const signedIn = await target.auth.signInWithPassword({ email, password });
  assert.equal(signedIn.error, null, signedIn.error?.message);
  return id;
}

try {
  const userId = await createTestUser(primary);
  const otherId = await createTestUser(secondary);
  console.log("PASS disposable accounts: real password sign-in");
  const onboarding = loadSource("src/app/onboarding/actions.ts");
  const profile = new FormData();
  for (const [key, value] of Object.entries({
    fullName: "Release Test",
    goal: "maintain",
    sex: "female",
    age: "28",
    heightCm: "165",
    weightKg: "65",
    activityLevel: "moderate",
  }))
    profile.set(key, value);
  // next/navigation redirect throws after success, as it does in Next.js.
  try {
    await onboarding.completeOnboarding({}, profile);
  } catch (error) {
    assert.ok(
      error.digest?.startsWith("NEXT_REDIRECT"),
      "Unexpected onboarding error",
    );
  }
  const savedProfile = await primary
    .from("profiles")
    .select("onboarding_completed,daily_calorie_target")
    .eq("id", userId)
    .single();
  assert.equal(savedProfile.error, null, savedProfile.error?.message);
  assert.equal(savedProfile.data.onboarding_completed, true);
  assert.ok(savedProfile.data.daily_calorie_target > 0);
  console.log("PASS onboarding: real profile and calorie target persisted");

  const meal = {
    image: null,
    dishName: "Release check dal",
    servingSummary: "1 test bowl",
    cuisine: "Indian",
    isSouthAsian: true,
    calories: 350,
    protein: 18,
    carbs: 45,
    fat: 10,
    fiber: 8,
    sugar: 2,
    confidence: "medium",
    assumptions: ["Synthetic test record"],
    tip: null,
  };
  const actions = loadSource("src/app/(dashboard)/scan/actions.ts");
  assert.equal((await actions.logMeal(meal)).ok, true);
  const history = await primary
    .from("meals")
    .select("id,calories")
    .eq("user_id", userId);
  assert.equal(history.data.length, 1);
  const mealId = history.data[0].id;
  console.log("PASS meal logging: persisted through application server action");

  const kitchen = loadSource("src/app/(dashboard)/kitchen/actions.ts");
  assert.equal(
    (await kitchen.saveMealToKitchen(mealId, "Release check dal")).ok,
    true,
  );
  const dishes = await primary
    .from("kitchen_dishes")
    .select("id")
    .eq("user_id", userId);
  const dishId = dishes.data[0].id;
  assert.equal((await kitchen.logKitchenDish(dishId)).ok, true);
  const duplicate = await kitchen.saveMealToKitchen(
    mealId,
    "Release check dal",
  );
  assert.equal(duplicate.code, "duplicate");
  for (let i = 0; i < 4; i++) {
    assert.equal(
      (await kitchen.saveMealToKitchen(mealId, `Release check extra ${i}`)).ok,
      true,
    );
  }
  console.log(
    "PASS Kitchen: save, re-log, duplicate detection, and more than three saved dishes",
  );

  const meter = loadSource("src/lib/billing/scan-metering.ts");
  for (let i = 0; i < 3; i++)
    assert.ok(await meter.recordScan(primary, userId, "meal"));
  assert.equal(
    await meter.countScansToday(primary, userId, "America/Los_Angeles"),
    3,
  );
  assert.equal(
    (await meter.gateScan(primary, userId, "America/Los_Angeles")).allowed,
    true,
  );
  console.log(
    "PASS scan metering: three recorded scans do not block Challenge access",
  );

  const exported = await loadSource("src/app/api/export/meals/route.ts").GET();
  assert.equal(exported.status, 200);
  assert.ok((await exported.text()).includes("Release check dal"));
  console.log("PASS CSV export: full-access account exports saved meals");

  for (const [table, column] of [
    ["profiles", "id"],
    ["meals", "user_id"],
    ["kitchen_dishes", "user_id"],
    ["scan_events", "user_id"],
  ]) {
    const hidden = await secondary.from(table).select("id").eq(column, userId);
    assert.equal(hidden.error, null, hidden.error?.message);
    assert.equal(
      hidden.data.length,
      0,
      `${table}: another account can read test data`,
    );
  }
  const deniedWrite = await secondary
    .from("meals")
    .insert({ user_id: userId, dish_name: "Forbidden", calories: 1 });
  assert.ok(deniedWrite.error, "Cross-account insert must be denied");
  activeClient = secondary;
  assert.equal((await kitchen.logKitchenDish(dishId)).ok, false);
  assert.equal(
    (await kitchen.saveMealToKitchen(mealId, "Forbidden")).ok,
    false,
  );
  const otherState = await secondary
    .from("profiles")
    .select("is_premium")
    .eq("id", otherId);
  assert.equal(otherState.error, null, otherState.error?.message);
  console.log(
    "PASS account isolation: cross-account reads, inserts, and dish/meal access denied",
  );

  activeClient = primary;
  assert.equal((await kitchen.deleteKitchenDish(dishId)).ok, true);
  const reLogged = await primary
    .from("meals")
    .select("id,kitchen_dish_id")
    .eq("user_id", userId);
  assert.equal(reLogged.data.length, 2);
  assert.ok(reLogged.data.every((row) => row.kitchen_dish_id === null));
  const deleted = await loadSource(
    "src/app/(dashboard)/logs/actions.ts",
  ).deleteMeal(mealId);
  assert.equal(deleted.ok, true);
  console.log(
    "PASS deletion: removing a dish preserves logged meals; meal deletion works",
  );

  if (process.argv.includes("--ai")) {
    const ai = loadSource("src/lib/ai/food.ts");
    // Existing public app screenshot contains a meal photo. This checks gateway
    // connectivity and schema output, not the nutritional accuracy of a model.
    const image = `data:image/png;base64,${readFileSync(path.join(root, "public/screens/macros.png")).toString("base64")}`;
    const analysis = await ai.analyzeFoodImage(image);
    assert.ok(analysis.dishName && analysis.questions.length > 0);
    const answers = analysis.questions.map((q) => ({
      question: q.label,
      answer: q.options[0] ?? "Not sure",
    }));
    const macros = await ai.estimateMacros(image, analysis, answers);
    assert.ok(Number.isFinite(macros.calories));
    const label = await ai.readNutritionLabel(image);
    assert.equal(label.isLabel, false);
    console.log(
      "PASS live AI: identification, follow-up estimate, and non-label recognition return valid structured output",
    );
  }
} finally {
  await Promise.all([primary.auth.signOut(), secondary.auth.signOut()]);
  for (const id of testUserIds) {
    const { error } = await admin.auth.admin.deleteUser(id);
    assert.equal(
      error,
      null,
      `Could not clean up disposable account: ${error?.message}`,
    );
  }
  console.log(
    "Cleaned up disposable accounts and their cascading test records.",
  );
}
