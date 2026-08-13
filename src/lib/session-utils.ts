/**
 * Pure helpers for in-workout session manipulation.
 *
 * Kept free of Alpine / DOM concerns so they stay unit-testable.
 */

import type { Session, SessionSet } from './storage';

type SessionStatus = 'completed' | 'in-progress' | 'planned';

/** Status labels object with translations for each status. */
export interface StatusLabels {
  completed: string;
  inProgress: string;
  planned: string;
}

/**
 * Returns the localized status label for a session status.
 * The caller provides the translated labels to keep this module
 * i18n-agnostic.
 */
export function statusLabel(status: SessionStatus, labels: StatusLabels): string {
  if (status === 'completed') return labels.completed;
  if (status === 'in-progress') return labels.inProgress;
  return labels.planned;
}

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

/**
 * Counts completed sessions in a measurement interval. The start is
 * inclusive; the next measurement date is exclusive so a session is
 * attributed to exactly one interval. When no end is supplied, the count
 * covers everything from the measurement to today.
 */
function sessionsInInterval(
  sessions: Session[],
  startDate: string,
  endDate?: string,
): Session[] {
  const start = startDate.slice(0, 10);
  const end = endDate ? endDate.slice(0, 10) : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return [];

  return sessions.filter((session) => {
    if (session.status !== 'completed') return false;
    const date = session.date.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < start) return false;
    return !end || date < end;
  });
}

export function countCompletedSessionsBetween(
  sessions: Session[],
  startDate: string,
  endDate?: string,
): number {
  return sessionsInInterval(sessions, startDate, endDate).length;
}

/**
 * Sums completed-set volume in the same interval used for body measurements.
 */
export function completedVolumeBetween(
  sessions: Session[],
  startDate: string,
  endDate?: string,
): number {
  return sessionsInInterval(sessions, startDate, endDate).reduce(
    (total, session) => total + completedVolume(session),
    0,
  );
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
