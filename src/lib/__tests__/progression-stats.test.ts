/**
 * Tests for src/lib/progression-stats.ts
 *
 * Pure aggregation module — no window/localStorage.
 */

import { describe, expect, it } from 'vitest';
import {
  computeExerciseProgression,
  computeMax1RM,
  historyBarHeight,
} from '../progression-stats';
import type { Session } from '../storage';

let seq = 0;

/** Minimal session helper. */
function session(
  date: string,
  exercises: Array<{ id: string; name: string; muscle: string; sets: Array<[number, number, boolean?]> }>,
): Session {
  seq += 1;
  return {
    id: `s-${seq}`,
    name: 'S',
    date,
    status: 'completed',
    exercises: exercises.map((e) => ({
      exerciseId: e.id,
      name: e.name,
      muscle: e.muscle,
      sets: e.sets.map(([weight, reps, completed = true], idx) => ({
        exerciseId: e.id,
        setNumber: idx + 1,
        weight,
        reps,
        type: 'work' as const,
        completed,
      })),
    })),
  };
}

describe('computeExerciseProgression', () => {
  it('returns empty for no sessions', () => {
    expect(computeExerciseProgression([])).toEqual([]);
  });

  it('returns empty when all sets incomplete', () => {
    const result = computeExerciseProgression([
      session('2026-08-01', [{ id: 'ex-1', name: 'Bench', muscle: 'Pecs', sets: [[100, 5, false]] }]),
    ]);
    expect(result).toEqual([]);
  });

  it('computes single exercise progression', () => {
    const result = computeExerciseProgression([
      session('2026-08-01', [{ id: 'ex-1', name: 'Bench', muscle: 'Pecs', sets: [[100, 5]] }]),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].exerciseId).toBe('ex-1');
    expect(result[0].sessionCount).toBe(1);
    expect(result[0].history).toHaveLength(1);
    expect(result[0].bestWeight).toBe(100);
    expect(result[0].bestReps).toBe(5);
  });

  it('tracks best 1RM across sessions', () => {
    const result = computeExerciseProgression([
      session('2026-08-01', [{ id: 'ex-1', name: 'Bench', muscle: 'Pecs', sets: [[80, 10]] }]),
      session('2026-08-03', [{ id: 'ex-1', name: 'Bench', muscle: 'Pecs', sets: [[100, 5]] }]),
    ]);
    expect(result[0].estimated1RM).toBeGreaterThan(0);
    // 100×5 > 80×10 in 1RM
    expect(result[0].bestWeight).toBe(100);
    expect(result[0].bestReps).toBe(5);
    expect(result[0].date).toBe('2026-08-03');
    expect(result[0].sessionCount).toBe(2);
  });

  it('sorts by estimated1RM descending', () => {
    const result = computeExerciseProgression([
      session('2026-08-01', [{ id: 'ex-1', name: 'Curl', muscle: 'Biceps', sets: [[20, 10]] }]),
      session('2026-08-01', [{ id: 'ex-2', name: 'Bench', muscle: 'Pecs', sets: [[100, 5]] }]),
    ]);
    expect(result[0].exerciseId).toBe('ex-2');
    expect(result[1].exerciseId).toBe('ex-1');
  });

  it('groups multiple exercises in one session', () => {
    const result = computeExerciseProgression([
      session('2026-08-01', [
        { id: 'ex-1', name: 'Bench', muscle: 'Pecs', sets: [[100, 5]] },
        { id: 'ex-2', name: 'Squat', muscle: 'Quads', sets: [[120, 5]] },
      ]),
    ]);
    expect(result).toHaveLength(2);
  });

  it('updates lastSessionDate to most recent', () => {
    const result = computeExerciseProgression([
      session('2026-08-01', [{ id: 'ex-1', name: 'Bench', muscle: 'Pecs', sets: [[100, 5]] }]),
      session('2026-08-05', [{ id: 'ex-1', name: 'Bench', muscle: 'Pecs', sets: [[90, 8]] }]),
    ]);
    expect(result[0].lastSessionDate).toBe('2026-08-05');
  });

  it('skips incomplete sets but counts session if at least one completed', () => {
    const result = computeExerciseProgression([
      session('2026-08-01', [{ id: 'ex-1', name: 'Bench', muscle: 'Pecs', sets: [[100, 5, false], [80, 10]] }]),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].sessionCount).toBe(1);
    expect(result[0].bestWeight).toBe(80);
  });
});

describe('computeMax1RM', () => {
  it('returns 0 for empty stats', () => {
    expect(computeMax1RM([])).toBe(0);
  });

  it('returns highest estimated1RM', () => {
    const stats = computeExerciseProgression([
      session('2026-08-01', [
        { id: 'ex-1', name: 'A', muscle: 'Pecs', sets: [[50, 10]] },
        { id: 'ex-2', name: 'B', muscle: 'Dos', sets: [[100, 5]] },
      ]),
    ]);
    expect(computeMax1RM(stats)).toBe(stats[0].estimated1RM);
  });
});

describe('historyBarHeight', () => {
  it('returns 0 for empty history', () => {
    expect(historyBarHeight([], 50)).toBe(0);
  });

  it('returns 0 for zero value', () => {
    expect(historyBarHeight([{ exerciseId: 'a', date: 'd', estimated1RM: 100, bestWeight: 100, bestReps: 5 }], 0)).toBe(0);
  });

  it('returns 8 for zero max', () => {
    expect(historyBarHeight([{ exerciseId: 'a', date: 'd', estimated1RM: 0, bestWeight: 0, bestReps: 0 }], 1)).toBe(8);
  });

  it('returns 100 for max value', () => {
    const history = [{ exerciseId: 'a', date: 'd', estimated1RM: 100, bestWeight: 100, bestReps: 5 }];
    expect(historyBarHeight(history, 100)).toBe(100);
  });

  it('clamps minimum to 8', () => {
    const history = [
      { exerciseId: 'a', date: 'd', estimated1RM: 100, bestWeight: 100, bestReps: 5 },
      { exerciseId: 'a', date: 'd', estimated1RM: 100, bestWeight: 100, bestReps: 5 },
    ];
    expect(historyBarHeight(history, 1)).toBe(8);
  });
});
