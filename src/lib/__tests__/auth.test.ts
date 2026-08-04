// @vitest-environment jsdom
/**
 * Tests for src/lib/auth.ts
 *
 * auth.ts is a localStorage-backed fake session helper, so we override
 * the default `node` environment with `jsdom` per file.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { clearAuth, getAuth, isAuthenticated, setAuth } from '../auth';

const AUTH_KEY = 'muscu-auth';

function clearLocalStorage(): void {
  try {
    window.localStorage.clear();
  } catch {
    // ignore
  }
}

afterEach(() => {
  clearLocalStorage();
});

describe('getAuth / setAuth', () => {
  it('returns null when no session is stored', () => {
    expect(getAuth()).toBeNull();
  });

  it('round-trips an email and name', () => {
    setAuth('user@example.com', 'Alice');
    const session = getAuth();
    expect(session).not.toBeNull();
    expect(session?.email).toBe('user@example.com');
    expect(session?.name).toBe('Alice');
  });

  it('trims whitespace before persisting', () => {
    setAuth('  user@example.com  ', '  Alice  ');
    const session = getAuth();
    expect(session?.email).toBe('user@example.com');
    expect(session?.name).toBe('Alice');
  });

  it('ignores calls with empty fields after trim', () => {
    setAuth('   ', 'Alice');
    expect(getAuth()).toBeNull();

    setAuth('user@example.com', '   ');
    expect(getAuth()).toBeNull();
  });
});

describe('clearAuth', () => {
  it('removes the stored session', () => {
    setAuth('user@example.com', 'Alice');
    expect(getAuth()).not.toBeNull();

    clearAuth();
    expect(getAuth()).toBeNull();
    expect(window.localStorage.getItem(AUTH_KEY)).toBeNull();
  });

  it('is safe to call when not logged in', () => {
    expect(() => clearAuth()).not.toThrow();
    expect(getAuth()).toBeNull();
  });
});

describe('isAuthenticated', () => {
  it('returns false when no session is stored', () => {
    expect(isAuthenticated()).toBe(false);
  });

  it('returns true when a session is stored', () => {
    setAuth('user@example.com', 'Alice');
    expect(isAuthenticated()).toBe(true);
  });

  it('returns false again after clearAuth', () => {
    setAuth('user@example.com', 'Alice');
    expect(isAuthenticated()).toBe(true);
    clearAuth();
    expect(isAuthenticated()).toBe(false);
  });

  it('returns a boolean', () => {
    expect(typeof isAuthenticated()).toBe('boolean');
  });
});
