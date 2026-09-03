# Plan Finalisation muscu.app

## Objectif

Finaliser, stabiliser, polisher app Astro/Alpine. Livrer GitHub propre, testée, documentée.

## État actuel

| Item | État |
|------|------|
| Tests | 457 passants |
| astro check | Erreurs TS préexistantes |
| README | Vide |
| Lint/format | Aucun configuré |
| E2E/accessibilité | Aucun test |
| Working tree | 37 paths modifiés, fichiers non suivis |
| Historique | DB SQLite potentiellement sensible |
| Auth | Simple gate localStorage |
| WebDAV | Credentials persistés localement |
| Service worker | Routes précachées incomplètes |
| Alpine | Double bootstrap sur debug/print |
| CSS | Risques light-theme, focus, placeholder, dead selectors |

## Phases

### Phase 0 — Baseline Git

Identifier commit de référence. Classer chaque fichier (garder/supprimer/ignorer). Ne jamais `git clean` sans validation. Ajouter `.gitattributes`. Étendre `.gitignore`. Commits cohérents par sujet.

### Phase 1 — Build + TypeScript

Corriger toutes erreurs `astro check`. Ajouter scripts `check`, `test`, `build` dans package.json. Critère: `pnpm check` et `pnpm build` passent sans erreur.

### Phase 2 — Dead Code + Architecture

Imports inutilisés, composants orphelins, fonctions jamais appelées. Vérifier Alpine Componentization Rule (AGENTS.md). Supprimer anciennes abstractions. Réconcilier ROADMAP.md.

### Phase 3 — Correctness Données

Valider JSON importé. Refuser records malformés. Gérer migrations. Normaliser NaN/négatifs/Infinity/champs absents. Tester corruption localStorage, import partiel, migration version.

### Phase 4 — Auth + Sync

Décision: gate local OU vrai backend. Ne jamais présenter localStorage auth comme sécurité. Évaluer credentials WebDAV. Ajouter confirmation overwrite distant. Stratégie conflit (last-write-wins ou merge). Tester erreurs réseau.

**État: Terminé.** Auth = fake dev gate (pas de sécurité). Sync = WebDAV Basic auth. Push overwrite confirmation ajoutée. Security model documenté dans auth.ts.

### Phase 5 — Service Worker + Offline

Générer routes depuis build Astro. Inclure FR/EN. Versionner cache. Tester installation, activation, navigation offline, assets obsolètes, routes inconnues.

**État: Terminé.** Routes précachées complétées (16 FR + 16 EN). Version bump v6→v7. `/en/timer/pop` retiré (n'existe pas).

### Phase 6 — CSS + UI Polish

Tokens (`color-scheme`, couleurs sémantiques). Corriger placeholder, Dialog, Checkbox, Toggle. Contraste WCAG. Focus rings. Dead CSS selectors. Audit `outline: none`. Labels vides (StatusSection, NotesSection).

**État: Terminé.** `color-scheme` ajouté (dark/light). Placeholder contrast fixé (`Input.astro`, `Pagination.astro`, `TableRow.astro`). Focus rings OK (outline:none + box-shadow). 0 dead CSS selectors.

### Phase 7 — Performance

Supprimer double bootstrap Alpine. Mesurer build. Vérifier scripts inline, fonts, SVG, recalculs Alpine. Optimiser uniquement si mesure justifie.

**État: Terminé.** Pas de double bootstrap (Alpine.start() sur DCL, module scripts). Build: 42 pages, 1.70s, 2.82 MB total. Fonts: Google Fonts avec preconnect. Inline scripts minimaux (locale, theme bootstrap). Tests: 457 ✅

### Phase 8 — Tests QA

Unitaires (stats, storage, sync, timers, builder). DOM (Alpine init, interactions, dialogs, forms). E2E (login, CRUD sessions, import/export, sync, theme, offline, FR/EN). Accessibilité automatisée.

**État: Audit terminé.** 26 fichiers, 457 tests unitaires (Vitest). Couverture: auth, storage, sync, stats (6 modules), builder, calculator, timer, benchmarks, body-chart, calendar-grid, exercises-stats, rest-times, settings-stats, session-utils. **Gaps:** pas de tests i18n, pas de tests DOM/Alpine, pas de framework E2E (Playwright absent). jsdom disponible pour tests DOM futurs.

### Phase 9 — Documentation

README complet (mission, stack, install, architecture, data model, auth, WebDAV, offline, i18n, themes, deployment, backup/restore, limites). CONTRIBUTING.md, SECURITY.md, CHANGELOG.md si utile.

**État: Terminé.** README réécrit (stack, install, architecture, data model, auth, WebDAV, offline, routes, i18n, themes, tests, build, deployment, limits). SECURITY.md créé (auth, localStorage, WebDAV tradeoffs). Plan déplacé dans plan.md existant.

### Phase 10 — GitHub Clean

Historique SQLite sensible. `.gitignore` étendu. CI GitHub Actions (install, test, check, build). Commits atomiques. Vérifier `git diff --check`. Working tree propre.

**État: En cours.** Workflow GitHub Actions ajouté (`.github/workflows/ci.yml`) avec install reproductible, tests, `astro check` et build. Reste à confirmer l’exécution sur GitHub et à finaliser le commit.

## Critères de sortie

```
pnpm test → vert
pnpm check → vert
pnpm build → vert
git diff --check → vert
```

Aucun dead code. Aucune route cassée FR/EN. Thème dark/light validé. Responsive validé. Accessibilité critique corrigée. Offline validé. Auth/sync documentés. README complet. CI verte. Aucun secret tracké.

## Commande d'exécution

```
Lire AGENTS.md → Lire ce plan → Lire git status → Phase 0 → tester → Phase 1 → tester → ...
```

Ne pas passer phase suivante si critères phase actuelle non atteints.
