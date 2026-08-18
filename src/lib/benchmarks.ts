/**
 * Benchmarks — comparaison locale de la 1RM estimée (Epley) à des tables
 * de référence par exercice.
 *
 * Roadmap P2 « Communauté / benchmarks », V1 : TOUT est calculé en local,
 * sur les seules séances terminées (`Session.status === 'completed'`) et les
 * séries terminées (`set.completed === true`), même convention que
 * `src/lib/volume-stats.ts` et `src/lib/mrv.ts`.
 *
 * ⚠️ Honnêteté des données : les tables de référence (`benchmarks-data.ts`)
 * sont des standards d'entraînement fournis par l'opérateur, PAS une cohorte
 * communautaire réelle. Le module est volontairement i18n-agnostic : il
 * renvoie des CODES de bande ('p50-p75', …) que l'UI localise (fr/en).
 */

import { calculate1RM, type Session } from './storage';
import { completedSets } from './session-utils';

// ============================================================================
// Types
// ============================================================================

/** Bande de percentiles pour un exercice : 1RM estimée en kg. */
export interface ReferenceBands {
  p25: number; // kg
  p50: number; // kg
  p75: number; // kg
  p90: number; // kg
}

/**
 * Une ligne de la table de référence. `name` est le nom EXACT du catalogue
 * FR (`getExercises()` / `DEFAULT_EXERCISES`) — les séances snapshot ce nom
 * dans `SessionExercise.name`, d'où un appariement nom→nom robuste.
 */
export interface ReferenceLift {
  name: string;
  bands: ReferenceBands;
  /** Note courte visible dans l'UI (ex. charge additionnelle pour un pdc). */
  note?: string;
}

/** Code de bande percentile, à localiser côté UI (fr/en). */
export type PercentileBand =
  | 'below-p25'
  | 'p25-p50'
  | 'p50-p75'
  | 'p75-p90'
  | 'p90+';

/**
 * Ligne de sortie pour le tableau des benchmarks :
 * `exercise` = nom de l'exercice de référence ; `userValue` = meilleur 1RM
 * Epley (kg) de l'utilisateur, `null` si aucune série terminée ; `band` =
 * bande percentile, `null` quand l'utilisateur n'a pas de valeur exploitable
 * (affiché « — » en UI, note « aucun repère pour cet exercice »).
 */
export interface BenchmarkRow {
  exercise: string;
  userValue: number | null;
  band: PercentileBand | null;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Meilleur 1RM estimé (Epley, `calculate1RM`) pour un exercice, sur les
 * séries terminées des séances terminées uniquement. `null` si aucune série
 * exploitable (aucune séance, séance non terminée, série non cochée).
 */
export function best1RMForExercise(
  exerciseId: string,
  sessions: Session[],
): number | null {
  let best: number | null = null;
  for (const { set } of completedSets(sessions, exerciseId)) {
    const oneRepMax = calculate1RM(set.weight, set.reps);
    if (oneRepMax > 0 && (best === null || oneRepMax > best)) {
      best = oneRepMax;
    }
  }
  return best;
}

/**
 * Bande percentile d'une valeur par rapport à une table de référence.
 * Bornes inclusives à gauche : value < p25 → 'below-p25' ; value ≥ p90 →
 * 'p90+'. Valeur invalide (null, non finie, ≤ 0) → band null (pas de bande).
 */
export function benchmarkPercentile(
  metricValue: number | null,
  bands: ReferenceBands,
): { band: PercentileBand | null; p25: number; p50: number; p75: number; p90: number } {
  const bandsOut = {
    p25: bands.p25,
    p50: bands.p50,
    p75: bands.p75,
    p90: bands.p90,
  };
  const v = metricValue;
  if (v == null || !Number.isFinite(v) || v <= 0) {
    return { band: null, ...bandsOut };
  }
  if (v < bands.p25) return { band: 'below-p25', ...bandsOut };
  if (v < bands.p50) return { band: 'p25-p50', ...bandsOut };
  if (v < bands.p75) return { band: 'p50-p75', ...bandsOut };
  if (v < bands.p90) return { band: 'p75-p90', ...bandsOut };
  return { band: 'p90+', ...bandsOut };
}

/**
 * Construit les lignes du tableau pour TOUTES les tables de référence
 * fournies (même quand l'utilisateur n'a aucune donnée : `userValue`/`band`
 * null → « — » en UI). L'appariement se fait par nom d'exercice (snapshot
 * `SessionExercise.name`), pas par id : un exercice custom hors table ne
 * produit simplement aucune ligne (pas de bande, par conception).
 */
export function buildBenchmarkRows(
  sessions: Session[],
  lifts: readonly ReferenceLift[],
): BenchmarkRow[] {
  return lifts.map((lift) => {
    const ids = new Set<string>();
    for (const { exercise } of completedSets(sessions)) {
      if (exercise.name === lift.name) ids.add(exercise.exerciseId);
    }
    let userValue: number | null = null;
    for (const id of ids) {
      const value = best1RMForExercise(id, sessions);
      if (value != null && (userValue === null || value > userValue)) {
        userValue = value;
      }
    }
    const { band, ...bands } = benchmarkPercentile(userValue, lift.bands);
    return {
      exercise: lift.name,
      userValue,
      band,
      p25: bands.p25,
      p50: bands.p50,
      p75: bands.p75,
      p90: bands.p90,
    };
  });
}