export const prerender = false;

import type { APIContext } from "astro";
import { createServerSupabase } from "../../../lib/supabase-server";

export async function GET(context: APIContext) {
  const supabase = createServerSupabase(context);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });

  const sessionId = parseInt(context.url.searchParams.get("session_id") || "", 10);
  if (isNaN(sessionId)) return new Response(JSON.stringify({ error: "session_id requis" }), { status: 400 });

  const { data, error } = await supabase
    .from("exercise_sets")
    .select("id, set_number, weight_kg, reps, rest_s, notes, completed_at, exercises!inner(name)")
    .eq("session_id", sessionId)
    .eq("user_id", user.id)
    .order("completed_at", { ascending: true });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
}

export async function POST(context: APIContext) {
  const supabase = createServerSupabase(context);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });

  const body = await context.request.json();
  if (!body.session_id || !body.exercise_id) {
    return new Response(JSON.stringify({ error: "session_id et exercise_id requis" }), { status: 400 });
  }

  const { data, error } = await supabase
    .from("exercise_sets")
    .insert({
      user_id: user.id,
      session_id: body.session_id,
      exercise_id: body.exercise_id,
      set_number: body.set_number,
      weight_kg: body.weight_kg,
      reps: body.reps,
      rest_s: body.rest_s ?? null,
      notes: body.notes ?? null,
    })
    .select("id, set_number, weight_kg, reps, rest_s, notes, exercises!inner(name)")
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { status: 201, headers: { "Content-Type": "application/json" } });
}
