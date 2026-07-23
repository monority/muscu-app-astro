export const prerender = false;

import type { APIContext } from "astro";
import { createServerSupabase } from "../../../../lib/supabase-server";

export async function GET(context: APIContext) {
  const supabase = createServerSupabase(context);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });

  const exerciseId = parseInt(context.params.id!, 10);
  if (isNaN(exerciseId)) return new Response(JSON.stringify({ error: "ID invalide" }), { status: 400 });

  const { data: lastSession, error: sessionError } = await supabase
    .from("sessions")
    .select("id, started_at")
    .not("ended_at", "is", null)
    .eq("user_id", user.id)
    .order("ended_at", { ascending: false })
    .limit(1)
    .single();

  if (sessionError || !lastSession) {
    return new Response(JSON.stringify({ session: null, sets: [] }), { headers: { "Content-Type": "application/json" } });
  }

  const { data: sets } = await supabase
    .from("exercise_sets")
    .select("weight_kg, reps, set_number, set_type")
    .eq("session_id", lastSession.id)
    .eq("exercise_id", exerciseId)
    .eq("user_id", user.id)
    .order("set_number", { ascending: true });

  const dateDiffDays = Math.round((Date.now() - new Date(lastSession.started_at).getTime()) / 86400000);

  return new Response(JSON.stringify({
    session: { id: lastSession.id, started_at: lastSession.started_at, date_diff_days: dateDiffDays },
    sets: sets ?? [],
  }), { headers: { "Content-Type": "application/json" } });
}
