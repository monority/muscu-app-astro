export const prerender = false;

import type { APIContext } from "astro";
import { createServerSupabase } from "../../../lib/supabase-server";

export async function GET(context: APIContext) {
  const supabase = createServerSupabase(context);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });

  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const mondayISO = monday.toISOString();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id")
    .not("ended_at", "is", null)
    .gte("ended_at", mondayISO)
    .eq("user_id", user.id);

  const sessionCount = sessions?.length ?? 0;

  let totalVolume = 0;
  let totalSets = 0;
  const exerciseIds = new Set<number>();

  if (sessions && sessions.length > 0) {
    const sessionIds = sessions.map((s) => s.id);
    const { data: sets } = await supabase
      .from("exercise_sets")
      .select("weight_kg, reps, exercise_id")
      .in("session_id", sessionIds)
      .eq("user_id", user.id);

    for (const set of sets ?? []) {
      totalVolume += set.weight_kg * set.reps;
      totalSets++;
      exerciseIds.add(set.exercise_id);
    }
  }

  return new Response(JSON.stringify({
    sessions: sessionCount,
    volume: Math.round(totalVolume * 10) / 10,
    sets: totalSets,
    exercises: exerciseIds.size,
  }), { headers: { "Content-Type": "application/json" } });
}
