// @vitest-environment node
/**
 * Tests for src/lib/benchmarks.ts — bandes de percentiles + agrégation 1RM.
 *
 * Module pur (aucun window/localStorage) : tourne dans l'environnement
 * `node` par défaut. La table de référence locale n'est PAS importée — les
 * tests passent des bandes explicites pour rester déterministes.
 */

import { describe, expect, it } from 'vitest';
import {
  benchmarkPercentile,
  best1RMForExercise,
  buildBenchmarkRows,
  type ReferenceBands,
  type ReferenceLift,
} from '../benchmarks';
import type { Session, SessionSet } from '../storage';

let seq = 0;

/** Bande de référence fixe (Développé couché barre, habitat moyen). */
const BANDS: ReferenceBands = { p25: 50, p50: 70, p75: 90, p90: 110 };

function set(weight: number, reps: number, completed = true): SessionSet {
  return {
    exerciseId: 'ex-bench',
    setNumber: 1,
    weight,
    reps,
    type: 'work',
    completed,
  };
}

/** Séance terminée contenant un exercice nommé comme demandé. L'exerciseId
 * dérive du NOM pour matcher comment `buildBenchmarkRows` agrège par nom. */
function session(
  date: string,
  name: string,
  sets: SessionSet[],
  status: Session['status'] = 'completed',
): Session {
  seq += 1;
  const exerciseId = `ex-${name}`;
  return {
    id: `s-${seq}`,
    name: 'Séance',
    date,
    status,
    exercises: [{ exerciseId, name, muscle: 'Pectoraux', sets }],
  };
}

const BENCH_LIFT: ReferenceLift = {
  name: 'Développé couché barre',
  bands: BANDS,
};

describe('benchmarkPercentile', () => {
  it('below p25 → below-p25', () => {
    expect(benchmarkPercentile(40, BANDS).band).toBe('below-p25');
  });

  it('between p25 and p50 → p25-p50', () => {
    expect(benchmarkPercentile(60, BANDS).band).toBe('p25-p50');
  });

  it('between p50 and p75 → p50-p75', () => {
    expect(benchmarkPercentile(80, BANDS).band).toBe('p50-p75');
  });

  it('between p75 and p90 → p75-p90', () => {
    expect(benchmarkPercentile(100, BANDS).band).toBe('p75-p90');
  });

  it('at or above p90 → p90+', () => {
    expect(benchmarkPercentile(110, BANDS).band).toBe('p90+');
    expect(benchmarkPercentile(140, BANDS).band).toBe('p90+');
  });

  it('null / non-finite / ≤ 0 value → no band', () => {
    expect(benchmarkPercentile(null, BANDS).band).toBeNull();
    expect(benchmarkPercentile(NaN, BANDS).band).toBeNull();
    expect(benchmarkPercentile(0, BANDS).band).toBeNull();
  });

  it('returns the reference bands untouched with the computed band', () => {
    const out = benchmarkPercentile(80, BANDS);
    expect(out).toEqual({ band: 'p50-p75', p25: 50, p50: 70, p75: 90, p90: 110 });
  });
});

describe('best1RMForExercise', () => {
  it('returns the max Epley 1RM across completed sets', () => {
    const sessions = [
      session('2026-08-01', 'Développé couché barre', [
        set(60, 10, true), // Epley 80
        set(70, 5, true), // Epley 81.67 → best
      ]),
      session('2026-08-08', 'Développé couché barre', [
        set(65, 6, true), // Epley 78
      ]),
    ];
    // Meilleure série = 70 × 5 → 81,67
    expect(best1RMForExercise('ex-Développé couché barre', sessions)).toBeCloseTo(81.67, 1);
  });

  it('ignores uncompleted sets and non-completed sessions', () => {
    const sessions = [
      session('2026-08-01', 'Développé couché barre', [
        set(100, 10, false), // non cochée → ignorée
        set(60, 10, true), // 80
      ], 'completed'),
      session('2026-08-02', 'Développé couché barre', [
        set(90, 10, true), // 120 mais séance en cours → ignorée
      ], 'in-progress'),
    ];
    expect(best1RMForExercise('ex-Développé couché barre', sessions)).toBeCloseTo(80, 5);
  });

  it('returns null when the exercise has no usable completed set', () => {
    expect(best1RMForExercise('ex-missing', [])).toBeNull();
    expect(
      best1RMForExercise('ex-Développé couché barre', [
        session('2026-08-01', 'Développé couché barre', [set(60, 10, false)]),
      ]),
    ).toBeNull();
  });
});

describe('buildBenchmarkRows', () => {
  it('matches the user exercise by name and computes band + row', () => {
    const sessions = [
      session('2026-08-01', 'Développé couché barre', [
        set(40, 10, true), // Epley 53,33 → between p25 et p50
      ]),
    ];
    const rows = buildBenchmarkRows(sessions, [BENCH_LIFT]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      exercise: 'Développé couché barre',
      band: 'p25-p50',
      p25: 50,
      p50: 70,
      p75: 90,
      p90: 110,
    });
    expect(rows[0].userValue).toBeCloseTo(53.33, 1);
  });

  it('no band when the user never logged the lift (name matched, no value)', () => {
    const sessions = [
      session('2026-08-01', 'Développé couché barre', [set(60, 10, false)]),
    ];
    const rows = buildBenchmarkRows(sessions, [BENCH_LIFT]);
    expect(rows[0].userValue).toBeNull();
    expect(rows[0].band).toBeNull();
  });

  it('exercise absent from the reference table produces no row (no band)', () => {
    const sessions = [
      session('2026-08-01', 'Curl barre EZ', [
        set(30, 10, true),
      ]),
    ];
    const rows = buildBenchmarkRows(sessions, [BENCH_LIFT]);
    expect(rows).toHaveLength(1); // seul le lift de la table de référence
    expect(rows[0].exercise).toBe('Développé couché barre');
    expect(rows.every((r) => r.exercise !== 'Curl barre EZ')).toBe(true);
  });

  it('takes the best row when multiple exercise ids share the ref name', () => {
    const sessions = [
      session('2026-08-01', 'Développé couché barre', [set(60, 10, true)]), // 80
      session('2026-08-02', 'Développé couché barre', [set(75, 5, true)]), // 87,5 → best
    ];
    const rows = buildBenchmarkRows(sessions, [BENCH_LIFT]);
    expect(rows[0].userValue).toBeCloseTo(87.5, 5);
    expect(rows[0].band).toBe('p50-p75'); // 87,5 ≥ p50, < p75
  });
});