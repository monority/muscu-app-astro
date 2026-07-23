export const prerender = false;

import type { APIContext } from "astro";
import { createServerSupabase } from "../../../lib/supabase-server";

export async function GET(context: APIContext) {
  const supabase = createServerSupabase(context);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });

  const { data, error } = await supabase
    .from("templates")
    .select("id, name, created_at, exercise_count:template_exercises(count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

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

  const { data: template, error: err1 } = await supabase
    .from("templates")
    .insert({ user_id: user.id, name: body.name.trim() })
    .select("id, name, created_at")
    .single();

  if (err1) return new Response(JSON.stringify({ error: err1.message }), { status: 500 });

  if (body.exercise_ids?.length > 0) {
    const inserts = body.exercise_ids.map((exercise_id: number, i: number) => ({
      template_id: template.id,
      exercise_id,
      sort_order: i,
    }));
    const { error: err2 } = await supabase.from("template_exercises").insert(inserts);
    if (err2) return new Response(JSON.stringify({ error: err2.message }), { status: 500 });
  }

  return new Response(JSON.stringify(template), { status: 201, headers: { "Content-Type": "application/json" } });
}
