/**
 * Pure calendar grid generation logic extracted from calendar.astro.
 *
 * No DOM or Alpine dependencies — safe for unit testing and reuse.
 */

import type { Session } from './storage';

// ============================================================================
// Types
// ============================================================================

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  dayNum: number; // 1-31
  isCurrentMonth: boolean;
  isToday: boolean;
  sessions: Session[];
}

// ============================================================================
// Pure functions
// ============================================================================

/** Format a Date as local YYYY-MM-DD (no UTC shift). */
export function formatISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Generate a 42-cell (6 weeks) calendar grid for the given month.
 *
 * The grid starts on the Sunday on or before the 1st of the month and
 * fills the remaining cells with days from the previous/next months.
 * Sessions are initialised to `[]` — use `assignSessions` to populate them.
 *
 * @param year  Full year (e.g. 2026)
 * @param month Zero-indexed month (0 = January)
 * @param today Optional reference date for `isToday` (defaults to `new Date()`)
 */
export function buildMonthDays(
  year: number,
  month: number,
  today?: Date,
): CalendarDay[] {
  const now = today ?? new Date();
  const todayStr = formatISO(now);

  // Find the Sunday that starts the grid
  const firstOfMonth = new Date(year, month, 1);
  const startDow = firstOfMonth.getDay(); // 0 = Sunday
  const startDate = new Date(year, month, 1 - startDow);

  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = formatISO(d);
    const isCurrentMonth =
      d.getMonth() === month && d.getFullYear() === year;
    days.push({
      date: dateStr,
      dayNum: d.getDate(),
      isCurrentMonth,
      isToday: dateStr === todayStr,
      sessions: [],
    });
  }

  return days;
}

/**
 * Attach matching sessions to each calendar day by date string.
 *
 * Returns a new array — the input is not mutated.
 */
export function assignSessions(
  days: CalendarDay[],
  sessions: Session[],
): CalendarDay[] {
  return days.map((day) => ({
    ...day,
    sessions: sessions.filter((s) => s.date === day.date),
  }));
}
