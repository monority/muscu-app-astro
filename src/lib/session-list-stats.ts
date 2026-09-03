/**
 * session-list-stats — Pure functions for the session list page.
 *
 * Extracted from pages/sessions/index.astro for testability and reuse.
 * No DOM, no localStorage, no Alpine dependency.
 */

import type { Session } from './storage';

// Re-export computeSessionStats from quick-session-stats for convenience
export { computeSessionStats } from './quick-session-stats';

// ── Functions ───────────────────────────────────────────────────

/**
 * Find the most frequent muscle group across a session's exercises.
 * Returns empty string if no muscle data.
 */
export function primaryMuscle(session: Session): string {
  const counts = new Map<string, number>();
  for (const ex of session.exercises) {
    if (!ex.muscle) continue;
    counts.set(ex.muscle, (counts.get(ex.muscle) ?? 0) + 1);
  }
  let best = '';
  let bestCount = 0;
  for (const [muscle, count] of counts) {
    if (count > bestCount) {
      best = muscle;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Filter sessions by search query (matches session name, case-insensitive).
 */
export function filterSessions(
  sessions: Session[],
  query: string,
): Session[] {
  const q = query.trim().toLowerCase();
  if (!q) return sessions;
  return sessions.filter((s) => s.name.toLowerCase().includes(q));
}

/**
 * Sort sessions by date descending (newest first).
 * Returns a new array — does not mutate the input.
 */
export function sortByDateDesc(sessions: Session[]): Session[] {
  return [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

/**
 * Generate count label for filtered results.
 */
export function countLabel(
  filteredCount: number,
  totalCount: number,
  labels: {
    noSession: string;
    noMatch: string;
    seanceSingular: string;
    pluralS: string;
  },
): string {
  if (filteredCount === 0) {
    return totalCount === 0 ? labels.noSession : labels.noMatch;
  }
  return `${filteredCount} ${labels.seanceSingular}${filteredCount > 1 ? labels.pluralS : ''}`;
}
