/**
 * Benchmarks — DONNÉES DE RÉFÉRENCE (V1).
 *
 * ⚠️ STATUT DE CE FICHIER — À LIRE AVANT TOUTE MODIFICATION ⚠️
 *
 * Ces valeurs NE sont PAS des données communautaires : ce sont des standards
 * d'entraînement génériques (population loisir) fournis/fixés par l'opérateur
 * de l'application. Aucune cohorte réelle anonymisée n'a été collectée — la
 * synchronisation serveur (Supabase, `docs/supabase-schema.sql`) et une
 * politique de confidentialité n'existent pas encore.
 *
 * Remplacer ce fichier par de VRAIS agrégats anonymisés quand le serveur
 * existera : le contrat à respecter est `ReferenceBands` (p25/p50/p75/p90 en
 * kg de 1RM Epley) + le nom FR exact du catalogue (`getExercises()`).
 *
 * Valeurs par défaut : conservatrices, pour un pratiquant moyen. Un exercice
 * absent de la liste n'a simplement aucune bande (ligne « — » en UI).
 */

import type { ReferenceLift } from './benchmarks';

/** Statut des données chargées : toujours `'reference'` tant que le serveur n'est pas branché. */
export const BENCHMARKS_DATA_STATUS: 'reference' | 'community' = 'reference';

/**
 * Tables de référence par exercice — 1RM estimée (kg, Epley) aux percentiles
 * p25/p50/p75/p90. Les `name` correspondent EXACTEMENT aux noms du catalogue
 * FR (`src/lib/storage.ts`, `DEFAULT_EXERCISES`).
 */
export const REFERENCE_DATA: ReadonlyArray<ReferenceLift> = [
  {
    name: 'Développé couché barre',
    bands: { p25: 50, p50: 70, p75: 90, p90: 110 },
  },
  {
    name: 'Squat barre',
    bands: { p25: 80, p50: 110, p75: 140, p90: 170 },
  },
  {
    name: 'Soulevé de terre barre',
    bands: { p25: 100, p50: 140, p75: 180, p90: 220 },
  },
  {
    name: 'Développé militaire barre',
    bands: { p25: 35, p50: 50, p75: 65, p90: 80 },
  },
  {
    name: 'Rowing barre',
    bands: { p25: 50, p50: 70, p75: 90, p90: 110 },
  },
  {
    name: 'Tractions pronation',
    // Poids du corps : la 1RM « kg » représente la charge ADDITIONNELLE
    // équivalente (poids du corps non inclus), base population loisir.
    note: 'charge additionnelle (poids du corps non inclus)',
    bands: { p25: 0, p50: 10, p75: 20, p90: 32 },
  },
];