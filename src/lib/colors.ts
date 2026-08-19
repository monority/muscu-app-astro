/**
 * Muscle category → hue tone mapping (Phase A of the UI refonte).
 *
 * Muscle groups are stored as canonical FR keys (see
 * src/i18n/exercise-translations.ts MUSCLES_EN — Pectoraux, Dos,
 * Épaules, Biceps, Triceps, Avant-bras, Quadriceps, Ischio-jambiers,
 * Fessiers, Mollets, Jambes, Abdominaux). The design system caps the
 * color language at 6 hue families (src/styles/tokens.css
 * `--color-cat-*`), so several stored groups share one family — e.g.
 * every arm group maps to the teal "arms" tone.
 *
 * Components render the tone as the CSS class `badge--cat-<tone>`
 * (see src/components/ui/Badge/Badge.astro). The helper stays i18n-agnostic:
 * it takes the stored key and returns a tone name; Alpine consumers
 * read it from `window.muscleHue` (exposed in AppLayout.astro, same
 * pattern as `window.trMuscle`).
 *
 * Unknown / custom muscles (the exercice editor allows free-text
 * muscle names) fall back to `other` → a neutral badge with no hue.
 */

export type MuscleTone =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'legs'
  | 'core'
  | 'other';

/** Canonical stored muscle key → hue family. */
const MUSCLE_TONE: Record<string, MuscleTone> = {
  // ── chest (rose) ──
  Pectoraux: 'chest',
  // ── back (indigo/blue) ──
  Dos: 'back',
  // ── shoulders (bronze/orange) ──
  Épaules: 'shoulders',
  // ── arms (teal/cyan) ──
  Biceps: 'arms',
  Triceps: 'arms',
  'Avant-bras': 'arms',
  // ── legs (green) ──
  Quadriceps: 'legs',
  'Ischio-jambiers': 'legs',
  Fessiers: 'legs',
  Mollets: 'legs',
  Jambes: 'legs',
  // ── core (purple) ──
  Abdominaux: 'core',
};

/** Hue family for a stored muscle; `other` (neutral) when unknown. */
export function muscleHue(muscle: string): MuscleTone {
  return MUSCLE_TONE[muscle] ?? 'other';
}