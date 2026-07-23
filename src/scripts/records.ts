import { get } from "../lib/api";
import { showToast } from "./toast";

interface Record {
  exercise_id: number;
  exercise_name: string;
  estimated_1rm: number;
  weight_kg: number;
  reps: number;
  achieved_at: string;
}

function q<T = HTMLElement>(s: string): T | null {
  return document.querySelector<T>(s);
}

function showError(msg: string) {
  q("[data-rec-skeleton]")?.classList.add("hidden");
  const el = q<HTMLElement>("[data-rec-error]");
  if (el) {
    el.innerHTML = `<div class="error-state" role="alert" aria-live="polite">
      <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" style="width:3.2rem;height:3.2rem;color:var(--accent)"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
      <h2 style="margin:0;font-size:1.6rem;font-weight:700;color:var(--text)">Erreur</h2>
      <p style="margin:0;font-size:1.3rem;color:var(--muted)">${msg}</p>
      <button class="error-retry" type="button" style="min-height:3.8rem;padding:0.6rem 1.6rem;border:1px solid hsl(24 100% 55% / 0.45);border-radius:var(--radius-md);background:var(--accent);color:var(--accent-foreground);font:inherit;font-size:1.3rem;font-weight:700;cursor:pointer">Réessayer</button>
    </div>`;
    el.hidden = false;
    el.querySelector(".error-retry")?.addEventListener("click", () => { el.hidden = true; loadRecords(); });
  }
}

async function loadRecords() {
  const skeleton = q("[data-rec-skeleton]");
  const list = q("[data-rec-list]");
  const empty = q("[data-rec-empty]");
  const errorEl = q("[data-rec-error]");

  skeleton?.classList.remove("hidden");
  empty?.classList.add("hidden");
  errorEl!.hidden = true;

  try {
    const records = await get<Record[]>("/api/records");

    if (!records || records.length === 0) {
      skeleton?.classList.add("hidden");
      empty?.classList.remove("hidden");
      return;
    }

    list!.innerHTML = records
      .map(
        (r, i) =>
          `<div class="rec-item">
            <span class="rec-rank ${i < 3 ? `rec-rank-${i + 1}` : ""}">#${i + 1}</span>
            <div class="rec-info">
              <span class="rec-name">${r.exercise_name}</span>
              <span class="rec-meta">${r.weight_kg} kg × ${r.reps} reps · ${new Date(r.achieved_at).toLocaleDateString("fr-FR")}</span>
            </div>
            <span class="rec-1rm">${r.estimated_1rm} <span class="rec-1rm-unit">kg</span></span>
          </div>`,
      )
      .join("");

    skeleton?.classList.add("hidden");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur de chargement";
    showError(msg);
    showToast(msg, "error");
  }
}

document.addEventListener("DOMContentLoaded", loadRecords);
