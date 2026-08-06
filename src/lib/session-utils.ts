/**
 * Pure helpers for in-workout session manipulation.
 *
 * Kept free of Alpine / DOM concerns so they stay unit-testable.
 */

import type { Session, SessionSet } from './storage';

export interface UndoLastSetResult {
  /** A shallow copy of the session with the last completed set reverted. */
  session: Session;
  /** The set that was reverted (original reference, before copy). */
  set: SessionSet;
  exerciseIndex: number;
  setIndex: number;
}

/**
 * Reverts the most recently completed set (scanning the session from the
 * end) to `completed: false`. Returns a new session object plus the
 * location of the reverted set, or `null` when nothing is completed.
 */
export function undoLastCompletedSet(session: Session): UndoLastSetResult | null {
  for (let ei = session.exercises.length - 1; ei >= 0; ei--) {
    const sets = session.exercises[ei].sets;
    for (let si = sets.length - 1; si >= 0; si--) {
      const set = sets[si];
      if (!set.completed) continue;
      const copy: Session = {
        ...session,
        exercises: session.exercises.map((ex, i) =>
          i === ei
            ? { ...ex, sets: ex.sets.map((s, j) => (j === si ? { ...s, completed: false } : s)) }
            : ex,
        ),
      };
      return { session: copy, set, exerciseIndex: ei, setIndex: si };
    }
  }
  return null;
}

/** Total volume (kg × reps) of the completed sets only. */
export function completedVolume(session: Session): number {
  return session.exercises.reduce(
    (sum, ex) =>
      sum +
      ex.sets.reduce(
        (s, set) => (set.completed ? s + set.weight * set.reps : s),
        0,
      ),
    0,
  );
}
