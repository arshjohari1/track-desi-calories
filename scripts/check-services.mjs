import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
assert.ok(
  url && anonKey && serviceKey,
  "Required Supabase variables are missing.",
);
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, serviceKey, options);
const anon = createClient(url, anonKey, options);
const tables = {
  profiles:
    "id,goal,sex,age,height_cm,weight_kg,activity_level,onboarding_completed,daily_calorie_target,is_premium",
  meals:
    "id,user_id,dish_name,image_url,calories,protein,carbs,fat,fiber,sugar,eaten_at,kitchen_dish_id",
  kitchen_dishes: "id,user_id",
  scan_events: "id,user_id,type,created_at",
};

for (const [table, columns] of Object.entries(tables)) {
  const { error } = await admin.from(table).select(columns).limit(0);
  assert.equal(error, null, `${table}: ${error?.message}`);
  console.log(`PASS ${table}: required columns are available`);
  const result = await anon.from(table).select("id").limit(1);
  assert.ok(
    result.error || result.data?.length === 0,
    `${table}: anonymous rows are exposed`,
  );
  console.log(`PASS ${table}: no anonymous rows exposed`);
}

const response = await fetch(new URL("/auth/v1/settings", url), {
  headers: { apikey: anonKey },
});
assert.ok(response.ok, `Auth settings returned ${response.status}`);
const settings = await response.json();
console.log(
  "Auth configuration:",
  JSON.stringify({
    emailEnabled: settings.external?.email,
    googleEnabled: settings.external?.google,
    emailAutoConfirm: settings.mailer_autoconfirm,
    signupDisabled: settings.disable_signup,
  }),
);
