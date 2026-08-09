/**
 * Tests for src/lib/volume-stats.ts
 *
 * Pure aggregation module (no window/localStorage), runs in the default
 * node environment. `volumeByMuscle` reads an optional `now` anchor so the
 * rolling windows are deterministic under test.
 */

import { describe, expect, it } from 'vitest';
import { OTHER_MUSCLE, volumeByMuscle } from '../volume-stats';
import type { Session } from '../storage';

/** Fixed anchor: 2026-08-10 12:00 local. */
const NOW = new Date(2026, 7, 10, 12, 0, 0);

let seq = 0;

/** Minimal completed session: `entries` = [muscle, weight, reps, completed?]. */
function session(
  date: string,
  entries: Array<[string, number, number, boolean?]>,
  status: Session['status'] = 'completed',
): Session {
  seq += 1;
  return {
    id: `s-${seq}`,
    name: 'Séance',
    date,
    status,
    exercises: entries.map(([muscle, weight, reps, completed = true]) => ({
      exerciseId: `ex-${seq}-${muscle}`,
      name: `${muscle} exercice`,
      muscle,
      sets: [
        {
          exerciseId: `ex-${seq}-${muscle}`,
          setNumber: 1,
          weight,
          reps,
          type: 'work',
          completed,
        },
      ],
    })),
  };
}

describe('volumeByMuscle', () => {
  it('groups by muscle, sorts by volume descending and computes pct', () => {
    const out = volumeByMuscle(
      [
        session('2026-08-01', [
          ['Pectoraux', 100, 5],
          ['Dos', 80, 5],
        ]),
      ],
      { period: 'all', now: NOW },
    );

    expect(out).toHaveLength(2);
    expect(out[0]).toEqual({
      id: 'Pectoraux',
      muscle: 'Pectoraux',
      volume: 500,
      pct: expect.closeTo(55.56, 1),
    });
    expect(out[1]).toEqual({
      id: 'Dos',
      muscle: 'Dos',
      volume: 400,
      pct: expect.closeTo(44.44, 1),
    });
  });

  it('counts completed sets only (across all set types)', () => {
    const out = volumeByMuscle(
      [
        session('2026-08-01', [
          ['Pectoraux', 100, 5],
          ['Dos', 80, 5, false], // not completed → ignored
        ]),
      ],
      { period: 'all', now: NOW },
    );

    expect(out).toHaveLength(1);
    expect(out[0].volume).toBe(500);
    expect(out[0].id).toBe('Pectoraux');
  });

  it("skips sessions that aren't completed", () => {
    const out = volumeByMuscle(
      [
        session('2026-08-01', [['Pectoraux', 100, 5]], 'in-progress'),
        session('2026-08-01', [['Dos', 80, 5]], 'planned'),
      ],
      { period: 'all', now: NOW },
    );

    expect(out).toEqual([]);
  });

  it('week period keeps the last 7 days only', () => {
    const out = volumeByMuscle(
      [
        session('2026-08-04', [['Pectoraux', 100, 5]]), // cutoff day → kept
        session('2026-08-03', [['Dos', 80, 5]]), // just outside → dropped
      ],
      { period: 'week', now: NOW },
    );

    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('Pectoraux');
  });

  it('month period keeps the last 30 days only', () => {
    const out = volumeByMuscle(
      [
        session('2026-07-12', [['Pectoraux', 100, 5]]), // cutoff day → kept
        session('2026-07-11', [['Dos', 80, 5]]), // just outside → dropped
      ],
      { period: 'month', now: NOW },
    );

    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('Pectoraux');
  });

  it('buckets missing/blank muscles under "Autre"', () => {
    const sessions = [
      session('2026-08-01', [['', 100, 5]]),
      session('2026-08-01', [['   ', 50, 5]]),
    ];
    const out = volumeByMuscle(sessions, { period: 'all', now: NOW });

    expect(out).toHaveLength(1);
    expect(out[0].id).toBe(OTHER_MUSCLE);
    expect(out[0].muscle).toBe(OTHER_MUSCLE);
    expect(out[0].volume).toBe(750);
  });

  it('returns [] when no volume falls in the period', () => {
    const out = volumeByMuscle(
      [session('2026-06-01', [['Pectoraux', 100, 5]])],
      { period: 'month', now: NOW },
    );

    expect(out).toEqual([]);
  });

  it('defaults to period all and a real now', () => {
    const out = volumeByMuscle([
      session('2000-01-01', [['Pectoraux', 100, 5]]),
    ]);

    expect(out).toHaveLength(1);
    expect(out[0].volume).toBe(500);
    expect(out[0].pct).toBeCloseTo(100, 5);
  });
});