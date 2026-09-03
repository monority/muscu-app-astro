import { describe, it, expect } from 'vitest';
import type { Exercise, Session } from '../storage';
import {
  resolveForm,
  computeSetCounts,
  filterExercises,
  computeMuscleGroups,
  muscleOptionsForSelect,
  buildTrendUrl,
  hasWorkingWeight,
  generateWarmupRows,
  formatCountLabel,
  CUSTOM_MUSCLE,
  DEFAULT_MUSCLES,
  type FormState,
  type AddSetRow,
} from '../exercises-stats';

// ── Helpers ──────────────────────────────────────────────────────

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'e1',
    name: 'Bench Press',
    muscle: 'Pectoraux',
    category: 'Barre',
    createdAt: '2026-01-01',
    ...overrides,
  };
}

function makeSession(exercises: { exerciseId: string; setCount: number }[] = []): Session {
  return {
    id: 's1',
    name: 'Test',
    date: '2026-01-01',
    status: 'completed',
    exercises: exercises.map((e) => ({
      exerciseId: e.exerciseId,
      name: 'Test',
      muscle: 'Pectoraux',
      sets: Array.from({ length: e.setCount }, (_, i) => ({
        exerciseId: e.exerciseId,
        setNumber: i + 1,
        weight: 80,
        reps: 8,
        type: 'work' as const,
        completed: true,
      })),
    })),
  };
}

// ── resolveForm ──────────────────────────────────────────────────

describe('resolveForm', () => {
  it('returns null for empty name', () => {
    expect(resolveForm({ name: '', muscle: 'Dos', customMuscle: '', category: 'Barre' })).toBeNull();
  });

  it('returns null for empty muscle', () => {
    expect(resolveForm({ name: 'Row', muscle: '', customMuscle: '', category: 'Barre' })).toBeNull();
  });

  it('returns null for empty category', () => {
    expect(resolveForm({ name: 'Row', muscle: 'Dos', customMuscle: '', category: '' })).toBeNull();
  });

  it('resolves custom muscle', () => {
    const result = resolveForm({
      name: 'Test',
      muscle: CUSTOM_MUSCLE,
      customMuscle: 'Forearms',
      category: 'Barre',
    });
    expect(result).toEqual({ name: 'Test', muscle: 'Forearms', category: 'Barre' });
  });

  it('trims whitespace', () => {
    const result = resolveForm({
      name: '  Bench  ',
      muscle: '  Pectoraux  ',
      customMuscle: '',
      category: '  Barre  ',
    });
    expect(result).toEqual({ name: 'Bench', muscle: 'Pectoraux', category: 'Barre' });
  });
});

// ── computeSetCounts ─────────────────────────────────────────────

describe('computeSetCounts', () => {
  it('returns empty for no sessions', () => {
    expect(computeSetCounts([])).toEqual({});
  });

  it('counts sets per exercise across sessions', () => {
    const sessions = [
      makeSession([{ exerciseId: 'e1', setCount: 3 }, { exerciseId: 'e2', setCount: 2 }]),
      makeSession([{ exerciseId: 'e1', setCount: 4 }]),
    ];
    const counts = computeSetCounts(sessions);
    expect(counts['e1']).toBe(7);
    expect(counts['e2']).toBe(2);
  });
});

// ── filterExercises ──────────────────────────────────────────────

describe('filterExercises', () => {
  const exercises = [
    makeExercise({ id: 'e1', name: 'Bench Press', muscle: 'Pectoraux', favorite: true }),
    makeExercise({ id: 'e2', name: 'Squat', muscle: 'Jambes', favorite: false }),
    makeExercise({ id: 'e3', name: 'Row', muscle: 'Dos', favorite: false }),
  ];

  it('returns all when no filters', () => {
    expect(filterExercises(exercises, { search: '', muscle: '', favorites: false })).toHaveLength(3);
  });

  it('filters by search', () => {
    const result = filterExercises(exercises, { search: 'bench', muscle: '', favorites: false });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('e1');
  });

  it('filters by muscle', () => {
    const result = filterExercises(exercises, { search: '', muscle: 'Dos', favorites: false });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('e3');
  });

  it('filters by favorites', () => {
    const result = filterExercises(exercises, { search: '', muscle: '', favorites: true });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('e1');
  });

  it('combines filters', () => {
    const result = filterExercises(exercises, { search: 'b', muscle: 'Pectoraux', favorites: true });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('e1');
  });
});

// ── computeMuscleGroups ──────────────────────────────────────────

describe('computeMuscleGroups', () => {
  it('returns defaults when no exercises', () => {
    const groups = computeMuscleGroups([]);
    expect(groups).toContain('Pectoraux');
    expect(groups).toContain('Dos');
    expect(groups.length).toBe(DEFAULT_MUSCLES.length);
  });

  it('includes custom muscles from exercises', () => {
    const exercises = [makeExercise({ muscle: 'Custom' })];
    const groups = computeMuscleGroups(exercises);
    expect(groups).toContain('Custom');
    expect(groups.length).toBe(DEFAULT_MUSCLES.length + 1);
  });

  it('sorts alphabetically (fr)', () => {
    const groups = computeMuscleGroups([]);
    const sorted = [...groups].sort((a, b) => a.localeCompare(b, 'fr'));
    expect(groups).toEqual(sorted);
  });
});

// ── muscleOptionsForSelect ───────────────────────────────────────

describe('muscleOptionsForSelect', () => {
  it('appends custom option', () => {
    const options = muscleOptionsForSelect(['Dos', 'Pectoraux'], 'Autre');
    expect(options).toHaveLength(3);
    expect(options[2]).toEqual({ value: CUSTOM_MUSCLE, label: 'Autre' });
  });
});

// ── buildTrendUrl ────────────────────────────────────────────────

describe('buildTrendUrl', () => {
  it('builds URL with exercise name', () => {
    const url = buildTrendUrl('Bench Press', '/exercises/trends');
    expect(url).toBe('/exercises/trends?ex=Bench+Press');
  });
});

// ── hasWorkingWeight ─────────────────────────────────────────────

describe('hasWorkingWeight', () => {
  it('returns false for empty', () => {
    expect(hasWorkingWeight([])).toBe(false);
  });

  it('returns false for zero weight', () => {
    expect(hasWorkingWeight([{ type: 'work', weight: 0, reps: 8 }])).toBe(false);
  });

  it('returns true for work set with weight', () => {
    expect(hasWorkingWeight([{ type: 'work', weight: 80, reps: 8 }])).toBe(true);
  });

  it('returns true for top set with weight', () => {
    expect(hasWorkingWeight([{ type: 'top', weight: 100, reps: 3 }])).toBe(true);
  });

  it('returns false for warmup with weight', () => {
    expect(hasWorkingWeight([{ type: 'warmup', weight: 40, reps: 12 }])).toBe(false);
  });
});

// ── generateWarmupRows ───────────────────────────────────────────

describe('generateWarmupRows', () => {
  it('returns empty for no working weight', () => {
    expect(generateWarmupRows([{ type: 'work', weight: 0, reps: 10 }])).toEqual([]);
  });

  it('generates 3 warmup rows', () => {
    const result = generateWarmupRows([
      { type: 'work', weight: 100, reps: 5 },
    ]);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ type: 'warmup', weight: 40, reps: 12 });
    expect(result[1]).toEqual({ type: 'warmup', weight: 60, reps: 8 });
    expect(result[2]).toEqual({ type: 'warmup', weight: 80, reps: 5 });
  });

  it('uses max weight across sets', () => {
    const result = generateWarmupRows([
      { type: 'work', weight: 80, reps: 8 },
      { type: 'top', weight: 100, reps: 3 },
    ]);
    expect(result[0].weight).toBe(40); // 100 * 0.4
  });
});

// ── formatCountLabel ─────────────────────────────────────────────

describe('formatCountLabel', () => {
  it('uses singular for 1', () => {
    expect(formatCountLabel(1, 'exercice', 'exercices')).toBe('1 exercice');
  });

  it('uses singular for 0', () => {
    expect(formatCountLabel(0, 'exercice', 'exercices')).toBe('0 exercice');
  });

  it('uses plural for 2+', () => {
    expect(formatCountLabel(5, 'exercice', 'exercices')).toBe('5 exercices');
  });
});
