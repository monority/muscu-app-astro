export const prerender = false;

import type { APIContext } from "astro";
import { createServerSupabase } from "../../../lib/supabase-server";

export async function GET(context: APIContext) {
  const supabase = createServerSupabase(context);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });

  const all = context.url.searchParams.get("all") === "true";
  const limit = parseInt(context.url.searchParams.get("limit") || "20", 10);

  let query = supabase
    .from("sessions")
    .select("id, started_at, ended_at, notes")
    .eq("user_id", user.id);

  if (all) {
    query = query.not("ended_at", "is", null).order("ended_at", { ascending: false });
  } else {
    query = query.not("ended_at", "is", null).order("ended_at", { ascending: false }).limit(limit);
  }

  const { data, error } = await query;
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
}

export async function POST(context: APIContext) {
  const supabase = createServerSupabase(context);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });

  const body = await context.request.json().catch(() => ({}));
  const insertData: Record<string, unknown> = { user_id: user.id };
  if (body.template_id) insertData.template_id = body.template_id;

  const { data, error } = await supabase
    .from("sessions")
    .insert(insertData)
    .select("id, started_at, user_id")
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { status: 201, headers: { "Content-Type": "application/json" } });
}
