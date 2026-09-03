# Roadmap

| Phase | Description | État | Critères |
|-------|-------------|------|----------|
| 0 | Baseline Git | `done` | Working tree compris, aucun fichier perdu, Git lisible |
| 1 | Build + TypeScript | `done` | `pnpm check` et `pnpm build` sans erreur |
| 2 | Dead Code + Architecture | `done` | Zéro dead code confirmé, architecture conforme AGENTS.md |
| 3 | Correctness Données | `done` | Validateurs runtime et tests de données corrompues |
| 4 | Auth + Sync | `done` | Modèle sécurité documenté, confirmation d’écrasement distante |
| 5 | Service Worker + Offline | `done` | Routes FR/EN précachées et cache versionné |
| 6 | CSS + UI Polish | `done` | Thèmes, contrastes et focus corrigés |
| 7 | Performance | `done` | Build mesuré, double bootstrap écarté |
| 8 | Tests QA | `done` | 26 fichiers et 457 tests unitaires passants |
| 9 | Documentation | `done` | README et SECURITY.md complets |
| 10 | GitHub Clean | `in_progress` | Workflow CI ajouté ; exécution GitHub à confirmer |

## Dépendances

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
                                                    ↓
Phase 6 → Phase 7 → Phase 8 → Phase 9 → Phase 10
```

Phase 0 est prerequisite de tout. Phases 1-5 séquentielles. Phase 6 dépend Phase 4-5. Phases 7-10 séquentielles après Phase 6.

## Blocage connu

**Phase 10 reste à confirmer sur GitHub** : le workflow est présent et passe les mêmes commandes localement ; la branche distante doit exécuter la CI.

## Commandes de validation

```bash
pnpm test      # Tests unitaires
pnpm check     # TypeScript validation
pnpm build     # Build production
git diff --check
git status
```

## Progression

```
Phase  0: [x] Done
Phase  1: [x] Done
Phase  2: [x] Done
Phase  3: [x] Done
Phase  4: [x] Done
Phase  5: [x] Done
Phase  6: [x] Done
Phase  7: [x] Done
Phase  8: [x] Done
Phase  9: [x] Done
Phase 10: [~] In progress — CI ajoutée, exécution distante à confirmer
```
