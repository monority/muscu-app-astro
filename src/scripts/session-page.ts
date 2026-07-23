import { supabase } from "../lib/supabase";
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

let state: {
  sessionId: number | null;
  exercise: Exercise | null;
  sets: ExerciseSet[];
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

function init() {
  state = { sessionId: null, exercise: null, sets: [] };

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

  loadOrCreateSession();
}

async function loadOrCreateSession() {
  const { data: session } = await supabase
    .from("sessions")
    .select("id")
    .is("ended_at", null)
    .limit(1)
    .single();

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
  const { data: session } = await supabase
    .from("sessions")
    .insert({})
    .select("id")
    .single();

  if (session) {
    state.sessionId = session.id;
    q<HTMLElement>("[data-session-start]")!.hidden = true;
    q<HTMLElement>("[data-session-track]")!.hidden = false;
    q<HTMLElement>("[data-session-end]")!.hidden = false;
  }
}

async function loadSets() {
  if (!state.sessionId) return;

  const { data } = await supabase
    .from("exercise_sets")
    .select("id, set_number, weight_kg, reps, rest_s, notes, exercises(name)")
    .eq("session_id", state.sessionId)
    .order("completed_at", { ascending: true });

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
      const { error } = await supabase
        .from("exercise_sets")
        .update({ weight_kg: weight, reps: reps, notes: notes })
        .eq("id", editingSetId);

      if (error) throw error;

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

      const { data: set, error } = await supabase
        .from("exercise_sets")
        .insert({
          session_id: state.sessionId,
          exercise_id: state.exercise.id,
          set_number: setNumber,
          weight_kg: weight,
          reps: reps,
          rest_s: state.exercise.default_rest_s,
          notes: notes,
        })
        .select("id, set_number, weight_kg, reps, rest_s, notes, exercises(name)")
        .single();

      if (error) throw error;

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
    const { error } = await supabase.from("exercise_sets").delete().eq("id", setId);
    if (error) throw error;

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

function endSession() {
  if (!state.sessionId) return;
  if (!confirm("Terminer la séance ?")) return;

  supabase
    .from("sessions")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", state.sessionId)
    .then(() => {
      window.location.href = "/";
    });
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
