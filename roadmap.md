# Roadmap produit GymEmpire

| Phase | Livrable | Etat | Definition de fini |
|---|---|---|---|
| 0 | Baseline et historique Git | done | Arbre compris, fichiers sensibles contrôlés |
| 1 | Build et TypeScript | done | Check et build reproductibles |
| 2 | Architecture et dead code | done | Découpage conforme à `AGENTS.md` |
| 3 | Intégrité des données | done | Validation runtime et import robuste |
| 4 | Auth et synchronisation | done | Limites documentées, overwrite confirmé |
| 5 | Offline et service worker | done | Routes FR/EN et cache versionné |
| 6 | Design system | in_progress | Tokens et composants cohérents sur les écrans clés |
| 7 | Dashboard premium | in_progress | Lecture en 3 secondes, états complets, responsive validé |
| 8 | Builder professionnel | planned | Création rapide, résumé, séries et supersets maîtrisés |
| 9 | Session active | planned | Saisie à une main, timer et undo fiables |
| 10 | Progression et insights | planned | Tendances actionnables et graphiques compréhensibles |
| 11 | QA DOM/E2E/accessibilité | in_progress | Parcours critiques automatisés |
| 12 | Documentation et release | done | README, SECURITY et workflow CI présents |

## Séquence prioritaire

```text
Design system -> Dashboard -> Builder -> Session active -> Progression -> QA E2E
```

## Barre de qualité

Chaque phase doit satisfaire :

- mobile-first et desktop
- dark/light mode
- clavier et lecteur d'écran
- FR/EN
- états vide, erreur, chargement et succès
- tests adaptés
- `pnpm test`, `pnpm check`, `pnpm build` et `git diff --check`

## Etat actuel

- Fondations techniques stables : 457 tests Vitest passent.
- CI configurée avec Node 22.13.0 et pnpm 11.21.0.
- Le chantier prioritaire est désormais une montée en gamme produit et visuelle, pas une simple retouche cosmétique.
- Lot livré : surfaces de cartes, hiérarchie des KPI, objectif hebdomadaire, action de prochaine séance et focus clavier renforcés.
- Le dashboard reste `in_progress` : les états vides, erreurs, chargement et le parcours complet restent à auditer.
- La confirmation du run GitHub reste nécessaire après push.
