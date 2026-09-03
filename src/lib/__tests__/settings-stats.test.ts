import { describe, it, expect } from 'vitest';
import {
  formatRestOptions,
  formatSyncLastLabel,
  formatSyncErrorLabel,
  parseRestTime,
  clampWeeklyGoal,
  exportFilename,
} from '../settings-stats';

// ── formatRestOptions ────────────────────────────────────────────

describe('formatRestOptions', () => {
  it('formats presets with whole minutes', () => {
    const opts = formatRestOptions([60, 120]);
    expect(opts).toEqual([
      { value: '60', label: '1 min' },
      { value: '120', label: '2 min' },
    ]);
  });

  it('formats presets with seconds', () => {
    const opts = formatRestOptions([90]);
    expect(opts).toEqual([{ value: '90', label: '1 min 30 s' }]);
  });

  it('uses default presets when none provided', () => {
    const opts = formatRestOptions();
    expect(opts.length).toBe(8);
    expect(opts[0].label).toBe('0 min 30 s');
    expect(opts[2].label).toBe('1 min');
  });
});

// ── formatSyncLastLabel ──────────────────────────────────────────

describe('formatSyncLastLabel', () => {
  it('returns never when undefined', () => {
    expect(formatSyncLastLabel(undefined, 'Jamais', 'Dernière')).toBe('Jamais');
  });

  it('returns never for invalid date', () => {
    expect(formatSyncLastLabel('not-a-date', 'Jamais', 'Dernière')).toBe('Jamais');
  });

  it('formats valid date', () => {
    const result = formatSyncLastLabel('2026-01-15T10:30:00Z', 'Jamais', 'Dernière');
    expect(result).toMatch(/^Dernière — /);
  });
});

// ── formatSyncErrorLabel ─────────────────────────────────────────

describe('formatSyncErrorLabel', () => {
  it('returns message for Error', () => {
    const err = new Error('fail');
    expect(formatSyncErrorLabel(err, {}, 'Fallback')).toBe('fail');
  });

  it('returns fallback for unknown', () => {
    expect(formatSyncErrorLabel(null, {}, 'Fallback')).toBe('Fallback');
  });

  it('handles SyncError-like objects', () => {
    const err = { code: 'sync-timeout' as const };
    const labels = { 'sync-timeout': 'Timeout!' };
    expect(formatSyncErrorLabel(err, labels, 'Fallback')).toBe('Timeout!');
  });

  it('adds HTTP status for sync-http', () => {
    const err = { code: 'sync-http' as const, status: 404 };
    const labels = { 'sync-http': 'HTTP Error' };
    expect(formatSyncErrorLabel(err, labels, 'Fallback')).toBe('HTTP Error (HTTP 404)');
  });

  it('falls back for unknown code', () => {
    const err = { code: 'unknown-code' as const };
    expect(formatSyncErrorLabel(err, {}, 'Fallback')).toBe('Fallback');
  });
});

// ── parseRestTime ────────────────────────────────────────────────

describe('parseRestTime', () => {
  it('parses valid rest time', () => {
    expect(parseRestTime('90')).toBe(90);
  });

  it('returns null for too small', () => {
    expect(parseRestTime('3')).toBeNull();
  });

  it('returns null for too large', () => {
    expect(parseRestTime('5000')).toBeNull();
  });

  it('returns null for NaN', () => {
    expect(parseRestTime('abc')).toBeNull();
  });

  it('accepts minimum (5)', () => {
    expect(parseRestTime('5')).toBe(5);
  });

  it('accepts maximum (3600)', () => {
    expect(parseRestTime('3600')).toBe(3600);
  });
});

// ── clampWeeklyGoal ──────────────────────────────────────────────

describe('clampWeeklyGoal', () => {
  it('clamps to [1, 7]', () => {
    expect(clampWeeklyGoal(0)).toBe(1);
    expect(clampWeeklyGoal(10)).toBe(7);
    expect(clampWeeklyGoal(4)).toBe(4);
  });

  it('rounds to integer', () => {
    expect(clampWeeklyGoal(3.7)).toBe(4);
  });

  it('returns null for NaN', () => {
    expect(clampWeeklyGoal(NaN)).toBeNull();
  });
});

// ── exportFilename ───────────────────────────────────────────────

describe('exportFilename', () => {
  it('builds filename with date', () => {
    const name = exportFilename('muscu-backup', 'json');
    expect(name).toMatch(/^muscu-backup-\d{4}-\d{2}-\d{2}\.json$/);
  });
});
