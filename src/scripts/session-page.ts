import { supabase } from "../lib/supabase";
import { ExerciseSearch } from "./exercise-search";
import { RestTimer } from "./rest-timer";

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
  exercises: { name: string };
}

let state: {
  sessionId: number | null;
  exercise: Exercise | null;
  sets: ExerciseSet[];
};
let timer: RestTimer;
let search: ExerciseSearch;

function q<T = HTMLElement>(s: string): T | null {
  return document.querySelector<T>(s);
}

function qq<T = HTMLElement>(s: string): NodeListOf<T> {
  return document.querySelectorAll<T>(s);
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
  q<HTMLElement>("[data-session-end]")?.addEventListener("click", endSession);
  q<HTMLElement>("[data-session-create]")?.addEventListener("click", startNewSession);

  document.addEventListener("keydown", (e) => {
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
    .select("id, set_number, weight_kg, reps, rest_s, exercises(name)")
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

  const setNumber = state.sets.filter((s) => s.exercises.name === state.exercise!.name).length + 1;

  const { data: set } = await supabase
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
    .select("id, set_number, weight_kg, reps, rest_s, exercises(name)")
    .single();

  if (set) {
    state.sets.push(set as unknown as ExerciseSet);
    renderHistory();
    updateHeader();

    (q<HTMLInputElement>("[data-set-weight]")!.value = "");
    (q<HTMLInputElement>("[data-set-reps]")!.value = "");
    (q<HTMLInputElement>("[data-set-notes]")!.value = "");
    q<HTMLInputElement>("[data-set-weight]")!.focus();
    validateForm();

    timer.start(state.exercise.default_rest_s);
  }
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

  for (const set of state.sets) {
    const li = document.createElement("li");
    li.innerHTML =
      `<span class="set-number">#${set.set_number}</span>` +
      `<span class="set-detail">${set.weight_kg} kg × ${set.reps}</span>` +
      `<span class="set-rest">${set.exercises.name}</span>`;
    list.appendChild(li);
  }

  list.hidden = false;
  q<HTMLElement>(".set-history-empty")!.hidden = state.sets.length > 0;
}

function updateHeader() {
  if (state.exercise) {
    q<HTMLElement>("[data-exercise-name]")!.textContent = state.exercise.name;
  }
  q<HTMLElement>("[data-set-count]")!.textContent = String(state.sets.length);
}

function validateForm() {
  const weight = parseFloat((q<HTMLInputElement>("[data-set-weight]")?.value || "0").replace(",", "."));
  const reps = parseInt((q<HTMLInputElement>("[data-set-reps]")?.value || "0"), 10);
  const btn = q<HTMLButtonElement>("[data-set-submit]")!;
  btn.disabled = !(weight > 0 && reps > 0 && state.exercise);
}

document.addEventListener("DOMContentLoaded", () => {
  init();
});
