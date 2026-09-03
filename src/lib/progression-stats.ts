/**
 * progression-stats — Pure computation for progression index page.
 *
 * Extracted from pages/progression/index.astro for testability.
 * All functions are pure: data in, results out. No DOM, no localStorage.
 */

import { calculate1RM, type Session, type ProgressRecord } from './storage';

// ── Types ───────────────────────────────────────────────────────

export interface ExerciseProgression {
  exerciseId: string;
  name: string;
  muscle: string;
  estimated1RM: number;
  bestWeight: number;
  bestReps: number;
  date: string;
  lastSessionDate: string;
  sessionCount: number;
  history: ProgressRecord[];
}

// ── Aggregation ─────────────────────────────────────────────────

/**
 * Compute per-exercise progression stats across all sessions.
 * Returns exercises sorted by best 1RM descending.
 */
export function computeExerciseProgression(sessions: Session[]): ExerciseProgression[] {
  const map = new Map<string, ExerciseProgression>();

  for (const session of sessions) {
    for (const ex of session.exercises) {
      accumulateExercise(map, ex, session.date);
    }
  }

  return Array.from(map.values())
    .filter((stat) => stat.history.length > 0)
    .sort((a, b) => b.estimated1RM - a.estimated1RM);
}

function accumulateExercise(
  map: Map<string, ExerciseProgression>,
  ex: { exerciseId: string; name: string; muscle: string; sets: { completed: boolean; weight: number; reps: number }[] },
  sessionDate: string,
) {
  let stat = map.get(ex.exerciseId);
  if (!stat) {
    stat = {
      exerciseId: ex.exerciseId,
      name: ex.name,
      muscle: ex.muscle,
      estimated1RM: 0,
      bestWeight: 0,
      bestReps: 0,
      date: '',
      lastSessionDate: '',
      sessionCount: 0,
      history: [],
    };
    map.set(ex.exerciseId, stat);
  }
  let trackedInSession = false;
  for (const set of ex.sets) {
    if (!set.completed) continue;
    trackedInSession = true;
    const record: ProgressRecord = {
      exerciseId: ex.exerciseId,
      date: sessionDate,
      estimated1RM: calculate1RM(set.weight, set.reps),
      bestWeight: set.weight,
      bestReps: set.reps,
    };
    stat.history.push(record);
    if (record.estimated1RM > stat.estimated1RM) {
      stat.estimated1RM = record.estimated1RM;
      stat.bestWeight = record.bestWeight;
      stat.bestReps = record.bestReps;
      stat.date = record.date;
    }
  }
  if (trackedInSession) {
    stat.sessionCount += 1;
    if (!stat.lastSessionDate || sessionDate > stat.lastSessionDate) {
      stat.lastSessionDate = sessionDate;
    }
  }
}

// ── Helpers ─────────────────────────────────────────────────────

/** Global max 1RM across all exercise progressions. */
export function computeMax1RM(stats: ExerciseProgression[]): number {
  let max = 0;
  for (const stat of stats) {
    if (stat.estimated1RM > max) max = stat.estimated1RM;
  }
  return max;
}

/** Height percentage (8..100) for a history bar tick. */
export function historyBarHeight(history: ProgressRecord[], value: number): number {
  if (history.length === 0 || value <= 0) return 0;
  const max = history.reduce((m, r) => (r.estimated1RM > m ? r.estimated1RM : m), 0);
  if (max <= 0) return 8;
  const pct = (value / max) * 100;
  return Math.max(8, Math.min(100, Math.round(pct)));
}
