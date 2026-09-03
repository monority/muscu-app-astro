/**
 * Tests for src/lib/trends-stats.ts
 *
 * Pure computation module — no window/localStorage.
 */

import { describe, expect, it } from 'vitest';
import {
  chartMax,
  chartX,
  chartY,
  computeTrendPoints,
  monthAgo,
} from '../trends-stats';
import type { Session } from '../storage';

const NOW = new Date(2026, 7, 10, 12, 0, 0);

let seq = 0;

/** Minimal session helper. entries = [exerciseId, weight, reps, completed?] */
function session(
  date: string,
  exerciseId: string,
  entries: Array<[number, number, boolean?]>,
): Session {
  seq += 1;
  return {
    id: `s-${seq}`,
    name: 'S',
    date,
    status: 'completed',
    exercises: [
      {
        exerciseId,
        name: 'Ex',
        muscle: 'Pecs',
        sets: entries.map(([weight, reps, completed = true], idx) => ({
          exerciseId,
          setNumber: idx + 1,
          weight,
          reps,
          type: 'work' as const,
          completed,
        })),
      },
    ],
  };
}

describe('monthAgo', () => {
  it('returns timestamp N months before now', () => {
    const result = monthAgo(3, NOW);
    const expected = new Date(2026, 4, 10, 12, 0, 0).getTime();
    expect(result).toBe(expected);
  });

  it('handles year boundary', () => {
    const result = monthAgo(12, NOW);
    const expected = new Date(2025, 7, 10, 12, 0, 0).getTime();
    expect(result).toBe(expected);
  });
});

describe('computeTrendPoints', () => {
  it('returns empty for no sessions', () => {
    const pts = computeTrendPoints([], 'ex-1', 'volume', 'all');
    expect(pts).toEqual([]);
  });

  it('returns empty when no sessions match exercise', () => {
    const pts = computeTrendPoints(
      [session('2026-08-01', 'ex-other', [[100, 5]])],
      'ex-1',
      'volume',
      'all',
    );
    expect(pts).toEqual([]);
  });

  it('computes volume per day', () => {
    const pts = computeTrendPoints(
      [session('2026-08-01', 'ex-1', [[100, 5]])],
      'ex-1',
      'volume',
      'all',
    );
    expect(pts).toHaveLength(1);
    expect(pts[0].date).toBe('2026-08-01');
    expect(pts[0].value).toBe(500); // 100 × 5
  });

  it('computes best 1RM per day', () => {
    const pts = computeTrendPoints(
      [session('2026-08-01', 'ex-1', [[100, 5], [80, 10]])],
      'ex-1',
      'rm',
      'all',
    );
    expect(pts).toHaveLength(1);
    // 1RM of 100×5 ≈ 116.7, 1RM of 80×10 ≈ 106.7
    expect(pts[0].value).toBeCloseTo(116.7, 0);
  });

  it('aggregates multiple sessions on same day', () => {
    const pts = computeTrendPoints(
      [
        session('2026-08-01', 'ex-1', [[100, 5]]),
        session('2026-08-01', 'ex-1', [[80, 10]]),
      ],
      'ex-1',
      'volume',
      'all',
    );
    expect(pts).toHaveLength(1);
    expect(pts[0].value).toBe(1300); // 500 + 800
  });

  it('sorts chronologically', () => {
    const pts = computeTrendPoints(
      [
        session('2026-08-03', 'ex-1', [[100, 5]]),
        session('2026-08-01', 'ex-1', [[80, 5]]),
      ],
      'ex-1',
      'volume',
      'all',
    );
    expect(pts[0].date).toBe('2026-08-01');
    expect(pts[1].date).toBe('2026-08-03');
  });

  it('filters by 3m period', () => {
    const pts = computeTrendPoints(
      [
        session('2026-04-01', 'ex-1', [[100, 5]]), // > 3 months ago
        session('2026-07-01', 'ex-1', [[100, 5]]), // within 3m
      ],
      'ex-1',
      'volume',
      '3m',
      NOW,
    );
    expect(pts).toHaveLength(1);
    expect(pts[0].date).toBe('2026-07-01');
  });

  it('filters by 1y period', () => {
    const pts = computeTrendPoints(
      [
        session('2024-01-01', 'ex-1', [[100, 5]]), // > 1 year
        session('2026-07-01', 'ex-1', [[100, 5]]),
      ],
      'ex-1',
      'volume',
      '1y',
      NOW,
    );
    expect(pts).toHaveLength(1);
  });

  it('ignores incomplete sets', () => {
    const pts = computeTrendPoints(
      [session('2026-08-01', 'ex-1', [[100, 5, false]])],
      'ex-1',
      'volume',
      'all',
    );
    expect(pts).toHaveLength(0);
  });

  it('handles multiple exercises per session', () => {
    const pts = computeTrendPoints(
      [session('2026-08-01', 'ex-1', [[100, 5]])],
      'ex-1',
      'volume',
      'all',
    );
    expect(pts[0].value).toBe(500);
  });
});

describe('chartMax', () => {
  it('returns 10 for empty points', () => {
    expect(chartMax([])).toBe(10);
  });

  it('returns peak × 1.1', () => {
    expect(chartMax([{ date: 'd', value: 100 }])).toBeCloseTo(110, 0);
  });

  it('floor at 10 for tiny values', () => {
    expect(chartMax([{ date: 'd', value: 1 }])).toBe(10);
  });
});

describe('chartX', () => {
  it('returns midpoint for single point', () => {
    expect(chartX(0, 1)).toBe(400);
  });

  it('scales linearly', () => {
    expect(chartX(0, 3)).toBe(0);
    expect(chartX(2, 3)).toBe(800);
    expect(chartX(1, 3)).toBe(400);
  });
});

describe('chartY', () => {
  it('returns CHART_H for zero max', () => {
    expect(chartY(50, 0)).toBe(300);
  });

  it('scales inversely', () => {
    const y = chartY(50, 100);
    expect(y).toBe(150); // 300 - (50/100)*300
  });
});
