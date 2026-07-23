import { supabase } from "./supabase";

export interface Session {
  id: number;
  started_at: string;
  ended_at: string | null;
}

export interface Exercise {
  id: number;
  name: string;
  category: string | null;
  default_rest_s: number;
}

export async function fetchActiveSession(): Promise<Session | null> {
  const { data } = await supabase
    .from("sessions")
    .select("id, started_at, ended_at")
    .is("ended_at", null)
    .limit(1)
    .single();
  return data;
}

export async function fetchRecentSessions(limit = 5): Promise<Session[]> {
  const { data } = await supabase
    .from("sessions")
    .select("id, started_at, ended_at")
    .not("ended_at", "is", null)
    .order("ended_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function fetchExercises(category?: string): Promise<Exercise[]> {
  let query = supabase.from("exercises").select("*").order("name");
  if (category) query = query.eq("category", category);
  const { data } = await query;
  return data ?? [];
}

export interface ProgressPoint {
  date: string;
  weight_kg: number;
  reps: number;
  estimated_1rm: number;
  session_id: number;
  set_type: string;
}

export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return weight * (1 + reps / 30);
}

export function formatRest(s: number | null): string {
  if (!s) return "—";
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}
