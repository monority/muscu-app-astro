/**
 * Text helpers shared across the app.
 */

/** Lowercase + strip diacritics so "echec" matches "échec". */
export function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}