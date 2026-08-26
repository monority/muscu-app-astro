import { describe, expect, it } from 'vitest';
import {
  computePlatesPerSide,
  computeDumbbells,
  groupPlates,
  groupDumbbellPlates,
  formatKg,
  formatTemplate,
  plateHeight,
  plateClass,
  dumbbellHeight,
  dumbbellWidth,
  PLATE_INVENTORY,
  DUMBBELL_PLATE_INVENTORY,
} from '../calculator';

// ── computePlatesPerSide ───────────────────────────────────────

describe('computePlatesPerSide', () => {
  it('returns empty for negative target', () => {
    const r = computePlatesPerSide(-10, 20);
    expect(r.plates).toEqual([]);
    expect(r.remainder).toBe(0);
    expect(r.error).toBeNull();
  });

  it('returns empty for NaN target', () => {
    const r = computePlatesPerSide(NaN, 20);
    expect(r.plates).toEqual([]);
    expect(r.error).toBeNull();
  });

  it('returns empty when target equals bar', () => {
    const r = computePlatesPerSide(20, 20);
    expect(r.plates).toEqual([]);
    expect(r.remainder).toBe(0);
    expect(r.error).toBeNull();
  });

  it('returns error when target below bar', () => {
    const r = computePlatesPerSide(15, 20);
    expect(r.error).toBe('targetBelowBar');
    expect(r.plates).toEqual([]);
  });

  it('returns error for target 0 below bar', () => {
    const r = computePlatesPerSide(0, 20);
    expect(r.plates).toEqual([]);
    expect(r.error).toBe('targetBelowBar');
  });

  it('computes simple case: 100 kg with 20 kg bar', () => {
    const r = computePlatesPerSide(100, 20);
    // per side = (100-20)/2 = 40
    // greedy: 25 + 15 = 40
    expect(r.error).toBeNull();
    expect(r.remainder).toBe(0);
    expect(r.plates).toEqual([25, 15]);
  });

  it('handles non-integer target', () => {
    const r = computePlatesPerSide(82.5, 20);
    // per side = (82.5-20)/2 = 31.25
    // greedy: 25 + 5 + 1.25 = 31.25
    expect(r.error).toBeNull();
    expect(r.remainder).toBe(0);
    expect(r.plates).toEqual([25, 5, 1.25]);
  });

  it('shows remainder when plates cannot match exactly', () => {
    const r = computePlatesPerSide(101, 20);
    // per side = (101-20)/2 = 40.5
    // greedy: 25 + 15 = 40 → remainder = 0.5
    expect(r.error).toBeNull();
    expect(r.remainder).toBe(0.5);
    expect(r.plates).toEqual([25, 15]);
  });

  it('handles bar only (7 kg technique bar)', () => {
    const r = computePlatesPerSide(7, 7);
    expect(r.plates).toEqual([]);
    expect(r.remainder).toBe(0);
    expect(r.error).toBeNull();
  });

  it('handles olympic bar with minimum load', () => {
    const r = computePlatesPerSide(21, 20);
    // per side = 0.5 → smallest plate is 1 kg, floor(0.5/1) = 0
    expect(r.plates).toEqual([]);
    expect(r.remainder).toBe(0.5);
    expect(r.error).toBeNull();
  });
});

// ── computeDumbbells ───────────────────────────────────────────

describe('computeDumbbells', () => {
  it('returns empty for negative target', () => {
    const r = computeDumbbells(-5, 2);
    expect(r.plates).toEqual([]);
    expect(r.error).toBeNull();
  });

  it('returns error for invalid bar weight', () => {
    const r = computeDumbbells(14, -1);
    expect(r.error).toBe('invalidBarWeight');
  });

  it('returns error for NaN bar weight', () => {
    const r = computeDumbbells(14, NaN);
    expect(r.error).toBe('invalidBarWeight');
  });

  it('returns empty for target 0', () => {
    const r = computeDumbbells(0, 2);
    expect(r.plates).toEqual([]);
    expect(r.dumbbellWeight).toBe(0);
    expect(r.error).toBeNull();
  });

  it('returns error when target below bar', () => {
    const r = computeDumbbells(1, 2);
    expect(r.error).toBe('targetBelowDumbbellBar');
  });

  it('returns bar weight only when target equals bar', () => {
    const r = computeDumbbells(2, 2);
    expect(r.plates).toEqual([]);
    expect(r.dumbbellWeight).toBe(2);
    expect(r.plateWeight).toBe(0);
    expect(r.remainder).toBe(0);
    expect(r.error).toBeNull();
  });

  it('computes simple case: 14 kg dumbbell with 2 kg bar', () => {
    const r = computeDumbbells(14, 2);
    // plate target = 12
    // greedy from [10, 7.5, 5, 4, 3, 2.5, 2, 1.5, 1.25, 1, 0.5]: 10 + 2 = 12
    expect(r.error).toBeNull();
    expect(r.plateWeight).toBe(12);
    expect(r.dumbbellWeight).toBe(14);
    expect(r.remainder).toBe(0);
    expect(r.plates).toEqual([10, 2]);
  });

  it('handles dumbbell with remainder', () => {
    const r = computeDumbbells(13, 2);
    // plate target = 11
    // greedy: 10 + 1 = 11
    expect(r.error).toBeNull();
    expect(r.dumbbellWeight).toBe(13);
    expect(r.remainder).toBe(0);
    expect(r.plates).toEqual([10, 1]);
  });

  it('returns negative target as empty (not error)', () => {
    const r = computeDumbbells(-10, 2);
    expect(r.error).toBeNull();
    expect(r.plates).toEqual([]);
  });
});

// ── groupPlates ────────────────────────────────────────────────

describe('groupPlates', () => {
  it('returns empty for empty input', () => {
    expect(groupPlates([])).toEqual([]);
  });

  it('groups identical plates', () => {
    const result = groupPlates([25, 25, 25]);
    expect(result).toEqual([{ weight: 25, count: 3 }]);
  });

  it('groups mixed plates in inventory order', () => {
    const result = groupPlates([10, 25, 10, 5, 25]);
    expect(result).toEqual([
      { weight: 25, count: 2 },
      { weight: 10, count: 2 },
      { weight: 5, count: 1 },
    ]);
  });

  it('handles decimal plate weights', () => {
    const result = groupPlates([2.5, 1.25, 2.5, 1.25, 1.25]);
    expect(result).toEqual([
      { weight: 2.5, count: 2 },
      { weight: 1.25, count: 3 },
    ]);
  });
});

// ── groupDumbbellPlates ────────────────────────────────────────

describe('groupDumbbellPlates', () => {
  it('returns empty for empty input', () => {
    expect(groupDumbbellPlates([])).toEqual([]);
  });

  it('groups dumbbell plates in DUMBBELL_PLATE_INVENTORY order', () => {
    const result = groupDumbbellPlates([5, 10, 5, 0.5]);
    expect(result).toEqual([
      { weight: 10, count: 1 },
      { weight: 5, count: 2 },
      { weight: 0.5, count: 1 },
    ]);
  });
});

// ── formatKg ───────────────────────────────────────────────────

describe('formatKg', () => {
  it('formats integer value', () => {
    expect(formatKg(20)).toBe('20 kg');
  });

  it('rounds to 2 decimals', () => {
    expect(formatKg(20.456)).toBe('20.46 kg');
  });

  it('returns "0 kg" for NaN', () => {
    expect(formatKg(NaN)).toBe('0 kg');
  });

  it('returns "0 kg" for Infinity', () => {
    expect(formatKg(Infinity)).toBe('0 kg');
  });

  it('handles 0', () => {
    expect(formatKg(0)).toBe('0 kg');
  });

  it('handles negative', () => {
    expect(formatKg(-5)).toBe('-5 kg');
  });
});

// ── formatTemplate ─────────────────────────────────────────────

describe('formatTemplate', () => {
  it('replaces single placeholder', () => {
    expect(formatTemplate('target is {target}', { target: 100 })).toBe('target is 100');
  });

  it('replaces multiple placeholders', () => {
    expect(formatTemplate('{target} < {bar}', { target: 10, bar: 20 })).toBe('10 < 20');
  });

  it('handles no placeholders', () => {
    expect(formatTemplate('no placeholders', {})).toBe('no placeholders');
  });

  it('handles numeric values', () => {
    expect(formatTemplate('{val}', { val: 3.14 })).toBe('3.14');
  });
});

// ── Visual helpers ─────────────────────────────────────────────

describe('plateHeight', () => {
  it('returns 160 for 25 kg', () => {
    expect(plateHeight(25)).toBe(160);
  });

  it('returns 40 for 1 kg', () => {
    expect(plateHeight(1)).toBe(40);
  });

  it('returns 60 for unknown weight', () => {
    expect(plateHeight(999)).toBe(60);
  });
});

describe('plateClass', () => {
  it('returns correct class for integer weight', () => {
    expect(plateClass(25)).toBe('calc__plate--25');
  });

  it('replaces dot with underscore for decimal weight', () => {
    expect(plateClass(2.5)).toBe('calc__plate--2_5');
  });
});

describe('dumbbellHeight', () => {
  it('returns 80 for min weight (2 kg)', () => {
    expect(dumbbellHeight(2)).toBe(80);
  });

  it('returns 200 for max weight (50 kg)', () => {
    expect(dumbbellHeight(50)).toBe(200);
  });

  it('clamps below min', () => {
    expect(dumbbellHeight(0)).toBe(80);
  });

  it('clamps above max', () => {
    expect(dumbbellHeight(100)).toBe(200);
  });
});

describe('dumbbellWidth', () => {
  it('returns 44 for min weight (2 kg)', () => {
    expect(dumbbellWidth(2)).toBe(44);
  });

  it('returns 80 for max weight (50 kg)', () => {
    expect(dumbbellWidth(50)).toBe(80);
  });
});

// ── Inventory sanity ───────────────────────────────────────────

describe('inventories', () => {
  it('PLATE_INVENTORY is sorted biggest first', () => {
    for (let i = 1; i < PLATE_INVENTORY.length; i++) {
      expect(PLATE_INVENTORY[i - 1]).toBeGreaterThanOrEqual(PLATE_INVENTORY[i]);
    }
  });

  it('DUMBBELL_PLATE_INVENTORY is sorted biggest first', () => {
    for (let i = 1; i < DUMBBELL_PLATE_INVENTORY.length; i++) {
      expect(DUMBBELL_PLATE_INVENTORY[i - 1]).toBeGreaterThanOrEqual(DUMBBELL_PLATE_INVENTORY[i]);
    }
  });
});
