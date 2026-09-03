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

### Phase 5 — Service Worker + Offline

Générer routes depuis build Astro. Inclure FR/EN. Versionner cache. Tester installation, activation, navigation offline, assets obsolètes, routes inconnues.

### Phase 6 — CSS + UI Polish

Tokens (`color-scheme`, couleurs sémantiques). Corriger placeholder, Dialog, Checkbox, Toggle. Contraste WCAG. Focus rings. Dead CSS selectors. Audit `outline: none`. Labels vides (StatusSection, NotesSection).

### Phase 7 — Performance

Supprimer double bootstrap Alpine. Mesurer build. Vérifier scripts inline, fonts, SVG, recalculs Alpine. Optimiser uniquement si mesure justifie.

### Phase 8 — Tests QA

Unitaires (stats, storage, sync, timers, builder). DOM (Alpine init, interactions, dialogs, forms). E2E (login, CRUD sessions, import/export, sync, theme, offline, FR/EN). Accessibilité automatisée.

### Phase 9 — Documentation

README complet (mission, stack, install, architecture, data model, auth, WebDAV, offline, i18n, themes, deployment, backup/restore, limites). CONTRIBUTING.md, SECURITY.md, CHANGELOG.md si utile.

### Phase 10 — GitHub Clean

Historique SQLite sensible. `.gitignore` étendu. CI GitHub Actions (install, test, check, build). Commits atomiques. Vérifier `git diff --check`. Working tree propre.

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
