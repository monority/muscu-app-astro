/**
 * Tests for src/lib/dashboard-stats.ts
 *
 * Pure computation module — no DOM, no localStorage, no Alpine.
 */

import { describe, expect, it } from 'vitest';
import {
  dateKey,
  computeSessionVolume,
  computeSessionPrimaryMuscle,
  computeTotalVolume,
  computeTodayVolume,
  computeTodaySessions,
  computeTodayExercises,
  computeBestPRs,
  computeTop1RM,
  computeWeeklyVolumeByDay,
  computeStreak,
} from '../dashboard-stats';
import type { Session } from '../storage';

let seq = 0;

function makeSession(
  date: string,
  exercises: Array<{ muscle: string; weight: number; reps: number; completed?: boolean }> = [],
  status: Session['status'] = 'completed',
): Session {
  seq += 1;
  return {
    id: `s-${seq}`,
    name: 'Test',
    date,
    status,
    exercises: exercises.map((e) => ({
      exerciseId: `ex-${seq}-${e.muscle}`,
      name: e.muscle,
      muscle: e.muscle,
      sets: [
        {
          exerciseId: `ex-${seq}-${e.muscle}`,
          setNumber: 1,
          weight: e.weight,
          reps: e.reps,
          type: 'work',
          completed: e.completed ?? true,
        },
      ],
    })),
  };
}

function today(): string {
  return dateKey(new Date());
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateKey(d);
}

// ── dateKey ──────────────────────────────────────────────────────

describe('dateKey', () => {
  it('returns YYYY-MM-DD format', () => {
    const d = new Date(2026, 0, 5);
    expect(dateKey(d)).toBe('2026-01-05');
  });

  it('pads single-digit month and day', () => {
    const d = new Date(2026, 0, 1);
    expect(dateKey(d)).toBe('2026-01-01');
  });
});

// ── computeSessionVolume ─────────────────────────────────────────

describe('computeSessionVolume', () => {
  it('sums weight × reps for completed sets', () => {
    const s = makeSession(today(), [
      { muscle: 'Pecs', weight: 100, reps: 5 },
      { muscle: 'Pecs', weight: 80, reps: 8 },
    ]);
    expect(computeSessionVolume(s)).toBe(1140);
  });

  it('ignores uncompleted sets', () => {
    const s = makeSession(today(), [
      { muscle: 'Pecs', weight: 100, reps: 5, completed: true },
      { muscle: 'Pecs', weight: 100, reps: 5, completed: false },
    ]);
    expect(computeSessionVolume(s)).toBe(500);
  });

  it('returns 0 for empty exercises', () => {
    const s = makeSession(today(), []);
    expect(computeSessionVolume(s)).toBe(0);
  });
});

// ── computeSessionPrimaryMuscle ──────────────────────────────────

describe('computeSessionPrimaryMuscle', () => {
  it('returns most frequent muscle', () => {
    const s = makeSession(today(), [
      { muscle: 'Dos', weight: 80, reps: 5 },
      { muscle: 'Pecs', weight: 100, reps: 5 },
      { muscle: 'Dos', weight: 60, reps: 8 },
    ]);
    expect(computeSessionPrimaryMuscle(s)).toBe('Dos');
  });

  it('returns empty string when no muscles', () => {
    const s = makeSession(today(), []);
    expect(computeSessionPrimaryMuscle(s)).toBe('');
  });
});

// ── computeTotalVolume ───────────────────────────────────────────

describe('computeTotalVolume', () => {
  it('sums volume across sessions', () => {
    const sessions = [
      makeSession(today(), [{ muscle: 'A', weight: 100, reps: 5 }]),
      makeSession(today(), [{ muscle: 'B', weight: 50, reps: 10 }]),
    ];
    expect(computeTotalVolume(sessions)).toBe(1000);
  });

  it('returns 0 for empty array', () => {
    expect(computeTotalVolume([])).toBe(0);
  });
});

// ── computeTodayVolume ───────────────────────────────────────────

describe('computeTodayVolume', () => {
  it('sums today sessions volume', () => {
    const sessions = [
      makeSession(today(), [{ muscle: 'A', weight: 100, reps: 5 }]),
    ];
    expect(computeTodayVolume(sessions)).toBe(500);
  });

  it('excludes past sessions', () => {
    const sessions = [
      makeSession(daysAgo(1), [{ muscle: 'A', weight: 100, reps: 5 }]),
    ];
    expect(computeTodayVolume(sessions)).toBe(0);
  });
});

// ── computeTodaySessions ─────────────────────────────────────────

describe('computeTodaySessions', () => {
  it('counts today sessions', () => {
    const sessions = [
      makeSession(today(), []),
      makeSession(today(), []),
      makeSession(daysAgo(1), []),
    ];
    expect(computeTodaySessions(sessions)).toBe(2);
  });
});

// ── computeTodayExercises ────────────────────────────────────────

describe('computeTodayExercises', () => {
  it('counts distinct exercises across today sessions', () => {
    const sessions = [
      makeSession(today(), [
        { muscle: 'A', weight: 50, reps: 5 },
        { muscle: 'B', weight: 50, reps: 5 },
      ]),
    ];
    expect(computeTodayExercises(sessions)).toBe(2);
  });

  it('exercises from past days not counted', () => {
    const sessions = [
      makeSession(daysAgo(1), [{ muscle: 'A', weight: 50, reps: 5 }]),
    ];
    expect(computeTodayExercises(sessions)).toBe(0);
  });
});

// ── computeBestPRs ───────────────────────────────────────────────

describe('computeBestPRs', () => {
  it('counts unique exercises with at least one completed set', () => {
    const sessions = [
      makeSession(today(), [
        { muscle: 'A', weight: 100, reps: 5 },
        { muscle: 'B', weight: 80, reps: 5 },
      ]),
    ];
    expect(computeBestPRs(sessions)).toBe(2);
  });

  it('exercises with no completed sets not counted', () => {
    const sessions = [
      makeSession(today(), [
        { muscle: 'A', weight: 100, reps: 5, completed: false },
      ]),
    ];
    expect(computeBestPRs(sessions)).toBe(0);
  });
});

// ── computeTop1RM ────────────────────────────────────────────────

describe('computeTop1RM', () => {
  it('returns highest estimated 1RM', () => {
    const sessions = [
      makeSession(today(), [
        { muscle: 'A', weight: 100, reps: 5 },
        { muscle: 'B', weight: 200, reps: 1 },
      ]),
    ];
    const top = computeTop1RM(sessions);
    expect(top).toBeGreaterThan(0);
  });

  it('returns 0 for no completed sets', () => {
    const sessions = [
      makeSession(today(), [
        { muscle: 'A', weight: 100, reps: 5, completed: false },
      ]),
    ];
    expect(computeTop1RM(sessions)).toBe(0);
  });
});

// ── computeWeeklyVolumeByDay ─────────────────────────────────────

describe('computeWeeklyVolumeByDay', () => {
  it('returns 7-element array with this week volumes', () => {
    const sessions = [
      makeSession(today(), [{ muscle: 'A', weight: 100, reps: 5 }]),
    ];
    const arr = computeWeeklyVolumeByDay(sessions);
    expect(arr).toHaveLength(7);
    expect(arr.some((v) => v > 0)).toBe(true);
  });

  it('excludes sessions from before this week', () => {
    const sessions = [
      makeSession(daysAgo(10), [{ muscle: 'A', weight: 100, reps: 5 }]),
    ];
    const arr = computeWeeklyVolumeByDay(sessions);
    expect(arr.every((v) => v === 0)).toBe(true);
  });
});

// ── computeStreak ────────────────────────────────────────────────

describe('computeStreak', () => {
  it('returns 0 for no completed sessions', () => {
    const sessions = [
      makeSession(today(), [], 'in-progress'),
    ];
    expect(computeStreak(sessions)).toBe(0);
  });

  it('returns 1 when only today is completed', () => {
    const sessions = [
      makeSession(today(), [{ muscle: 'A', weight: 50, reps: 5 }]),
    ];
    expect(computeStreak(sessions)).toBe(1);
  });

  it('counts consecutive days', () => {
    const sessions = [
      makeSession(today(), [{ muscle: 'A', weight: 50, reps: 5 }]),
      makeSession(daysAgo(1), [{ muscle: 'A', weight: 50, reps: 5 }]),
      makeSession(daysAgo(2), [{ muscle: 'A', weight: 50, reps: 5 }]),
    ];
    expect(computeStreak(sessions)).toBe(3);
  });

  it('breaks streak on gap day', () => {
    const sessions = [
      makeSession(today(), [{ muscle: 'A', weight: 50, reps: 5 }]),
      makeSession(daysAgo(2), [{ muscle: 'A', weight: 50, reps: 5 }]),
    ];
    expect(computeStreak(sessions)).toBe(1);
  });

  it('continues streak if yesterday trained but not today', () => {
    const sessions = [
      makeSession(daysAgo(1), [{ muscle: 'A', weight: 50, reps: 5 }]),
      makeSession(daysAgo(2), [{ muscle: 'A', weight: 50, reps: 5 }]),
    ];
    expect(computeStreak(sessions)).toBe(2);
  });
});
