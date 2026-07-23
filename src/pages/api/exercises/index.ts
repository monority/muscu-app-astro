export const prerender = false;

import type { APIContext } from "astro";
import { createServerSupabase } from "../../../lib/supabase-server";

export async function GET(context: APIContext) {
  const supabase = createServerSupabase(context);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });

  let query = supabase
    .from("exercises")
    .select("id, name, category, default_rest_s")
    .eq("user_id", user.id)
    .order("name");

  const category = context.url.searchParams.get("category");
  if (category) query = query.eq("category", category);

  const search = context.url.searchParams.get("search");
  if (search) query = query.ilike("name", `%${search}%`);

  const { data, error } = await query;
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
}

export async function POST(context: APIContext) {
  const supabase = createServerSupabase(context);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });

  const body = await context.request.json();
  if (!body.name?.trim()) {
    return new Response(JSON.stringify({ error: "Le nom est requis" }), { status: 400 });
  }

  const { data, error } = await supabase
    .from("exercises")
    .insert({
      user_id: user.id,
      name: body.name.trim(),
      category: body.category || null,
      default_rest_s: body.default_rest_s ?? 90,
    })
    .select("id, name, category, default_rest_s")
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { status: 201, headers: { "Content-Type": "application/json" } });
}
