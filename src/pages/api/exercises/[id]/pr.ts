export const prerender = false;

import type { APIContext } from "astro";
import { createServerSupabase } from "../../../../lib/supabase-server";
import { estimate1RM } from "../../../../lib/helpers";

export async function GET(context: APIContext) {
  const supabase = createServerSupabase(context);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });

  const exerciseId = parseInt(context.params.id!, 10);
  if (isNaN(exerciseId)) return new Response(JSON.stringify({ error: "ID invalide" }), { status: 400 });

  const { data: sets } = await supabase
    .from("exercise_sets")
    .select("weight_kg, reps, completed_at")
    .eq("exercise_id", exerciseId)
    .eq("user_id", user.id);

  let best: { estimated_1rm: number; weight_kg: number; reps: number; achieved_at: string } | null = null;

  for (const set of sets ?? []) {
    const e1rm = estimate1RM(set.weight_kg, set.reps);
    if (!best || e1rm > best.estimated_1rm) {
      best = { estimated_1rm: Math.round(e1rm * 10) / 10, weight_kg: set.weight_kg, reps: set.reps, achieved_at: set.completed_at };
    }
  }

  return new Response(JSON.stringify(best), { headers: { "Content-Type": "application/json" } });
}
