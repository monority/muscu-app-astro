import { get, post, patch, del } from "../lib/api";
import { showToast } from "./toast";

function q<T = HTMLElement>(s: string): T | null {
  return document.querySelector<T>(s);
}

interface Exercise {
  id: number;
  name: string;
  category: string | null;
  default_rest_s: number;
  notes: string | null;
  muscle_group: string | null;
  equipment: string | null;
}

const muscleLabels: Record<string, string> = {
  chest: "Pectoraux", back: "Dos", shoulders: "Épaules",
  biceps: "Biceps", triceps: "Triceps", quadriceps: "Quadriceps",
  hamstrings: "Ischios", glutes: "Fessiers", calves: "Mollets",
  abs: "Abdos", traps: "Trapèzes", forearms: "Avant-bras",
};

const equipmentLabels: Record<string, string> = {
  barbell: "Barre", dumbbell: "Haltères", machine: "Machine",
  cable: "Poulie", bodyweight: "Poids du corps", kettlebell: "Kettlebell",
  "ez-bar": "EZ", smith: "Smith", bands: "Élastiques", other: "Autre",
};

let currentFilter = "all";

async function load() {
  q("[data-ex-skeleton]")?.classList.remove("hidden");
  q("[data-ex-error]")!.hidden = true;

  try {
    const params = new URLSearchParams();
    if (currentFilter !== "all") params.set("category", currentFilter);
    const muscle = (q<HTMLSelectElement>("[data-ex-filter-muscle]")?.value || "");
    if (muscle) params.set("muscle_group", muscle);
    const equipment = (q<HTMLSelectElement>("[data-ex-filter-equipment]")?.value || "");
    if (equipment) params.set("equipment", equipment);

    const qs = params.toString();
    const url = qs ? `/api/exercises?${qs}` : "/api/exercises";
    const data = await get<Exercise[]>(url);
    q("[data-ex-toolbar]")!.hidden = false;
    render(data ?? []);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur de chargement";
    q("[data-ex-error]")!.hidden = false;
    q("[data-ex-error]")!.innerHTML = `<div class="error-state" role="alert" aria-live="polite">
      <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" style="width:3.2rem;height:3.2rem;color:var(--accent)"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
      <h2 style="margin:0;font-size:1.6rem;font-weight:700;color:var(--text)">Erreur</h2>
      <p style="margin:0;font-size:1.3rem;color:var(--muted)">${msg}</p>
      <button class="error-retry" type="button" style="min-height:3.8rem;padding:0.6rem 1.6rem;border:1px solid hsl(0 84% 62% / 0.45);border-radius:var(--radius-md);background:var(--accent);color:var(--accent-foreground);font:inherit;font-size:1.3rem;font-weight:700;cursor:pointer">Réessayer</button>
    </div>`;
    q("[data-ex-error]")!.querySelector(".error-retry")?.addEventListener("click", () => { q("[data-ex-error]")!.hidden = true; load(); });
    showToast(msg, "error");
  } finally {
    q("[data-ex-skeleton]")?.classList.add("hidden");
  }
}

function render(exercises: Exercise[]) {
  const list = q<HTMLElement>("[data-ex-list]")!;
  const search = (q<HTMLInputElement>("[data-ex-search]")?.value || "").toLowerCase();

  const filtered = exercises.filter((ex) => ex.name.toLowerCase().includes(search));

  if (filtered.length === 0) {
    list.innerHTML = `<li class="ex-empty">Aucun exercice trouvé</li>`;
    return;
  }

  list.innerHTML = filtered
    .map(
      (ex) =>
        `<li>
          <div class="ex-info">
            <span class="ex-name">${ex.name}</span>
            <div class="ex-meta">
              ${ex.category ? `<span class="ex-category">${ex.category}</span>` : ""}
              ${ex.muscle_group ? `<span class="ex-badge ex-muscle" data-muscle="${ex.muscle_group}">${muscleLabels[ex.muscle_group] || ex.muscle_group}</span>` : ""}
              ${ex.equipment ? `<span class="ex-badge ex-equipment" data-equipment="${ex.equipment}">${equipmentLabels[ex.equipment] || ex.equipment}</span>` : ""}
            </div>
            ${ex.notes ? `<div class="ex-notes">${ex.notes}</div>` : ""}
          </div>
          <div class="ex-actions">
            <span class="ex-rest">${ex.default_rest_s}s</span>
            <button class="ex-notes-edit" type="button" data-edit-notes="${ex.id}" aria-label="Notes">✎</button>
            <button class="ex-delete" type="button" data-del="${ex.id}">Suppr.</button>
          </div>
        </li>`,
    )
    .join("");

  list.querySelectorAll("[data-del]").forEach((btn) =>
    btn.addEventListener("click", () => deleteEx(parseInt((btn as HTMLElement).getAttribute("data-del")!, 10))),
  );

  list.querySelectorAll("[data-edit-notes]").forEach((btn) =>
    btn.addEventListener("click", () => editNotes(parseInt((btn as HTMLElement).getAttribute("data-edit-notes")!, 10))),
  );
}

async function editNotes(id: number) {
  const ex = await get<Exercise>(`/api/exercises/${id}`);
  if (!ex) return;

  const current = ex.notes ?? "";
  const newNotes = prompt("Notes / Cues pour cet exercice :", current);
  if (newNotes === null) return;

  try {
    await patch(`/api/exercises/${id}`, { notes: newNotes.trim() || null });
    showToast("Notes mises à jour ✓", "success");
    load();
  } catch {
    showToast("Erreur lors de la modification", "error");
  }
}

async function deleteEx(id: number) {
  if (!confirm("Supprimer cet exercice ?")) return;
  try {
    await del(`/api/exercises/${id}`);
    load();
  } catch {}
}

document.addEventListener("DOMContentLoaded", () => {
  load();

  q("[data-ex-search]")?.addEventListener("input", () => load());

  q("[data-ex-categories]")?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest("[data-cat]") as HTMLElement | null;
    if (!btn) return;
    document.querySelectorAll("[data-cat]").forEach((c) => c.removeAttribute("data-active"));
    btn.setAttribute("data-active", "");
    currentFilter = btn.getAttribute("data-cat")!;
    load();
  });

  q("[data-ex-filter-muscle]")?.addEventListener("change", () => load());
  q("[data-ex-filter-equipment]")?.addEventListener("change", () => load());

  q("[data-ex-add]")?.addEventListener("click", () => {
    q("[data-ex-add-form]")?.classList.remove("hidden");
  });

  q("[data-ex-cancel]")?.addEventListener("click", () => {
    q("[data-ex-add-form]")?.classList.add("hidden");
  });

  q("[data-ex-save]")?.addEventListener("click", async () => {
    const name = (q<HTMLInputElement>("[data-ex-name]")?.value || "").trim();
    const category = (q<HTMLSelectElement>("[data-ex-category]")?.value || "").trim() || null;
    const rest = parseInt((q<HTMLInputElement>("[data-ex-rest]")?.value || "90"), 10);
    const notes = (q<HTMLTextAreaElement>("[data-ex-notes]")?.value || "").trim() || null;
    const muscle_group = (q<HTMLSelectElement>("[data-ex-muscle]")?.value || "").trim() || null;
    const equipment = (q<HTMLSelectElement>("[data-ex-equipment]")?.value || "").trim() || null;

    if (!name) return;

    try {
      await post("/api/exercises", { name, category, default_rest_s: rest, notes, muscle_group, equipment });
      (q<HTMLInputElement>("[data-ex-name]")!.value = "");
      (q<HTMLSelectElement>("[data-ex-category]")!.value = "");
      (q<HTMLSelectElement>("[data-ex-muscle]")!.value = "");
      (q<HTMLSelectElement>("[data-ex-equipment]")!.value = "");
      (q<HTMLInputElement>("[data-ex-rest]")!.value = "90");
      (q<HTMLTextAreaElement>("[data-ex-notes]")!.value = "");
      q("[data-ex-add-form]")?.classList.add("hidden");
      load();
    } catch {}
  });
});
