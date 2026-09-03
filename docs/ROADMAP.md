# Rework Roadmap

## What a rework consists of

Chaque page suit le meme processus en 6 etapes :

### 1. Extraire la logique metier → `src/lib/<page>-stats.ts`

Fonctions pures (pas de DOM, pas de localStorage, pas de Alpine). Exemples :
- Calculs metier (volume, streak, RPE stats, suggestions, etc.)
- Transformations de donnees (aggregation, filtrage, tri)
- Fonctions de forme pures

Pourquoi : testable, reutilisable, hors Alpine.

### 2. Extraire les helpers partages → `src/lib/*.ts` existants

Deplacer dans les modules existants si logique reutilisable :
- `format.ts` — formatage dates, volumes, poids
- `csv-export.ts` — export CSV, download blob, slugify
- `share-card.ts` — generation image share
- `session-utils.ts` — labels de statut, utilitaires session

### 3. Ecrire les tests → `src/lib/__tests__/<page>-stats.test.ts`

Couvrir :
- Cas limites (0, negatif, null, vide)
- Cas normaux
- Cas complexes (plusieurs sessions, groups, etc.)

Objectif : toute logique metier critique a au moins un test.

### 4. Extraire les composants Astro → `src/components/<page>/`

Decouper le template en sous-composants visuels independants :
- Sections visuelles autonomes (header, sidebar, cards, listes)
- Composants qui repetent un pattern (ex: item de liste, carte de stats)
- garder les directives Alpine dans les composants (x-text, x-if, x-for)

Ne PAS extraire :
- Les wrappers trop fins (3 lignes)
- Les sections specifiques non reutilisables
- Les parties qui dependent etroitement de l'Alpine scope parent

### 5. Nettoyer le CSS

- Supprimer les selecteurs morts (cibles plus utilisees)
- Deplacer le CSS des composants extraits si is:global
- Garder le CSS scope pour les elements specifiques à la page
- Utiliser les design tokens (pas de valeurs hardcodees sauf couleurs semantiques)

### 6. Validation

- `npx vitest run` — tous les tests passent
- `npx astro check` — pas d'erreurs TypeScript (les warnings pre-existants sont ok)
- Verification manuelle : meme rendu, les deux themes, responsive

---

## Completed

| Page | Lines | Date |
|------|-------|------|
| `sessions/detail` | 2165 → 1497 | 2026-08-26 |
| `index` (dashboard) | 1507 → 503 | 2026-08-26 |
| `calculator` | 995 → 704 | 2026-08-26 |
| `sessions/create` | 2128 → 1976 | 2026-08-27 |
| `exercises/index` | 1727 → 1658 | 2026-08-27 |
| `sessions/quick` | 1716 → 1640 | 2026-08-27 |
| `settings/index` | 1570 → 1557 | 2026-08-27 |
| `timer/index` | 1175 → ~1090 | 2026-08-28 |
| `sessions/compare` | 1305 → ~1240 | 2026-08-28 |
| `progression/stats` | 1258 → ~1100 | 2026-08-28 |
| `sessions/print` | 937 → ~870 | 2026-08-28 |
| `exercises/history` | 845 → ~790 | 2026-08-28 |
| `progression/poids` | 935 → ~830 | 2026-08-28 |
| `calendar.astro` | 833 → ~767 | 2026-08-28 |
| `sessions/index` | 823 → ~770 | 2026-08-28 |
| `exercises/trends` | 523 → 482 | 2026-09-03 |
| `progression/index` | 515 → 439 | 2026-09-03 |

## Remaining

No more candidates — all pages reworked.

## Not candidates

| Page | Lines | Reason |
|------|-------|--------|
| `login.astro` | 665 | Simple auth form. |
| `ui.astro` | 854 | Design system showcase. |
| `debug.astro` | 189 | Debug tool. |
| `pop.astro` | 39 | Tiny. |
| `en/*` | 5 | FR wrappers. |
