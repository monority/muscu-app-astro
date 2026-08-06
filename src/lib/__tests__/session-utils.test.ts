import { describe, it, expect } from 'vitest';
import type { Session } from '../storage';
import { undoLastCompletedSet, completedVolume } from '../session-utils';

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
