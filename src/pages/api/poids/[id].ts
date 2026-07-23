export const prerender = false;

import type { APIContext } from "astro";
import { createServerSupabase } from "../../../lib/supabase-server";

export async function PATCH(context: APIContext) {
  const supabase = createServerSupabase(context);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });

  const id = parseInt(context.params.id!, 10);
  if (isNaN(id)) return new Response(JSON.stringify({ error: "ID invalide" }), { status: 400 });

  const body = await context.request.json();
  const updates: Record<string, unknown> = {};
  if (body.weight_kg !== undefined) updates.weight_kg = body.weight_kg;
  if (body.measured_at !== undefined) updates.measured_at = body.measured_at;
  if (body.notes !== undefined) updates.notes = body.notes;

  const { data, error } = await supabase
    .from("body_weight")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, weight_kg, measured_at, notes")
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
    .from("body_weight")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(null, { status: 204 });
}
