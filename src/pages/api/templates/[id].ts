export const prerender = false;

import type { APIContext } from "astro";
import { createServerSupabase } from "../../../lib/supabase-server";

export async function GET(context: APIContext) {
  const supabase = createServerSupabase(context);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });

  const id = parseInt(context.params.id!, 10);
  if (isNaN(id)) return new Response(JSON.stringify({ error: "ID invalide" }), { status: 400 });

  const { data: template, error: err1 } = await supabase
    .from("templates")
    .select("id, name, created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (err1) return new Response(JSON.stringify({ error: err1.message }), { status: 500 });

  const { data: exercises, error: err2 } = await supabase
    .from("template_exercises")
    .select("id, exercise_id, sort_order, exercises!inner(id, name, default_rest_s)")
    .eq("template_id", id)
    .order("sort_order");

  if (err2) return new Response(JSON.stringify({ error: err2.message }), { status: 500 });

  return new Response(JSON.stringify({ ...template, exercises }), { headers: { "Content-Type": "application/json" } });
}

export async function PATCH(context: APIContext) {
  const supabase = createServerSupabase(context);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });

  const id = parseInt(context.params.id!, 10);
  if (isNaN(id)) return new Response(JSON.stringify({ error: "ID invalide" }), { status: 400 });

  const body = await context.request.json();

  if (body.name !== undefined) {
    const { error } = await supabase
      .from("templates")
      .update({ name: body.name.trim() })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (body.exercise_ids !== undefined) {
    await supabase.from("template_exercises").delete().eq("template_id", id);
    if (body.exercise_ids.length > 0) {
      const inserts = body.exercise_ids.map((exercise_id: number, i: number) => ({
        template_id: id,
        exercise_id,
        sort_order: i,
      }));
      const { error } = await supabase.from("template_exercises").insert(inserts);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }

  const { data, error } = await supabase
    .from("templates")
    .select("id, name, created_at")
    .eq("id", id)
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
    .from("templates")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(null, { status: 204 });
}
