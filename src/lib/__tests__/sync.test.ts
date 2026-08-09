// @vitest-environment node
/**
 * Tests for src/lib/sync.ts — the WebDAV sync client.
 *
 * Runs in the default `node` environment: `fetch`, `Response`, `btoa` and
 * `TextEncoder` are Node 22+ globals, so pure helpers and mocked-fetch
 * flows work without jsdom. `window`/localStorage are never touched here.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildBasicAuthHeader,
  normalizeResourceUrl,
  syncAvailable,
  syncPull,
  syncPush,
  syncTest,
  SYNC_FILENAME,
  SyncError,
  type SyncErrorCode,
} from '../sync';
import type { AppDataSnapshot } from '../storage';

function snapshot(): AppDataSnapshot {
  return {
    version: 1,
    exportedAt: '2026-08-10T12:00:00.000Z',
    exercises: [],
    sessions: [],
    progress: [],
    body: [],
    settings: {
      pseudo: '',
      email: '',
      unit: 'kg',
      repsFormat: 'simple',
      defaultRestTime: 90,
      soundAlerts: true,
      weeklyGoal: 3,
      reminders: { enabled: false, days: [1, 3, 5], time: '18:00' },
      webdav: { url: '', username: '', password: '' },
    },
  };
}

function mockFetchResponse(status: number, bodyJson?: unknown): void {
  const res = new Response(
    bodyJson === undefined ? null : JSON.stringify(bodyJson),
    { status, headers: { 'Content-Type': 'application/json' } },
  );
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res));
}

const originalFetch = globalThis.fetch;

afterEach(() => {
  vi.unstubAllGlobals();
  globalThis.fetch = originalFetch;
});

describe('syncAvailable', () => {
  it('is true in a modern environment (node 22+ globals)', () => {
    expect(syncAvailable()).toBe(true);
  });
});

describe('buildBasicAuthHeader', () => {
  it('encodes user:password per RFC 7617', () => {
    expect(buildBasicAuthHeader('user', 'pass')).toBe('Basic dXNlcjpwYXNz');
  });

  it('handles non-ASCII credentials without throwing (unicode-safe)', () => {
    const header = buildBasicAuthHeader('moi', 'möt de passe é');
    expect(header.startsWith('Basic ')).toBe(true);
    const decoded = atob(header.slice('Basic '.length));
    expect(decoded.startsWith('moi:m')).toBe(true);
  });
});

describe('normalizeResourceUrl', () => {
  it('appends the backup filename to a directory URL (trailing slash)', () => {
    expect(normalizeResourceUrl('https://ex.com/dav/muscu/')).toBe(
      `https://ex.com/dav/muscu/${SYNC_FILENAME}`,
    );
  });

  it('keeps a file URL as the exact target', () => {
    expect(normalizeResourceUrl('https://ex.com/dav/muscu/backup.json')).toBe(
      'https://ex.com/dav/muscu/backup.json',
    );
  });

  it('trims whitespace before classifying', () => {
    expect(normalizeResourceUrl('  https://ex.com/dav/  ')).toBe(
      `https://ex.com/dav/${SYNC_FILENAME}`,
    );
  });

  it('rejects empty, unparsable and non-http(s) URLs', () => {
    for (const bad of ['', '   ', 'not-a-url', 'ftp://ex.com/file']) {
      expect(() => normalizeResourceUrl(bad)).toThrow(
        expect.objectContaining({ code: 'sync-invalid-url' }),
      );
    }
  });
});

describe('SyncError', () => {
  it('carries the stable code and optional status, and stays an Error', () => {
    const e = new SyncError('sync-unauthorized', 401);
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('SyncError');
    expect(e.code).toBe('sync-unauthorized');
    expect(e.status).toBe(401);
  });
});

describe('syncPush', () => {
  it('PUTs the snapshot to the normalized URL with Basic auth, resolves on 2xx', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201 });
    vi.stubGlobal('fetch', fetchMock);

    await syncPush('https://ex.com/dav/', 'user', 'pass', snapshot());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`https://ex.com/dav/${SYNC_FILENAME}`);
    expect(init.method).toBe('PUT');
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Basic dXNlcjpwYXNz');
    expect(headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(String(init.body))).toHaveProperty('exportedAt');
  });

  it('throws sync-unauthorized on a 401 response', async () => {
    mockFetchResponse(401);
    await expect(
      syncPush('https://ex.com/dav/', 'u', 'p', snapshot()),
    ).rejects.toMatchObject({ code: 'sync-unauthorized' });
  });

  it('throws sync-network when fetch rejects (CORS/DNS)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(
      syncPush('https://ex.com/dav/', 'u', 'p', snapshot()),
    ).rejects.toMatchObject({ code: 'sync-network' });
  });
});

describe('syncPull', () => {
  it('returns the parsed snapshot for a valid JSON payload', async () => {
    mockFetchResponse(200, snapshot());
    const result = await syncPull('https://ex.com/dav/backup.json', 'u', 'p');
    expect(result.version).toBe(1);
    expect(result.exportedAt).toBe('2026-08-10T12:00:00.000Z');
  });

  it('maps a missing remote file to sync-notfound', async () => {
    mockFetchResponse(404);
    await expect(
      syncPull('https://ex.com/dav/file.json', 'u', 'p'),
    ).rejects.toMatchObject({ code: 'sync-notfound' });
  });

  it('maps a non-snapshot JSON payload to sync-invalid', async () => {
    mockFetchResponse(200, { hello: 'world' });
    await expect(
      syncPull('https://ex.com/dav/backup.json', 'u', 'p'),
    ).rejects.toMatchObject({ code: 'sync-invalid' });
  });

  it('maps an array body (JSON-valid, not an object) to sync-invalid', async () => {
    mockFetchResponse(200, [1, 2, 3]);
    await expect(
      syncPull('https://ex.com/dav/backup.json', 'u', 'p'),
    ).rejects.toMatchObject({ code: 'sync-invalid' });
  });

  it('maps unparsable payloads to sync-invalid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error('bad json')),
      }),
    );
    await expect(
      syncPull('https://ex.com/dav/backup.json', 'u', 'p'),
    ).rejects.toMatchObject({ code: 'sync-invalid' });
  });

  it('throws sync-http with the status for a 500', async () => {
    mockFetchResponse(500);
    await expect(
      syncPull('https://ex.com/dav/backup.json', 'u', 'p'),
    ).rejects.toMatchObject({ code: 'sync-http', status: 500 });
  });
});

describe('syncTest', () => {
  it('reports reachable + hasBackup on 200', async () => {
    mockFetchResponse(200, snapshot());
    await expect(syncTest('https://ex.com/dav/backup.json', 'u', 'p')).resolves.toEqual({
      reachable: true,
      hasBackup: true,
    });
  });

  it('reports reachable + no backup on 404 (credentials are valid)', async () => {
    mockFetchResponse(404);
    await expect(syncTest('https://ex.com/dav/backup.json', 'u', 'p')).resolves.toEqual({
      reachable: true,
      hasBackup: false,
    });
  });

  it('throws sync-forbidden on 403', async () => {
    mockFetchResponse(403);
    await expect(syncTest('https://ex.com/dav/backup.json', 'u', 'p')).rejects.toMatchObject({
      code: 'sync-forbidden',
    });
  });
});