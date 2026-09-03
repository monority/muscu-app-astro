/**
 * format — Shared date/number formatting utilities.
 *
 * Consolidates the 7+ duplicated formatDate/formatNumber/formatVolume
 * implementations across pages into a single source of truth.
 */

import { DATE_LOCALE } from '../i18n';

// ── Date formatters ─────────────────────────────────────────────

/** "lundi 12 août 2025" — full date + weekday. */
export function formatDateLong(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const loc = DATE_LOCALE();
  const date = d.toLocaleDateString(loc, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return date.charAt(0).toUpperCase() + date.slice(1);
}

/** "lundi 12 août 2025 · 14:30" — full date + time. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const loc = DATE_LOCALE();
  const date = d.toLocaleDateString(loc, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString(loc, {
    hour: '2-digit',
    minute: '2-digit',
  });
  return date.charAt(0).toUpperCase() + date.slice(1) + ' · ' + time;
}

/** "12 août 2025" — date without time. */
export function formatDateMedium(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(DATE_LOCALE(), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** "12 août" or "12 août 2025" — short date. */
export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(DATE_LOCALE(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** "12 août" — day + month only. */
export function formatDateDayMonth(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(DATE_LOCALE(), {
    day: 'numeric',
    month: 'short',
  });
}

/** "12/08/2025" — numeric date. */
export function formatDateNumeric(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(DATE_LOCALE(), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Time-only "14:30". */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString(DATE_LOCALE(), {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Time with seconds "14:30:05". */
export function formatTimeSeconds(date: Date): string {
  return date.toLocaleTimeString(DATE_LOCALE(), {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// ── Number formatters ───────────────────────────────────────────

/** Locale-formatted integer: "1 234". */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '0';
  return new Intl.NumberFormat(DATE_LOCALE()).format(Math.round(n));
}

/** Locale-formatted number, returns "0" for ≤0. */
export function formatNumPositive(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0';
  return Math.round(n).toLocaleString(DATE_LOCALE());
}

/** Volume: "1 234 kg". */
export function formatVolume(volume: number): string {
  if (!Number.isFinite(volume) || volume <= 0) return '0 kg';
  return Math.round(volume).toLocaleString(DATE_LOCALE()) + ' kg';
}

/** Weight: same as volume (alias). */
export function formatWeight(weight: number): string {
  return formatVolume(weight);
}

/** Duration in seconds → "2h 15min" or "15min 30s". */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
}

/** Duration with zero-padded segments → "2h 05m", "5m 03s". Returns "—" for invalid. */
export function formatDurationShort(seconds?: number): string {
  if (!seconds || seconds <= 0) return '\u2014';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}

/** "12 août 2025 · 14:30" — compact datetime with short month. */
export function formatDateCompact(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const loc = DATE_LOCALE();
  const date = d.toLocaleDateString(loc, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString(loc, {
    hour: '2-digit',
    minute: '2-digit',
  });
  return date + ' \u00b7 ' + time;
}
