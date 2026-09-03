import { describe, it, expect } from 'vitest';
import type { SessionSet } from '../storage';
import {
  rpeTone,
  computeExerciseSummary,
  formatExerciseSummary,
  generateWarmupSets,
  buildExerciseFromTemplate,
  hasWorkingWeight,
  createNextSet,
  getSupersetIds,
  getNextSupersetId,
  supersetChain,
  type BuilderExercise,
} from '../session-builder-stats';

// ── Helpers ──────────────────────────────────────────────────────

function set(overrides: Partial<SessionSet> = {}): SessionSet {
  return {
    exerciseId: 'e1',
    setNumber: 1,
    weight: 0,
    reps: 0,
    type: 'work',
    completed: false,
    ...overrides,
  };
}

function builderEx(overrides: Partial<BuilderExercise> = {}): BuilderExercise {
  return {
    exerciseId: 'e1',
    name: 'Bench Press',
    muscle: 'Pectoraux',
    sets: [set()],
    supersetId: null,
    ...overrides,
  };
}

const LABELS = {
  noSets: 'Aucune série',
  setsSingular: 'série',
  setsPlural: 'séries',
  top: 'Top',
};

// ── rpeTone ─────────────────────────────────────────────────────

describe('rpeTone', () => {
  it('classifies easy', () => {
    expect(rpeTone(1)).toBe('easy');
    expect(rpeTone(3)).toBe('easy');
  });
  it('classifies moderate', () => {
    expect(rpeTone(4)).toBe('moderate');
    expect(rpeTone(6)).toBe('moderate');
  });
  it('classifies hard', () => {
    expect(rpeTone(7)).toBe('hard');
    expect(rpeTone(8)).toBe('hard');
  });
  it('classifies max', () => {
    expect(rpeTone(9)).toBe('max');
    expect(rpeTone(10)).toBe('max');
  });
});

// ── computeExerciseSummary ───────────────────────────────────────

describe('computeExerciseSummary', () => {
  it('returns zeros for empty sets', () => {
    const ex = builderEx({ sets: [] });
    const s = computeExerciseSummary(ex);
    expect(s.setCount).toBe(0);
    expect(s.totalReps).toBe(0);
    expect(s.totalVolume).toBe(0);
  });

  it('computes volume and reps', () => {
    const ex = builderEx({
      sets: [
        set({ weight: 80, reps: 8 }),
        set({ weight: 80, reps: 6 }),
        set({ weight: 90, reps: 4 }),
      ],
    });
    const s = computeExerciseSummary(ex);
    expect(s.setCount).toBe(3);
    expect(s.totalReps).toBe(18);
    expect(s.totalVolume).toBe(80 * 8 + 80 * 6 + 90 * 4); // 1620
    expect(s.topWeight).toBe(90);
    expect(s.topReps).toBe(4);
  });

  it('ignores zero-weight sets for top', () => {
    const ex = builderEx({
      sets: [set({ weight: 0, reps: 10 }), set({ weight: 60, reps: 8 })],
    });
    const s = computeExerciseSummary(ex);
    expect(s.topWeight).toBe(60);
    expect(s.topReps).toBe(8);
  });
});

// ── formatExerciseSummary ────────────────────────────────────────

describe('formatExerciseSummary', () => {
  it('returns noSets for empty', () => {
    const ex = builderEx({ sets: [] });
    expect(formatExerciseSummary(ex, LABELS)).toBe('Aucune série');
  });

  it('formats single set', () => {
    const ex = builderEx({
      sets: [set({ weight: 80, reps: 8 })],
    });
    const result = formatExerciseSummary(ex, LABELS);
    expect(result).toContain('1 série');
    expect(result).toContain('8 reps');
    expect(result).toContain('640 kg');
  });

  it('formats multiple sets with top', () => {
    const ex = builderEx({
      sets: [
        set({ weight: 80, reps: 8 }),
        set({ weight: 90, reps: 6 }),
      ],
    });
    const result = formatExerciseSummary(ex, LABELS);
    expect(result).toContain('2 séries');
    expect(result).toContain('Top 90 kg');
  });
});

// ── generateWarmupSets ───────────────────────────────────────────

describe('generateWarmupSets', () => {
  it('returns empty for no working weight', () => {
    const sets = [set({ weight: 0, reps: 10 })];
    expect(generateWarmupSets('e1', sets)).toEqual([]);
  });

  it('returns empty for no work/top type', () => {
    const sets = [set({ type: 'warmup', weight: 80, reps: 5 })];
    expect(generateWarmupSets('e1', sets)).toEqual([]);
  });

  it('generates 3 warmup sets + renumbered originals', () => {
    const sets = [
      set({ type: 'work', weight: 100, reps: 5 }),
      set({ type: 'work', weight: 100, reps: 5 }),
    ];
    const result = generateWarmupSets('e1', sets);
    expect(result).toHaveLength(5); // 3 warmup + 2 original
    // Warmup sets
    expect(result[0].type).toBe('warmup');
    expect(result[0].weight).toBe(40); // 100 * 0.4
    expect(result[0].reps).toBe(12);
    expect(result[1].weight).toBe(60); // 100 * 0.6
    expect(result[1].reps).toBe(8);
    expect(result[2].weight).toBe(80); // 100 * 0.8
    expect(result[2].reps).toBe(5);
    // Renumbered originals
    expect(result[3].setNumber).toBe(4);
    expect(result[4].setNumber).toBe(5);
  });

  it('uses max weight across sets', () => {
    const sets = [
      set({ type: 'work', weight: 80, reps: 8 }),
      set({ type: 'top', weight: 100, reps: 3 }),
    ];
    const result = generateWarmupSets('e1', sets);
    expect(result[0].weight).toBe(40); // 100 * 0.4
    expect(result[2].weight).toBe(80); // 100 * 0.8
  });
});

// ── buildExerciseFromTemplate ────────────────────────────────────

describe('buildExerciseFromTemplate', () => {
  it('creates exercise with correct sets', () => {
    const result = buildExerciseFromTemplate(
      { id: 'e1', name: 'Squat', muscle: 'Jambes' },
      { name: 'Squat', muscle: 'Jambes', defaultSets: 3, defaultReps: 10 },
    );
    expect(result.exerciseId).toBe('e1');
    expect(result.name).toBe('Squat');
    expect(result.muscle).toBe('Jambes');
    expect(result.sets).toHaveLength(3);
    expect(result.sets[0].reps).toBe(10);
    expect(result.sets[0].weight).toBe(0);
    expect(result.supersetId).toBeNull();
  });

  it('defaults to 1 set when defaultSets < 1', () => {
    const result = buildExerciseFromTemplate(
      { id: 'e1', name: 'Test', muscle: 'Test' },
      { name: 'Test', muscle: 'Test', defaultSets: 0, defaultReps: 5 },
    );
    expect(result.sets).toHaveLength(1);
  });
});

// ── hasWorkingWeight ─────────────────────────────────────────────

describe('hasWorkingWeight', () => {
  it('returns false for empty sets', () => {
    expect(hasWorkingWeight(builderEx({ sets: [] }))).toBe(false);
  });

  it('returns false for zero weight', () => {
    const ex = builderEx({
      sets: [set({ type: 'work', weight: 0, reps: 10 })],
    });
    expect(hasWorkingWeight(ex)).toBe(false);
  });

  it('returns true for work set with weight', () => {
    const ex = builderEx({
      sets: [set({ type: 'work', weight: 80, reps: 8 })],
    });
    expect(hasWorkingWeight(ex)).toBe(true);
  });

  it('returns true for top set with weight', () => {
    const ex = builderEx({
      sets: [set({ type: 'top', weight: 100, reps: 3 })],
    });
    expect(hasWorkingWeight(ex)).toBe(true);
  });

  it('returns false for warmup with weight', () => {
    const ex = builderEx({
      sets: [set({ type: 'warmup', weight: 40, reps: 12 })],
    });
    expect(hasWorkingWeight(ex)).toBe(false);
  });
});

// ── createNextSet ────────────────────────────────────────────────

describe('createNextSet', () => {
  it('inherits from last set', () => {
    const last = set({ weight: 80, reps: 8 });
    const next = createNextSet('e1', 2, last);
    expect(next.weight).toBe(80);
    expect(next.reps).toBe(8);
    expect(next.setNumber).toBe(2);
    expect(next.type).toBe('work');
    expect(next.completed).toBe(false);
  });

  it('zeros when no last set', () => {
    const next = createNextSet('e1', 1, undefined);
    expect(next.weight).toBe(0);
    expect(next.reps).toBe(0);
  });
});

// ── superset helpers ─────────────────────────────────────────────

describe('getSupersetIds', () => {
  it('returns empty for no supersets', () => {
    const exs = [builderEx({ supersetId: null })];
    expect(getSupersetIds(exs)).toEqual([]);
  });

  it('returns unique sorted IDs', () => {
    const exs = [
      builderEx({ supersetId: 2 }),
      builderEx({ supersetId: 1 }),
      builderEx({ supersetId: 2 }),
    ];
    expect(getSupersetIds(exs)).toEqual([1, 2]);
  });
});

describe('getNextSupersetId', () => {
  it('returns 1 when empty', () => {
    expect(getNextSupersetId([])).toBe(1);
  });

  it('returns max + 1', () => {
    const exs = [builderEx({ supersetId: 3 })];
    expect(getNextSupersetId(exs)).toBe(4);
  });
});

describe('supersetChain', () => {
  it('returns empty for null groupId', () => {
    const exs = [builderEx({ supersetId: 1 })];
    expect(supersetChain(exs, null)).toEqual([]);
  });

  it('returns names in group', () => {
    const exs = [
      builderEx({ name: 'Bench', supersetId: 1 }),
      builderEx({ name: 'Row', supersetId: 1 }),
      builderEx({ name: 'Squat', supersetId: 2 }),
    ];
    expect(supersetChain(exs, 1)).toEqual(['Bench', 'Row']);
  });

  it('applies translate function', () => {
    const exs = [builderEx({ name: 'Bench', supersetId: 1 })];
    const translated = supersetChain(exs, 1, (n) => n.toUpperCase());
    expect(translated).toEqual(['BENCH']);
  });
});
