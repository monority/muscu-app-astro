export const prerender = false;

import type { APIContext } from "astro";
import { createServerSupabase } from "../../../lib/supabase-server";
import { estimate1RM } from "../../../lib/helpers";

export async function GET(context: APIContext) {
  const supabase = createServerSupabase(context);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });

  const { data: sets } = await supabase
    .from("exercise_sets")
    .select("exercise_id, weight_kg, reps, completed_at, exercises!inner(name)")
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false });

  const bestByExercise = new Map<number, { exercise_name: string; estimated_1rm: number; weight_kg: number; reps: number; achieved_at: string }>();

  for (const set of sets ?? []) {
    const eid = set.exercise_id;
    const ename = (set as unknown as { exercises: { name: string } }).exercises.name;
    const e1rm = estimate1RM(set.weight_kg, set.reps);

    const existing = bestByExercise.get(eid);
    if (!existing || e1rm > existing.estimated_1rm) {
      bestByExercise.set(eid, {
        exercise_name: ename,
        estimated_1rm: Math.round(e1rm * 10) / 10,
        weight_kg: set.weight_kg,
        reps: set.reps,
        achieved_at: set.completed_at,
      });
    }
  }

  const records = [...bestByExercise.entries()]
    .map(([exercise_id, data]) => ({ exercise_id, ...data }))
    .sort((a, b) => b.estimated_1rm - a.estimated_1rm);

  return new Response(JSON.stringify(records), { headers: { "Content-Type": "application/json" } });
}
