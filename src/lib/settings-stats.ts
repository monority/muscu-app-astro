/**
 * settings-stats — Pure computation functions for settings page.
 *
 * Extracted from pages/settings/index.astro for testability and reuse.
 * All functions are pure: they take data in, return results out.
 * No DOM, no localStorage, no Alpine dependency.
 */

import type { SyncErrorCode } from './sync';

// ── Rest presets ────────────────────────────────────────────────

const REST_PRESETS = [30, 45, 60, 90, 120, 180, 240, 300] as const;

/** Compute rest time option labels from preset seconds. */
export function formatRestOptions(
  presets: readonly number[] = REST_PRESETS,
): { value: string; label: string }[] {
  return presets.map((s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    const label =
      secs === 0
        ? `${mins} min`
        : `${mins} min ${secs.toString().padStart(2, '0')} s`;
    return { value: String(s), label };
  });
}

// ── Sync labels ─────────────────────────────────────────────────

/** Format last sync timestamp into human label. */
export function formatSyncLastLabel(
  lastSyncAt: string | undefined,
  neverLabel: string,
  lastSyncLabel: string,
): string {
  if (!lastSyncAt) return neverLabel;
  const d = new Date(lastSyncAt);
  if (Number.isNaN(d.getTime())) return neverLabel;
  return `${lastSyncLabel} — ${d.toLocaleString()}`;
}

/** Format sync error into human label. */
export function formatSyncErrorLabel(
  err: unknown,
  errorLabels: Record<string, string>,
  fallbackLabel: string,
): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code: SyncErrorCode }).code;
    const label = errorLabels[code] ?? fallbackLabel;
    if (code === 'sync-http' && 'status' in err && typeof (err as any).status === 'number') {
      return `${label} (HTTP ${(err as any).status})`;
    }
    return label;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallbackLabel;
}

// ── Rest time validation ────────────────────────────────────────

/** Validate and clamp rest time value. Returns null if invalid. */
export function parseRestTime(value: string): number | null {
  const rest = parseInt(value, 10);
  if (!Number.isFinite(rest) || rest < 5 || rest > 3600) return null;
  return rest;
}

// ── Weekly goal clamping ────────────────────────────────────────

/** Clamp weekly goal to [1, 7]. Returns null if not a finite number. */
export function clampWeeklyGoal(value: number): number | null {
  if (!Number.isFinite(value)) return null;
  return Math.min(7, Math.max(1, Math.round(value)));
}

// ── Export filename ─────────────────────────────────────────────

/** Build export filename with date. */
export function exportFilename(prefix: string, ext: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${prefix}-${date}.${ext}`;
}
