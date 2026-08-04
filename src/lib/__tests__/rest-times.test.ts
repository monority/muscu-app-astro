import { describe, it, expect } from 'vitest';
import { getRestTime, formatRestTime, REST_TIMES_MAP, DEFAULT_REST } from '../rest-times';

describe('getRestTime', () => {
  it('returns 180s for compound lower-body lifts (Squat barre)', () => {
    expect(getRestTime('Squat barre')).toBe(180);
  });

  it('returns 150s for heavy compound upper-body lifts (Développé couché barre)', () => {
    expect(getRestTime('Développé couché barre')).toBe(150);
  });

  it('returns 150s for moderate compounds (Rowing barre, Presse à cuisses)', () => {
    expect(getRestTime('Rowing barre')).toBe(150);
    expect(getRestTime('Presse à cuisses')).toBe(150);
  });

  it('returns 60s for isolation work (Curl haltères, Élévations latérales)', () => {
    expect(getRestTime('Curl haltères')).toBe(60);
    expect(getRestTime('Élévations latérales haltères')).toBe(60);
  });

  it('returns 45s for core work (Crunch)', () => {
    expect(getRestTime('Crunch')).toBe(45);
  });

  it('falls back to the default 90s for unknown exercises', () => {
    expect(getRestTime('Exercice inventé XYZ')).toBe(DEFAULT_REST);
    expect(DEFAULT_REST).toBe(90);
  });

  it('falls back to the default 90s for empty input', () => {
    expect(getRestTime('')).toBe(90);
  });
});

describe('formatRestTime', () => {
  it('formats whole minutes as M:00', () => {
    expect(formatRestTime(60)).toBe('1:00');
    expect(formatRestTime(180)).toBe('3:00');
    expect(formatRestTime(0)).toBe('0:00');
  });

  it('pads seconds to two digits', () => {
    expect(formatRestTime(5)).toBe('0:05');
    expect(formatRestTime(45)).toBe('0:45');
    expect(formatRestTime(65)).toBe('1:05');
  });

  it('floors fractional seconds', () => {
    expect(formatRestTime(60.9)).toBe('1:00');
    expect(formatRestTime(59.5)).toBe('0:59');
  });

  it('clamps negative values to 0:00', () => {
    expect(formatRestTime(-10)).toBe('0:00');
  });
});

describe('REST_TIMES_MAP', () => {
  it('contains all compound entries (no undefined for known names)', () => {
    expect(REST_TIMES_MAP['Squat barre']).toBe(180);
    expect(REST_TIMES_MAP['Soulevé de terre barre']).toBe(180);
    expect(REST_TIMES_MAP['Développé militaire barre']).toBe(150);
  });

  it('uses rest values >= 60s for compound lifts', () => {
    for (const [name, seconds] of Object.entries(REST_TIMES_MAP)) {
      // No compound lift should be in the 60s isolation bucket.
      if (
        name.startsWith('Squat') ||
        name.startsWith('Soulevé') ||
        name.startsWith('Développé') ||
        name.startsWith('Rowing') ||
        name.startsWith('Presse') ||
        name.startsWith('Hip thrust') ||
        name.startsWith('Tractions')
      ) {
        expect(seconds).toBeGreaterThanOrEqual(60);
      }
    }
  });
});
