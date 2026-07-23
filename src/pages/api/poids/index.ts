export const prerender = false;

import type { APIContext } from "astro";
import { createServerSupabase } from "../../../lib/supabase-server";

export async function GET(context: APIContext) {
  const supabase = createServerSupabase(context);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });

  const limit = parseInt(context.url.searchParams.get("limit") || "100", 10);

  const { data, error } = await supabase
    .from("body_weight")
    .select("id, weight_kg, measured_at, notes")
    .eq("user_id", user.id)
    .order("measured_at", { ascending: false })
    .limit(limit);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
}

export async function POST(context: APIContext) {
  const supabase = createServerSupabase(context);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });

  const body = await context.request.json();
  if (!body.weight_kg || body.weight_kg <= 0) {
    return new Response(JSON.stringify({ error: "weight_kg doit être > 0" }), { status: 400 });
  }

  const { data, error } = await supabase
    .from("body_weight")
    .insert({
      user_id: user.id,
      weight_kg: body.weight_kg,
      measured_at: body.measured_at || new Date().toISOString(),
      notes: body.notes ?? null,
    })
    .select("id, weight_kg, measured_at, notes")
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { status: 201, headers: { "Content-Type": "application/json" } });
}
