/**
 * WebDAV sync client (v1) — minimal, browser-only, no backend of our own.
 *
 * Pushes/pulls the `AppDataSnapshot` produced by `exportAllData()` (see
 * ./storage) to any plain WebDAV server using pre-emptive Basic auth over
 * `fetch`. No new dependency: the app talks directly to the user-supplied
 * server.
 *
 * Error handling is locale-agnostic. Every failure throws a `SyncError`
 * carrying a stable machine-readable `code`; the UI maps codes to fr/en
 * strings. This module never embeds a locale.
 *
 * Conflict policy (v1): last-write-wins. `syncPush` unconditionally
 * overwrites the remote file and the caller records `webdav.lastSyncAt` so
 * the settings page can show a "last sync" timestamp. The snapshot itself
 * carries an `exportedAt` timestamp field (see `AppDataSnapshot`), which a
 * future merge strategy can use — v1 deliberately does not merge.
 */

import type { AppDataSnapshot } from './storage';

/** Filename appended when the configured URL points at a directory. */
export const SYNC_FILENAME = 'muscu-backup.json';

/** Stable codes surfaced to the UI (mapped to localized messages there). */
export type SyncErrorCode =
  | 'sync-unavailable'
  | 'sync-invalid-url'
  | 'sync-unauthorized'
  | 'sync-forbidden'
  | 'sync-notfound'
  | 'sync-invalid'
  | 'sync-network'
  | 'sync-http';

export class SyncError extends Error {
  readonly code: SyncErrorCode;
  /** HTTP status that produced the error, when applicable (e.g. 503). */
  readonly status?: number;

  constructor(code: SyncErrorCode, status?: number) {
    super(status === undefined ? code : `${code} (HTTP ${status})`);
    this.name = 'SyncError';
    this.code = code;
    this.status = status;
  }
}

/** Result of `syncTest`: reachable + whether a backup already exists. */
export interface SyncTestResult {
  reachable: boolean;
  hasBackup: boolean;
}

/**
 * Feature guard. Sync is client-only; when `fetch` or `btoa` are unavailable
 * (ancient browsers / SSR), every sync API resolves to a `sync-unavailable`
 * error instead of crashing with a reference error.
 */
export function syncAvailable(): boolean {
  return typeof fetch === 'function' && typeof btoa === 'function';
}

/**
 * RFC 7617 Basic auth header, unicode-safe. `btoa` alone throws on any
 * character > U+00FF (é, ü, … passwords), so we encode through `TextEncoder`
 * when available and fall back to plain `btoa` (Latin-1 only) otherwise.
 */
export function buildBasicAuthHeader(username: string, password: string): string {
  const credentials = `${username}:${password}`;
  if (typeof TextEncoder === 'function') {
    const bytes = new TextEncoder().encode(credentials);
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    return `Basic ${btoa(binary)}`;
  }
  return `Basic ${btoa(credentials)}`;
}

/**
 * Normalizes the user-configured URL into a concrete resource URL.
 * - URL ending with '/' (directory) → the backup filename is appended.
 * - Any other value → treated as the exact file target.
 * Only http/https is accepted; anything else is `sync-invalid-url`.
 */
export function normalizeResourceUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) throw new SyncError('sync-invalid-url');
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new SyncError('sync-invalid-url');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new SyncError('sync-invalid-url');
  }
  if (parsed.pathname.endsWith('/')) {
    parsed.pathname += SYNC_FILENAME;
  }
  return parsed.toString();
}

/** Maps an HTTP status to a stable error code. */
function codeForStatus(status: number): SyncErrorCode {
  if (status === 401) return 'sync-unauthorized';
  if (status === 403) return 'sync-forbidden';
  if (status === 404) return 'sync-notfound';
  return 'sync-http';
}

/** Auth'd fetch wrapper: reference/network failures become SyncError. */
async function fetchResource(
  resource: string,
  username: string,
  password: string,
  init: { method: string; headers?: Record<string, string>; body?: string },
): Promise<Response> {
  if (!syncAvailable()) throw new SyncError('sync-unavailable');
  try {
    return await fetch(resource, {
      ...init,
      headers: {
        Authorization: buildBasicAuthHeader(username, password),
        ...init.headers,
      },
    });
  } catch {
    // TypeError (CORS preflight rejected, DNS, connection refused, …)
    throw new SyncError('sync-network');
  }
}

/**
 * Uploads the snapshot to the WebDAV server via a PUT (create/overwrite).
 * Resolves when the server confirmed with a 2xx. Last-write-wins: the
 * remote file is unconditionally overwritten.
 */
export async function syncPush(
  url: string,
  username: string,
  password: string,
  snapshot: AppDataSnapshot,
): Promise<void> {
  const resource = normalizeResourceUrl(url);
  const res = await fetchResource(resource, username, password, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot),
  });
  if (!res.ok) throw new SyncError(codeForStatus(res.status), res.status);
  await res.body?.cancel?.();
}

/**
 * Downloads and validates the snapshot. Returns the parsed payload so the
 * caller can hand it to `importAllData()` (which performs the deeper
 * per-field validation and writes to localStorage).
 */
export async function syncPull(
  url: string,
  username: string,
  password: string,
): Promise<AppDataSnapshot> {
  const resource = normalizeResourceUrl(url);
  const res = await fetchResource(resource, username, password, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new SyncError(codeForStatus(res.status), res.status);

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new SyncError('sync-invalid');
  }
  if (!isSnapshotLike(data)) throw new SyncError('sync-invalid');
  return data as AppDataSnapshot;
}

/**
 * Lightweight connectivity + credential check: a bare GET of the resource
 * without importing anything. A 404 still counts as reachable — the server
 * is up and the credentials were accepted, the backup file just doesn't
 * exist yet.
 */
export async function syncTest(
  url: string,
  username: string,
  password: string,
): Promise<SyncTestResult> {
  const resource = normalizeResourceUrl(url);
  const res = await fetchResource(resource, username, password, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (res.ok) return { reachable: true, hasBackup: true };
  if (res.status === 404) return { reachable: true, hasBackup: false };
  throw new SyncError(codeForStatus(res.status), res.status);
}

/**
 * Loose structure check for an `AppDataSnapshot`: numeric `version`,
 * `exportedAt` timestamp, a `settings` object, and array collections when
 * present. `importAllData()` does the authoritative deep validation.
 */
function isSnapshotLike(value: unknown): value is AppDataSnapshot {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (typeof v.version !== 'number') return false;
  if (typeof v.exportedAt !== 'string') return false;
  if (typeof v.settings !== 'object' || v.settings === null) return false;
  for (const key of ['exercises', 'sessions', 'progress', 'body'] as const) {
    if (v[key] !== undefined && !Array.isArray(v[key])) return false;
  }
  return true;
}