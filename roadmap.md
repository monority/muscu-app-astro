# Roadmap

| Phase | Description | État | Critères |
|-------|-------------|------|----------|
| 0 | Baseline Git | `pending` | Working tree compris, aucun fichier perdu, Git lisible |
| 1 | Build + TypeScript | `pending` | `pnpm check` et `pnpm build` sans erreur |
| 2 | Dead Code + Architecture | `pending` | Zéro dead code confirmé, architecture conforme AGENTS.md |
| 3 | Correctness Données | `pending` | Données invalides ne cassent jamais app |
| 4 | Auth + Sync | `pending` | Modèle sécurité documenté, risques assumés ou corrigés |
| 5 | Service Worker + Offline | `pending` | Chaque route fonctionne online/offline selon contrat |
| 6 | CSS + UI Polish | `pending` | UI cohérente, lisible, responsive, accessible |
| 7 | Performance | `pending` | Budget documenté, aucune optimisation spéculative |
| 8 | Tests QA | `pending` | Pipeline reproductible, régressions détectées |
| 9 | Documentation | `pending` | README complet, limites documentées |
| 10 | GitHub Clean | `pending` | CI verte, working tree propre, aucun secret tracké |

## Dépendances

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
                                                    ↓
Phase 6 → Phase 7 → Phase 8 → Phase 9 → Phase 10
```

Phase 0 est prerequisite de tout. Phases 1-5 séquentielles. Phase 6 dépend Phase 4-5. Phases 7-10 séquentielles après Phase 6.

## Blocage connu

**Phase 4 requiert décision**: auth reste gate local OU devient vrai backend. Pas d'implémentation implicite.

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
Phase  0: [ ] Pending
Phase  1: [ ] Pending
Phase  2: [ ] Pending
Phase  3: [ ] Pending
Phase  4: [ ] Pending
Phase  5: [ ] Pending
Phase  6: [ ] Pending
Phase  7: [ ] Pending
Phase  8: [ ] Pending
Phase  9: [ ] Pending
Phase 10: [ ] Pending
```
