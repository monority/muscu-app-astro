export const prerender = false;

import type { APIContext } from "astro";
import { createServerSupabase } from "../../../../lib/supabase-server";

export async function POST(context: APIContext) {
  const supabase = createServerSupabase(context);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });

  const templateId = parseInt(context.params.id!, 10);
  if (isNaN(templateId)) return new Response(JSON.stringify({ error: "ID invalide" }), { status: 400 });

  const { data: template, error: err1 } = await supabase
    .from("templates")
    .select("id, name")
    .eq("id", templateId)
    .eq("user_id", user.id)
    .single();

  if (err1) return new Response(JSON.stringify({ error: "Template introuvable" }), { status: 404 });

  const { data: session, error: err2 } = await supabase
    .from("sessions")
    .insert({ user_id: user.id, template_id: templateId })
    .select("id, started_at, template_id")
    .single();

  if (err2) return new Response(JSON.stringify({ error: err2.message }), { status: 500 });

  return new Response(JSON.stringify({ ...session, template_name: template.name }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
