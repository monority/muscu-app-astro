/**
 * session-builder-stats — Pure computation functions for session builder.
 *
 * Extracted from pages/sessions/create/index.astro for testability and reuse.
 * All functions are pure: they take data in, return results out.
 * No DOM, no localStorage, no Alpine dependency.
 */

import type { SessionExercise, SessionSet, SetType } from './storage';
import type { TemplateExercise } from './templates';

// ── Types ───────────────────────────────────────────────────────

export type RpeLevel = 'easy' | 'moderate' | 'hard' | 'max';

export interface ExerciseSummaryParts {
  setCount: number;
  totalReps: number;
  totalVolume: number;
  topWeight: number;
  topReps: number;
}

export interface BuilderExercise extends SessionExercise {
  supersetId: number | null;
}

// ── RPE helpers ─────────────────────────────────────────────────

/** Classify RPE value into tone category. */
export function rpeTone(rpe: number): RpeLevel {
  if (rpe <= 3) return 'easy';
  if (rpe <= 6) return 'moderate';
  if (rpe <= 8) return 'hard';
  return 'max';
}

// ── Exercise summary ────────────────────────────────────────────

/** Compute raw summary data for a single exercise. */
export function computeExerciseSummary(exercise: SessionExercise): ExerciseSummaryParts {
  const setCount = exercise.sets.length;
  const totalReps = exercise.sets.reduce((sum, s) => sum + (s.reps || 0), 0);
  const totalVolume = exercise.sets.reduce(
    (sum, s) => sum + (s.weight || 0) * (s.reps || 0),
    0,
  );
  const top = exercise.sets.reduce(
    (best, s) => (s.weight > (best?.weight || 0) ? s : best),
    exercise.sets[0],
  );
  return {
    setCount,
    totalReps,
    totalVolume,
    topWeight: top?.weight ?? 0,
    topReps: top?.reps ?? 0,
  };
}

/** Format exercise summary string. */
export function formatExerciseSummary(
  exercise: SessionExercise,
  labels: { noSets: string; setsSingular: string; setsPlural: string; top: string },
): string {
  if (exercise.sets.length === 0) return labels.noSets;
  const { setCount, totalReps, totalVolume, topWeight, topReps } =
    computeExerciseSummary(exercise);
  const setLabel = setCount > 1 ? labels.setsPlural : labels.setsSingular;
  const volume = Math.round(totalVolume);
  const topLine =
    topWeight > 0
      ? ` \u2014 ${labels.top} ${topWeight} kg \u2014 ${topReps}`
      : '';
  return `${setCount} ${setLabel} \u2014 ${totalReps} reps \u2014 ${volume} kg${topLine}`;
}

// ── Warmup generation ───────────────────────────────────────────

const WARMUP_PERCENTS = [0.4, 0.6, 0.8] as const;
const WARMUP_REPS = [12, 8, 5] as const;

/** Generate warmup sets from working sets. Returns empty array if no working weight. */
export function generateWarmupSets(
  exerciseId: string,
  sets: SessionSet[],
): SessionSet[] {
  const workingSets = sets.filter(
    (s) => (s.type === 'work' || s.type === 'top') && s.weight > 0,
  );
  if (workingSets.length === 0) return [];

  const maxWeight = Math.max(...workingSets.map((s) => s.weight));
  const warmups: SessionSet[] = WARMUP_PERCENTS.map((p, i) => ({
    exerciseId,
    setNumber: i + 1,
    type: 'warmup' as SetType,
    weight: Math.round(maxWeight * p),
    reps: WARMUP_REPS[i],
    completed: false,
  }));

  return [
    ...warmups,
    ...sets.map((s, i) => ({
      ...s,
      setNumber: i + warmups.length + 1,
    })),
  ];
}

// ── Template helpers ────────────────────────────────────────────

/** Create a BuilderExercise from a template exercise definition. */
export function buildExerciseFromTemplate(
  exercise: { id: string; name: string; muscle: string },
  template: TemplateExercise,
  defaultSetType: SetType = 'work',
): BuilderExercise {
  const sets: SessionSet[] = [];
  const count = Math.max(1, template.defaultSets);
  for (let i = 0; i < count; i++) {
    sets.push({
      exerciseId: exercise.id,
      setNumber: i + 1,
      weight: 0,
      reps: template.defaultReps,
      type: defaultSetType,
      completed: false,
    });
  }
  return {
    exerciseId: exercise.id,
    name: exercise.name,
    muscle: exercise.muscle,
    sets,
    supersetId: null,
  };
}

// ── Set helpers ─────────────────────────────────────────────────

/** Check if exercise has at least one work/top set with weight > 0. */
export function hasWorkingWeight(exercise: SessionExercise): boolean {
  return exercise.sets.some(
    (s) => (s.type === 'work' || s.type === 'top') && s.weight > 0,
  );
}

/** Create a new set with values inherited from the last set. */
export function createNextSet(
  exerciseId: string,
  setNumber: number,
  lastSet: SessionSet | undefined,
  defaultType: SetType = 'work',
): SessionSet {
  return {
    exerciseId,
    setNumber,
    weight: lastSet ? lastSet.weight : 0,
    reps: lastSet ? lastSet.reps : 0,
    type: defaultType,
    completed: false,
  };
}

// ── Superset helpers ────────────────────────────────────────────

/** Get unique superset IDs from exercises. */
export function getSupersetIds(exercises: BuilderExercise[]): number[] {
  const ids = new Set<number>();
  for (const ex of exercises) {
    if (ex.supersetId != null) ids.add(ex.supersetId);
  }
  return Array.from(ids).sort((a, b) => a - b);
}

/** Compute next superset ID (max + 1). */
export function getNextSupersetId(exercises: BuilderExercise[]): number {
  const used = getSupersetIds(exercises);
  if (used.length === 0) return 1;
  return Math.max(...used) + 1;
}

/** Get exercise names in a superset chain. */
export function supersetChain(
  exercises: BuilderExercise[],
  groupId: number | null,
  translate?: (name: string) => string,
): string[] {
  if (groupId == null) return [];
  return exercises
    .filter((e) => e.supersetId === groupId)
    .map((e) => (translate ? translate(e.name) : e.name));
}
