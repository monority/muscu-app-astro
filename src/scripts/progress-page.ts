import { supabase } from "../lib/supabase";
import { barChart } from "../lib/chart";

function q<T = HTMLElement>(s: string): T | null {
  return document.querySelector<T>(s);
}

interface SessionSummary {
  id: number;
  started_at: string;
  total_volume: number;
  total_sets: number;
  total_exercises: number;
}

interface TopExercise {
  name: string;
  total_volume: number;
  total_sets: number;
}

async function load() {
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, started_at, ended_at")
    .not("ended_at", "is", null)
    .order("ended_at", { ascending: false });

  if (!sessions || sessions.length === 0) {
    q("[data-pr-empty]")!.classList.remove("hidden");
    return;
  }

  q("[data-pr-empty]")!.classList.add("hidden");
  q("[data-pr-cards]")!.classList.remove("hidden");

  const sessionIds = sessions.map((s) => s.id);

  const { data: sets } = await supabase
    .from("exercise_sets")
    .select("session_id, exercise_id, weight_kg, reps, exercises!inner(name)")
    .in("session_id", sessionIds);

  const setsBySession = new Map<number, typeof sets>();
  const volumeBySession = new Map<number, number>();
  const countsBySession = new Map<number, number>();
  const exerciseIdsBySession = new Map<number, Set<number>>();
  const volumeByExercise = new Map<string, { volume: number; sets: number }>();

  for (const set of sets ?? []) {
    const sid = set.session_id;
    if (!setsBySession.has(sid)) setsBySession.set(sid, []);
    setsBySession.get(sid)!.push(set);

    volumeBySession.set(sid, (volumeBySession.get(sid) ?? 0) + set.weight_kg * set.reps);
    countsBySession.set(sid, (countsBySession.get(sid) ?? 0) + 1);
    if (!exerciseIdsBySession.has(sid)) exerciseIdsBySession.set(sid, new Set());
    exerciseIdsBySession.get(sid)!.add(set.exercise_id);

    const ename = (set as unknown as { exercises: { name: string } }).exercises.name;
    if (!volumeByExercise.has(ename)) volumeByExercise.set(ename, { volume: 0, sets: 0 });
    const e = volumeByExercise.get(ename)!;
    e.volume += set.weight_kg * set.reps;
    e.sets += 1;
  }

  const totalSessions = sessions.length;
  const totalVolume = [...volumeBySession.values()].reduce((a, b) => a + b, 0);
  const totalSets = [...countsBySession.values()].reduce((a, b) => a + b, 0);
  const allExerciseIds = new Set<number>();
  for (const ids of exerciseIdsBySession.values()) {
    for (const id of ids) allExerciseIds.add(id);
  }

  q("[data-pr-sessions]")!.textContent = String(totalSessions);
  q("[data-pr-volume]")!.textContent = totalVolume.toLocaleString("fr-FR") + " kg";
  q("[data-pr-sets]")!.textContent = String(totalSets);
  q("[data-pr-exercises]")!.textContent = String(allExerciseIds.size);

  const sorted = [...sessions].reverse();
  const chartData = sorted.map((s) => ({
    label: new Date(s.started_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
    value: volumeBySession.get(s.id) ?? 0,
  }));
  q("[data-pr-volume-chart]")!.innerHTML = barChart(chartData);
  q("[data-pr-volume-section]")!.classList.remove("hidden");

  const setsChartData = sorted.map((s) => ({
    label: new Date(s.started_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
    value: countsBySession.get(s.id) ?? 0,
  }));
  q("[data-pr-sets-chart]")!.innerHTML = barChart(setsChartData);
  q("[data-pr-sets-section]")!.classList.remove("hidden");

  const topExercises = [...volumeByExercise.entries()]
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10);

  if (topExercises.length > 0) {
    const topEl = q("[data-pr-top]")!;
    topEl.innerHTML = topExercises
      .map(
        (ex) =>
          `<div class="pr-top-item">
            <span class="pr-top-name">${ex.name}</span>
            <span class="pr-top-meta">${ex.volume.toLocaleString("fr-FR")} kg · ${ex.sets} séries</span>
          </div>`,
      )
      .join("");
    q("[data-pr-top-section]")!.classList.remove("hidden");
  }

  const recentEl = q("[data-pr-recent]")!;
  recentEl.innerHTML = sessions
    .slice(0, 20)
    .map(
      (s) =>
        `<li><a href="/session/${s.id}">
          <span class="pr-recent-date">${new Date(s.started_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
          <span class="pr-recent-meta">${volumeBySession.get(s.id)?.toLocaleString("fr-FR") ?? 0} kg · ${countsBySession.get(s.id) ?? 0} séries</span>
        </a></li>`,
    )
    .join("");
  q("[data-pr-recent-section]")!.classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", load);
