/**
 * nav — Shared navigation helpers for Sidebar + AppShell.
 *
 * Eliminates the duplicated nav-icons.ts and navId() functions.
 */
import { icons } from './icons';

/** Stable slug from a URL path: "/en/progression" → "progression". */
export const navId = (href: string): string =>
  href
    .replace(/^\/(en)?\//, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");

/** Render an icon by name (empty string for unknown / missing). */
export function renderIcon(name?: string): string {
  if (!name) return "";
  return (icons as Record<string, (w?: number, h?: number) => string>)[name]?.(20, 20) ?? "";
}

/** Small chevron used by collapsible nav toggles (12x12, stroke-width 2.5). */
export const chevronDown = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>`;
