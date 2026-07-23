import { get } from "../lib/api";
import { lineChart } from "../lib/chart";
import { showToast } from "./toast";

function q<T = HTMLElement>(s: string): T | null {
  return document.querySelector<T>(s);
}

interface ProgressResponse {
  points: { date: string; weight_kg: number; reps: number; estimated_1rm: number; session_id: number; set_type: string }[];
  summary: { total_sets: number; total_volume: number; best_1rm: number; session_count: number };
}

async function loadProgress(exerciseId: number, days?: number) {
  const skeleton = q("[data-ep-skeleton]");
  const cards = q("[data-ep-cards]");
  const chartSection = q("[data-ep-chart-section]");
  const errorEl = q("[data-ep-error]");
  const emptyEl = q("[data-ep-empty]");
  const filters = q("[data-ep-filters]");

  skeleton?.classList.remove("hidden");
  cards?.classList.add("hidden");
  chartSection?.classList.add("hidden");
  filters?.classList.add("hidden");
  errorEl!.hidden = true;
  emptyEl?.classList.add("hidden");

  try {
    const url = days && days > 0 ? `/api/exercises/${exerciseId}/progress?days=${days}` : `/api/exercises/${exerciseId}/progress?days=9999`;
    const data = await get<ProgressResponse>(url);

    if (!data.points || data.points.length === 0) {
      skeleton?.classList.add("hidden");
      emptyEl?.classList.remove("hidden");
      return;
    }

    q("[data-ep-sets]")!.textContent = String(data.summary.total_sets);
    q("[data-ep-volume]")!.textContent = data.summary.total_volume.toLocaleString("fr-FR") + " kg";
    q("[data-ep-best-1rm]")!.textContent = data.summary.best_1rm > 0 ? data.summary.best_1rm.toLocaleString("fr-FR") + " kg" : "—";
    q("[data-ep-sessions]")!.textContent = String(data.summary.session_count);

    cards?.classList.remove("hidden");
    filters?.classList.remove("hidden");

    const chartData = data.points
      .filter((p) => p.estimated_1rm > 0)
      .map((p) => ({
        label: p.date,
        value: p.estimated_1rm,
        secondary: p.set_type !== "warmup" ? p.weight_kg : undefined,
      }));

    q("[data-ep-chart]")!.innerHTML = lineChart(chartData);
    chartSection?.classList.remove("hidden");

    skeleton?.classList.add("hidden");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur de chargement";
    errorEl!.hidden = false;
    errorEl!.innerHTML = `<div class="error-state" role="alert" aria-live="polite">
      <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" style="width:3.2rem;height:3.2rem;color:var(--accent)"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
      <h2 style="margin:0;font-size:1.6rem;font-weight:700;color:var(--text)">Erreur</h2>
      <p style="margin:0;font-size:1.3rem;color:var(--muted)">${msg}</p>
      <button class="error-retry" type="button" style="min-height:3.8rem;padding:0.6rem 1.6rem;border:1px solid hsl(0 84% 62% / 0.45);border-radius:var(--radius-md);background:var(--accent);color:var(--accent-foreground);font:inherit;font-size:1.3rem;font-weight:700;cursor:pointer">Réessayer</button>
    </div>`;
    errorEl!.querySelector(".error-retry")?.addEventListener("click", () => { errorEl!.hidden = true; loadProgress(exerciseId, days); });
    showToast(msg, "error");
    skeleton?.classList.add("hidden");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const page = q<HTMLElement>("[data-exercise-id]");
  if (!page) return;
  const exerciseId = parseInt(page.getAttribute("data-exercise-id")!, 10);
  if (!exerciseId) return;

  let currentDays: number | undefined = 365;

  loadProgress(exerciseId, currentDays);

  q("[data-ep-filters]")?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-days]");
    if (!btn) return;
    document.querySelectorAll("[data-days]").forEach((el) => el.removeAttribute("data-active"));
    btn.setAttribute("data-active", "");
    const days = parseInt(btn.getAttribute("data-days")!, 10);
    currentDays = days > 0 ? days : undefined;
    loadProgress(exerciseId, currentDays);
  });
});
