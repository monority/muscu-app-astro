/**
 * editSessionLoader — Load edit session data into builder state.
 *
 * Pure transformation: session → builder fields.
 * No DOM, no Alpine dependency.
 */

import { getSessionById, type Session } from "../../lib/storage";
import { type BuilderExercise } from "../../lib/session-builder-stats";

export interface EditSessionData {
  sessionId: string;
  name: string;
  date: string;
  rpe: number;
  fatigue: number;
  mood: string;
  notes: string;
  exercises: BuilderExercise[];
}

export function loadEditSession(
  sessionId: string,
): EditSessionData | null {
  const session = getSessionById(sessionId);
  if (!session) return null;

  const supersetIds = new Map<string, number>();
  session.supersets?.forEach((group, index) => {
    group.exercises.forEach((exerciseId) =>
      supersetIds.set(exerciseId, index + 1),
    );
  });

  return {
    sessionId: session.id,
    name: session.name,
    date: session.date.slice(0, 10),
    rpe: session.rpe ?? 5,
    fatigue: session.fatigue ?? 0,
    mood: session.mood ?? "",
    notes: session.notes ?? "",
    exercises: session.exercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => ({ ...set, completed: false })),
      supersetId: supersetIds.get(exercise.exerciseId) ?? null,
    })),
  };
}
