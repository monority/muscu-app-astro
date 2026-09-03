/**
 * stats-helpers — Pure display helpers for the stats page.
 *
 * Donut family grouping + SVG/HTML escaping helpers. No Alpine/DOM
 * dependency; readable/unit-testable.
 */

import { muscleHue, type MuscleTone } from './colors';
import type { MuscleVolumeSlice } from './volume-stats';

export type { MuscleTone };

/** One donut slice after aggregation: a whole muscle FAMILY. */
export interface FamilySlice {
  /** Hue family (`muscleHue()` tones chest/back/shoulders/arms/legs/core/other). */
  tone: MuscleTone;
  /** Σ volume of every stored muscle in the family, kg. */
  volume: number;
  /** Family share of the period's total, 0..100. */
  pct: number;
  /** Largest-volume muscle of the family — its translated name labels the arc. */
  dominant: MuscleVolumeSlice;
  /** How many distinct stored muscles share this family. */
  count: number;
}

/**
 * Donut aggregation: group per-muscle slices into the 6 muscle FAMILIES
 * via `muscleHue()`, so the ring shows one arc per hue family.
 */
export function groupByFamily(slices: MuscleVolumeSlice[]): FamilySlice[] {
  const byTone = new Map<
    MuscleTone,
    { volume: number; count: number; dominant: MuscleVolumeSlice }
  >();
  for (const sl of slices) {
    const tone = muscleHue(sl.muscle);
    const entry = byTone.get(tone) ?? { volume: 0, count: 0, dominant: sl };
    entry.volume += sl.volume;
    entry.count += 1;
    if (sl.volume > entry.dominant.volume) entry.dominant = sl;
    byTone.set(tone, entry);
  }

  const grouped = Array.from(byTone.entries()).map(([tone, e]) => ({
    tone,
    volume: e.volume,
    pct: 0,
    dominant: e.dominant,
    count: e.count,
  }));
  const total = grouped.reduce((s, g) => s + g.volume, 0);
  for (const g of grouped) {
    g.pct = total > 0 ? (g.volume / total) * 100 : 0;
  }
  return grouped.sort((a, b) => b.volume - a.volume);
}

/** Donut/legend label: dominant muscle name, suffixed ×N when several share it. */
export function familyLabel(
  g: FamilySlice,
  trMuscle: (key: string) => string,
): string {
  const name = trMuscle(g.dominant.muscle);
  return g.count > 1 ? `${name} ×${g.count}` : name;
}

/** SQL-style HTML/SVG escaping for user-generated content. */
export function svgEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Donut/legend color for a stored muscle key — family token value. */
export function muscleToneColor(
  muscle: string,
  cssVar: (name: string) => string,
): string {
  const CAT_TONE_VAR: Record<string, string> = {
    chest: '--color-cat-chest',
    back: '--color-cat-back',
    shoulders: '--color-cat-shoulders',
    arms: '--color-cat-arms',
    legs: '--color-cat-legs',
    core: '--color-cat-core',
  };
  const token = CAT_TONE_VAR[muscleHue(muscle)];
  return cssVar(token || '--color-muted');
}