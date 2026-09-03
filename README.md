# muscu.app

## Mission

Finaliser, stabiliser, polisher et nettoyer app Astro/Alpine avant livraison GitHub.

## Règles d'intégration

- Lire `AGENTS.md` avant toute modification.
- Inspecter fichiers avant édition.
- Respecter Alpine Componentization Rule.
- Runtime `x-for`/`x-if` reste dans parent `.astro`.
- Logique pure va dans `src/lib/*.ts`.
- Toute logique métier nouvelle reçoit tests Vitest.
- Réutiliser tokens CSS existants.
- Aucun hardcode couleur sauf couleur sémantique justifiée.
- Ne pas modifier changements utilisateur sans validation.
- Ne jamais utiliser commande destructive.
- Ne jamais utiliser `git reset --hard`.
- Ne jamais utiliser `git checkout --`.
- Ne jamais utiliser `git clean` sans liste validée.
- Ne jamais commit/push sans demande explicite.
- Après chaque phase: tests ciblés, puis état Git.
- Petits commits atomiques uniquement si commit demandé.

## État initial connu

- Tests actuels: 457 passants.
- `astro check`: erreurs TypeScript préexistantes.
- `README.md`: vide.
- Aucun lint configuré.
- Aucun test E2E.
- Aucun test accessibilité automatisé.
- Working tree sale:
  - 37 paths modifiés.
  - docs supprimées à vérifier.
  - nombreux fichiers non suivis.
- Historique contient ancienne DB SQLite potentiellement sensible.
- Auth actuelle: simple gate `localStorage`, pas sécurité réelle.
- WebDAV: credentials persistés localement, Basic Auth.
- Service worker: routes précachées incomplètes.
- Alpine: double bootstrap sur `debug` et `sessions/print`.
- CSS: risques light-theme, focus, placeholder, contraste, dead selectors.

## Phase 0 — Baseline Git obligatoire

### Objectif

Comprendre changements existants avant toute suppression ou refactor.

### Actions

1. Exécuter:
   ```bash
   git status --short
   git diff --stat
   git diff --check
   git log --oneline -10
   git branch -vv
   ```
2. Identifier commit de référence.
3. Classer chaque fichier:
   - changement utilisateur à préserver;
   - changement du rework à conserver;
   - fichier temporaire;
   - fichier généré;
   - suppression documentaire à confirmer.
4. Lire chaque suppression avant décision.
5. Inspecter fichiers non suivis.
6. Ne pas nettoyer automatiquement.
7. Ne pas supprimer docs sans vérifier usage et historique.

### Sortie

- Inventaire Git documenté.
- Liste fichiers à garder/supprimer/ignorer.
- Aucun changement accidentel perdu.

## Phase 1 — Installer validation technique

### Objectif

Rendre qualité mesurable et reproductible.

### Actions

1. Ajouter scripts package:
   ```json
   {
     "test": "vitest run",
     "check": "astro check",
     "build": "astro build"
   }
   ```
2. Ajouter lint/format seulement après choix outil cohérent.
3. Éviter migration massive de formatage.
4. Configurer CI après commandes locales stables.
5. Vérifier Node/pnpm versions avec `package.json`.

### Critères

- `pnpm test` passe.
- `pnpm check` passe sans erreur.
- `pnpm build` passe.
- Warnings existants identifiés séparément.

## Phase 2 — Corriger TypeScript

### Cibles connues

- `src/components/builder/sessionSave.ts`
- `src/components/layout/AppShell.astro`
- `src/pages/login.astro`
- `src/pages/exercises/history.astro`
- `src/pages/exercises/index.astro`
- `src/pages/progression/poids.astro`
- `src/pages/sessions/compare.astro`
- `src/pages/sessions/print.astro`
- `src/pages/sessions/create/index.astro`
- `src/pages/settings/index.astro`
- tests utilisant types obsolètes
- `src/env.d.ts`

### Règles

- Corriger types à la source.
- Ne pas masquer erreurs avec `any`.
- Ne pas utiliser casts `unknown as X` sans validation.
- Préserver comportement runtime.
- Ajouter test si correction change logique.

### Critères

```bash
pnpm check
```

Aucune erreur TypeScript.

## Phase 3 — Dead code et architecture

### Recherche

- imports inutilisés;
- exports jamais utilisés;
- fonctions jamais appelées;
- composants jamais importés;
- classes CSS sans usage;
- labels i18n orphelins;
- icônes jamais référencées;
- anciens modules remplacés;
- scripts Alpine dupliqués.

### Convention Alpine stricte

- Markup généré par `x-for`, `x-if`, état runtime reste dans `.astro` parent.
- Ne pas extraire markup runtime en composant Astro.
- Extraire uniquement:
  - logique pure vers `src/lib`;
  - état/méthodes Alpine vers module TypeScript;
  - markup statique/build-time vers composant Astro.
- Vérifier:
  - `src/components/calculator/BarbellResult.astro`
  - `src/components/calculator/DumbbellResult.astro`

### Critères

- Aucun dead code confirmé.
- Roadmap correspond au code réel.
- Aucun composant extrait contre `AGENTS.md`.

## Phase 4 — Données et stockage

### Fichier principal

- `src/lib/storage.ts`

### Actions

1. Auditer tous `JSON.parse`.
2. Remplacer casts directs par guards ou schemas.
3. Valider:
   - sessions;
   - exercises;
   - sets;
   - progress;
   - body records;
   - settings;
   - snapshot importé.
4. Gérer:
   - champs absents;
   - mauvais types;
   - `NaN`;
   - `Infinity`;
   - valeurs négatives;
   - dates invalides;
   - IDs dupliqués;
   - versions inconnues.
5. Définir migrations explicites.
6. Tester localStorage corrompu.
7. Tester import/export partiel.
8. Tester ancienne version de données.

### Critères

- Données invalides ne font pas crasher app.
- Import invalide refusé proprement.
- Backup précédent conservé avant remplacement.

## Phase 5 — Décision auth

### État actuel

`src/lib/auth.ts` indique explicitement fake auth:

- session dans localStorage;
- password non vérifié;
- protection uniquement UI;
- routes statiques accessibles.

### Décision obligatoire

#### Option A — App locale personnelle

- Renommer/documenter auth comme UX gate.
- Ne jamais présenter comme sécurité.
- Supprimer champs ou promesses password inutiles.
- Ajouter avertissement README.
- Garder logique simple et testée.

#### Option B — Vrais comptes

- Backend obligatoire.
- Hash password serveur.
- Session cookie sécurisée.
- Protection serveur des routes.
- Validation serveur.
- CSRF/session expiry.
- Ne pas implémenter pseudo-sécurité localStorage.

Ne pas choisir implicitement Option B.

## Phase 6 — Sync WebDAV

### Fichier principal

- `src/lib/sync.ts`

### Risques

- credentials password en localStorage;
- Basic Auth préemptive;
- CORS;
- last-write-wins destructif;
- overwrite distant sans conflit;
- endpoint HTTP possible.

### Actions

1. Exiger HTTPS sauf environnement local explicite.
2. Documenter modèle de menace.
3. Évaluer stockage password:
   - session-only;
   - Web Crypto;
   - backend proxy;
   - jamais prétendre chiffrement si absent.
4. Ajouter confirmation avant overwrite.
5. Ajouter version/timestamp comparé avant push.
6. Prévoir backup local avant pull.
7. Tester:
   - 401;
   - 403;
   - 404;
   - CORS;
   - timeout;
   - réseau coupé;
   - JSON invalide;
   - conflit;
   - serveur indisponible.
8. Garder erreurs machine-readable + traduction UI.

### Critères

- Aucun overwrite silencieux dangereux.
- Erreurs compréhensibles.
- Stratégie conflit documentée.

## Phase 7 — Service worker/offline

### Fichier principal

- `public/sw.js`

### Actions

1. Comparer routes `src/pages` aux routes `APP_SHELL`.
2. Inclure routes FR et EN:
   - calculator;
   - progression;
   - records;
   - stats;
   - poids;
   - exercises history;
   - exercises trends;
   - sessions compare;
   - sessions print;
   - timer pop.
3. Vérifier trailing slash et URLs Astro produites.
4. Éviter fallback dashboard pour route différente.
5. Versionner cache.
6. Tester installation.
7. Tester activation/migration.
8. Tester navigation offline.
9. Tester assets anciens.
10. Tester route jamais visitée.
11. Tester session détail dynamique.

### Critères

- Routes connues servent contenu correct offline.
- Fallback offline explicite.
- Aucun cache obsolète après update.

## Phase 8 — CSS/theme/accessibilité

### Tokens

Fichiers:

- `src/styles/tokens.css`
- `src/styles/reset.css`
- `src/styles/utilities.css`
- `src/styles/global.css`

Actions:

- ajouter `color-scheme: dark light` selon thème actif;
- éliminer couleurs hardcodées incompatibles;
- corriger placeholder Input;
- corriger Dialog;
- corriger Checkbox;
- corriger Toggle;
- vérifier contrastes WCAG;
- uniformiser focus ring;
- éviter `outline: none` sans remplacement;
- uniformiser disabled/hover/active;
- normaliser tailles d'icônes.

### Accessibility connue

- `StatusSection.astro`: `aria-label=""`;
- `NotesSection.astro`: fatigue `aria-label=""`;
- drawer AppShell: contenu derrière non `inert`;
- Card clickable: hover sans clavier/focus;
- labels dynamiques à vérifier;
- boutons icon-only à vérifier.

### Dead CSS candidates à confirmer

- `.border-b-separator`
- `.text-label`
- `.text-body-secondary`
- `.text-caption`
- `.text-settings-label`
- `.text-stat-value`
- `.section-gap`
- `.card-surface`
- `.grid-responsive-2`
- `.grid-responsive-3`
- `.status-dot` et variantes

Ne supprimer qu'après recherche statique + runtime Alpine.

## Phase 9 — Polish page par page

Ordre strict:

1. `sessions/detail`
2. `sessions/create`
3. dashboard
4. sessions list
5. progression hub
6. exercises
7. settings
8. timer
9. calculator
10. calendar
11. pages print/debug

Pour chaque page:

- lire page + composants + module logique;
- vérifier structure HTML;
- vérifier dark theme;
- vérifier light theme;
- vérifier mobile;
- vérifier desktop;
- vérifier longs noms;
- vérifier texte vide;
- vérifier erreurs;
- vérifier loading;
- vérifier disabled;
- vérifier clavier;
- vérifier focus;
- vérifier icônes;
- vérifier boutons;
- vérifier contrastes;
- vérifier overflow;
- vérifier `x-cloak`;
- vérifier locale FR/EN;
- prendre note avant/après;
- ajouter test si bug logique découvert.

Ne pas refaire design global page par page. D'abord établir tokens et composants UI communs.

## Phase 10 — Performance

### Actions

- supprimer double bootstrap Alpine:
  - `src/pages/debug.astro`
  - `src/pages/sessions/print.astro`
- mesurer taille build avant optimisation;
- vérifier scripts inline;
- limiter fonts et poids;
- vérifier SVG;
- vérifier images;
- vérifier recalculs Alpine;
- éviter abstractions inutiles;
- vérifier cache SW;
- charger uniquement ressources nécessaires.

### Critères

- build mesuré.
- optimisation justifiée par mesure.
- pas de régression interaction.

## Phase 11 — Tests

### Unit

- logique stats;
- storage guards;
- migrations;
- sync;
- format;
- timers;
- builder.

### DOM

- Alpine init;
- interactions boutons;
- status update;
- create/edit session;
- dialogs;
- theme switch;
- drawer;
- form validation.

### E2E

- login gate;
- dashboard;
- create session;
- edit session;
- delete session;
- update status;
- add/remove exercises;
- import/export;
- sync;
- theme;
- offline;
- FR/EN;
- responsive.

### Accessibility

- labels;
- keyboard;
- focus;
- contrast;
- dialog;
- drawer;
- icon-only buttons;
- tables.

## Phase 12 — Documentation

README doit documenter:

- mission;
- stack;
- Node/pnpm requis;
- installation;
- scripts;
- architecture;
- Astro/Alpine boundaries;
- localStorage;
- schema données;
- migrations;
- auth et limites;
- WebDAV et risques;
- offline;
- routes;
- i18n;
- themes;
- tests;
- build;
- déploiement;
- backup/restore;
- limites connues;
- contribution;
- sécurité.

Ajouter si utile:

- `CONTRIBUTING.md`
- `SECURITY.md`
- `CHANGELOG.md`

## Phase 13 — GitHub clean

### Avant nettoyage

- inspecter toutes suppressions;
- inspecter tous fichiers non suivis;
- sauvegarder repo;
- vérifier remote;
- vérifier branches;
- vérifier worktrees.

### `.gitignore`

Ajouter avec prudence:

```gitignore
.env.*
!.env.example
.freebuff/
*.log
```

Ne pas ignorer fichiers nécessaires au build ou déploiement.

### Historique sensible

SQLite historique:

- `.freebuff/desktop-v2.db`
- `.freebuff/desktop-v2.db-wal`
- `.freebuff/desktop-v2.db-shm`

Procédure:

1. confirmer contenu sensible;
2. faire backup repo;
3. prévenir équipe;
4. inspecter credentials potentiellement exposés;
5. rotation credentials;
6. réécrire historique seulement avec accord explicite;
7. utiliser `git filter-repo`;
8. force-push uniquement après confirmation;
9. vérifier clone propre;
10. ne pas prune unreachable sans inspection.

Action irréversible → confirmation obligatoire.

### CI

Ajouter GitHub Actions:

```yaml
pnpm install --frozen-lockfile
pnpm test
pnpm check
pnpm build
```

## Critères de fin

- `pnpm test` vert.
- `pnpm check` vert.
- `pnpm build` vert.
- aucun dead code confirmé.
- aucune route cassée FR/EN.
- thème dark/light validé.
- responsive validé.
- accessibility critique corrigée.
- offline validé.
- auth/sync documentés.
- README complet.
- CI verte.
- `git diff --check` vert.
- working tree propre après commit.
- aucun secret actuel tracké.
- historique traité ou risque explicitement accepté.

## Procédure pour prochain modèle

1. Lire `AGENTS.md`.
2. Lire ce README.
3. Lire `git status`.
4. Ne pas supprimer changements existants.
5. Réaliser une seule phase à la fois.
6. Montrer findings avant gros changement.
7. Modifier petits lots.
8. Tester après chaque lot.
9. Mettre à jour README avec état phase.
10. Ne pas passer phase suivante si critères phase actuelle non atteints.
11. Demander confirmation avant:
    - auth backend;
    - changement data model;
    - suppression docs incertaine;
    - réécriture historique;
    - force-push;
    - suppression fichier non suivi.
