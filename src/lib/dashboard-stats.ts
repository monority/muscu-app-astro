/**
 * dashboard-stats — Pure computation functions for the dashboard.
 *
 * Extracted from pages/index.astro for testability and reuse.
 * All functions are pure: they take data in, return results out.
 * No DOM, no localStorage, no Alpine dependency.
 */

import { calculate1RM, type Session } from './storage';

// ── Date helpers ───────────────────────────────────────────────

/** ISO date key YYYY-MM-DD (local-tz) — day-level comparisons. */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ── Per-session ────────────────────────────────────────────────

/** Sum of weight × reps over completed sets. */
export function computeSessionVolume(session: Session): number {
  return session.exercises.reduce((sum, ex) => {
    return (
      sum +
      ex.sets.reduce((sSum, set) => {
        return sSum + (set.completed ? set.weight * set.reps : 0);
      }, 0)
    );
  }, 0);
}

/** Most frequent muscle across the session's exercises ('' when none). */
export function computeSessionPrimaryMuscle(session: Session): string {
  const counts = new Map<string, number>();
  for (const ex of session.exercises) {
    if (!ex.muscle) continue;
    counts.set(ex.muscle, (counts.get(ex.muscle) ?? 0) + 1);
  }
  let best = '';
  let bestCount = 0;
  for (const [muscle, count] of counts) {
    if (count > bestCount) {
      best = muscle;
      bestCount = count;
    }
  }
  return best;
}

// ── Aggregate stats ────────────────────────────────────────────

/** Total volume across all sessions. */
export function computeTotalVolume(sessions: Session[]): number {
  return sessions.reduce((sum, s) => sum + computeSessionVolume(s), 0);
}

/** Sum of session volumes for today. */
export function computeTodayVolume(sessions: Session[]): number {
  const key = dateKey(new Date());
  return sessions
    .filter((s) => dateKey(new Date(s.date)) === key)
    .reduce((sum, s) => sum + computeSessionVolume(s), 0);
}

/** Number of sessions today. */
export function computeTodaySessions(sessions: Session[]): number {
  const key = dateKey(new Date());
  return sessions.filter((s) => dateKey(new Date(s.date)) === key).length;
}

/** Count of distinct exercises across today's sessions. */
export function computeTodayExercises(sessions: Session[]): number {
  const key = dateKey(new Date());
  const seen = new Set<string>();
  for (const s of sessions) {
    if (dateKey(new Date(s.date)) !== key) continue;
    for (const ex of s.exercises) seen.add(ex.exerciseId);
  }
  return seen.size;
}

/** Number of unique exercises with at least one completed set. */
export function computeBestPRs(sessions: Session[]): number {
  const trained = new Set<string>();
  for (const s of sessions) {
    for (const ex of s.exercises) {
      if (ex.sets.some((set) => set.completed)) {
        trained.add(ex.exerciseId);
      }
    }
  }
  return trained.size;
}

/** Highest estimated 1RM across all completed sets. */
export function computeTop1RM(sessions: Session[]): number {
  let best = 0;
  for (const s of sessions) {
    for (const ex of s.exercises) {
      for (const set of ex.sets) {
        if (!set.completed) continue;
        const oneRM = calculate1RM(set.weight, set.reps);
        if (oneRM > best) best = oneRM;
      }
    }
  }
  return best;
}

// ── Weekly trend ───────────────────────────────────────────────

/** Per-day volume sums (index = getDay(), 0 = Sunday), this week. */
export function computeWeeklyVolumeByDay(sessions: Session[]): number[] {
  const arr = new Array(7).fill(0);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  for (const s of sessions) {
    const d = new Date(s.date);
    if (d < startOfWeek) continue;
    arr[d.getDay()] += computeSessionVolume(s);
  }
  return arr;
}

// ── Streak ─────────────────────────────────────────────────────

/**
 * Consecutive-day streak ending today (or yesterday if today has
 * no session yet). Returns 0 when no completed sessions or when
 * most recent training day is older than yesterday.
 */
export function computeStreak(sessions: Session[]): number {
  const completedDays = new Set(
    sessions
      .filter((s) => s.status === 'completed')
      .map((s) => dateKey(new Date(s.date))),
  );
  if (completedDays.size === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cursor = new Date(today);

  if (!completedDays.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!completedDays.has(dateKey(cursor))) return 0;
  }

  let count = 0;
  while (completedDays.has(dateKey(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}
