import { describe, it, expect } from 'vitest';
import type { Session } from '../storage';
import {
  undoLastCompletedSet,
  completedVolume,
  completedVolumeBetween,
  countCompletedSessionsBetween,
} from '../session-utils';

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 's1',
    name: 'Test',
    date: '2026-01-01',
    status: 'in-progress',
    exercises: [
      {
        exerciseId: 'e1',
        name: 'Développé couché barre',
        muscle: 'Pectoraux',
        sets: [
          { exerciseId: 'e1', setNumber: 1, weight: 60, reps: 8, type: 'work', completed: true },
          { exerciseId: 'e1', setNumber: 2, weight: 60, reps: 8, type: 'work', completed: false },
        ],
      },
      {
        exerciseId: 'e2',
        name: 'Dips triceps',
        muscle: 'Triceps',
        sets: [
          { exerciseId: 'e2', setNumber: 1, weight: 10, reps: 10, type: 'work', completed: true },
        ],
      },
    ],
    ...overrides,
  };
}

describe('undoLastCompletedSet', () => {
  it('reverts the last completed set (in the last exercise)', () => {
    const s = makeSession();
    const res = undoLastCompletedSet(s);
    expect(res).not.toBeNull();
    expect(res!.exerciseIndex).toBe(1);
    expect(res!.setIndex).toBe(0);
    // Original untouched, returned copy has the set reverted.
    expect(s.exercises[1].sets[0].completed).toBe(true);
    expect(res!.session.exercises[1].sets[0].completed).toBe(false);
    // Earlier completed sets are preserved.
    expect(res!.session.exercises[0].sets[0].completed).toBe(true);
  });

  it('skips uncompleted trailing sets to find the last done one', () => {
    const s = makeSession();
    s.exercises[1].sets.push({
      exerciseId: 'e2',
      setNumber: 2,
      weight: 10,
      reps: 10,
      type: 'work',
      completed: false,
    });
    const res = undoLastCompletedSet(s);
    expect(res!.exerciseIndex).toBe(1);
    expect(res!.setIndex).toBe(0);
  });

  it('finds the set when only an earlier exercise has completed sets', () => {
    const s = makeSession();
    s.exercises[1].sets[0].completed = false;
    s.exercises[0].sets[1].completed = true;
    const res = undoLastCompletedSet(s);
    expect(res!.exerciseIndex).toBe(0);
    expect(res!.setIndex).toBe(1);
  });

  it('returns null when no set is completed', () => {
    const s = makeSession();
    for (const ex of s.exercises) {
      for (const set of ex.sets) set.completed = false;
    }
    expect(undoLastCompletedSet(s)).toBeNull();
  });

  it('does not mutate the input session object', () => {
    const s = makeSession();
    undoLastCompletedSet(s);
    expect(s.exercises[1].sets[0].completed).toBe(true);
  });
});

describe('countCompletedSessionsBetween', () => {
  it('counts completed sessions in a half-open measurement interval', () => {
    const sessions = [
      makeSession({ id: 'before', date: '2025-12-31', status: 'completed' }),
      makeSession({ id: 'inside', date: '2026-01-03', status: 'completed' }),
      makeSession({ id: 'planned', date: '2026-01-05', status: 'planned' }),
      makeSession({ id: 'next', date: '2026-01-10', status: 'completed' }),
    ];

    expect(countCompletedSessionsBetween(sessions, '2026-01-01', '2026-01-10')).toBe(1);
    expect(countCompletedSessionsBetween(sessions, '2026-01-10')).toBe(1);
  });

  it('supports ISO timestamps and rejects invalid interval starts', () => {
    const session = makeSession({ date: '2026-02-04T18:30:00.000Z', status: 'completed' });
    expect(countCompletedSessionsBetween([session], '2026-02-04', '2026-02-05')).toBe(1);
    expect(countCompletedSessionsBetween([session], 'not-a-date')).toBe(0);
  });

  it('sums only completed volume in the interval', () => {
    const inside = makeSession({ id: 'inside', date: '2026-02-03', status: 'completed' });
    const outside = makeSession({ id: 'outside', date: '2026-02-10', status: 'completed' });
    const planned = makeSession({ id: 'planned', date: '2026-02-04', status: 'planned' });
    expect(completedVolumeBetween([inside, outside, planned], '2026-02-01', '2026-02-05')).toBe(580);
  });
});

describe('completedVolume', () => {
  it('sums kg × reps only for completed sets', () => {
    const s = makeSession(); // 60×8 + 10×10 = 580
    expect(completedVolume(s)).toBe(580);
  });

  it('returns 0 when nothing is completed', () => {
    const s = makeSession();
    for (const ex of s.exercises) {
      for (const set of ex.sets) set.completed = false;
    }
    expect(completedVolume(s)).toBe(0);
  });
});
