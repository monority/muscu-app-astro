import { describe, it, expect } from 'vitest';
import { formatTime, formatShort, formatStopwatch } from '../timer-format';

describe('formatTime', () => {
  it('formats minutes:seconds', () => {
    expect(formatTime(90)).toBe('01:30');
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(61)).toBe('01:01');
    expect(formatTime(3599)).toBe('59:59');
  });

  it('floors fractional seconds', () => {
    expect(formatTime(1.9)).toBe('00:01');
  });

  it('clamps negative to 00:00', () => {
    expect(formatTime(-5)).toBe('00:00');
  });
});

describe('formatShort', () => {
  it('returns seconds only when < 1 min', () => {
    expect(formatShort(45)).toBe('45s');
    expect(formatShort(0)).toBe('0s');
  });

  it('returns mm:00 when exact minutes', () => {
    expect(formatShort(120)).toBe('2:00');
    expect(formatShort(60)).toBe('1:00');
  });

  it('returns mm:ss otherwise', () => {
    expect(formatShort(90)).toBe('1:30');
    expect(formatShort(125)).toBe('2:05');
  });
});

describe('formatStopwatch', () => {
  it('formats ms as mm:ss.cc', () => {
    expect(formatStopwatch(0)).toBe('00:00.00');
    expect(formatStopwatch(1500)).toBe('00:01.50');
    expect(formatStopwatch(61234)).toBe('01:01.23');
  });

  it('formats hours when >= 1h', () => {
    expect(formatStopwatch(3600000)).toBe('01:00:00');
    expect(formatStopwatch(3661000)).toBe('01:01:01');
  });

  it('clamps negative to 00:00.00', () => {
    expect(formatStopwatch(-100)).toBe('00:00.00');
  });

  it('floors fractional ms', () => {
    expect(formatStopwatch(1005)).toBe('00:01.00');
  });
});
