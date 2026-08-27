/**
 * superset — Pure logic for superset management.
 *
 * Wraps session-builder-stats functions + normalization helpers.
 */

import {
  getSupersetIds,
  getNextSupersetId,
  supersetChain,
  type BuilderExercise,
} from "../../lib/session-builder-stats";

export function availableSupersetIds(exercises: BuilderExercise[]): number[] {
  return getSupersetIds(exercises);
}

export function nextSupersetId(exercises: BuilderExercise[]): number {
  return getNextSupersetId(exercises);
}

export function normalizeSupersetId(supersetId: number | null): number | null {
  if (!Number.isFinite(supersetId as number) || (supersetId as number) <= 0) {
    return null;
  }
  return supersetId;
}

export function buildSupersetChain(
  exercises: BuilderExercise[],
  groupId: number | null,
  translate: (name: string) => string,
): string[] {
  return supersetChain(exercises, groupId, translate);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function trName(ex: BuilderExercise): string {
  const fn = (window as any).trExercise as
    ((n: string) => string) | undefined;
  return fn ? fn(ex.name) : ex.name;
}
