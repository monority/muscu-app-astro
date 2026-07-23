export const prerender = false;

import type { APIContext } from "astro";
import { createServerSupabase } from "../../../lib/supabase-server";

export async function GET(context: APIContext) {
  const supabase = createServerSupabase(context);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });

  const days = parseInt(context.url.searchParams.get("days") || "30", 10);
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data, error } = await supabase
    .from("exercise_sets")
    .select(`
      weight, reps,
      exercises!inner(name, muscle_group)
    `)
    .eq("exercises.user_id", user.id)
    .not("exercises.muscle_group", "is", null)
    .gte("created_at", since);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const balance: Record<string, { sets: number; volume: number }> = {};

  for (const row of data || []) {
    const mg = (row as any).exercises?.muscle_group;
    if (!mg) continue;
    if (!balance[mg]) balance[mg] = { sets: 0, volume: 0 };
    balance[mg].sets += 1;
    balance[mg].volume += (row.weight || 0) * (row.reps || 0);
  }

  const entries = Object.entries(balance)
    .map(([muscle_group, stats]) => ({ muscle_group, ...stats }))
    .sort((a, b) => b.sets - a.sets);

  return new Response(JSON.stringify(entries), {
    headers: { "Content-Type": "application/json" },
  });
}
