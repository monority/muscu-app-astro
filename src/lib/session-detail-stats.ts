/**
 * session-detail-stats — Pure computation functions for session detail page.
 *
 * Extracted from pages/sessions/detail.astro for testability and reuse.
 * All functions are pure: they take data in, return results out.
 * No DOM, no localStorage, no Alpine dependency.
 */

import type { Session, SessionExercise } from './storage';
import { exerciseVolume } from './workout-helpers';

// ── Types ───────────────────────────────────────────────────────

export interface RpeStats {
  count: number;
  avg: number;
  max: number;
  allTen: boolean;
}

export interface RpeSuggestion {
  headline: string;
  detail: string;
  tone: 'up' | 'maintain' | 'down';
}

// ── RPE Stats ───────────────────────────────────────────────────

/**
 * Aggregates RPE values across the whole session (completed sets only).
 * Returns count=0 when no RPE is recorded.
 */
export function computeRpeStats(session: Session | null): RpeStats {
  if (!session) return { count: 0, avg: 0, max: 0, allTen: false };

  let count = 0;
  let sum = 0;
  let max = 0;
  let allTen = true;

  for (const ex of session.exercises) {
    for (const set of ex.sets) {
      if (!set.completed) continue;
      if (set.rpe == null || !Number.isFinite(set.rpe)) continue;

      count += 1;
      sum += set.rpe;
      if (set.rpe > max) max = set.rpe;
      if (set.rpe < 10) allTen = false;
    }
  }

  if (count === 0) return { count: 0, avg: 0, max: 0, allTen: false };
  return { count, avg: sum / count, max, allTen };
}

// ── RPE Suggestion ──────────────────────────────────────────────

export interface SuggestionLabels {
  allTenHeadline: string;
  allTenDetail: string;
  increaseHeadline: string;
  increaseDetail: string;
  maintainHeadline: string;
  maintainDetail: string;
  continueHeadline: string;
  continueDetail: string;
}

/**
 * Returns the headline + detail + tone for the suggestion card,
 * or null when no actionable advice can be given.
 */
export function computeRpeSuggestion(
  stats: RpeStats,
  labels: SuggestionLabels,
): RpeSuggestion | null {
  if (stats.count === 0) return null;

  // Highest priority: every set hit a perfect 10 → back off.
  if (stats.allTen) {
    return {
      headline: labels.allTenHeadline,
      detail: labels.allTenDetail,
      tone: 'down',
    };
  }

  if (stats.avg < 6) {
    return {
      headline: labels.increaseHeadline,
      detail: labels.increaseDetail,
      tone: 'up',
    };
  }

  if (stats.avg > 8) {
    return {
      headline: labels.maintainHeadline,
      detail: labels.maintainDetail,
      tone: 'maintain',
    };
  }

  // Middle ground — no actionable advice.
  return {
    headline: labels.continueHeadline,
    detail: labels.continueDetail,
    tone: 'maintain',
  };
}

// ── Session Stats ───────────────────────────────────────────────

/** Total volume across all exercises in a session. */
export function computeSessionTotalVolume(session: Session | null): number {
  if (!session) return 0;
  return session.exercises.reduce((sum, ex) => sum + exerciseVolume(ex), 0);
}

/** Total number of sets across all exercises in a session. */
export function computeTotalSets(session: Session | null): number {
  if (!session) return 0;
  return session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
}

/** Best estimated 1RM for a single exercise. */
export function computeBest1RM(
  exercise: SessionExercise,
  calculate1RM: (weight: number, reps: number) => number,
): number {
  let best = 0;
  for (const set of exercise.sets) {
    if (!set.completed) continue;
    const e = calculate1RM(set.weight, set.reps);
    if (e > best) best = e;
  }
  return best;
}

// ── Notes Check ─────────────────────────────────────────────────

/** Check if session has any notes (RPE, fatigue, mood, or free text). */
export function hasNotes(session: Session | null): boolean {
  if (!session) return false;
  return (
    (session.rpe != null && Number.isFinite(session.rpe)) ||
    (session.fatigue != null && session.fatigue > 0) ||
    session.mood != null ||
    (session.notes != null && session.notes.trim() !== '')
  );
}

// ── RPE Tone/Label Helpers ──────────────────────────────────────

export type RpeTone = 'easy' | 'moderate' | 'hard' | 'max' | 'none';

/** Classify RPE value into a tone category. */
export function rpeTone(rpe: number | undefined | null): RpeTone {
  if (rpe == null || !Number.isFinite(rpe)) return 'none';
  if (rpe <= 3) return 'easy';
  if (rpe <= 6) return 'moderate';
  if (rpe <= 8) return 'hard';
  return 'max';
}

export interface RpeLabels {
  easy: string;
  moderate: string;
  hard: string;
  max: string;
}

/** Get localized label for RPE tone. */
export function rpeLabel(rpe: number | undefined | null, labels: RpeLabels): string {
  const tone = rpeTone(rpe);
  if (tone === 'easy') return labels.easy;
  if (tone === 'moderate') return labels.moderate;
  if (tone === 'hard') return labels.hard;
  if (tone === 'max') return labels.max;
  return '—';
}

// ── Fatigue Label ───────────────────────────────────────────────

export interface FatigueLabels {
  veryFresh: string;
  fresh: string;
  normal: string;
  tired: string;
  exhausted: string;
}

/** Get localized label for fatigue level. */
export function fatigueLabel(level: number | undefined | null, labels: FatigueLabels): string {
  if (!level || level <= 0) return '—';
  if (level === 1) return labels.veryFresh;
  if (level === 2) return labels.fresh;
  if (level === 3) return labels.normal;
  if (level === 4) return labels.tired;
  return labels.exhausted;
}
