# Règles de qualité GymEmpire

## Niveau produit

- Concevoir pour un utilisateur debout, distrait et parfois pressé.
- Prioriser clarté, vitesse de saisie, feedback et récupération après erreur.
- Ne jamais considérer une interface “finie” sans ses états vide, erreur, chargement, succès et responsive.
- Une décision visuelle doit servir une hiérarchie ou une action, pas seulement décorer.

## Direction visuelle anti-AI-slop

- Éviter l'AI slop : pas d'empilement automatique de cartes, de panneaux ou de blocs avec background.
- Ne pas donner à chaque élément une apparence de carte flottante.
- Privilégier une composition éditoriale : espace, typographie, grille, séparateurs fins et accents de couleur mesurés.
- Les composants `Card` doivent rester plats par défaut : pas de background, pas d'ombre et pas d'arrondi décoratif systématique.
- Un background est réservé à une fonction claire : contrôle interactif, état sélectionné, feedback, overlay ou distinction sémantique.
- Ne pas ajouter de gradient, glow, glassmorphism ou ombre uniquement pour “faire premium”.
- Toute nouvelle surface visuelle doit justifier son rôle et être validée en dark et light mode.

## Workflow obligatoire

1. Lire `AGENTS.md`, `plan.md`, `roadmap.md` et `git status`.
2. Inspecter les composants, styles, labels et logique concernés.
3. Décrire le changement et ses états avant un gros lot.
4. Implémenter par petits lots testables.
5. Vérifier mobile, desktop, dark/light, clavier et traductions.

```bash
pnpm test
pnpm check
pnpm build
git diff --check
git status
```

## Astro et Alpine

- Le markup produit par `x-for`, `x-if` ou l'état runtime reste dans le template `.astro` parent.
- Ne pas extraire du markup dynamique dans un composant Astro.
- Extraire la logique métier, les transformations et validations dans TypeScript.
- Utiliser `$dispatch` pour les événements entre zones Alpine.

## UI et accessibilité

- Utiliser les tokens existants et limiter les valeurs arbitraires.
- Cibles tactiles d'au moins 44 px.
- Focus `:focus-visible` visible et cohérent.
- Contraste vérifié en dark et light mode.
- Titres, labels, erreurs et annonces compréhensibles par lecteur d'écran.
- Prévoir texte long, zoom, clavier, écran étroit et absence de données.
- Respecter `prefers-reduced-motion` pour les animations non essentielles.

## Données et sécurité

- Valider localStorage, import et synchronisation à chaque frontière.
- Ne jamais perdre silencieusement une saisie utilisateur.
- Ne jamais ajouter de secret ou de clé en dur.
- Décrire clairement les limites de l'authentification locale et du WebDAV.

## Tests et livraison

- Toute logique métier nouvelle reçoit des tests Vitest.
- Toute interaction critique reçoit un test DOM ou E2E dès que le harness existe.
- Commits atomiques, messages explicites, pas de commit fourre-tout.
- Pas de `git push` sans demande explicite.
- Ne pas utiliser `git reset --hard`, `git checkout --` ou `git clean` sans validation explicite.
