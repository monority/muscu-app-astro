/**
 * MRV — charge recommandée (suggested load) for a set.
 *
 * Roadmap P2 « MRV automatique (charge prescrite) », V1 : progression linéaire
 * depuis l'historique des séances terminées (`Session.status === 'completed'`),
 * la même convention de filtre que le reste des stats (voir
 * `src/lib/volume-stats.ts`). V2 (algorithme intelligent) reste en P2.
 *
 * ── V1 — formule documentée (triée pour la transparence) ────────────────────
 *
 *   1. Base : top set du dernier historique — on parcourt les séances
 *      terminées contenant l'exercice de la plus récente à la plus ancienne
 *      (tri lexicographique de `session.date` en ISO), et on prend le
 *      MAX poids parmi les séries terminées (poids > 0) de la PREMIÈRE
 *      séance qui en a. Aucune séance n'en a → `null` ('none').
 *      `lastLoad` (param d'appel — p.ex. le poids déjà tapé dans la série
 *      courante) sert de base de repli quand l'historique complet est vide.
 *
 *   2. Ajustement répétitions (table de facteurs, clamp ±10 %) :
 *          diff = targetReps − baseReps        (baseReps = reps du top set)
 *          steps = trunc(|diff| / 2) × sign(diff)   (pas de 2 reps)
 *          factor = 1 − 0.04 × steps, borné à [0.90, 1.10]
 *
 *      | diff (reps) | steps | facteur |
 *      |-------------|-------|---------|
 *      |  0 … ±1     |   0   | × 1.00  |
 *      | ±2 … ±3     |  ±1   | × 0.96 / × 1.04 |
 *      | ±4 … ±5     |  ±2   | × 0.92 / × 1.08 |
 *      | ≥ ±6        |  ±3   | × 0.90 / × 1.10 (clamp) |
 *
 *      targetReps absent/≤ 0 (reps pas encore saisies) → facteur 1 (proposé
 *      comme la base, cohérent : on repart du dernier top set).
 *
 *   3. Ajustement RPE du top set (0,5 steps, nullable ⇒ « non loggé ») :
 *          RPE ≥ 8.5  (proche du max)  → × 1.025  (+2.5 %, surcharge)
 *          RPE ≤ 6.5                   → × 0.975  (−2.5 %, décharge)
 *          7.0 … 8.0 ou non loggé      → × 1.000
 *
 *   4. Plafond 1RM estimé (Epley, `calculate1RM`) : le suggéré ne dépasse
 *      JAMAIS 95 % du meilleur 1RM estimé parmi les séries du dernier
 *      historique (même lignée que `ProgressRecord.estimated1RM`, calculé
 *      par Epley depuis le top set) → `reason = 'epley-cap'`. L'arrondi aux
 *      plaques peut dépasser légèrement le plafond (ex. 101,3 → 102,5).
 *
 *   5. Arrondi à la plus proche plaque : 2,5 kg par défaut (pas de 1,25 kg
 *      possible via `roundStep` — inventaire du calculateur).
 *
 * ── Convention ──────────────────────────────────────────────────────────────
 * Module i18n-agnostic : renvoie un CHIFFRE + un code raison
 * ('history' | 'epley-cap' | 'none') que l'UI localise (fr/en).
 */

import { calculate1RM, type Session, type SessionSet } from './storage';

/** Description textuelle de la formule V1 (transparence roadmap / UI). */
export const MRV_FORMULA =
  'V1 linéaire — base = max poids séries terminées de la dernière séance ' +
  'terminée (repli : lastLoad) ; × (1 − 0.04 × trunc(|Δreps|/2)), clamp ±10 % ; ' +
  '× 1.025 si RPE ≥ 8.5, × 0.975 si RPE ≤ 6.5 ; plafonné à 95 % du 1RM Epley ; ' +
  'arrondi à 2,5 kg.';

/** Code raison de la suggestion, à localiser côté UI (fr/en). */
export type MrvReason = 'history' | 'epley-cap' | 'none';

export interface LoadSuggestion {
  /** Charge recommandée en kg, `null` quand aucun historique. */
  weight: number | null;
  /** Code raison : 'none' (pas d'historique), 'epley-cap' (plafonné), sinon 'history'. */
  reason: MrvReason;
  /** Plafond 1RM estimé (Epley × 0,95) appliqué, `null` si inapplicable. */
  cap: number | null;
  /** Base (poids de départ, avant ajustements/arrondi) ou `null`. */
  base: number | null;
}

export interface SuggestLoadOptions {
  /** Reps visées de la série (ajuste la charge). Absent/≤ 0 ⇒ suggestion = base. */
  targetReps?: number;
  /** Base de repli (poids déjà saisi) quand aucun historique n'existe. */
  lastLoad?: number;
  /** Pas d'arrondi en kg (défaut 2,5 ; ex. 1,25 pour demi-plaque). */
  roundStep?: number;
}

/** Pas d'arrondi par défaut (plaque du calculateur). */
export const MRV_DEFAULT_ROUND_STEP = 2.5;
/** Ratio du plafond 1RM (jamais suggérer plus de 95 % du 1RM estimé). */
export const MRV_EPLEY_CAP_RATIO = 0.95;
/** Surcharge RPE : dernière série proche du max (≥ 8.5). */
export const MRV_RPE_OVERLOAD = 1.025;
/** Décharge RPE : dernière série très loin du max (≤ 6.5). */
export const MRV_RPE_DELOAD = 0.975;
/** Seuil bas/haut des fenêtres RPE sans ajustement. */
export const MRV_RPE_OVERLOAD_MIN = 8.5;
export const MRV_RPE_DELOAD_MAX = 6.5;
/** Pas des ajustements de reps (reps) et facteur linéaire par pas. */
export const MRV_REP_STEP = 2;
export const MRV_REP_STEP_FACTOR = 0.04;
/** Clamp global de l'ajustement répétitions (±10 %). */
export const MRV_REP_FACTOR_CLAMP = 0.1;

/**
 * Séries terminées (poids > 0) de l'exercice dans LA PLUS RÉCENTE séance
 * terminée qui en contient au moins une. Retourne [] quand l'exercice n'a
 * aucun historique exploitable.
 */
function mostRecentCompletedSets(
  sessions: Session[],
  exerciseId: string,
): SessionSet[] {
  const ordered = [...sessions]
    .filter(
      (s) =>
        s.status === 'completed' &&
        typeof s.date === 'string' &&
        s.date.length > 0,
    )
    // Les dates sont stockées en ISO (YYYY-MM-DD) → tri lexicographique.
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  for (const session of ordered) {
    const sets: SessionSet[] = [];
    for (const ex of session.exercises) {
      if (ex.exerciseId !== exerciseId) continue;
      for (const set of ex.sets) {
        if (set.completed && Number.isFinite(set.weight) && set.weight > 0) {
          sets.push(set);
        }
      }
    }
    if (sets.length > 0) return sets;
  }
  return [];
}

/** Meilleure série (max poids) — le « top set » de la séance d'historique. */
function topSetOf(sets: SessionSet[]): SessionSet {
  return sets.reduce((best, s) => (s.weight > best.weight ? s : best), sets[0]);
}

/**
 * Facteur d'ajustement linéaire des répétitions (voir tableau en tête de
 * module). `targetReps` absent/≤ 0 ⇒ 1 (on repart de la base telle quelle).
 */
function repsFactor(baseReps: number, targetReps: number | undefined): number {
  if (!targetReps || !Number.isFinite(targetReps) || targetReps <= 0) return 1;
  if (!baseReps || !Number.isFinite(baseReps) || baseReps <= 0) return 1;
  const diff = targetReps - baseReps;
  const steps = Math.trunc(Math.abs(diff) / MRV_REP_STEP) * Math.sign(diff);
  const factor = Math.min(
    1 + MRV_REP_FACTOR_CLAMP,
    Math.max(1 - MRV_REP_FACTOR_CLAMP, 1 - MRV_REP_STEP_FACTOR * steps),
  );
  return factor;
}

/** Facteur RPE du top set : surcharge ≥ 8.5, décharge ≤ 6.5, sinon 1. */
function rpeFactor(rpe: SessionSet['rpe']): number {
  const v = typeof rpe === 'string' ? Number(rpe) : rpe;
  if (v == null || !Number.isFinite(v)) return 1;
  if (v >= MRV_RPE_OVERLOAD_MIN) return MRV_RPE_OVERLOAD;
  if (v <= MRV_RPE_DELOAD_MAX) return MRV_RPE_DELOAD;
  return 1;
}

/** Arrondi à la plaque la plus proche (2,5 kg par défaut). */
function roundToStep(weight: number, step: number): number {
  const s = Number.isFinite(step) && step > 0 ? step : MRV_DEFAULT_ROUND_STEP;
  const rounded = Math.round(weight / s) * s;
  // Assainit les artefacts flottants (ex. 87.499999…) — 2 décimales suffisent
  // pour les pas plaque (2.5 → *.0/*.5, 1.25 → *.00/*.25/*.50/*.75).
  return Math.round(rounded * 100) / 100;
}

/**
 * Calcule la charge recommandée pour une série + le code raison.
 * Voir en tête de module pour la formule V1 complète (table de facteurs).
 */
export function suggestLoadSuggestion(
  exerciseId: string,
  sessions: Session[],
  options: SuggestLoadOptions = {},
): LoadSuggestion {
  const recent = mostRecentCompletedSets(sessions, exerciseId);
  const lastLoad =
    options.lastLoad != null &&
    Number.isFinite(options.lastLoad) &&
    options.lastLoad > 0
      ? options.lastLoad
      : null;

  if (recent.length === 0 && lastLoad === null) {
    // Aucun historique exploitable → pas de suggestion (état désactivé en UI).
    return { weight: null, reason: 'none', cap: null, base: null };
  }

  if (recent.length === 0) {
    // Repli sur `lastLoad` (dernier poids saisi dans la séance courante).
    return {
      weight: roundToStep(lastLoad as number, options.roundStep ?? MRV_DEFAULT_ROUND_STEP),
      reason: 'history',
      cap: null,
      base: lastLoad as number,
    };
  }

  const topSet = topSetOf(recent);
  const base = topSet.weight;
  let suggested = base;

  // Réps + RPE (seulement quand on a un top set de référence).
  suggested *= repsFactor(topSet.reps, options.targetReps);
  suggested *= rpeFactor(topSet.rpe);

  // Plafond 1RM estimé (Epley) : jamais plus de 95 %.
  const withReps = recent.filter(
    (s) => Number.isFinite(s.reps) && s.reps > 0,
  );
  if (withReps.length > 0) {
    const best1RM = Math.max(
      ...withReps.map((s) => calculate1RM(s.weight, s.reps)),
    );
    const cap = best1RM * MRV_EPLEY_CAP_RATIO;
    if (suggested > cap) {
      suggested = cap;
      return {
        weight: roundToStep(suggested, options.roundStep ?? MRV_DEFAULT_ROUND_STEP),
        reason: 'epley-cap',
        cap,
        base,
      };
    }
  }

  return {
    weight: roundToStep(suggested, options.roundStep ?? MRV_DEFAULT_ROUND_STEP),
    reason: 'history',
    cap: null,
    base,
  };
}

/**
 * Charge recommandée (kg) pour une série, ou `null` quand aucun historique
 * ne permet de la calculer (raison via `suggestLoadSuggestion`).
 */
export function suggestLoad(
  exerciseId: string,
  sessions: Session[],
  options: SuggestLoadOptions = {},
): number | null {
  return suggestLoadSuggestion(exerciseId, sessions, options).weight;
}