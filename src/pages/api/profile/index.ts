export const prerender = false;

import type { APIContext } from "astro";
import { createServerSupabase } from "../../../lib/supabase-server";

export async function GET(context: APIContext) {
  const supabase = createServerSupabase(context);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, preferred_rest_s, created_at")
    .eq("id", user.id)
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
}

export async function PUT(context: APIContext) {
  const supabase = createServerSupabase(context);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });

  const body = await context.request.json();
  const updates: Record<string, unknown> = {};
  if (body.display_name !== undefined) updates.display_name = body.display_name;
  if (body.preferred_rest_s !== undefined) updates.preferred_rest_s = body.preferred_rest_s;

  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, ...updates })
    .select("id, display_name, preferred_rest_s, created_at")
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
}
