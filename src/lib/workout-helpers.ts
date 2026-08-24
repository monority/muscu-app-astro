/**
 * Shared display helpers for session tables (Detail / Print / Quick).
 *
 * Pure functions — no DOM / Alpine dependency. Import from Astro frontmatter
 * or <script> blocks.
 */

import type { SessionExercise, RpeType, SetType } from './storage';

// ── Type labels ────────────────────────────────────────────────

export interface TypeLabels {
  warmup: string;
  work: string;
  top: string;
  drop: string;
  failure: string;
}

/** Localized label for a set type. */
export function typeLabel(type: SetType, labels: TypeLabels): string {
  switch (type) {
    case 'warmup':  return labels.warmup;
    case 'work':    return labels.work;
    case 'top':     return labels.top;
    case 'drop':    return labels.drop;
    case 'failure': return labels.failure;
  }
}

// ── RPE display ────────────────────────────────────────────────

/**
 * Per-set RPE display label: "RPE 7.5" or "uRPE 7".
 * Sets without a value render '—'.
 */
export function formatSetRpe(
  rpe: number | string | null | undefined,
  rpeType?: RpeType,
): string {
  const v = typeof rpe === 'string' ? Number(rpe) : rpe;
  if (v == null || !Number.isFinite(v)) return '—';
  return (rpeType === 'urpe' ? 'uRPE ' : 'RPE ') + v.toString();
}

// ── Volume ─────────────────────────────────────────────────────

/** Total volume (kg × reps) of completed sets for one exercise. */
export function exerciseVolume(ex: SessionExercise): number {
  return ex.sets.reduce(
    (s, set) => s + (set.completed ? set.weight * set.reps : 0),
    0,
  );
}
