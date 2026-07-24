export const prerender = false;

import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
  const supabase = locals.supabase;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data: sessions, error } = await supabase
    .from("workout_sessions")
    .select("id, started_at, volume_total, set_count")
    .eq("user_id", user.id)
    .gte("started_at", sevenDaysAgo.toISOString())
    .order("started_at", { ascending: true });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const trend: Record<string, { sessions: number; volume: number; sets: number }> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    trend[key] = { sessions: 0, volume: 0, sets: 0 };
  }

  for (const s of sessions) {
    const key = new Date(s.started_at).toISOString().slice(0, 10);
    if (trend[key]) {
      trend[key].sessions += 1;
      trend[key].volume += s.volume_total || 0;
      trend[key].sets += s.set_count || 0;
    }
  }

  const result = Object.entries(trend).map(([date, data]) => ({
    date, ...data, volume: Math.round(data.volume * 100) / 100,
  }));

  return new Response(JSON.stringify({ trend: result }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
