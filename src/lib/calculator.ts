/**
 * calculator — Pure plate / dumbbell calculation logic.
 *
 * Extracted from pages/calculator.astro for testability and reuse.
 * Functions return error *keys* (not formatted strings) so callers
 * can localise the messages via i18n.
 */

// ── Constants ───────────────────────────────────────────────────

/** Available plate weights (kg), biggest first for greedy algo. */
export const PLATE_INVENTORY: readonly number[] = [25, 20, 15, 10, 5, 2.5, 2, 1.5, 1.25, 1];

/** Available dumbbell plate weights (kg), biggest first for greedy algo. */
export const DUMBBELL_PLATE_INVENTORY: readonly number[] = [10, 7.5, 5, 4, 3, 2.5, 2, 1.5, 1.25, 1, 0.5];

// ── Types ───────────────────────────────────────────────────────

export interface PlateCount {
  weight: number;
  count: number;
}

export interface BarbellResult {
  plates: number[];
  remainder: number;
  error: string | null;
}

export interface DumbbellResult {
  plates: number[];
  plateWeight: number;
  dumbbellWeight: number;
  remainder: number;
  error: string | null;
}

// ── Helpers ─────────────────────────────────────────────────────

/** Substitute `{key}` placeholders in a template string. */
export function formatTemplate(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key]));
}

/** Format a number as "X kg" with 2 decimal rounding. */
export function formatKg(value: number): string {
  if (!Number.isFinite(value)) return '0 kg';
  return Math.round(value * 100) / 100 + ' kg';
}

// ── Plate height map (visual scaling) ──────────────────────────

const PLATE_HEIGHT_MAP: Record<number, number> = {
  25: 160,
  20: 144,
  15: 128,
  10: 108,
  5: 84,
  2.5: 60,
  2: 55,
  1.5: 49,
  1.25: 44,
  1: 40,
};

/** Visual height in px for a given plate weight. */
export function plateHeight(weight: number): number {
  return PLATE_HEIGHT_MAP[weight] ?? 60;
}

/** CSS modifier class for Olympic plate colour convention. */
export function plateClass(weight: number): string {
  return 'calc__plate--' + weight.toString().replace('.', '_');
}

// ── Dumbbell visual scaling ────────────────────────────────────

const DUMB_MIN_W = 2;
const DUMB_MIN_H = 80;
const DUMB_MAX_W = 50;
const DUMB_MAX_H = 200;
const DUMB_MIN_WPX = 44;
const DUMB_MAX_WPX = 80;

/** Visual height in px for a dumbbell head. */
export function dumbbellHeight(weight: number): number {
  const ratio = Math.max(0, Math.min(1, (weight - DUMB_MIN_W) / (DUMB_MAX_W - DUMB_MIN_W)));
  return Math.round(DUMB_MIN_H + ratio * (DUMB_MAX_H - DUMB_MIN_H));
}

/** Visual width in px for a dumbbell head. */
export function dumbbellWidth(weight: number): number {
  const ratio = Math.max(0, Math.min(1, (weight - DUMB_MIN_W) / (DUMB_MAX_W - DUMB_MIN_W)));
  return Math.round(DUMB_MIN_WPX + ratio * (DUMB_MAX_WPX - DUMB_MIN_WPX));
}

// ── Barbell calculation ────────────────────────────────────────

/**
 * Compute plates needed per side for a barbell.
 *
 * Returns error keys:
 * - `"targetBelowBar"` — target < bar weight (use `formatTemplate` with `{target}` and `{bar}`)
 *
 * @returns BarbellResult with plates, remainder, and error key (or null).
 */
export function computePlatesPerSide(
  target: number,
  bar: number,
): BarbellResult {
  if (!Number.isFinite(target) || target < 0) {
    return { plates: [], remainder: 0, error: null };
  }
  if (target < bar) {
    return {
      plates: [],
      remainder: 0,
      error: 'targetBelowBar',
    };
  }
  if (target === bar) {
    return { plates: [], remainder: 0, error: null };
  }

  const perSideTarget = (target - bar) / 2;
  let remaining = perSideTarget;
  const plates: number[] = [];

  for (const p of PLATE_INVENTORY) {
    const count = Math.floor(remaining / p);
    for (let i = 0; i < count; i++) plates.push(p);
    remaining = +(remaining - count * p).toFixed(4);
  }

  const used = plates.reduce((s, p) => s + p, 0);
  const remainder = +(perSideTarget - used).toFixed(2);
  return { plates, remainder, error: null };
}

// ── Dumbbell calculation ───────────────────────────────────────

/**
 * Compute plates for a single dumbbell (user takes 2 identical).
 *
 * Returns error keys:
 * - `"invalidBarWeight"` — barWeight is not finite or negative
 * - `"targetBelowDumbbellBar"` — target < barWeight (use `formatTemplate` with `{target}` and `{bar}`)
 *
 * @returns DumbbellResult with plates, weights, remainder, and error key (or null).
 */
export function computeDumbbells(
  target: number,
  barWeight: number,
): DumbbellResult {
  if (!Number.isFinite(target) || target < 0) {
    return { plates: [], plateWeight: 0, dumbbellWeight: 0, remainder: 0, error: null };
  }
  if (!Number.isFinite(barWeight) || barWeight < 0) {
    return {
      plates: [],
      plateWeight: 0,
      dumbbellWeight: 0,
      remainder: 0,
      error: 'invalidBarWeight',
    };
  }
  if (target === 0) {
    return { plates: [], plateWeight: 0, dumbbellWeight: 0, remainder: 0, error: null };
  }
  if (target < barWeight) {
    return {
      plates: [],
      plateWeight: 0,
      dumbbellWeight: 0,
      remainder: 0,
      error: 'targetBelowDumbbellBar',
    };
  }
  if (target === barWeight) {
    return { plates: [], plateWeight: 0, dumbbellWeight: barWeight, remainder: 0, error: null };
  }

  const plateTarget = +(target - barWeight).toFixed(4);
  let remaining = plateTarget;
  const plates: number[] = [];

  for (const p of DUMBBELL_PLATE_INVENTORY) {
    const count = Math.floor(remaining / p);
    for (let i = 0; i < count; i++) plates.push(p);
    remaining = +(remaining - count * p).toFixed(4);
  }

  const plateWeight = +plates.reduce((s, p) => s + p, 0).toFixed(2);
  const dumbbellWeight = +(barWeight + plateWeight).toFixed(2);
  const remainder = +(dumbbellWeight - target).toFixed(2);
  return { plates, plateWeight, dumbbellWeight, remainder, error: null };
}

// ── Grouping ───────────────────────────────────────────────────

/** Group plates by weight, ordered by PLATE_INVENTORY (biggest first). */
export function groupPlates(plates: number[]): PlateCount[] {
  const map = new Map<number, number>();
  for (const p of plates) map.set(p, (map.get(p) ?? 0) + 1);
  return PLATE_INVENTORY.filter((p) => map.has(p)).map((p) => ({
    weight: p,
    count: map.get(p) ?? 0,
  }));
}

/** Group dumbbell plates by weight, ordered by DUMBBELL_PLATE_INVENTORY. */
export function groupDumbbellPlates(plates: number[]): PlateCount[] {
  const map = new Map<number, number>();
  for (const p of plates) map.set(p, (map.get(p) ?? 0) + 1);
  return DUMBBELL_PLATE_INVENTORY.filter((p) => map.has(p)).map((p) => ({
    weight: p,
    count: map.get(p) ?? 0,
  }));
}
