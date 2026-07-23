import { supabase } from "../lib/supabase";
import { showToast } from "./toast";

interface SetRow {
  weight_kg: number;
  reps: number;
  exercises: { name: string };
}

interface SessionRow {
  id: number;
  started_at: string;
  ended_at: string | null;
}

function q<T = HTMLElement>(s: string): T | null {
  return document.querySelector<T>(s);
}

function showContent() {
  document.querySelector("[data-dash-skeleton]")?.classList.add("hidden");
  document.querySelector("[data-dash-content]")?.classList.remove("hidden");
}

export async function loadDashboard() {
  showContent();

  try {
    const { data: activeSession, error: err1 } = await supabase
    .from("sessions")
    .select("id, started_at")
    .is("ended_at", null)
    .limit(1)
    .single();

  if (err1 && err1.code !== "PGRST116") throw err1;

  const activeCard = q("[data-active-session]");
  const emptyCard = q("[data-no-session]");
  const cta = q<HTMLAnchorElement>("[data-start-session]");

  if (activeSession) {
    activeCard?.classList.remove("hidden");
    emptyCard?.classList.add("hidden");

    const { data: sets, error: err3 } = await supabase
      .from("exercise_sets")
      .select("weight_kg, reps, exercises(name)")
      .eq("session_id", activeSession.id)
      .order("completed_at", { ascending: false })
      .limit(10);
    if (err3) throw err3;

    if (sets && sets.length > 0) {
      const last = sets[0] as unknown as SetRow;
      const totalSets = sets.length;
      const totalVol = sets.reduce((s: number, set: SetRow) => s + set.weight_kg * set.reps, 0);

      q("[data-active-exercise]")!.textContent = last.exercises.name;
      q("[data-active-sets]")!.textContent = String(totalSets);
      q("[data-active-volume]")!.textContent = totalVol + " kg";
    }

    if (cta) cta.href = "/session";
  } else {
    activeCard?.classList.add("hidden");
    emptyCard?.classList.remove("hidden");
    if (cta) cta.href = "/session";
  }

  const { data: recent, error: err2 } = await supabase
    .from("sessions")
    .select("id, started_at")
    .not("ended_at", "is", null)
    .order("ended_at", { ascending: false })
    .limit(5);
  if (err2) throw err2;

  const list = q("[data-recent-list]");
  if (list && recent && recent.length > 0) {
    list.innerHTML = recent
      .map(
        (s: SessionRow) =>
          `<li><a href="/session/${s.id}" style="display:block;text-decoration:none;color:inherit">
            ${new Date(s.started_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            })} — Séance #${s.id}
          </a></li>`,
      )
      .join("");
  }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur de chargement";
    const el = q<HTMLElement>("[data-dash-error]");
    if (el) {
      el.innerHTML = `<div class="error-state" role="alert" aria-live="polite">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" style="width:3.2rem;height:3.2rem;color:var(--accent)"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
        <h2 style="margin:0;font-size:1.6rem;font-weight:700;color:var(--text)">Erreur</h2>
        <p style="margin:0;font-size:1.3rem;color:var(--muted)">${msg}</p>
        <button class="error-retry" type="button" style="min-height:3.8rem;padding:0.6rem 1.6rem;border:1px solid hsl(0 84% 62% / 0.45);border-radius:var(--radius-md);background:var(--accent);color:var(--accent-foreground);font:inherit;font-size:1.3rem;font-weight:700;cursor:pointer">Réessayer</button>
      </div>`;
      el.hidden = false;
      el.querySelector(".error-retry")?.addEventListener("click", () => { el.hidden = true; loadDashboard(); });
    }
    showToast(msg, "error");
  }
}

document.addEventListener("DOMContentLoaded", loadDashboard);
