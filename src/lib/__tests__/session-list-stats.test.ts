import { describe, expect, it } from 'vitest';
import {
  primaryMuscle,
  filterSessions,
  sortByDateDesc,
  countLabel,
} from '../session-list-stats';
import type { Session, SessionSet, SessionExercise } from '../storage';

// ── Helpers ─────────────────────────────────────────────────────

function makeSession(
  overrides: Partial<Session> & { id: string; name: string; date: string } = {
    id: 's1',
    name: 'Session 1',
    date: '2026-01-15T12:00:00Z',
  },
): Session {
  return {
    exercises: [],
    status: 'planned',
    ...overrides,
  };
}

function makeExercise(muscle: string): SessionExercise {
  return {
    exerciseId: 'e1',
    name: 'Bench',
    muscle,
    sets: [],
  };
}

// ── primaryMuscle ───────────────────────────────────────────────

describe('primaryMuscle', () => {
  it('returns most frequent muscle', () => {
    const s = makeSession({
      id: 's1',
      name: 'Session 1',
      date: '2026-01-15T12:00:00Z',
      exercises: [
        makeExercise('Pectoraux'),
        makeExercise('Pectoraux'),
        makeExercise('Dos'),
      ],
    });
    expect(primaryMuscle(s)).toBe('Pectoraux');
  });

  it('returns empty string when no exercises', () => {
    expect(primaryMuscle(makeSession())).toBe('');
  });

  it('returns empty string when no muscle data', () => {
    const s = makeSession({
      id: 's1',
      name: 'Session 1',
      date: '2026-01-15T12:00:00Z',
      exercises: [{ exerciseId: 'e1', name: 'Bench', muscle: '', sets: [] }],
    });
    expect(primaryMuscle(s)).toBe('');
  });

  it('handles tie by returning first encountered', () => {
    const s = makeSession({
      id: 's1',
      name: 'Session 1',
      date: '2026-01-15T12:00:00Z',
      exercises: [
        makeExercise('Pectoraux'),
        makeExercise('Dos'),
      ],
    });
    // Both have count 1; first iteration picks the first one inserted
    expect(primaryMuscle(s)).toBe('Pectoraux');
  });
});

// ── filterSessions ──────────────────────────────────────────────

describe('filterSessions', () => {
  const sessions = [
    makeSession({ id: 's1', name: 'Push Day', date: '2026-01-15T12:00:00Z' }),
    makeSession({ id: 's2', name: 'Pull Day', date: '2026-01-16T12:00:00Z' }),
    makeSession({ id: 's3', name: 'Leg Day', date: '2026-01-17T12:00:00Z' }),
  ];

  it('returns all sessions when query is empty', () => {
    expect(filterSessions(sessions, '')).toHaveLength(3);
  });

  it('returns all sessions when query is whitespace only', () => {
    expect(filterSessions(sessions, '   ')).toHaveLength(3);
  });

  it('filters by name (case-insensitive)', () => {
    expect(filterSessions(sessions, 'push')).toHaveLength(1);
    expect(filterSessions(sessions, 'PUSH')).toHaveLength(1);
    expect(filterSessions(sessions, 'day')).toHaveLength(3);
  });

  it('returns empty array when no match', () => {
    expect(filterSessions(sessions, 'xyz')).toHaveLength(0);
  });
});

// ── sortByDateDesc ──────────────────────────────────────────────

describe('sortByDateDesc', () => {
  it('sorts newest first', () => {
    const sessions = [
      makeSession({ id: 'old', name: 'Old', date: '2026-01-01T12:00:00Z' }),
      makeSession({ id: 'new', name: 'New', date: '2026-06-15T12:00:00Z' }),
    ];
    const sorted = sortByDateDesc(sessions);
    expect(sorted[0].id).toBe('new');
    expect(sorted[1].id).toBe('old');
  });

  it('does not mutate original array', () => {
    const sessions = [
      makeSession({ id: 'a', name: 'A', date: '2026-01-01T12:00:00Z' }),
      makeSession({ id: 'b', name: 'B', date: '2026-06-15T12:00:00Z' }),
    ];
    const original = [...sessions];
    sortByDateDesc(sessions);
    expect(sessions.map((s) => s.id)).toEqual(original.map((s) => s.id));
  });
});

// ── countLabel ──────────────────────────────────────────────────

describe('countLabel', () => {
  const labels = {
    noSession: 'Aucune séance',
    noMatch: 'Aucun résultat',
    seanceSingular: 'séance',
    pluralS: 's',
  };

  it('returns noSession when count is 0 and total is 0', () => {
    expect(countLabel(0, 0, labels)).toBe('Aucune séance');
  });

  it('returns noMatch when count is 0 and total > 0', () => {
    expect(countLabel(0, 5, labels)).toBe('Aucun résultat');
  });

  it('returns singular label when count is 1', () => {
    expect(countLabel(1, 3, labels)).toBe('1 séance');
  });

  it('returns plural label when count > 1', () => {
    expect(countLabel(5, 10, labels)).toBe('5 séances');
  });
});
