export const prerender = false;

import type { APIContext } from "astro";
import { createServerSupabase } from "../../../lib/supabase-server";

export async function DELETE(context: APIContext) {
  const supabase = createServerSupabase(context);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });

  const id = parseInt(context.params.id!, 10);
  if (isNaN(id)) return new Response(JSON.stringify({ error: "ID invalide" }), { status: 400 });

  const { error } = await supabase
    .from("exercises")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(null, { status: 204 });
}
