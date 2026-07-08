import { createClient } from "@supabase/supabase-js";
import { env } from "~/env";

// SUPABASE_SERVICE_ROLE_KEY is intentionally accessed via process.env rather
// than env.ts because env.ts is imported by middleware (Edge Runtime), which
// does not have access to server-only environment variables.
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
  }
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
