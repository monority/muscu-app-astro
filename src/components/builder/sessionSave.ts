/**
 * sessionSave — Pure logic for session save/discard.
 *
 * Handles: transient exercise persistence, payload building, supersets cleanup.
 * No DOM, no Alpine dependency.
 */

import {
  saveExercise,
  saveSession,
  updateSession,
  getSessionById,
  type Exercise,
  type SessionExercise,
  type SessionMood,
} from "../../lib/storage";
import { type BuilderExercise } from "../../lib/session-builder-stats";

const TEMPLATE_FALLBACK_CATEGORY = "Autre";

// ── Transient exercise persistence ─────────────────────────────

export function persistTransientExercises(
  exercises: BuilderExercise[],
): Map<string, string> {
  const transient = exercises.filter((e) =>
    e.exerciseId.startsWith("template:"),
  );
  const idMap = new Map<string, string>();
  for (const ex of transient) {
    if (idMap.has(ex.exerciseId)) continue;
    const created = saveExercise({
      name: ex.name,
      muscle: ex.muscle,
      category: TEMPLATE_FALLBACK_CATEGORY,
    });
    idMap.set(ex.exerciseId, created.id);
  }
  return idMap;
}

// ── Exercise cleaning ──────────────────────────────────────────

export function cleanExercises(
  exercises: BuilderExercise[],
  idMap: Map<string, string>,
): SessionExercise[] {
  return exercises.map(({ supersetId: _sid, ...ex }) => ({
    ...ex,
    exerciseId: idMap.get(ex.exerciseId) ?? ex.exerciseId,
    sets: ex.sets.map((set) => ({
      ...set,
      exerciseId: idMap.get(set.exerciseId) ?? set.exerciseId,
    })),
  }));
}

// ── Superset building ──────────────────────────────────────────

export function buildSupersets(
  exercises: BuilderExercise[],
  idMap: Map<string, string>,
): { exercises: string[] }[] {
  const groupMap = new Map<number, string[]>();
  for (const ex of exercises) {
    if (ex.supersetId == null) continue;
    const list = groupMap.get(ex.supersetId) ?? [];
    list.push(idMap.get(ex.exerciseId) ?? ex.exerciseId);
    groupMap.set(ex.supersetId, list);
  }
  const supersets: { exercises: string[] }[] = [];
  for (const [, ids] of groupMap) {
    if (ids.length >= 2) supersets.push({ exercises: ids });
  }
  return supersets;
}

// ── Payload building ───────────────────────────────────────────

export interface SessionPayload {
  name: string;
  date: string;
  exercises: SessionExercise[];
  status: string;
  rpe?: number;
  fatigue?: number;
  mood?: SessionMood;
  notes?: string;
  supersets?: { exercises: string[] }[];
  sourceSessionId?: string;
}

export function buildPayload(opts: {
  name: string;
  date: string;
  exercises: BuilderExercise[];
  rpe: number;
  fatigue: number;
  mood: SessionMood | "";
  notes: string;
  editSessionId: string | null;
  idMap: Map<string, string>;
}): SessionPayload {
  const clean = cleanExercises(opts.exercises, opts.idMap);
  const supersets = buildSupersets(opts.exercises, opts.idMap);

  const payload: SessionPayload = {
    name: opts.name.trim(),
    date: opts.date,
    exercises: clean,
    status:
      (opts.editSessionId
        ? getSessionById(opts.editSessionId)?.status
        : null) ?? "planned",
  };
  if (opts.rpe) payload.rpe = opts.rpe;
  if (opts.fatigue > 0) payload.fatigue = opts.fatigue;
  if (opts.mood !== "") payload.mood = opts.mood;
  if (opts.notes.trim() !== "") payload.notes = opts.notes.trim();
  if (supersets.length > 0) payload.supersets = supersets;

  if (opts.editSessionId) {
    const existing = getSessionById(opts.editSessionId);
    if (existing?.sourceSessionId)
      payload.sourceSessionId = existing.sourceSessionId;
  }

  return payload;
}

// ── Save / discard ─────────────────────────────────────────────

export function saveSessionBuilder(opts: {
  name: string;
  date: string;
  exercises: BuilderExercise[];
  rpe: number;
  fatigue: number;
  mood: SessionMood | "";
  notes: string;
  editSessionId: string | null;
}): void {
  const idMap = persistTransientExercises(opts.exercises);
  const payload = buildPayload({ ...opts, idMap });

  if (opts.editSessionId) {
    updateSession(opts.editSessionId, payload);
  } else {
    saveSession(payload);
  }
}

export function shouldConfirmDiscard(
  exerciseCount: number,
  sessionName: string,
): boolean {
  return exerciseCount > 0 || sessionName.trim().length > 0;
}
