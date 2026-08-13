/**
 * mood — Shared mood SVG icons and helpers.
 *
 * Consolidates the duplicated MOOD_SVG_ATTRS + 5 mood SVGs
 * from seances/index.astro and seances/detail.astro.
 */

import type { SessionMood } from './storage';

export type { SessionMood };

const MOOD_ATTRS =
  'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

const MOOD_SMILE = `<svg ${MOOD_ATTRS}><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`;
const MOOD_HEART = `<svg ${MOOD_ATTRS}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
const MOOD_MEH = `<svg ${MOOD_ATTRS}><circle cx="12" cy="12" r="10"/><line x1="8" y1="15" x2="16" y2="15"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`;
const MOOD_FROWN = `<svg ${MOOD_ATTRS}><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`;
const MOOD_BED = `<svg ${MOOD_ATTRS}><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>`;

/** Returns the SVG string for a given mood, or empty string for undefined. */
export function moodSvg(mood: SessionMood | undefined | null): string {
  if (!mood) return '';
  if (mood === 'great') return MOOD_SMILE;
  if (mood === 'good') return MOOD_HEART;
  if (mood === 'ok') return MOOD_MEH;
  if (mood === 'tired') return MOOD_FROWN;
  return MOOD_BED;
}

/** Returns a human-readable emoji for a given mood. */
export function moodEmoji(mood: SessionMood | undefined | null): string {
  if (!mood) return '';
  if (mood === 'great') return '😊';
  if (mood === 'good') return '❤️';
  if (mood === 'ok') return '😐';
  if (mood === 'tired') return '😟';
  return '🛏️';
}

/** Returns a human-readable label for a given mood. */
export function moodLabel(mood: SessionMood | undefined | null): string {
  if (!mood) return '';
  if (mood === 'great') return 'Super';
  if (mood === 'good') return 'Bien';
  if (mood === 'ok') return 'Moyen';
  if (mood === 'tired') return 'Fatigué';
  return 'Épuisé';
}
