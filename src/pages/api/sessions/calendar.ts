export const prerender = false;

import type { APIContext } from "astro";
import { createServerSupabase } from "../../../lib/supabase-server";

export async function GET(context: APIContext) {
  const supabase = createServerSupabase(context);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });

  const monthsParam = context.url.searchParams.get("months");
  const months = Math.min(Math.max(parseInt(monthsParam ?? "6", 10) || 6, 1), 24);

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  const startISO = startDate.toISOString();

  const { data, error } = await supabase
    .from("sessions")
    .select("id, ended_at")
    .not("ended_at", "is", null)
    .gte("ended_at", startISO)
    .eq("user_id", user.id)
    .order("ended_at", { ascending: true });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const dayCount = new Map<string, number>();
  for (const s of data ?? []) {
    const dateKey = new Date(s.ended_at).toISOString().slice(0, 10);
    dayCount.set(dateKey, (dayCount.get(dateKey) ?? 0) + 1);
  }

  const result = [...dayCount.entries()].map(([date, count]) => ({ date, count }));
  return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
}
