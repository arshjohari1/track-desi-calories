"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "~/lib/supabase/server";

export type DeleteMealResult = { ok: true } | { ok: false; error: string };

const mealIdSchema = z.uuid();

/** Remove one of the current user's logged meals. RLS also scopes this to the
 * owner; the explicit user_id filter is defense in depth. */
export async function deleteMeal(mealId: string): Promise<DeleteMealResult> {
  const parsed = mealIdSchema.safeParse(mealId);
  if (!parsed.success) {
    return { ok: false, error: "That meal couldn't be found." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You need to be signed in to delete a meal." };
  }

  const { error } = await supabase
    .from("meals")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", user.id);

  if (error) {
    console.error("[deleteMeal]", error);
    return { ok: false, error: "Couldn't delete this meal. Please try again." };
  }

  // Drop it from the history and recompute the dashboard tracker.
  revalidatePath("/logs");
  revalidatePath("/dashboard");
  return { ok: true };
}
