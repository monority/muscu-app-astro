import { describe, it, expect } from 'vitest';
import { formatISO, buildMonthDays, assignSessions, type CalendarDay } from '../calendar-grid';
import type { Session } from '../storage';

// ============================================================================
// formatISO
// ============================================================================

describe('formatISO', () => {
  it('formats Date as YYYY-MM-DD in local time', () => {
    expect(formatISO(new Date(2026, 0, 1))).toBe('2026-01-01');
    expect(formatISO(new Date(2026, 11, 31))).toBe('2026-12-31');
    expect(formatISO(new Date(2028, 1, 29))).toBe('2028-02-29');
  });

  it('pads single-digit months and days', () => {
    expect(formatISO(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(formatISO(new Date(2026, 2, 9))).toBe('2026-03-09');
  });
});

// ============================================================================
// buildMonthDays
// ============================================================================

describe('buildMonthDays', () => {
  it('returns exactly 42 days', () => {
    const days = buildMonthDays(2026, 7); // August 2026
    expect(days).toHaveLength(42);
  });

  it('first day is the Sunday on or before the 1st', () => {
    // August 1, 2026 — check what day of week it falls on
    const firstOfMonth = new Date(2026, 7, 1);
    const startDow = firstOfMonth.getDay();
    const days = buildMonthDays(2026, 7);
    // The first cell should be `startDow` days before the 1st
    const expectedFirst = new Date(2026, 7, 1 - startDow);
    expect(days[0].date).toBe(formatISO(expectedFirst));
  });

  it('month starting on Sunday has no previous-month padding', () => {
    // Find a month that starts on Sunday
    // June 2026: let's check
    const june1 = new Date(2026, 5, 1);
    if (june1.getDay() === 0) {
      const days = buildMonthDays(2026, 5);
      expect(days[0].isCurrentMonth).toBe(true);
      expect(days[0].dayNum).toBe(1);
    }
  });

  it('correctly identifies current month days', () => {
    const days = buildMonthDays(2026, 7); // August 2026
    const currentMonthDays = days.filter((d) => d.isCurrentMonth);
    // August has 31 days
    expect(currentMonthDays).toHaveLength(31);
    expect(currentMonthDays[0].dayNum).toBe(1);
    expect(currentMonthDays[30].dayNum).toBe(31);
  });

  it('previous month days have isCurrentMonth=false', () => {
    const days = buildMonthDays(2026, 7); // August 2026
    const first = days[0];
    // First day(s) should be from July
    if (first.isCurrentMonth === false) {
      expect(first.date.startsWith('2026-07')).toBe(true);
    }
  });

  it('handles February in leap year (2028)', () => {
    const days = buildMonthDays(2028, 1); // February 2028
    const febDays = days.filter((d) => d.isCurrentMonth);
    expect(febDays).toHaveLength(29); // leap year
    expect(febDays[28].dayNum).toBe(29);
  });

  it('handles February in non-leap year', () => {
    const days = buildMonthDays(2027, 1); // February 2027
    const febDays = days.filter((d) => d.isCurrentMonth);
    expect(febDays).toHaveLength(28);
  });

  it('sets isToday correctly', () => {
    const fakeToday = new Date(2026, 7, 15); // Aug 15, 2026
    const days = buildMonthDays(2026, 7, fakeToday);
    const todayCells = days.filter((d) => d.isToday);
    expect(todayCells).toHaveLength(1);
    expect(todayCells[0].date).toBe('2026-08-15');
    expect(todayCells[0].dayNum).toBe(15);
  });

  it('isToday is false when today is outside the grid month', () => {
    const fakeToday = new Date(2026, 8, 15); // Sep 15, 2026
    const days = buildMonthDays(2026, 7, fakeToday); // August grid
    const todayCells = days.filter((d) => d.isToday);
    expect(todayCells).toHaveLength(0);
  });

  it('initialises sessions to empty array for every day', () => {
    const days = buildMonthDays(2026, 7);
    for (const day of days) {
      expect(day.sessions).toEqual([]);
    }
  });

  it('month starting mid-week pads correctly', () => {
    // August 1, 2026 — check day of week
    const aug1 = new Date(2026, 7, 1);
    const startDow = aug1.getDay();
    const days = buildMonthDays(2026, 7);

    // Should have `startDow` previous-month days
    const prevMonthDays = days.filter((d) => !d.isCurrentMonth);
    // Some prev month days may appear at the start, some at the end
    const leadingPrevMonth = days.findIndex((d) => d.isCurrentMonth === false);
    const firstCurrentMonth = days.findIndex((d) => d.isCurrentMonth);

    if (startDow > 0) {
      expect(leadingPrevMonth).toBe(0);
      expect(firstCurrentMonth).toBe(startDow);
    }
  });
});

// ============================================================================
// assignSessions
// ============================================================================

function makeSession(overrides: Partial<Session> & { date: string }): Session {
  return {
    id: overrides.id ?? 's1',
    name: overrides.name ?? 'Test Session',
    exercises: [],
    status: overrides.status ?? 'completed',
    ...overrides,
  };
}

describe('assignSessions', () => {
  it('attaches sessions to the correct days', () => {
    const days = buildMonthDays(2026, 7); // August 2026
    const sessions: Session[] = [
      makeSession({ id: 's1', date: '2026-08-05', status: 'completed' }),
      makeSession({ id: 's2', date: '2026-08-05', status: 'planned' }),
      makeSession({ id: 's3', date: '2026-08-20', status: 'in-progress' }),
    ];

    const updated = assignSessions(days, sessions);
    const aug5 = updated.find((d) => d.date === '2026-08-05');
    const aug20 = updated.find((d) => d.date === '2026-08-20');
    const aug1 = updated.find((d) => d.date === '2026-08-01');

    expect(aug5!.sessions).toHaveLength(2);
    expect(aug5!.sessions.map((s) => s.id)).toEqual(['s1', 's2']);
    expect(aug20!.sessions).toHaveLength(1);
    expect(aug20!.sessions[0].id).toBe('s3');
    expect(aug1!.sessions).toHaveLength(0);
  });

  it('handles empty sessions array', () => {
    const days = buildMonthDays(2026, 7);
    const updated = assignSessions(days, []);
    for (const day of updated) {
      expect(day.sessions).toEqual([]);
    }
  });

  it('handles sessions with same date', () => {
    const days = buildMonthDays(2026, 7);
    const sessions: Session[] = [
      makeSession({ id: 'a', date: '2026-08-10', status: 'completed' }),
      makeSession({ id: 'b', date: '2026-08-10', status: 'completed' }),
      makeSession({ id: 'c', date: '2026-08-10', status: 'planned' }),
    ];

    const updated = assignSessions(days, sessions);
    const aug10 = updated.find((d) => d.date === '2026-08-10');
    expect(aug10!.sessions).toHaveLength(3);
  });

  it('handles no matching sessions', () => {
    const days = buildMonthDays(2026, 7);
    const sessions: Session[] = [
      makeSession({ id: 's1', date: '2026-09-10', status: 'completed' }),
    ];

    const updated = assignSessions(days, sessions);
    for (const day of updated) {
      expect(day.sessions).toEqual([]);
    }
  });

  it('does not mutate the original days array', () => {
    const days = buildMonthDays(2026, 7);
    const original = days.map((d) => ({ ...d, sessions: [...d.sessions] }));
    const sessions: Session[] = [
      makeSession({ id: 's1', date: '2026-08-05', status: 'completed' }),
    ];

    assignSessions(days, sessions);
    expect(days).toEqual(original);
  });
});
