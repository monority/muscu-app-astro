/**
 * Fake auth helpers for the dev build.
 *
 * Persists a minimal session object in localStorage under the
 * `muscu-auth` key. This is NOT a real auth system: there is no
 * password check, no token, no server-side validation. It only
 * gates the UI so the rest of the app can be developed in a
 * "logged in" state.
 *
 * SECURITY MODEL (v1):
 * - This app is 100% offline/local-first — no backend exists.
 * - The "auth" gate is purely cosmetic (UI access control).
 * - localStorage data is readable by any code on the same origin.
 * - WebDAV credentials are stored in plain text (deliberate tradeoff
 *   documented in the UI and sync.ts). They are only sent to the
 *   user-configured WebDAV server.
 * - Never present this auth as a security boundary. It exists only
 *   to support the dev workflow and optional UI gating.
 *
 * Stored shape: { email: string, name: string }
 */

export interface MuscuAuth {
  email: string;
  name: string;
}

const AUTH_KEY = 'muscu-auth';

/**
 * Read the current session, or null if not logged in / data is
 * malformed / localStorage is unavailable (SSR, private mode).
 */
export function getAuth(): MuscuAuth | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(AUTH_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as Partial<MuscuAuth>;
    if (
      typeof parsed?.email !== 'string' ||
      typeof parsed?.name !== 'string'
    ) {
      return null;
    }
    const email = parsed.email.trim();
    const name = parsed.name.trim();
    if (!email || !name) return null;
    return { email, name };
  } catch {
    return null;
  }
}

/**
 * Persist a new session. Both fields are trimmed before storage
 * so downstream code never has to worry about stray whitespace.
 * Silently no-ops if either field is empty or storage is unavailable.
 */
export function setAuth(email: string, name: string): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  const cleanEmail = email.trim();
  const cleanName = name.trim();
  if (!cleanEmail || !cleanName) return;
  try {
    window.localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({ email: cleanEmail, name: cleanName }),
    );
  } catch {
    // quota exceeded, private mode, storage disabled — silently no-op
  }
}

/**
 * Drop the session. Safe to call when not logged in or from SSR.
 */
export function clearAuth(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.removeItem(AUTH_KEY);
  } catch {
    // ignore
  }
}

/**
 * Convenience boolean for guards.
 */
export function isAuthenticated(): boolean {
  return getAuth() !== null;
}
