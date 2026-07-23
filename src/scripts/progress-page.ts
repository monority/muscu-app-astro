import { supabase } from "../lib/supabase";
import { barChart } from "../lib/chart";
import { showToast } from "./toast";
import { get } from "../lib/api";
import { renderHeatmap, type CalendarDay } from "./calendar-heatmap";

function q<T = HTMLElement>(s: string): T | null {
  return document.querySelector<T>(s);
}

function showError(msg: string) {
  q("[data-pr-skeleton]")?.classList.add("hidden");
  const el = q<HTMLElement>("[data-pr-error]");
  if (el) {
    el.innerHTML = `<div class="error-state" role="alert" aria-live="polite">
      <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" style="width:3.2rem;height:3.2rem;color:var(--accent)">
        <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
      </svg>
      <h2 style="margin:0;font-size:1.6rem;font-weight:700;color:var(--text)">Une erreur est survenue</h2>
      <p style="margin:0;font-size:1.3rem;color:var(--muted)">${msg}</p>
      <button class="error-retry" type="button" style="min-height:3.8rem;padding:0.6rem 1.6rem;border:1px solid hsl(0 84% 62% / 0.45);border-radius:var(--radius-md);background:var(--accent);color:var(--accent-foreground);font:inherit;font-size:1.3rem;font-weight:700;cursor:pointer;transition:background 160ms ease">Réessayer</button>
    </div>`;
    el.hidden = false;
    el.querySelector(".error-retry")?.addEventListener("click", () => { el.hidden = true; load(); });
  }
}

async function load() {
  q("[data-pr-skeleton]")?.classList.remove("hidden");
  q("[data-pr-error]")!.hidden = true;

  try {
    const { data: sessions, error: err1 } = await supabase
    .from("sessions")
    .select("id, started_at, ended_at")
    .not("ended_at", "is", null)
    .order("ended_at", { ascending: false });

  if (err1) throw err1;

  if (!sessions || sessions.length === 0) {
    q("[data-pr-skeleton]")?.classList.add("hidden");
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
  const volumeByExercise = new Map<string, { volume: number; sets: number; id: number }>();

  for (const set of sets ?? []) {
    const sid = set.session_id;
    if (!setsBySession.has(sid)) setsBySession.set(sid, []);
    setsBySession.get(sid)!.push(set);

    volumeBySession.set(sid, (volumeBySession.get(sid) ?? 0) + set.weight_kg * set.reps);
    countsBySession.set(sid, (countsBySession.get(sid) ?? 0) + 1);
    if (!exerciseIdsBySession.has(sid)) exerciseIdsBySession.set(sid, new Set());
    exerciseIdsBySession.get(sid)!.add(set.exercise_id);

    const ename = (set as unknown as { exercises: { name: string } }).exercises.name;
    if (!volumeByExercise.has(ename)) volumeByExercise.set(ename, { volume: 0, sets: 0, id: 0 });
    const e = volumeByExercise.get(ename)!;
    e.volume += set.weight_kg * set.reps;
    e.sets += 1;
    e.id = set.exercise_id;
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
          `<a href="/progress/exercise/${ex.id}" class="pr-top-item" style="text-decoration:none;color:inherit">
            <span class="pr-top-name">${ex.name}</span>
            <span class="pr-top-meta">${ex.volume.toLocaleString("fr-FR")} kg · ${ex.sets} séries</span>
          </a>`,
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

  try {
    const heatmapData = await get<CalendarDay[]>("/api/sessions/calendar?months=6");
    const heatmapEl = q<HTMLElement>("[data-pr-heatmap]");
    if (heatmapData?.length && heatmapEl) {
      renderHeatmap(heatmapEl, heatmapData, 6);
      q("[data-pr-heatmap-section]")?.classList.remove("hidden");
    }
  } catch {
    // heatmap is optional
  }

  await renderMuscleBalance();

  q("[data-pr-skeleton]")?.classList.add("hidden");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur de chargement";
    showError(msg);
    showToast(msg, "error");
  }
}

const muscleColors: Record<string, string> = {
  chest: "hsl(0, 84%, 60%)",
  back: "hsl(220, 80%, 55%)",
  shoulders: "hsl(40, 90%, 55%)",
  biceps: "hsl(270, 70%, 60%)",
  triceps: "hsl(190, 70%, 55%)",
  quadriceps: "hsl(120, 55%, 50%)",
  hamstrings: "hsl(160, 55%, 45%)",
  glutes: "hsl(30, 70%, 55%)",
  calves: "hsl(80, 60%, 50%)",
  abs: "hsl(320, 70%, 55%)",
  traps: "hsl(10, 70%, 55%)",
  forearms: "hsl(50, 60%, 50%)",
};

const muscleLabels: Record<string, string> = {
  chest: "Pectoraux", back: "Dos", shoulders: "Épaules",
  biceps: "Biceps", triceps: "Triceps", quadriceps: "Quadriceps",
  hamstrings: "Ischios", glutes: "Fessiers", calves: "Mollets",
  abs: "Abdos", traps: "Trapèzes", forearms: "Avant-bras",
};

async function renderMuscleBalance() {
  try {
    const data = await get<{ muscle_group: string; sets: number; volume: number }[]>("/api/progress/muscle-balance?days=30");
    if (!data || data.length === 0) return;

    const el = q<HTMLElement>("[data-pr-balance-chart]");
    if (!el) return;

    const maxSets = Math.max(...data.map((d) => d.sets), 1);
    el.innerHTML = data
      .map(
        (d) =>
          `<div class="pr-balance-bar">
            <span class="pr-balance-label">${muscleLabels[d.muscle_group] || d.muscle_group}</span>
            <div class="pr-balance-track">
              <div class="pr-balance-fill" style="width:${(d.sets / maxSets) * 100}%;background:${muscleColors[d.muscle_group] || "var(--accent)"}"></div>
            </div>
            <span class="pr-balance-count">${d.sets}</span>
          </div>`,
      )
      .join("");

    q("[data-pr-balance-section]")?.classList.remove("hidden");
  } catch {
    // muscle balance is optional
  }
}

document.addEventListener("DOMContentLoaded", load);
