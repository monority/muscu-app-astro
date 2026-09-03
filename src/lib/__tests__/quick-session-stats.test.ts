import { describe, it, expect } from 'vitest';
import type { Session, SessionSet } from '../storage';
import {
  formatWeight,
  formatDuration,
  formatRestTime,
  typeLabel,
  todayISO,
  computeAvailableSessions,
  computeSessionStats,
  computeProgressPercent,
  canGoPrev,
  canGoNext,
  restNextLabel,
  completionTitle,
  completionMessage,
} from '../quick-session-stats';

// ── Helpers ──────────────────────────────────────────────────────

function makeSet(overrides: Partial<SessionSet> = {}): SessionSet {
  return {
    exerciseId: 'e1',
    setNumber: 1,
    weight: 80,
    reps: 8,
    type: 'work',
    completed: false,
    ...overrides,
  };
}

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 's1',
    name: 'Test Session',
    date: '2026-01-01',
    status: 'planned',
    exercises: [
      {
        exerciseId: 'e1',
        name: 'Bench',
        muscle: 'Pectoraux',
        sets: [makeSet({ completed: true }), makeSet({ completed: false })],
      },
    ],
    ...overrides,
  };
}

const DURATION_LABELS = { minShort: 'm', hShort: 'h', sShort: 's' };
const TYPE_LABELS = {
  typeWarmup: 'Échauffement',
  typeWork: 'Travail',
  typeTop: 'Top set',
  typeDrop: 'Drop set',
  typeFailure: 'Échec',
};

// ── formatWeight ─────────────────────────────────────────────────

describe('formatWeight', () => {
  it('returns 0 for zero', () => {
    expect(formatWeight(0)).toBe('0');
  });
  it('returns 0 for negative', () => {
    expect(formatWeight(-5)).toBe('0');
  });
  it('returns 0 for NaN', () => {
    expect(formatWeight(NaN)).toBe('0');
  });
  it('rounds to integer', () => {
    expect(formatWeight(80)).toBe('80');
  });
  it('keeps one decimal', () => {
    expect(formatWeight(80.5)).toBe('80.5');
  });
  it('rounds 80.04 to 80', () => {
    expect(formatWeight(80.04)).toBe('80');
  });
});

// ── formatDuration ───────────────────────────────────────────────

describe('formatDuration', () => {
  it('returns 0m for undefined', () => {
    expect(formatDuration(undefined, DURATION_LABELS)).toBe('0m');
  });
  it('formats seconds only', () => {
    expect(formatDuration(45, DURATION_LABELS)).toBe('45s');
  });
  it('formats minutes + seconds', () => {
    expect(formatDuration(125, DURATION_LABELS)).toBe('2m 05s');
  });
  it('formats hours + minutes', () => {
    expect(formatDuration(3661, DURATION_LABELS)).toBe('1h 01m');
  });
});

// ── formatRestTime ───────────────────────────────────────────────

describe('formatRestTime', () => {
  it('formats 0 as 0:00', () => {
    expect(formatRestTime(0)).toBe('0:00');
  });
  it('formats 90 as 1:30', () => {
    expect(formatRestTime(90)).toBe('1:30');
  });
  it('formats 5 as 0:05', () => {
    expect(formatRestTime(5)).toBe('0:05');
  });
});

// ── typeLabel ────────────────────────────────────────────────────

describe('typeLabel', () => {
  it('returns correct label for each type', () => {
    expect(typeLabel('warmup', TYPE_LABELS)).toBe('Échauffement');
    expect(typeLabel('work', TYPE_LABELS)).toBe('Travail');
    expect(typeLabel('top', TYPE_LABELS)).toBe('Top set');
    expect(typeLabel('drop', TYPE_LABELS)).toBe('Drop set');
    expect(typeLabel('failure', TYPE_LABELS)).toBe('Échec');
  });
  it('returns empty for unknown', () => {
    expect(typeLabel('unknown' as any, TYPE_LABELS)).toBe('');
  });
});

// ── todayISO ─────────────────────────────────────────────────────

describe('todayISO', () => {
  it('returns YYYY-MM-DD format', () => {
    const result = todayISO();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ── computeAvailableSessions ─────────────────────────────────────

describe('computeAvailableSessions', () => {
  it('excludes completed sessions', () => {
    const sessions = [makeSession({ status: 'completed' })];
    expect(computeAvailableSessions(sessions)).toHaveLength(0);
  });
  it('excludes sessions with no sets', () => {
    const sessions = [makeSession({ exercises: [] })];
    expect(computeAvailableSessions(sessions)).toHaveLength(0);
  });
  it('includes planned sessions', () => {
    const sessions = [makeSession({ status: 'planned' })];
    expect(computeAvailableSessions(sessions)).toHaveLength(1);
  });
  it('includes in-progress sessions', () => {
    const sessions = [makeSession({ status: 'in-progress' })];
    expect(computeAvailableSessions(sessions)).toHaveLength(1);
  });
  it('computes totalSets and totalVolume', () => {
    const sessions = [makeSession()];
    const info = computeAvailableSessions(sessions);
    expect(info[0].totalSets).toBe(2);
    expect(info[0].totalVolume).toBe(80 * 8 * 2); // 2 completed sets
  });
});

// ── computeSessionStats ──────────────────────────────────────────

describe('computeSessionStats', () => {
  it('computes all stats', () => {
    const session = makeSession();
    const stats = computeSessionStats(session);
    expect(stats.totalSets).toBe(2);
    expect(stats.recordedSets).toBe(1);
    expect(stats.totalExercises).toBe(1);
    expect(stats.completedExercises).toBe(0); // not all sets completed
    expect(stats.totalVolume).toBe(80 * 8); // only completed sets
  });
  it('counts fully completed exercises', () => {
    const session = makeSession({
      exercises: [
        {
          exerciseId: 'e1',
          name: 'Bench',
          muscle: 'Pectoraux',
          sets: [makeSet({ completed: true }), makeSet({ completed: true })],
        },
      ],
    });
    const stats = computeSessionStats(session);
    expect(stats.completedExercises).toBe(1);
    expect(stats.recordedSets).toBe(2);
  });
});

// ── computeProgressPercent ───────────────────────────────────────

describe('computeProgressPercent', () => {
  it('returns 0 at start', () => {
    const session = makeSession();
    expect(computeProgressPercent(session, 0, 0)).toBe(0);
  });
  it('returns 50 after first set of first exercise', () => {
    const session = makeSession();
    expect(computeProgressPercent(session, 0, 1)).toBe(50);
  });
  it('returns 100 at end', () => {
    const session = makeSession();
    expect(computeProgressPercent(session, 1, 0)).toBe(100);
  });
});

// ── canGoPrev / canGoNext ────────────────────────────────────────

describe('canGoPrev', () => {
  it('returns false at start', () => {
    expect(canGoPrev(0, 0)).toBe(false);
  });
  it('returns true after advancing', () => {
    expect(canGoPrev(0, 1)).toBe(true);
    expect(canGoPrev(1, 0)).toBe(true);
  });
});

describe('canGoNext', () => {
  it('returns true when more sets', () => {
    const session = makeSession();
    expect(canGoNext(session, 0, 0)).toBe(true);
  });
  it('returns false at last set of last exercise', () => {
    const session = makeSession();
    expect(canGoNext(session, 1, 0)).toBe(false);
  });
});

// ── restNextLabel ────────────────────────────────────────────────

describe('restNextLabel', () => {
  it('builds label with weight and reps', () => {
    const session = makeSession();
    const result = restNextLabel(
      session,
      0,
      0,
      (w) => String(w),
      'kg',
      'Next up',
    );
    expect(result).toBe('Next up 80 kg × 8');
  });
  it('returns empty for invalid index', () => {
    const session = makeSession();
    const result = restNextLabel(session, 5, 0, (w) => String(w), 'kg', 'Next');
    expect(result).toBe('');
  });
});

// ── completionTitle / completionMessage ──────────────────────────

describe('completionTitle', () => {
  it('shows all done when complete', () => {
    expect(completionTitle(10, 10, 'All done!', 'Ended early')).toBe('All done!');
  });
  it('shows ended early when partial', () => {
    expect(completionTitle(5, 10, 'All done!', 'Ended early')).toBe('Ended early');
  });
});

describe('completionMessage', () => {
  it('returns full message when complete', () => {
    expect(completionMessage(10, 10, 'Full', 'Partial', 'sets')).toBe('Full');
  });
  it('returns partial message with count', () => {
    expect(completionMessage(3, 10, 'Full', 'Partial', 'sets')).toBe('Partial — 3/10 sets');
  });
});
