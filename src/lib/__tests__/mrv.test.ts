/**
 * Tests for src/lib/mrv.ts — MRV V1 (progression linéaire).
 *
 * Pure module (no window/localStorage), node environment. The formula
 * (base → facteur reps → facteur RPE → plafond Epley → arrondi 2,5 kg)
 * is asserted case-by-case, including the factor table boundaries.
 */

import { describe, expect, it } from 'vitest';
import {
  MRV_EPLEY_CAP_RATIO,
  suggestLoad,
  suggestLoadSuggestion,
} from '../mrv';
import type { Session, SessionSet } from '../storage';

let seq = 0;

/** Completed session for one exercise (defaults to the shared `ex-1`). */
function session(
  date: string,
  sets: Array<{
    weight: number;
    reps: number;
    rpe?: number | null;
    completed?: boolean;
    type?: SessionSet['type'];
  }>,
  status: Session['status'] = 'completed',
  exerciseId = 'ex-1',
): Session {
  seq += 1;
  return {
    id: `s-${seq}`,
    name: 'Séance',
    date,
    status,
    exercises: [
      {
        exerciseId,
        name: 'Exercice',
        muscle: 'Pectoraux',
        sets: sets.map((s, i) => ({
          exerciseId,
          setNumber: i + 1,
          weight: s.weight,
          reps: s.reps,
          rpe: s.rpe ?? null,
          type: s.type ?? 'work',
          completed: s.completed ?? true,
        })),
      },
    ],
  };
}

const NO_SETS: Session[] = [];
const CANNED = { targetReps: undefined, lastLoad: undefined };

describe('suggestLoad / suggestLoadSuggestion', () => {
  it('returns null (reason none) when the exercise has no history', () => {
    expect(suggestLoad('ex-x', NO_SETS)).toBeNull();
    expect(
      suggestLoadSuggestion('ex-x', [], CANNED).reason,
    ).toBe('none');
    // planned / in-progress sessions are not history.
    expect(
      suggestLoad('ex-x', [session('2026-08-01', [{ weight: 100, reps: 10 }], 'planned')]),
    ).toBeNull();
  });

  it('uses the top set (max weight) of the most recent completed session', () => {
    const out = suggestLoadSuggestion('ex-1', [
      session('2026-08-01', [
        { weight: 60, reps: 10 },
        { weight: 100, reps: 8 }, // top set
        { weight: 80, reps: 8 },
      ]),
    ]);
    expect(out?.base).toBe(100);
    expect(out?.reason).toBe('history');
    expect(out?.weight).toBe(100); // same reps as the row not asked → base
  });

  it('skips a newer completed session whose sets have no weight', () => {
    const out = suggestLoadSuggestion('ex-1', [
      session('2026-08-10', [{ weight: 0, reps: 10 }, { weight: 0, reps: 8, completed: false }]),
      session('2026-08-01', [{ weight: 110, reps: 5 }]),
    ]);
    // The incomplete/zero session is skipped → base from the older one.
    expect(out?.base).toBe(110);
    expect(out?.weight).toBe(110);
  });

  it('ignores non-completed sets when picking the base', () => {
    const out = suggestLoadSuggestion('ex-1', [
      session('2026-08-01', [
        { weight: 140, reps: 5, completed: false }, // not logged → ignored
        { weight: 120, reps: 5 },
      ]),
    ]);
    expect(out?.base).toBe(120);
  });

  it('does not apply a rep adjustment when targetReps ≈ baseReps (0–1 rep diff)', () => {
    const s = [session('2026-08-01', [{ weight: 100, reps: 10 }])];
    expect(suggestLoad('ex-1', s, { targetReps: 10 })).toBe(100);
    expect(suggestLoad('ex-1', s, { targetReps: 11 })).toBe(100);
    expect(suggestLoad('ex-1', s, { targetReps: 9 })).toBe(100);
  });

  it('factor table: +2 reps ~ −4 %, +4 ~ −8 %, ≥ +6 clamped at −10 %', () => {
    const s = [session('2026-08-01', [{ weight: 100, reps: 10 }])];
    expect(suggestLoad('ex-1', s, { targetReps: 12 })).toBe(95); // ×0.96 → 96 → 95
    expect(suggestLoad('ex-1', s, { targetReps: 13 })).toBe(95); // trunc 1 step
    expect(suggestLoad('ex-1', s, { targetReps: 14 })).toBe(92.5); // ×0.92 → 92 → 92.5
    expect(suggestLoad('ex-1', s, { targetReps: 16 })).toBe(90); // clamp ×0.90
    expect(suggestLoad('ex-1', s, { targetReps: 20 })).toBe(90); // clamp ×0.90
  });

  it('factor table: −2 reps ~ +4 %, −4 ~ +8 %, ≥ −6 clamped at +10 %', () => {
    const s = [session('2026-08-01', [{ weight: 100, reps: 10 }])];
    expect(suggestLoad('ex-1', s, { targetReps: 8 })).toBe(105); // ×1.04 → 104 → 105
    expect(suggestLoad('ex-1', s, { targetReps: 7 })).toBe(105);
    expect(suggestLoad('ex-1', s, { targetReps: 6 })).toBe(107.5); // ×1.08 → 108 → 107.5
    expect(suggestLoad('ex-1', s, { targetReps: 4 })).toBe(110); // clamp ×1.10
    expect(suggestLoad('ex-1', s, { targetReps: 1 })).toBe(110);
  });

  it('RPE overload: last set ≥ 8.5 suggests +2.5 %', () => {
    const s = [session('2026-08-01', [{ weight: 100, reps: 10, rpe: 9 }])];
    expect(suggestLoad('ex-1', s, { targetReps: 10 })).toBe(102.5);
    expect(suggestLoad('ex-1', s, { targetReps: 11 })).toBe(102.5); // reps ≈ base → RPE only
  });

  it('RPE deload: last set ≤ 6.5 suggests −2.5 %', () => {
    const s = [session('2026-08-01', [{ weight: 100, reps: 10, rpe: 5 }])];
    expect(suggestLoad('ex-1', s, { targetReps: 10 })).toBe(97.5);
    // RPE 6.5 → deload too.
    const s65 = [session('2026-08-01', [{ weight: 100, reps: 10, rpe: 6.5 }])];
    expect(suggestLoad('ex-1', s65, { targetReps: 10 })).toBe(97.5);
  });

  it('RPE 7–8 (or unlogged) leaves the suggestion unchanged', () => {
    const mid = [session('2026-08-01', [{ weight: 100, reps: 10, rpe: 7.5 }])];
    expect(suggestLoad('ex-1', mid, { targetReps: 10 })).toBe(100);
    const none = [session('2026-08-01', [{ weight: 100, reps: 10, rpe: null }])];
    expect(suggestLoad('ex-1', none, { targetReps: 10 })).toBe(100);
    const missing = [session('2026-08-01', [{ weight: 100, reps: 10 }])];
    expect(suggestLoad('ex-1', missing, { targetReps: 10 })).toBe(100);
  });

  it('caps the suggestion at 95 % of the best Epley 1RM of the recent history', () => {
    // Recent history: 100×2 (heavy top) + 60×20 ⇒ best 1RM = 106.67,
    // cap = 101.33. Base 100 @ RPE 9.5 → 102.5 → clamped to the cap.
    const out = suggestLoadSuggestion('ex-1', [
      session('2026-08-01', [
        { weight: 100, reps: 2, rpe: 9.5 },
        { weight: 60, reps: 20 },
      ]),
    ], { targetReps: 2 });
    expect(out?.reason).toBe('epley-cap');
    expect(out?.cap).toBeCloseTo(100 * (1 + 2 / 30) * MRV_EPLEY_CAP_RATIO, 3);
    expect(out?.weight).toBe(102.5); // arrondi plaque, ~cap
    expect(out?.weight ? out.weight : Infinity).toBeLessThanOrEqual(102.5);
  });

  it('rounds to the nearest 2.5 kg by default', () => {
    const s = [session('2026-08-01', [{ weight: 91, reps: 10 }])];
    expect(suggestLoad('ex-1', s, { targetReps: 10 })).toBe(90); // 91 → 90
    const s93 = [session('2026-08-01', [{ weight: 93, reps: 10 }])];
    expect(suggestLoad('ex-1', s93, { targetReps: 10 })).toBe(92.5); // 93 → 92.5
  });

  it('honours a custom roundStep (half-plate 1.25 kg)', () => {
    const s = [session('2026-08-01', [{ weight: 101, reps: 10 }])];
    expect(suggestLoad('ex-1', s, { targetReps: 10, roundStep: 1.25 })).toBe(101.25);
  });

  it('falls back to lastLoad when there is no completed history', () => {
    expect(suggestLoad('ex-x', NO_SETS, { lastLoad: 87.5 })).toBe(87.5);
    expect(suggestLoad('ex-x', NO_SETS, { lastLoad: 91 })).toBe(90);
    const out = suggestLoadSuggestion('ex-x', [], { lastLoad: 87.5 });
    expect(out?.reason).toBe('history');
    expect(out?.base).toBe(87.5);
  });
});