import { get, post, patch, del } from "../lib/api";
import { ExerciseSearch } from "./exercise-search";
import { RestTimer } from "./rest-timer";
import { showToast } from "./toast";

interface Exercise {
  id: number;
  name: string;
  default_rest_s: number;
}

interface ExerciseSet {
  id: number;
  set_number: number;
  weight_kg: number;
  reps: number;
  rest_s: number | null;
  notes: string | null;
  exercises: { name: string };
}

interface TemplateEx {
  id: number;
  name: string;
  default_rest_s: number;
}

let state: {
  sessionId: number | null;
  exercise: Exercise | null;
  sets: ExerciseSet[];
  templateExercises: TemplateEx[] | null;
  templateIndex: number;
};
let editingSetId: number | null = null;
let timer: RestTimer;
let search: ExerciseSearch;

function q<T = HTMLElement>(s: string): T | null {
  return document.querySelector<T>(s);
}

function qq<T = HTMLElement>(s: string): NodeListOf<T> {
  return document.querySelectorAll<T>(s);
}

function setLoading(loading: boolean) {
  const btn = q<HTMLButtonElement>("[data-set-submit]");
  if (!btn) return;
  if (loading) {
    btn.setAttribute("data-loading", "");
    btn.disabled = true;
    q("[data-set-error]")!.hidden = true;
  } else {
    btn.removeAttribute("data-loading");
    btn.disabled = !(state.exercise && isValidForm());
  }
}

function setError(message: string) {
  const el = q<HTMLElement>("[data-set-error]");
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  setLoading(false);
}

function isValidForm() {
  const weight = parseFloat((q<HTMLInputElement>("[data-set-weight]")?.value || "0").replace(",", "."));
  const reps = parseInt((q<HTMLInputElement>("[data-set-reps]")?.value || "0"), 10);
  return weight > 0 && reps > 0;
}

function getExerciseSets() {
  if (!state.exercise) return state.sets;
  return state.sets.filter((s) => s.exercises.name === state.exercise!.name);
}

function showSessionError(msg: string) {
  q("[data-session-loading]")?.classList.add("hidden");
  const el = q<HTMLElement>("[data-session-error]");
  if (el) {
    el.innerHTML = `<div class="error-state" role="alert" aria-live="polite">
      <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" style="width:3.2rem;height:3.2rem;color:var(--accent)"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
      <h2 style="margin:0;font-size:1.6rem;font-weight:700;color:var(--text)">Une erreur est survenue</h2>
      <p style="margin:0;font-size:1.3rem;color:var(--muted)">${msg}</p>
      <button class="error-retry" type="button" style="min-height:3.8rem;padding:0.6rem 1.6rem;border:1px solid hsl(0 84% 62% / 0.45);border-radius:var(--radius-md);background:var(--accent);color:var(--accent-foreground);font:inherit;font-size:1.3rem;font-weight:700;cursor:pointer">Réessayer</button>
    </div>`;
    el.hidden = false;
    el.querySelector(".error-retry")?.addEventListener("click", () => { el.hidden = true; init(); });
  }
}

function init() {
  state = { sessionId: null, exercise: null, sets: [], templateExercises: null, templateIndex: 0 };

  const timerContainer = q<HTMLElement>("[data-rest-timer-container]")!;
  timer = new RestTimer(timerContainer);
  timer.onComplete = () => onTimerComplete();

  const input = q<HTMLInputElement>("[data-exercise-search]")!;
  const results = q<HTMLElement>("[data-exercise-results]")!;
  const selected = q<HTMLElement>("[data-exercise-selected]")!;
  search = new ExerciseSearch(input, results, selected);
  search.onSelect = (ex) => onExerciseSelect(ex);

  q<HTMLElement>("[data-set-submit]")?.addEventListener("click", logSet);
  q<HTMLElement>("[data-set-cancel]")?.addEventListener("click", cancelEdit);
  q<HTMLElement>("[data-session-end]")?.addEventListener("click", endSession);
  q<HTMLElement>("[data-session-create]")?.addEventListener("click", startNewSession);

  q<HTMLElement>("[data-exercise-change]")?.addEventListener("click", () => {
    state.exercise = null;
    editingSetId = null;
    search.reset();
    q<HTMLElement>("[data-form-container]")!.hidden = true;
    q<HTMLElement>("[data-set-cancel]")!.hidden = true;
    q<HTMLElement>("[data-set-submit-text]")!.textContent = "Enregistrer la série";
    cancelEdit();
  });

  q<HTMLElement>("[data-set-history]")?.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const deleteBtn = target.closest<HTMLButtonElement>("[data-delete-set]");
    if (deleteBtn) {
      deleteSet(parseInt(deleteBtn.getAttribute("data-delete-set")!, 10));
      return;
    }
    const editBtn = target.closest<HTMLButtonElement>("[data-edit-set]");
    if (editBtn) {
      startEdit(parseInt(editBtn.getAttribute("data-edit-set")!, 10));
      return;
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && editingSetId) {
      cancelEdit();
      return;
    }
    if (e.key === "Enter") {
      const active = document.activeElement;
      if (active?.matches("[data-set-weight], [data-set-reps], [data-set-notes]")) {
        e.preventDefault();
        logSet();
      }
    }
  });

  ["data-set-weight", "data-set-reps"].forEach((attr) => {
    q<HTMLInputElement>(`[${attr}]`)?.addEventListener("input", validateForm);
  });

  q("[data-template-next]")?.addEventListener("click", nextTemplateExercise);

  q("[data-session-loading]")?.classList.remove("hidden");
  q("[data-session-error]")!.hidden = true;

  const params = new URLSearchParams(window.location.search);
  const templateSessionId = params.get("template");
  const templateIdFromParam = params.get("tid");

  if (templateSessionId && templateIdFromParam) {
    startFromTemplate(parseInt(templateSessionId, 10), parseInt(templateIdFromParam, 10)).catch((err) => {
      showSessionError(err instanceof Error ? err.message : "Erreur de chargement");
    }).finally(() => {
      q("[data-session-loading]")?.classList.add("hidden");
    });
  } else {
    loadOrCreateSession().catch((err) => {
      showSessionError(err instanceof Error ? err.message : "Erreur de chargement");
    }).finally(() => {
      q("[data-session-loading]")?.classList.add("hidden");
    });
  }
}

async function startFromTemplate(sessionId: number, templateId: number) {
  state.sessionId = sessionId;

  const templateResp = await get<{ exercises: { exercise_id: number; exercises: { id: number; name: string; default_rest_s: number } }[] }>(
    `/api/templates/${templateId}`
  );

  if (templateResp.exercises?.length) {
    state.templateExercises = templateResp.exercises.map((ex) => ({
      id: ex.exercise_id,
      name: ex.exercises.name,
      default_rest_s: ex.exercises.default_rest_s,
    }));
    state.templateIndex = 0;
    selectTemplateExercise(0);
  }

  q<HTMLElement>("[data-session-track]")!.hidden = false;
  q<HTMLElement>("[data-session-start]")!.hidden = true;
  q<HTMLElement>("[data-session-end]")!.hidden = false;

  await loadSets();
}

function selectTemplateExercise(index: number) {
  if (!state.templateExercises || index >= state.templateExercises.length) return;

  const ex = state.templateExercises[index];
  state.templateIndex = index;

  search.setValue(ex.name);
  state.exercise = { id: ex.id, name: ex.name, default_rest_s: ex.default_rest_s };
  q<HTMLElement>("[data-form-container]")!.hidden = false;

  const prog = q<HTMLElement>("[data-template-progress]")!;
  prog.hidden = false;
  q<HTMLElement>("[data-template-progress-text]")!.textContent = `Exercice ${index + 1}/${state.templateExercises.length} — ${ex.name}`;

  const nextBtn = q<HTMLElement>("[data-template-next]")!;
  nextBtn.hidden = index >= state.templateExercises.length - 1;

  q<HTMLInputElement>("[data-set-weight]")!.focus();
  validateForm();
}

function nextTemplateExercise() {
  if (!state.templateExercises) return;
  const next = state.templateIndex + 1;
  if (next < state.templateExercises.length) {
    selectTemplateExercise(next);
  } else {
    q<HTMLElement>("[data-template-progress]")!.hidden = true;
    showToast("Template terminé ! 🎉", "success");
  }
}

async function loadOrCreateSession() {
  const session = await get<{ id: number } | null>("/api/sessions/active");

  if (session) {
    state.sessionId = session.id;
    await loadSets();
    q<HTMLElement>("[data-session-track]")!.hidden = false;
    q<HTMLElement>("[data-session-start]")!.hidden = true;
    q<HTMLElement>("[data-session-end]")!.hidden = false;
  } else {
    q<HTMLElement>("[data-session-start]")!.hidden = false;
    q<HTMLElement>("[data-session-track]")!.hidden = true;
  }
}

async function startNewSession() {
  const session = await post<{ id: number; started_at: string }>("/api/sessions");

  if (session) {
    state.sessionId = session.id;
    q<HTMLElement>("[data-session-start]")!.hidden = true;
    q<HTMLElement>("[data-session-track]")!.hidden = false;
    q<HTMLElement>("[data-session-end]")!.hidden = false;
  }
}

async function loadSets() {
  if (!state.sessionId) return;

  const data = await get<ExerciseSet[]>(`/api/sets?session_id=${state.sessionId}`);

  if (data) {
    state.sets = data as unknown as ExerciseSet[];
    renderHistory();
    updateHeader();
  }
}

function onExerciseSelect(ex: Exercise) {
  state.exercise = ex;
  q<HTMLElement>("[data-form-container]")!.hidden = false;
  q<HTMLInputElement>("[data-set-weight]")!.focus();
  validateForm();
}

async function logSet() {
  if (!state.sessionId || !state.exercise) return;

  const weight = parseFloat((q<HTMLInputElement>("[data-set-weight]")!.value || "0").replace(",", "."));
  const reps = parseInt(q<HTMLInputElement>("[data-set-reps]")!.value || "0", 10);
  const notes = (q<HTMLInputElement>("[data-set-notes]")?.value || "").trim() || null;

  if (weight <= 0 || reps <= 0) return;

  setLoading(true);

  try {
    if (editingSetId) {
      const updated = await patch<ExerciseSet>(`/api/sets/${editingSetId}`, { weight_kg: weight, reps: reps, notes: notes });

      const idx = state.sets.findIndex((s) => s.id === editingSetId);
      if (idx !== -1) {
        state.sets[idx].weight_kg = weight;
        state.sets[idx].reps = reps;
        state.sets[idx].notes = notes;
      }

      showToast("Série modifiée ✓", "success");
      cancelEdit();
    } else {
      const setNumber = getExerciseSets().length + 1;

      const set = await post<ExerciseSet>("/api/sets", {
        session_id: state.sessionId,
        exercise_id: state.exercise.id,
        set_number: setNumber,
        weight_kg: weight,
        reps: reps,
        rest_s: state.exercise.default_rest_s,
        notes: notes,
      });

      state.sets.push(set as unknown as ExerciseSet);
      showToast(`Série #${setNumber} enregistrée ✓`, "success");

      timer.start(state.exercise.default_rest_s);
    }

    renderHistory();
    updateHeader();

    (q<HTMLInputElement>("[data-set-weight]")!.value = "");
    (q<HTMLInputElement>("[data-set-reps]")!.value = "");
    (q<HTMLInputElement>("[data-set-notes]")!.value = "");
    q<HTMLInputElement>("[data-set-weight]")!.focus();
    validateForm();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur lors de l'enregistrement";
    setError(msg);
    showToast(msg, "error");
  } finally {
    setLoading(false);
  }
}

async function deleteSet(setId: number) {
  if (!confirm("Supprimer cette série ?")) return;

  try {
    await del(`/api/sets/${setId}`);

    state.sets = state.sets.filter((s) => s.id !== setId);
    if (editingSetId === setId) cancelEdit();
    renderHistory();
    updateHeader();
    showToast("Série supprimée", "info");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur lors de la suppression";
    showToast(msg, "error");
  }
}

function startEdit(setId: number) {
  const set = state.sets.find((s) => s.id === setId);
  if (!set) return;

  editingSetId = setId;
  (q<HTMLInputElement>("[data-set-weight]")!.value = String(set.weight_kg));
  (q<HTMLInputElement>("[data-set-reps]")!.value = String(set.reps));
  (q<HTMLInputElement>("[data-set-notes]")!.value = set.notes ?? "");
  q<HTMLInputElement>("[data-set-weight]")!.focus();

  const btn = q<HTMLButtonElement>("[data-set-submit]")!;
  q<HTMLElement>("[data-set-submit-text]")!.textContent = "Modifier la série";
  q<HTMLElement>("[data-set-cancel]")!.hidden = false;

  validateForm();
}

function cancelEdit() {
  editingSetId = null;
  (q<HTMLInputElement>("[data-set-weight]")!.value = "");
  (q<HTMLInputElement>("[data-set-reps]")!.value = "");
  (q<HTMLInputElement>("[data-set-notes]")!.value = "");
  q<HTMLElement>("[data-set-submit-text]")!.textContent = "Enregistrer la série";
  q<HTMLElement>("[data-set-cancel]")!.hidden = true;
  validateForm();
}

function onTimerComplete() {
  q<HTMLInputElement>("[data-set-weight]")!.focus();
}

async function endSession() {
  if (!state.sessionId) return;
  if (!confirm("Terminer la séance ?")) return;

  try {
    await patch(`/api/sessions/${state.sessionId}`, { ended_at: new Date().toISOString() });
    window.location.href = "/";
  } catch {}
}

function renderHistory() {
  const list = q<HTMLElement>("[data-set-history]")!;
  list.innerHTML = "";

  const filtered = getExerciseSets();

  for (const set of filtered) {
    const li = document.createElement("li");
    li.innerHTML =
      `<span class="set-number">#${set.set_number}</span>` +
      `<span class="set-detail">${set.weight_kg} kg × ${set.reps}</span>` +
      `<span class="set-rest">${set.exercises.name}</span>` +
      `<div class="set-actions">` +
      `<button class="set-edit-btn" data-edit-set="${set.id}" aria-label="Modifier">✎</button>` +
      `<button class="set-delete-btn" data-delete-set="${set.id}" aria-label="Supprimer">✕</button>` +
      `</div>`;
    list.appendChild(li);
  }

  list.hidden = filtered.length === 0;
  q<HTMLElement>(".set-history-empty")!.hidden = filtered.length > 0;
}

function updateHeader() {
  if (state.exercise) {
    q<HTMLElement>("[data-exercise-name]")!.textContent = state.exercise.name;
  }

  const filtered = getExerciseSets();
  q<HTMLElement>("[data-set-count]")!.textContent = String(filtered.length);

  const lastSetEl = q<HTMLElement>("[data-last-set]");
  const lastSetDetail = q<HTMLElement>("[data-last-set-detail]");
  if (filtered.length > 0 && lastSetEl && lastSetDetail) {
    const last = filtered[filtered.length - 1];
    lastSetDetail.textContent = `${last.weight_kg} kg × ${last.reps}`;
    lastSetEl.hidden = false;
  } else if (lastSetEl) {
    lastSetEl.hidden = true;
  }
}

function validateForm() {
  const btn = q<HTMLButtonElement>("[data-set-submit]")!;
  btn.disabled = !(state.exercise && isValidForm());
}

document.addEventListener("DOMContentLoaded", () => {
  init();
});
