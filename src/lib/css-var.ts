/**
 * Design-token reader for client-side chart renderers.
 *
 * SVG presentation attributes (`fill`, `stroke`, gradient stops) don't
 * reliably resolve `var()` references in every browser, so the chart
 * pages (progression/poids, progression/stats) read token values here
 * and inline them into the generated SVG markup.
 *
 * The reads always go through `document.documentElement`, so the
 * dark/light override already on `<html data-theme="...">` (see
 * AppLayout.astro theme bootstrap + src/styles/tokens.css) is picked up
 * automatically.
 */

/** Computed value of a CSS custom property on the root element, trimmed.
    Returns '' when the token is missing. */
export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

/**
 * Token value with an alpha channel appended — used for muted SVG fills
 * that would otherwise need a hand-written rgba()/fallback color.
 * Works on parenthesized values like `hsl(32 55% 45%)` →
 * `hsl(32 55% 45% / 0.55)`. Returns the token unchanged when it doesn't
 * end with a closing paren (e.g. a hex value).
 */
export function cssVarAlpha(name: string, alpha: number): string {
  const value = cssVar(name);
  return value.endsWith(')')
    ? value.replace(/\)$/, ` / ${alpha})`)
    : value;
}