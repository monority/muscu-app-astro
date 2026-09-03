/**
 * quick-session-stats — Pure computation functions for quick session page.
 *
 * Extracted from pages/sessions/quick.astro for testability and reuse.
 * All functions are pure: they take data in, return results out.
 * No DOM, no localStorage, no Alpine dependency.
 */

import type { Session, SetType } from './storage';

// ── Types ───────────────────────────────────────────────────────

export interface QuickSessionInfo {
  id: string;
  label: string;
  totalSets: number;
  totalVolume: number;
  status: Session['status'];
}

export interface SessionStats {
  totalSets: number;
  recordedSets: number;
  totalExercises: number;
  completedExercises: number;
  totalVolume: number;
}

// ── Formatting helpers ──────────────────────────────────────────

/** Format weight for display. 0 → "0", 80.5 → "80.5", 80 → "80". */
export function formatWeight(w: number): string {
  if (!Number.isFinite(w) || w <= 0) return '0';
  const rounded = Math.round(w * 10) / 10;
  return Number.isFinite(rounded) && Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(1).replace(/\.0$/, '');
}

/** Format seconds into duration string. */
export function formatDuration(
  seconds: number | undefined,
  labels: { minShort: string; hShort: string; sShort: string },
): string {
  if (!seconds || seconds <= 0 || !Number.isFinite(seconds))
    return '0' + labels.minShort;
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0)
    return `${h}${labels.hShort} ${m.toString().padStart(2, '0')}${labels.minShort}`;
  if (m > 0)
    return `${m}${labels.minShort} ${s.toString().padStart(2, '0')}${labels.sShort}`;
  return `${s}${labels.sShort}`;
}

/** Format rest timer as M:SS. */
export function formatRestTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const r = totalSeconds % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

/** Get label for set type. */
export function typeLabel(
  t: SetType,
  labels: Record<string, string>,
): string {
  switch (t) {
    case 'warmup':
      return labels.typeWarmup;
    case 'work':
      return labels.typeWork;
    case 'top':
      return labels.typeTop;
    case 'drop':
      return labels.typeDrop;
    case 'failure':
      return labels.typeFailure;
    default:
      return '';
  }
}

// ── Date helper ─────────────────────────────────────────────────

/** Today's date as ISO string YYYY-MM-DD. */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// ── Session filtering ───────────────────────────────────────────

/** Filter and compute info for available quick-session candidates. */
export function computeAvailableSessions(sessions: Session[]): QuickSessionInfo[] {
  return sessions
    .filter(
      (s) =>
        (s.status === 'planned' || s.status === 'in-progress') &&
        s.exercises.some((e) => e.sets.length > 0),
    )
    .map((s) => {
      const totalSets = s.exercises.reduce(
        (sum, ex) => sum + ex.sets.length,
        0,
      );
      const totalVolume = s.exercises.reduce(
        (sum, ex) =>
          sum + ex.sets.reduce((v, set) => v + set.weight * set.reps, 0),
        0,
      );
      return {
        id: s.id,
        label: s.name,
        totalSets,
        totalVolume,
        status: s.status,
      };
    })
    .sort((a, b) => (a.label < b.label ? 1 : -1));
}

// ── Session stats ───────────────────────────────────────────────

/** Compute aggregate stats for a session. */
export function computeSessionStats(session: Session): SessionStats {
  const totalSets = session.exercises.reduce(
    (sum, ex) => sum + ex.sets.length,
    0,
  );
  const recordedSets = session.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((set) => set.completed).length,
    0,
  );
  const totalExercises = session.exercises.length;
  const completedExercises = session.exercises.filter(
    (ex) => ex.sets.length > 0 && ex.sets.every((set) => set.completed),
  ).length;
  const totalVolume = session.exercises.reduce(
    (sum, ex) =>
      sum +
      ex.sets.reduce(
        (v, set) => (set.completed ? v + set.weight * set.reps : v),
        0,
      ),
    0,
  );
  return { totalSets, recordedSets, totalExercises, completedExercises, totalVolume };
}

/** Compute progress percentage based on current exercise/set position. */
export function computeProgressPercent(
  session: Session,
  currentExerciseIndex: number,
  currentSetIndex: number,
): number {
  const total = session.exercises.reduce(
    (sum, ex) => sum + ex.sets.length,
    0,
  );
  if (total === 0) return 0;
  let done = 0;
  for (let i = 0; i < session.exercises.length; i++) {
    const ex = session.exercises[i];
    if (i < currentExerciseIndex) {
      done += ex.sets.length;
    } else if (i === currentExerciseIndex) {
      done += currentSetIndex;
    } else {
      break;
    }
  }
  return Math.min(100, Math.round((done / total) * 100));
}

// ── Navigation helpers ──────────────────────────────────────────

/** Check if navigation to previous set is possible. */
export function canGoPrev(
  currentExerciseIndex: number,
  currentSetIndex: number,
): boolean {
  return currentExerciseIndex > 0 || currentSetIndex > 0;
}

/** Check if navigation to next set is possible. */
export function canGoNext(
  session: Session,
  currentExerciseIndex: number,
  currentSetIndex: number,
): boolean {
  const ex = session.exercises[currentExerciseIndex];
  if (!ex) return false;
  return (
    currentSetIndex < ex.sets.length - 1 ||
    currentExerciseIndex < session.exercises.length - 1
  );
}

// ── Rest label ──────────────────────────────────────────────────

/** Build "next up" label for rest period. */
export function restNextLabel(
  session: Session,
  currentExerciseIndex: number,
  currentSetIndex: number,
  formatWeightFn: (w: number) => string,
  unit: string,
  nextUpLabel: string,
): string {
  const ex = session.exercises[currentExerciseIndex];
  if (!ex) return '';
  const set = ex.sets[currentSetIndex];
  if (!set) return '';
  const weight = formatWeightFn(set.weight);
  return `${nextUpLabel} ${weight} ${unit} × ${set.reps}`;
}

// ── Completion messages ─────────────────────────────────────────

/** Get completion title based on recorded vs total sets. */
export function completionTitle(
  recordedSets: number,
  totalSets: number,
  allDoneLabel: string,
  endedEarlyLabel: string,
): string {
  return recordedSets >= totalSets ? allDoneLabel : endedEarlyLabel;
}

/** Get completion message. */
export function completionMessage(
  recordedSets: number,
  totalSets: number,
  fullLabel: string,
  partialLabel: string,
  setsShort: string,
): string {
  if (recordedSets >= totalSets) return fullLabel;
  return `${partialLabel} — ${recordedSets}/${totalSets} ${setsShort}`;
}
