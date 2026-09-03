/**
 * trends-stats — Pure computation for exercise trends page.
 *
 * Extracted from pages/exercises/trends.astro for testability.
 * All functions are pure: data in, results out. No DOM, no localStorage.
 */

import { calculate1RM, type Session } from './storage';

// ── Types ───────────────────────────────────────────────────────

export interface TrendPoint {
  date: string;
  value: number;
}

export type Metric = 'volume' | 'rm';
export type Period = 'all' | '3m' | '1y';

// ── Helpers ─────────────────────────────────────────────────────

export const CHART_W = 800;
export const CHART_H = 300;

/** Timestamp of N months ago from `now`. */
export function monthAgo(months: number, now = new Date()): number {
  const d = new Date(now);
  d.setMonth(d.getMonth() - months);
  return d.getTime();
}

// ── Points computation ──────────────────────────────────────────

/**
 * Compute trend points for a given exercise across sessions.
 *
 * Aggregates volume (Σ weight×reps) and best 1RM per day,
 * then filters by period and sorts chronologically.
 */
export function computeTrendPoints(
  sessions: Session[],
  exerciseId: string,
  metric: Metric,
  period: Period,
  now = new Date(),
): TrendPoint[] {
  const byDate = new Map<string, { vol: number; rm: number }>();

  for (const session of sessions) {
    for (const ex of session.exercises) {
      if (ex.exerciseId !== exerciseId) continue;
      let vol = 0;
      let rm = 0;
      for (const set of ex.sets) {
        if (!set.completed) continue;
        vol += set.weight * set.reps;
        const estimate = calculate1RM(set.weight, set.reps);
        if (estimate > rm) rm = estimate;
      }
      if (vol > 0 || rm > 0) {
        const cur = byDate.get(session.date) ?? { vol: 0, rm: 0 };
        cur.vol += vol;
        cur.rm = Math.max(cur.rm, rm);
        byDate.set(session.date, cur);
      }
    }
  }

  const minTime =
    period === '3m' ? monthAgo(3, now) : period === '1y' ? monthAgo(12, now) : null;

  let pts = Array.from(byDate.entries()).map(([date, v]) => ({
    date,
    value: metric === 'volume' ? v.vol : v.rm,
  }));

  if (minTime !== null) {
    pts = pts.filter((p) => new Date(p.date).getTime() >= minTime);
  }

  return pts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// ── Chart helpers ───────────────────────────────────────────────

/** Max Y-axis value: peak × 1.1 with floor of 10. */
export function chartMax(points: TrendPoint[]): number {
  const peak = points.reduce((m, d) => (d.value > m ? d.value : m), 0);
  return Math.max(peak * 1.1, 10);
}

/** X coordinate for point index `i` in a chart of width CHART_W. */
export function chartX(i: number, count: number): number {
  if (count <= 1) return CHART_W / 2;
  return (i / (count - 1)) * CHART_W;
}

/** Y coordinate for value `v` given the chart max. */
export function chartY(v: number, max: number): number {
  if (max <= 0) return CHART_H;
  return CHART_H - (v / max) * CHART_H;
}
