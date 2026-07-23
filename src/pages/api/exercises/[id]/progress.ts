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

  const daysParam = context.url.searchParams.get("days");
  const days = daysParam ? parseInt(daysParam, 10) : 365;
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data: sets, error } = await supabase
    .from("exercise_sets")
    .select("id, set_number, weight_kg, reps, set_type, completed_at, session_id")
    .eq("exercise_id", exerciseId)
    .eq("user_id", user.id)
    .gte("completed_at", since)
    .order("completed_at", { ascending: true });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const points = (sets ?? []).map((s) => ({
    date: new Date(s.completed_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
    weight_kg: s.weight_kg,
    reps: s.reps,
    estimated_1rm: Math.round(estimate1RM(s.weight_kg, s.reps) * 10) / 10,
    session_id: s.session_id,
    set_type: s.set_type,
  }));

  const totalSets = points.length;
  const totalVolume = points.reduce((s, p) => s + p.weight_kg * p.reps, 0);
  const best1rm = points.reduce((best, p) => Math.max(best, p.estimated_1rm), 0);

  const sessionIds = new Set(points.map((p) => p.session_id));

  return new Response(JSON.stringify({
    points,
    summary: {
      total_sets: totalSets,
      total_volume: Math.round(totalVolume * 10) / 10,
      best_1rm: Math.round(best1rm * 10) / 10,
      session_count: sessionIds.size,
    },
  }), { headers: { "Content-Type": "application/json" } });
}
