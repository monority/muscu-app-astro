/**
 * exercises-stats — Pure computation functions for exercises page.
 *
 * Extracted from pages/exercises/index.astro for testability and reuse.
 * All functions are pure: they take data in, return results out.
 * No DOM, no localStorage, no Alpine dependency.
 */

import type { Exercise, Session, SetType } from './storage';

// ── Types ───────────────────────────────────────────────────────

export interface FormState {
  name: string;
  muscle: string;
  customMuscle: string;
  category: string;
}

export interface ResolvedForm {
  name: string;
  muscle: string;
  category: string;
}

export interface AddSetRow {
  type: SetType;
  weight: number;
  reps: number;
}

// ── Constants ───────────────────────────────────────────────────

/** Sentinel value for custom muscle input. */
export const CUSTOM_MUSCLE = '__custom__';

/** Default muscle groups always surfaced in the filter bar. */
export const DEFAULT_MUSCLES = [
  'Pectoraux',
  'Dos',
  'Épaules',
  'Biceps',
  'Triceps',
  'Quadriceps',
  'Ischio-jambiers',
  'Fessiers',
  'Abdominaux',
  'Mollets',
  'Avant-bras',
] as const;

// ── Form ────────────────────────────────────────────────────────

/** Resolve form state into clean exercise data. Returns null if invalid. */
export function resolveForm(form: FormState): ResolvedForm | null {
  const name = form.name.trim();
  const muscle =
    form.muscle === CUSTOM_MUSCLE
      ? form.customMuscle.trim()
      : form.muscle.trim();
  const category = form.category.trim();
  if (!name || !muscle || !category) return null;
  return { name, muscle, category };
}

// ── Set counts ──────────────────────────────────────────────────

/** Compute per-exercise set counts across all sessions. */
export function computeSetCounts(sessions: Session[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const session of sessions) {
    for (const ex of session.exercises) {
      counts[ex.exerciseId] =
        (counts[ex.exerciseId] ?? 0) + ex.sets.length;
    }
  }
  return counts;
}

// ── Filtering ───────────────────────────────────────────────────

/** Filter exercises by search query, muscle group, and favorites flag. */
export function filterExercises(
  exercises: Exercise[],
  options: { search: string; muscle: string; favorites: boolean },
): Exercise[] {
  const q = options.search.trim().toLowerCase();
  const { muscle, favorites } = options;
  return exercises.filter((ex) => {
    if (muscle && ex.muscle !== muscle) return false;
    if (favorites && !ex.favorite) return false;
    if (q && !ex.name.toLowerCase().includes(q)) return false;
    return true;
  });
}

/** Derive sorted muscle group list from exercises + defaults. */
export function computeMuscleGroups(exercises: Exercise[]): string[] {
  const fromData = exercises.map((e) => e.muscle);
  const set = new Set<string>([...DEFAULT_MUSCLES, ...fromData]);
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
}

/** Build muscle options for <select> element. */
export function muscleOptionsForSelect(
  muscleGroups: string[],
  customLabel: string,
): { value: string; label: string }[] {
  return [
    ...muscleGroups.map((m) => ({ value: m, label: m })),
    { value: CUSTOM_MUSCLE, label: customLabel },
  ];
}

// ── URL builder ─────────────────────────────────────────────────

/** Build deep-link URL to trend chart for a specific exercise. */
export function buildTrendUrl(
  exerciseName: string,
  basePath: string,
): string {
  const q = new URLSearchParams({ ex: exerciseName });
  return `${basePath}?${q.toString()}`;
}

// ── Warmup generation ───────────────────────────────────────────

const WARMUP_PERCENTS = [0.4, 0.6, 0.8] as const;
const WARMUP_REPS = [12, 8, 5] as const;

/** Check if any set has working weight. */
export function hasWorkingWeight(sets: AddSetRow[]): boolean {
  return sets.some(
    (s) => (s.type === 'work' || s.type === 'top') && s.weight > 0,
  );
}

/** Generate warmup rows from working sets. Returns empty array if no working weight. */
export function generateWarmupRows(sets: AddSetRow[]): AddSetRow[] {
  const workingSets = sets.filter(
    (s) => (s.type === 'work' || s.type === 'top') && s.weight > 0,
  );
  if (workingSets.length === 0) return [];

  const maxWeight = Math.max(...workingSets.map((s) => s.weight));
  return WARMUP_PERCENTS.map((p, i) => ({
    type: 'warmup' as SetType,
    weight: Math.round(maxWeight * p),
    reps: WARMUP_REPS[i],
  }));
}

// ── Count label ─────────────────────────────────────────────────

/** Format exercise count label. */
export function formatCountLabel(
  count: number,
  singular: string,
  plural: string,
): string {
  return `${count} ${count > 1 ? plural : singular}`;
}
