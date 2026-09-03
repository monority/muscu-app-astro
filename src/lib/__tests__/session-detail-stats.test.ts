import { describe, it, expect } from 'vitest';
import type { Session } from '../storage';
import {
  computeRpeStats,
  computeRpeSuggestion,
  computeSessionTotalVolume,
  computeTotalSets,
  hasNotes,
  rpeTone,
  rpeLabel,
  fatigueLabel,
  type SuggestionLabels,
} from '../session-detail-stats';

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 's1',
    name: 'Test',
    date: '2026-01-01',
    status: 'completed',
    exercises: [],
    ...overrides,
  };
}

function makeExercise(sets: Array<{ weight: number; reps: number; completed?: boolean; rpe?: number }>) {
  return {
    exerciseId: 'e1',
    name: 'Test exercise',
    muscle: 'Pectoraux',
    sets: sets.map((s, i) => ({
      exerciseId: 'e1',
      setNumber: i + 1,
      weight: s.weight,
      reps: s.reps,
      type: 'work' as const,
      completed: s.completed ?? true,
      rpe: s.rpe,
    })),
  };
}

const suggestionLabels: SuggestionLabels = {
  allTenHeadline: 'All 10',
  allTenDetail: 'Back off',
  increaseHeadline: 'Increase',
  increaseDetail: 'Go heavier',
  maintainHeadline: 'Maintain',
  maintainDetail: 'Keep going',
  continueHeadline: 'Continue',
  continueDetail: 'Nice pace',
};

describe('computeRpeStats', () => {
  it('returns zeros for null session', () => {
    expect(computeRpeStats(null)).toEqual({ count: 0, avg: 0, max: 0, allTen: false });
  });

  it('returns zeros when no completed sets have RPE', () => {
    const s = makeSession({ exercises: [makeExercise([{ weight: 100, reps: 5 }])] });
    expect(computeRpeStats(s)).toEqual({ count: 0, avg: 0, max: 0, allTen: false });
  });

  it('computes stats from completed sets with RPE', () => {
    const s = makeSession({
      exercises: [
        makeExercise([
          { weight: 100, reps: 5, rpe: 8 },
          { weight: 100, reps: 5, rpe: 10 },
        ]),
      ],
    });
    const stats = computeRpeStats(s);
    expect(stats.count).toBe(2);
    expect(stats.avg).toBe(9);
    expect(stats.max).toBe(10);
    expect(stats.allTen).toBe(false);
  });

  it('sets allTen when every completed set has RPE 10', () => {
    const s = makeSession({
      exercises: [
        makeExercise([
          { weight: 100, reps: 5, rpe: 10 },
          { weight: 100, reps: 3, rpe: 10 },
        ]),
      ],
    });
    expect(computeRpeStats(s).allTen).toBe(true);
  });

  it('skips uncompleted sets', () => {
    const s = makeSession({
      exercises: [
        makeExercise([
          { weight: 100, reps: 5, rpe: 8, completed: false },
          { weight: 100, reps: 5, rpe: 10 },
        ]),
      ],
    });
    const stats = computeRpeStats(s);
    expect(stats.count).toBe(1);
    expect(stats.allTen).toBe(true);
  });
});

describe('computeRpeSuggestion', () => {
  it('returns null when count is 0', () => {
    expect(computeRpeSuggestion({ count: 0, avg: 0, max: 0, allTen: false }, suggestionLabels)).toBeNull();
  });

  it('returns down tone when allTen', () => {
    const result = computeRpeSuggestion({ count: 5, avg: 10, max: 10, allTen: true }, suggestionLabels);
    expect(result).toEqual({ headline: 'All 10', detail: 'Back off', tone: 'down' });
  });

  it('returns up tone when avg < 6', () => {
    const result = computeRpeSuggestion({ count: 5, avg: 4.5, max: 6, allTen: false }, suggestionLabels);
    expect(result?.tone).toBe('up');
  });

  it('returns maintain tone when avg > 8', () => {
    const result = computeRpeSuggestion({ count: 5, avg: 8.5, max: 10, allTen: false }, suggestionLabels);
    expect(result?.tone).toBe('maintain');
  });

  it('returns maintain tone for middle ground', () => {
    const result = computeRpeSuggestion({ count: 5, avg: 7, max: 8, allTen: false }, suggestionLabels);
    expect(result?.tone).toBe('maintain');
  });
});

describe('computeSessionTotalVolume', () => {
  it('returns 0 for null session', () => {
    expect(computeSessionTotalVolume(null)).toBe(0);
  });

  it('sums volume across exercises', () => {
    const s = makeSession({
      exercises: [
        makeExercise([{ weight: 100, reps: 5 }]),
        makeExercise([{ weight: 80, reps: 10 }]),
      ],
    });
    expect(computeSessionTotalVolume(s)).toBe(500 + 800);
  });
});

describe('computeTotalSets', () => {
  it('returns 0 for null session', () => {
    expect(computeTotalSets(null)).toBe(0);
  });

  it('counts sets across exercises', () => {
    const s = makeSession({
      exercises: [
        makeExercise([{ weight: 100, reps: 5 }, { weight: 100, reps: 5 }]),
        makeExercise([{ weight: 80, reps: 10 }]),
      ],
    });
    expect(computeTotalSets(s)).toBe(3);
  });
});

describe('hasNotes', () => {
  it('returns false for null', () => {
    expect(hasNotes(null)).toBe(false);
  });

  it('returns false when empty', () => {
    expect(hasNotes(makeSession())).toBe(false);
  });

  it('returns true when rpe is set', () => {
    expect(hasNotes(makeSession({ rpe: 7 }))).toBe(true);
  });

  it('returns true when fatigue is set', () => {
    expect(hasNotes(makeSession({ fatigue: 3 }))).toBe(true);
  });

  it('returns true when mood is set', () => {
    expect(hasNotes(makeSession({ mood: 'ok' }))).toBe(true);
  });

  it('returns true when notes text exists', () => {
    expect(hasNotes(makeSession({ notes: 'Good session' }))).toBe(true);
  });

  it('returns false when notes is whitespace only', () => {
    expect(hasNotes(makeSession({ notes: '   ' }))).toBe(false);
  });
});

describe('rpeTone', () => {
  it('returns none for null/undefined', () => {
    expect(rpeTone(null)).toBe('none');
    expect(rpeTone(undefined)).toBe('none');
  });

  it('classifies correctly', () => {
    expect(rpeTone(2)).toBe('easy');
    expect(rpeTone(3)).toBe('easy');
    expect(rpeTone(4)).toBe('moderate');
    expect(rpeTone(6)).toBe('moderate');
    expect(rpeTone(7)).toBe('hard');
    expect(rpeTone(8)).toBe('hard');
    expect(rpeTone(9)).toBe('max');
    expect(rpeTone(10)).toBe('max');
  });
});

describe('rpeLabel', () => {
  const labels = { easy: 'Facile', moderate: 'Modere', hard: 'Dur', max: 'Max' };

  it('returns dash for none', () => {
    expect(rpeLabel(null, labels)).toBe('—');
  });

  it('returns correct label', () => {
    expect(rpeLabel(2, labels)).toBe('Facile');
    expect(rpeLabel(5, labels)).toBe('Modere');
    expect(rpeLabel(7, labels)).toBe('Dur');
    expect(rpeLabel(10, labels)).toBe('Max');
  });
});

describe('fatigueLabel', () => {
  const labels = {
    veryFresh: 'Tres frais',
    fresh: 'Frais',
    normal: 'Normal',
    tired: 'Fatigue',
    exhausted: 'Epuise',
  };

  it('returns dash for 0/null', () => {
    expect(fatigueLabel(0, labels)).toBe('—');
    expect(fatigueLabel(null, labels)).toBe('—');
  });

  it('returns correct label', () => {
    expect(fatigueLabel(1, labels)).toBe('Tres frais');
    expect(fatigueLabel(2, labels)).toBe('Frais');
    expect(fatigueLabel(3, labels)).toBe('Normal');
    expect(fatigueLabel(4, labels)).toBe('Fatigue');
    expect(fatigueLabel(5, labels)).toBe('Epuise');
  });
});
