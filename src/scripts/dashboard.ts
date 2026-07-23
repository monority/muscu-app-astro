import { get, post } from "../lib/api";
import { showToast } from "./toast";
import type { BodyWeight } from "../lib/types";

interface SetRow {
  weight_kg: number;
  reps: number;
  exercises: { name: string };
}

interface ActiveSession {
  id: number;
  started_at: string;
}

interface RecentSession {
  id: number;
  started_at: string;
}

interface WeeklySummary {
  sessions: number;
  volume: number;
  sets: number;
  exercises: number;
}

interface StreakData {
  current_streak: number;
  longest_streak: number;
}

interface Template {
  id: number;
  name: string;
}

interface SessionDetail {
  id: number;
  started_at: string;
  ended_at: string | null;
  difficulty: string | null;
  notes: string | null;
}

function q<T = HTMLElement>(s: string): T | null {
  return document.querySelector<T>(s);
}

function showContent() {
  q("[data-dash-skeleton]")?.classList.add("hidden");
  q("[data-dash-content]")?.classList.remove("hidden");
}

export async function loadDashboard() {
  showContent();

  try {
    const activeSession = await get<ActiveSession | null>("/api/sessions/active");

    const activeCard = q("[data-active-session]");
    const emptyCard = q("[data-no-session]");
    const cta = q<HTMLAnchorElement>("[data-start-session]");

    if (activeSession) {
      activeCard?.classList.remove("hidden");
      emptyCard?.classList.add("hidden");

      const sets = await get<SetRow[]>(`/api/sets?session_id=${activeSession.id}`);

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

      const hour = new Date().getHours();
      const greeting = hour < 12 ? "Prêt pour une séance matinale ?" : hour < 18 ? "Prêt pour l'entraînement ?" : "Bonne séance en soirée !";
      const greetingEl = q("[data-dash-greeting]");
      if (greetingEl) greetingEl.textContent = greeting;
    }

    const recent = await get<RecentSession[]>("/api/sessions?limit=5");
    const list = q("[data-recent-list]");
    if (list && recent && recent.length > 0) {
      list.innerHTML = recent
        .map(
          (s: RecentSession) =>
            `<li><a href="/session/${s.id}">
              ${new Date(s.started_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} — Séance #${s.id}
            </a></li>`,
        )
        .join("");
    }

    const [weekly, streak, lastSession] = await Promise.allSettled([
      get<WeeklySummary>("/api/dashboard/weekly-summary"),
      get<StreakData>("/api/dashboard/streak"),
      get<SessionDetail[]>("/api/sessions?limit=1"),
    ]);

    if (weekly.status === "fulfilled" && weekly.value) {
      const w = weekly.value;
      q("[data-week-sessions]")!.textContent = String(w.sessions);
      q("[data-week-volume]")!.textContent = w.volume.toLocaleString("fr-FR") + " kg";
      q("[data-week-sets]")!.textContent = String(w.sets);
      q("[data-week-exercises]")!.textContent = String(w.exercises);
      q("[data-weekly-card]")?.classList.remove("hidden");
    }

    if (streak.status === "fulfilled" && streak.value) {
      const s = streak.value;
      if (s.current_streak > 0) {
        q("[data-streak-count]")!.textContent = String(s.current_streak);
        q("[data-streak-best]")!.textContent = s.longest_streak > 1 ? `Meilleure série : ${s.longest_streak} jours` : "";
        q("[data-streak-card]")?.classList.remove("hidden");
      }
    }

    if (lastSession.status === "fulfilled" && lastSession.value && lastSession.value.length > 0) {
      const s = lastSession.value[0] as unknown as RecentSession;
      const dateStr = new Date(s.started_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
      q("[data-last-date]")!.textContent = dateStr;
      const link = q<HTMLAnchorElement>("[data-last-link]");
      if (link) link.href = `/session/${s.id}`;
      q("[data-last-session]")?.classList.remove("hidden");
    }

    const templates = await get<Template[]>("/api/templates").catch(() => null);
    const templatesList = q("[data-templates-list]");
    if (templatesList && templates && templates.length > 0) {
      templatesList.innerHTML = templates
        .slice(0, 3)
        .map(
          (t: Template) =>
            `<button class="dash-template-btn" type="button" data-template-start="${t.id}">
              <span>${t.name}</span>
              <span class="dash-template-start">Démarrer</span>
            </button>`,
        )
        .join("");
      templatesList.querySelectorAll("[data-template-start]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = (btn as HTMLElement).getAttribute("data-template-start")!;
          try {
            const session = await post<{ id: number }>(`/api/templates/${id}/start`);
            window.location.href = `/session?template=${session.id}&tid=${id}`;
          } catch {
            showToast("Erreur au démarrage du template", "error");
          }
        });
      });
    }

    const weightData = await get<BodyWeight[]>("/api/poids?limit=1").catch(() => null);
    if (weightData && weightData.length > 0) {
      const w = weightData[0];
      q("[data-last-weight]")!.textContent = `${w.weight_kg.toFixed(1)} kg`;
      const dateStr = new Date(w.measured_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
      q("[data-weight-date]")!.textContent = dateStr;
      q("[data-weight-card]")?.classList.remove("hidden");
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
