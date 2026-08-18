/**
 * Volume breakdown by muscle group over a period.
 *
 * Roadmap P2 « Répartition volume par groupe musculaire »: camembert/donut of
 * Σ volume per muscle group, filtered by period (week / month / all).
 *
 * ── Grouping rule ─────────────────────────────────────────────────────────
 * Each completed set is attributed to `SessionExercise.muscle` — the muscle
 * group snapshot recorded when the session was logged (source:
 * `Exercise.muscle` from the exercise catalog, e.g. "Pectoraux", "Dos").
 * This is the same field the exercices page filters on and the previous
 * 12-week muscle donut used. It is denormalized on the session, so the
 * breakdown keeps working after an exercise is edited, renamed or deleted
 * (no catalog re-resolution by id). A set whose muscle is missing/blank
 * falls back into the "Autre" bucket.
 *
 * ── Volume ────────────────────────────────────────────────────────────────
 * Σ weight × reps over completed sets (of any type, warmups included) in
 * completed sessions only — identical convention to the rest of the stats
 * page. Returns one record per muscle, biggest volume first, plus the
 * share (0..100) of the period's total volume.
 *
 * ── Periods ───────────────────────────────────────────────────────────────
 * - 'week':  rolling last 7 days (from N-6 to N) — matches « 7 derniers jours ».
 * - 'month': rolling last 30 days (from N-29 to N) — matches « 30 derniers jours ».
 * - 'all':   no date filter.
 *
 * The module is i18n-agnostic: `id` is the canonical stored muscle key (FR,
 * e.g. "Pectoraux"). Localize for display with `trMuscle()` at render time
 * (repo convention — data is stored in FR and never mutated; see
 * src/i18n/exercise-translations.ts).
 */

import type { Session } from './storage';
import { completedSets } from './session-utils';

export type VolumePeriod = 'week' | 'month' | 'all';

export interface VolumeOptions {
  period?: VolumePeriod;
  /** Anchor for the rolling windows; override in tests. */
  now?: Date;
}

export interface MuscleVolumeSlice {
  /** Canonical muscle-group id (stored FR key, e.g. "Pectoraux"). */
  id: string;
  /** Canonical muscle-group name — same as `id`; feed to `trMuscle()`. */
  muscle: string;
  /** Σ weight × reps for the period, in kg. */
  volume: number;
  /** Share of the period's total volume, 0..100. */
  pct: number;
}

/** Fallback bucket for sets whose muscle group is missing/unknown. */
export const OTHER_MUSCLE = 'Autre';

/** Rolling window lengths (days) used per period. */
const PERIOD_DAYS: Record<Exclude<VolumePeriod, 'all'>, number> = {
  week: 7,
  month: 30,
};

/**
 * Volume per muscle group for the given sessions, filtered by `period`.
 * Empty when no completed sets fall inside the period.
 */
export function volumeByMuscle(
  sessions: Session[],
  options: VolumeOptions = {},
): MuscleVolumeSlice[] {
  const period = options.period ?? 'all';
  const now = options.now ?? new Date();

  // Rolling cutoff: N - (days - 1) at 00:00 local, so "today" is included.
  let minTime: number | null = null;
  if (period === 'week' || period === 'month') {
    const d = new Date(now);
    d.setDate(d.getDate() - (PERIOD_DAYS[period] - 1));
    d.setHours(0, 0, 0, 0);
    minTime = d.getTime();
  }

  const totals = new Map<string, number>();

  // Pre-filter sessions by date window before iterating sets.
  const filtered = sessions.filter((session) => {
    if (session.status !== 'completed') return false;
    if (!session.date) return false;
    if (minTime !== null) {
      const t = new Date(session.date + 'T00:00:00').getTime();
      if (isNaN(t) || t < minTime) return false;
    }
    return true;
  });

  for (const { exercise, set } of completedSets(filtered)) {
    const muscle =
      exercise.muscle && exercise.muscle.trim().length > 0 ? exercise.muscle : OTHER_MUSCLE;
    const vol = set.weight * set.reps;
    if (vol > 0) totals.set(muscle, (totals.get(muscle) ?? 0) + vol);
  }

  const total = Array.from(totals.values()).reduce((s, v) => s + v, 0);
  if (total <= 0) return [];

  return Array.from(totals.entries())
    .map(([muscle, volume]) => ({
      id: muscle,
      muscle,
      volume,
      pct: (volume / total) * 100,
    }))
    .sort((a, b) => b.volume - a.volume);
}