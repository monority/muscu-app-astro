// @vitest-environment jsdom
/**
 * Tests for src/lib/storage.ts
 *
 * The storage module reads from `window.localStorage`, so we override the
 * default `node` environment with `jsdom` per file.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  calculate1RM,
  exportSessionsAsCSV,
  generateId,
  getExercises,
  getSessions,
  getSessionsByDate,
  getSessionsByMonth,
  getSettings,
  saveExercise,
  saveSession,
  toggleExerciseFavorite,
  type Session,
  type SessionExercise,
  type SessionSet,
  type Settings,
} from '../storage';

const STORAGE_KEYS = {
  exercises: 'muscu:exercises',
  sessions: 'muscu:sessions',
  progress: 'muscu:progress',
  settings: 'muscu-settings',
} as const;

function clearLocalStorage(): void {
  try {
    window.localStorage.clear();
  } catch {
    // ignore
  }
}

describe('generateId', () => {
  it('returns a string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('returns unique values across calls', () => {
    const a = generateId();
    const b = generateId();
    expect(a).not.toBe(b);
  });
});

describe('calculate1RM (Epley formula)', () => {
  it('returns the weight as-is for a single rep', () => {
    expect(calculate1RM(100, 1)).toBe(100);
  });

  it('computes 100 × (1 + 5/30) = 116.666… for 100kg × 5', () => {
    expect(calculate1RM(100, 5)).toBeCloseTo(116.6667, 4);
  });

  it('returns 0 for non-positive weight', () => {
    expect(calculate1RM(0, 5)).toBe(0);
    expect(calculate1RM(-10, 5)).toBe(0);
  });

  it('returns 0 for non-positive reps', () => {
    expect(calculate1RM(100, 0)).toBe(0);
    expect(calculate1RM(100, -3)).toBe(0);
  });

  it('returns 0 for non-finite inputs', () => {
    expect(calculate1RM(Number.NaN, 5)).toBe(0);
    expect(calculate1RM(100, Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe('getExercises', () => {
  beforeEach(() => {
    clearLocalStorage();
  });

  it('returns seeded defaults on first call', () => {
    const exercises = getExercises();
    expect(exercises.length).toBeGreaterThan(0);
    expect(exercises[0]).toHaveProperty('id');
    expect(exercises[0]).toHaveProperty('name');
    expect(exercises[0]).toHaveProperty('muscle');
    expect(exercises[0]).toHaveProperty('category');
    expect(exercises[0]).toHaveProperty('createdAt');
  });

  it('persists the seeded defaults to localStorage', () => {
    const exercises = getExercises();
    const raw = window.localStorage.getItem(STORAGE_KEYS.exercises);
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw as string);
    expect(stored.length).toBe(exercises.length);
  });
});

describe('saveExercise + getExercises', () => {
  beforeEach(() => {
    clearLocalStorage();
  });

  it('persists a new exercise and returns it on next call', () => {
    const initial = getExercises();
    const initialCount = initial.length;

    const created = saveExercise({
      name: 'Curl haltère',
      muscle: 'Biceps',
      category: 'Haltère',
    });

    expect(created.id).toBeTruthy();
    expect(created.name).toBe('Curl haltère');
    expect(created.createdAt).toBeTruthy();

    const after = getExercises();
    expect(after.length).toBe(initialCount + 1);
    expect(after.some((e) => e.id === created.id)).toBe(true);
  });
});

describe('toggleExerciseFavorite', () => {
  beforeEach(() => {
    clearLocalStorage();
  });

  it('defaults to non-favorite and toggles on/off', () => {
    const created = saveExercise({
      name: 'Curl haltère',
      muscle: 'Biceps',
      category: 'Haltère',
    });
    expect(created.favorite).toBeUndefined();

    expect(toggleExerciseFavorite(created.id)).toBe(true);
    expect(getExercises().find((e) => e.id === created.id)?.favorite).toBe(true);

    expect(toggleExerciseFavorite(created.id)).toBe(false);
    expect(getExercises().find((e) => e.id === created.id)?.favorite).toBe(false);
  });

  it('returns false for an unknown id', () => {
    expect(toggleExerciseFavorite('missing')).toBe(false);
  });
});

describe('saveSession + getSessions', () => {
  beforeEach(() => {
    clearLocalStorage();
  });

  it('persists a session and reads it back', () => {
    expect(getSessions()).toEqual([]);

    const exerciseId = 'ex-1';
    const set: SessionSet = {
      exerciseId,
      setNumber: 1,
      weight: 80,
      reps: 8,
      type: 'work',
      completed: true,
    };
    const sessionExercise: SessionExercise = {
      exerciseId,
      name: 'Développé couché',
      muscle: 'Pectoraux',
      sets: [set],
    };
    const session: Omit<Session, 'id'> = {
      name: 'Push day',
      date: '2026-08-04T10:00:00.000Z',
      exercises: [sessionExercise],
      status: 'completed',
    };

    const created = saveSession(session);
    expect(created.id).toBeTruthy();

    const all = getSessions();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(created.id);
    expect(all[0].name).toBe('Push day');
    expect(all[0].exercises[0].sets[0].weight).toBe(80);
  });
});

describe('getSettings', () => {
  beforeEach(() => {
    clearLocalStorage();
  });

  it('returns defaults on first call', () => {
    const settings = getSettings();
    expect(settings).toEqual<Settings>({
      pseudo: '',
      email: '',
      unit: 'kg',
      repsFormat: 'simple',
      defaultRestTime: 90,
      soundAlerts: true,
      weeklyGoal: 3,
    });
  });
});

describe('exportSessionsAsCSV', () => {
  beforeEach(() => {
    clearLocalStorage();
  });

  it('returns a valid CSV with header row when there are no sessions', () => {
    const csv = exportSessionsAsCSV();
    const lines = csv.split('\n');
    expect(lines.length).toBe(1);
    expect(lines[0]).toBe(
      'Date,Nom,Exercice,Série,Type,Charge (kg),Répétitions,1RM estimé',
    );
  });

  it('includes a row per set with the expected columns', () => {
    const set: SessionSet = {
      exerciseId: 'ex-1',
      setNumber: 1,
      weight: 100,
      reps: 5,
      type: 'work',
      completed: true,
    };
    const sessionExercise: SessionExercise = {
      exerciseId: 'ex-1',
      name: 'Squat',
      muscle: 'Quadriceps',
      sets: [set],
    };
    saveSession({
      name: 'Legs',
      date: '2026-08-04',
      exercises: [sessionExercise],
      status: 'completed',
    });

    const csv = exportSessionsAsCSV();
    const lines = csv.split('\n');
    expect(lines.length).toBe(2);
    expect(lines[0]).toContain('Date');
    expect(lines[1]).toContain('Squat');
    expect(lines[1]).toContain('100');
    expect(lines[1]).toContain('work');
    // 1RM for 100 × 5 via Epley ≈ 117
    expect(lines[1]).toContain('117');
  });
});

afterEach(() => {
  clearLocalStorage();
});

describe('getSessionsByDate', () => {
  beforeEach(() => {
    clearLocalStorage();
  });

  it('returns only sessions matching the exact YYYY-MM-DD prefix', () => {
    saveSession({
      name: 'A',
      date: '2026-08-04',
      exercises: [],
      status: 'completed',
    });
    saveSession({
      name: 'B',
      date: '2026-08-04T18:30:00.000Z',
      exercises: [],
      status: 'planned',
    });
    saveSession({
      name: 'C',
      date: '2026-08-05',
      exercises: [],
      status: 'completed',
    });

    const matches = getSessionsByDate('2026-08-04');
    expect(matches).toHaveLength(1);
    expect(matches.map((s) => s.name)).toEqual(['A']);
  });

  it('returns an empty array when no session matches', () => {
    saveSession({
      name: 'A',
      date: '2026-08-04',
      exercises: [],
      status: 'completed',
    });
    expect(getSessionsByDate('2030-01-01')).toEqual([]);
  });
});

describe('getSessionsByMonth', () => {
  beforeEach(() => {
    clearLocalStorage();
  });

  it('returns sessions whose local year+month match the given values', () => {
    saveSession({
      name: 'July',
      date: '2026-07-15',
      exercises: [],
      status: 'completed',
    });
    saveSession({
      name: 'Aug-a',
      date: '2026-08-01',
      exercises: [],
      status: 'completed',
    });
    saveSession({
      name: 'Aug-b',
      date: '2026-08-31',
      exercises: [],
      status: 'planned',
    });
    saveSession({
      name: 'Sep',
      date: '2026-09-01',
      exercises: [],
      status: 'completed',
    });

    const july = getSessionsByMonth(2026, 6);
    expect(july.map((s) => s.name)).toEqual(['July']);

    const aug = getSessionsByMonth(2026, 7);
    expect(aug.map((s) => s.name).sort()).toEqual(['Aug-a', 'Aug-b']);

    expect(getSessionsByMonth(2026, 8).map((s) => s.name)).toEqual(['Sep']);
  });

  it('returns an empty array when the month has no sessions', () => {
    expect(getSessionsByMonth(2025, 0)).toEqual([]);
  });
});
