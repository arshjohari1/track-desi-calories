import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { endOfDay, startOfDay } from "~/lib/date";
import { createAdminClient } from "~/lib/supabase/admin";
import {
  FREE_DAILY_SCANS,
  PREMIUM_FAIR_USE_SCANS_PER_MONTH,
} from "./constants";
import { fetchSubscription } from "./subscription";

/** Which AI flow is being metered. Kitchen re-logs / manual entry are neither. */
export type ScanType = "meal" | "label";

export type ScanGate =
  | {
      allowed: true;
      isPremium: boolean;
      usedToday: number;
      limit: number | null;
    }
  | { allowed: false; reason: "daily_limit"; usedToday: number; limit: number };

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * How many scans the user has recorded today, in their own timezone. Fails open
 * (returns 0) on error: a metering read hiccup shouldn't lock a user out — the
 * cap is a cost control, not a security boundary.
 */
export async function countScansToday(
  supabase: SupabaseClient,
  userId: string,
  timeZone: string,
): Promise<number> {
  if (!userId) return 0;
  const since = startOfDay(timeZone);
  const until = endOfDay(timeZone);

  const { count, error } = await supabase
    .from("scan_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since.toISOString())
    .lt("created_at", until.toISOString());

  if (error) {
    console.error("[countScansToday]", error);
    return 0;
  }
  return count ?? 0;
}

/** Rolling-window scan count, used only for the premium fair-use backstop. */
async function countScansSince(
  supabase: SupabaseClient,
  userId: string,
  since: Date,
): Promise<number> {
  const { count, error } = await supabase
    .from("scan_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since.toISOString());

  if (error) {
    console.error("[countScansSince]", error);
    return 0;
  }
  return count ?? 0;
}

/**
 * Decide whether a user may start an AI scan right now.
 *
 * Premium users are never blocked by the daily cap — they're only measured
 * against the ~300/30d fair-use backstop, which flags (never blocks) a runaway
 * account. Free users are held to {@link FREE_DAILY_SCANS} per local day.
 */
export async function gateScan(
  supabase: SupabaseClient,
  userId: string,
  timeZone: string,
): Promise<ScanGate> {
  const { isPremium } = await fetchSubscription(supabase, userId);

  if (isPremium) {
    const monthly = await countScansSince(
      supabase,
      userId,
      new Date(Date.now() - 30 * DAY_MS),
    );
    if (monthly >= PREMIUM_FAIR_USE_SCANS_PER_MONTH) {
      // Soft throttle: flag for review, but let the paying user keep scanning.
      console.warn(
        `[fair-use] premium user ${userId} at ${monthly} scans in 30d`,
      );
    }
    return { allowed: true, isPremium: true, usedToday: 0, limit: null };
  }

  const usedToday = await countScansToday(supabase, userId, timeZone);
  if (usedToday >= FREE_DAILY_SCANS) {
    return {
      allowed: false,
      reason: "daily_limit",
      usedToday,
      limit: FREE_DAILY_SCANS,
    };
  }
  return {
    allowed: true,
    isPremium: false,
    usedToday,
    limit: FREE_DAILY_SCANS,
  };
}

/**
 * Record a scan against the user's daily count. Called at the analyze/label
 * step (metered once per scan). Returns the event id so a failed AI call can
 * refund it, or null if the write failed (in which case we don't block the
 * scan over a bookkeeping error).
 */
export async function recordScan(
  supabase: SupabaseClient,
  userId: string,
  type: ScanType,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("scan_events")
    .insert({ user_id: userId, type })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[recordScan]", error);
    return null;
  }
  return data.id as string;
}

/**
 * Undo a recorded scan when the AI call itself fails, so a user is never
 * charged a scan for our error. Uses the service_role client because
 * scan_events has no user-facing DELETE policy (the count is tamper-proof).
 * Best-effort: a failed refund is logged, never thrown.
 */
export async function refundScan(eventId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("scan_events")
      .delete()
      .eq("id", eventId);
    if (error) console.error("[refundScan]", error);
  } catch (err) {
    console.error("[refundScan]", err);
  }
}
