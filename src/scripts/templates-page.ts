import { get, post, patch, del } from "../lib/api";
import { showToast } from "./toast";

function q<T = HTMLElement>(s: string): T | null {
  return document.querySelector<T>(s);
}

interface ExOption {
  id: number;
  name: string;
}

interface TemplateCard {
  id: number;
  name: string;
  created_at: string;
  exercise_count: number;
}

let selectedExercises: ExOption[] = [];
let allExercises: ExOption[] = [];
let searchTimeout = 0;

async function load() {
  q("[data-tp-skeleton]")!.classList.remove("hidden");
  q("[data-tp-error]")!.hidden = true;

  try {
    const data = await get<TemplateCard[]>("/api/templates");
    renderList(data ?? []);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur";
    showToast(msg, "error");
  } finally {
    q("[data-tp-skeleton]")?.classList.add("hidden");
  }
}

function renderList(templates: TemplateCard[]) {
  const list = q<HTMLElement>("[data-tp-list]")!;

  if (templates.length === 0) {
    list.innerHTML = `<p style="color:var(--muted);text-align:center;font-size:1.3rem;padding:3.2rem 0">Aucun template pour le moment</p>`;
    return;
  }

  list.innerHTML = templates
    .map(
      (t) => `
      <div class="tp-card" data-tp-card="${t.id}">
        <div class="tp-card-header">
          <div>
            <div class="tp-card-name">${t.name}</div>
            <div class="tp-card-count">${t.exercise_count} exercice${t.exercise_count > 1 ? "s" : ""}</div>
          </div>
          <div class="tp-card-actions">
            <button class="tp-start-btn" type="button" data-tp-start="${t.id}">Démarrer</button>
            <button class="tp-expand-btn" type="button" data-tp-expand="${t.id}">Détails</button>
            <button class="tp-delete-btn" type="button" data-tp-delete="${t.id}">Suppr.</button>
          </div>
        </div>
        <div class="tp-ex-list hidden" data-tp-ex-list="${t.id}"></div>
      </div>`,
    )
    .join("");
}

async function expandTemplate(id: number) {
  const exList = q<HTMLElement>(`[data-tp-ex-list="${id}"]`)!;
  if (!exList.hidden) {
    exList.hidden = true;
    return;
  }

  try {
    const data = await get<{ exercises: { id: number; sort_order: number; exercises: { name: string } }[] }>(`/api/templates/${id}`);
    if (data.exercises?.length) {
      exList.innerHTML = data.exercises
        .map(
          (ex) =>
            `<div class="tp-ex-item"><span class="tp-ex-order">#${ex.sort_order + 1}</span>${ex.exercises?.name ?? "?"}</div>`,
        )
        .join("");
    } else {
      exList.innerHTML = `<div class="tp-ex-item" style="color:var(--muted)">Aucun exercice</div>`;
    }
    exList.hidden = false;
  } catch {
    showToast("Erreur de chargement", "error");
  }
}

async function startTemplate(id: number) {
  try {
    const data = await post<{ id: number; template_id: number }>(`/api/templates/${id}/start`);
    window.location.href = `/session?template=${data.id}&tid=${data.template_id}`;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur";
    showToast(msg, "error");
  }
}

async function deleteTemplate(id: number) {
  if (!confirm("Supprimer ce template ?")) return;
  try {
    await del(`/api/templates/${id}`);
    showToast("Template supprimé", "info");
    load();
  } catch {
    showToast("Erreur lors de la suppression", "error");
  }
}

function setupSearch() {
  const input = q<HTMLInputElement>("[data-tp-ex-input]")!;
  const results = q<HTMLElement>("[data-tp-ex-results]")!;

  input.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = window.setTimeout(async () => {
      const qVal = input.value.trim();
      if (qVal.length < 1) {
        results.hidden = true;
        return;
      }
      try {
        allExercises = await get<ExOption[]>(`/api/exercises?search=${encodeURIComponent(qVal)}`);
        results.innerHTML = "";
        if (allExercises.length > 0) {
          for (const ex of allExercises) {
            const li = document.createElement("li");
            li.textContent = ex.name;
            li.addEventListener("click", () => addExercise(ex));
            results.appendChild(li);
          }
        } else {
          const li = document.createElement("li");
          li.textContent = `➕ Créer "${qVal}"`;
          li.addEventListener("click", async () => {
            try {
              const created = await post<ExOption>("/api/exercises", { name: qVal });
              addExercise(created);
              input.value = "";
              results.hidden = true;
            } catch {}
          });
          results.appendChild(li);
        }
        results.hidden = false;
      } catch {}
    }, 250);
  });

  document.addEventListener("click", (e) => {
    if (!input.closest(".tp-ex-search")) {
      results.hidden = true;
    }
  });
}

function addExercise(ex: ExOption) {
  if (selectedExercises.some((e) => e.id === ex.id)) return;
  selectedExercises.push(ex);
  renderSelectedExercises();
  q<HTMLInputElement>("[data-tp-ex-input]")!.value = "";
  q<HTMLElement>("[data-tp-ex-results]")!.hidden = true;
}

function removeExercise(id: number) {
  selectedExercises = selectedExercises.filter((e) => e.id !== id);
  renderSelectedExercises();
}

function renderSelectedExercises() {
  const el = q<HTMLElement>("[data-tp-selected-ex]")!;
  el.innerHTML = selectedExercises
    .map(
      (ex) =>
        `<span class="tp-selected-ex-tag">${ex.name}<button class="tp-selected-ex-remove" type="button" data-rm-ex="${ex.id}">×</button></span>`,
    )
    .join("");
  el.querySelectorAll("[data-rm-ex]").forEach((btn) =>
    btn.addEventListener("click", () => removeExercise(parseInt((btn as HTMLElement).getAttribute("data-rm-ex")!, 10))),
  );
}

document.addEventListener("DOMContentLoaded", () => {
  load();
  setupSearch();

  q("[data-tp-add]")?.addEventListener("click", () => {
    q("[data-tp-create-form]")?.classList.remove("hidden");
  });

  q("[data-tp-cancel]")?.addEventListener("click", () => {
    q("[data-tp-create-form]")?.classList.add("hidden");
    selectedExercises = [];
    renderSelectedExercises();
    (q<HTMLInputElement>("[data-tp-name]")!.value = "");
  });

  q("[data-tp-save]")?.addEventListener("click", async () => {
    const name = (q<HTMLInputElement>("[data-tp-name]")?.value || "").trim();
    if (!name) return;

    try {
      await post("/api/templates", {
        name,
        exercise_ids: selectedExercises.map((e) => e.id),
      });
      q("[data-tp-create-form]")?.classList.add("hidden");
      selectedExercises = [];
      renderSelectedExercises();
      (q<HTMLInputElement>("[data-tp-name]")!.value = "");
      showToast("Template créé ✓", "success");
      load();
    } catch {
      showToast("Erreur lors de la création", "error");
    }
  });

  q("[data-tp-list]")?.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const startBtn = target.closest<HTMLButtonElement>("[data-tp-start]");
    if (startBtn) {
      startTemplate(parseInt(startBtn.getAttribute("data-tp-start")!, 10));
      return;
    }
    const expandBtn = target.closest<HTMLButtonElement>("[data-tp-expand]");
    if (expandBtn) {
      expandTemplate(parseInt(expandBtn.getAttribute("data-tp-expand")!, 10));
      return;
    }
    const deleteBtn = target.closest<HTMLButtonElement>("[data-tp-delete]");
    if (deleteBtn) {
      deleteTemplate(parseInt(deleteBtn.getAttribute("data-tp-delete")!, 10));
      return;
    }
  });
});
