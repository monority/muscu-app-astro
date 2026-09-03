# Règles d'intégration

## Avant toute modification

1. Lire `AGENTS.md`
2. Lire `plan.md`
3. Lire `git status`
4. Inspecter chaque fichier avant édition

## Conventions Alpine

- Runtime `x-for`/`x-if` reste dans parent `.astro`
- Ne pas extraire markup runtime en composant Astro
- Logique pure → `src/lib/*.ts`
- État/méthodes Alpine → module TypeScript
- Markup statique/build-time → composant Astro

## Commandes interdites

- `git reset --hard`
- `git checkout --`
- `git clean` sans liste validée
- `git push` sans demande explicite
- Modification de données utilisateur sans validation

## Commandes obligatoires après chaque phase

```bash
pnpm test
pnpm check
pnpm build
git status
```

## Commit

- Petits commits atomiques uniquement
- Un commit par sujet (pas fourre-tout)
- Jamais sans demande explicite

## Sécurité

- Aucun secret dans le code
- Aucune clé en dur
- Ne jamais présenter localStorage auth comme sécurité
- Ne pas stocker passwords en clair
- Ne pas modifier changements utilisateur sans validation

## Tests

- Toute logique métier nouvelle reçoit des tests Vitest
- Tester après chaque lot de changement
- Vérifier erreurs TypeScript avant de continuer

## CSS

- Réutiliser tokens existants
- Aucun hardcode couleur sauf sémantique justifiée
- Supprimer dead CSS uniquement après recherche statique + runtime Alpine

## Validation

- Ne pas passer phase suivante si critères phase actuelle non atteints
- Montrer findings avant gros changement
- Modifier petits lots
- Demander confirmation avant:
  - Auth backend
  - Changement data model
  - Suppression docs incertaine
  - Réécriture historique
  - Force-push
  - Suppression fichier non suivi
