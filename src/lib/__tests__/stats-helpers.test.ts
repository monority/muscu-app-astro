import { describe, it, expect } from 'vitest';
import {
  groupByFamily,
  familyLabel,
  svgEscape,
  muscleToneColor,
} from '../stats-helpers';
import type { MuscleVolumeSlice } from '../volume-stats';

function slice(muscle: string, volume: number): MuscleVolumeSlice {
  return { muscle, volume, pct: 0 } as MuscleVolumeSlice;
}

const trIdentity = (m: string) => m;

describe('groupByFamily', () => {
  it('collapses muscles into families sorted by volume desc', () => {
    const groups = groupByFamily([
      slice('Pectoraux', 100),
      slice('Triceps', 60),
      slice('Dos', 80),
    ]);
    const labels = groups.map((g) => familyLabel(g, trIdentity));
    expect(labels).toEqual(['Pectoraux', 'Dos', 'Triceps']);
  });

  it('merges same-family muscles and sums volume', () => {
    const groups = groupByFamily([
      slice('Pectoraux', 100),
      slice('Deltoïdes', 20), // shoulder family
      slice('Quadriceps', 50), // leg family
    ]);
    const pec = groups.find((g) => g.tone === 'chest');
    expect(pec?.volume).toBe(100);
    const leg = groups.find((g) => g.tone === 'legs');
    expect(leg?.volume).toBe(50);
  });

  it('pct sums to ~100', () => {
    const groups = groupByFamily([slice('Pectoraux', 100), slice('Dos', 100)]);
    const total = groups.reduce((s, g) => s + g.pct, 0);
    expect(total).toBeCloseTo(100);
  });

  it('labels dominant muscle and ×N count', () => {
    const groups = groupByFamily([
      slice('Pectoraux', 100),
      slice('Pectoraux', 40),
    ]);
    const chest = groups.find((g) => g.tone === 'chest')!;
    expect(chest.count).toBe(2);
    expect(familyLabel(chest, trIdentity)).toBe('Pectoraux ×2');
  });
});

describe('svgEscape', () => {
  it('escapes HTML-special chars', () => {
    expect(svgEscape('a<b>&c"d')).toBe('a&lt;b&gt;&amp;c&quot;d');
  });

  it('returns empty input unchanged', () => {
    expect(svgEscape('')).toBe('');
  });
});

describe('muscleToneColor', () => {
  it('returns chest token for chest family', () => {
    const cssVar = (name: string) => `var(${name})`;
    const color = muscleToneColor('Pectoraux', cssVar);
    expect(color).toBe('var(--color-cat-chest)');
  });

  it('falls back to muted for unknown', () => {
    const cssVar = (name: string) => `var(${name})`;
    expect(muscleToneColor('Inconnu', cssVar)).toBe('var(--color-muted)');
  });
});