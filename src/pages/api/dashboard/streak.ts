export const prerender = false;

import type { APIContext } from "astro";
import { createServerSupabase } from "../../../lib/supabase-server";

export async function GET(context: APIContext) {
  const supabase = createServerSupabase(context);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });

  const { data: sessions } = await supabase
    .from("sessions")
    .select("ended_at")
    .not("ended_at", "is", null)
    .eq("user_id", user.id)
    .order("ended_at", { ascending: false });

  const dates = new Set<string>();
  for (const s of sessions ?? []) {
    dates.add(new Date(s.ended_at).toISOString().slice(0, 10));
  }

  const today = new Date().toISOString().slice(0, 10);
  let currentStreak = 0;
  const cursor = new Date();

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (dates.has(key)) {
      currentStreak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (key === today) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    } else {
      break;
    }
  }

  let longestStreak = 0;
  let tempStreak = 0;
  const sortedDates = [...dates].sort();
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(sortedDates[i - 1]);
      const cur = new Date(sortedDates[i]);
      const diffDays = Math.round((cur.getTime() - prev.getTime()) / 86400000);
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  return new Response(JSON.stringify({ current_streak: currentStreak, longest_streak: longestStreak }), { headers: { "Content-Type": "application/json" } });
}
