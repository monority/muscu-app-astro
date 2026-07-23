export const prerender = false;

import type { APIContext } from "astro";
import { createServerSupabase } from "../../../lib/supabase-server";

export async function GET(context: APIContext) {
  const supabase = createServerSupabase(context);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });

  const id = parseInt(context.params.id!, 10);
  if (isNaN(id)) return new Response(JSON.stringify({ error: "ID invalide" }), { status: 400 });

  const { data: session, error } = await supabase
    .from("sessions")
    .select("id, started_at, ended_at, notes, difficulty")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  if (!session) return new Response(JSON.stringify({ error: "Séance introuvable" }), { status: 404 });

  const { data: sets } = await supabase
    .from("exercise_sets")
    .select("id, set_number, weight_kg, reps, rest_s, notes, exercises(name)")
    .eq("session_id", id)
    .eq("user_id", user.id)
    .order("completed_at", { ascending: true });

  return new Response(JSON.stringify({ session, sets }), { headers: { "Content-Type": "application/json" } });
}

export async function PATCH(context: APIContext) {
  const supabase = createServerSupabase(context);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });

  const id = parseInt(context.params.id!, 10);
  if (isNaN(id)) return new Response(JSON.stringify({ error: "ID invalide" }), { status: 400 });

  const body = await context.request.json();
  const updates: Record<string, unknown> = {};
  if (body.ended_at !== undefined) updates.ended_at = body.ended_at;
  if (body.notes !== undefined) updates.notes = body.notes;
  if (body.difficulty !== undefined) updates.difficulty = body.difficulty;

  const { data, error } = await supabase
    .from("sessions")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, started_at, ended_at, notes, difficulty")
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
}

export async function DELETE(context: APIContext) {
  const supabase = createServerSupabase(context);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });

  const id = parseInt(context.params.id!, 10);
  if (isNaN(id)) return new Response(JSON.stringify({ error: "ID invalide" }), { status: 400 });

  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(null, { status: 204 });
}
