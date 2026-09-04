# Plan de transformation produit — GymEmpire

## Ambition

Construire une application de suivi de musculation crédible face aux meilleurs produits fitness : rapide en salle, lisible sous pression, visuellement premium, fiable offline et suffisamment rigoureuse pour inspirer confiance.

## Principes de produit

- L'utilisateur doit savoir quoi faire dans les 3 secondes suivant l'ouverture d'un écran.
- Chaque écran possède une action principale clairement dominante.
- La saisie pendant l'entraînement doit demander le moins de taps possible.
- Les données importantes sont visibles avant les détails.
- Toute action destructive est réversible ou confirmée.
- Une interface professionnelle gère les états vide, chargement, erreur, succès et données longues.

## Priorités

### 1. Fondations visuelles

- Définir une grille, une échelle typographique et des espacements cohérents.
- Harmoniser cartes, boutons, champs, badges, tableaux, modales et notifications.
- Construire une identité GymEmpire : contrastée, énergique, sobre et reconnaissable.
- Garantir dark/light mode, responsive, clavier et contraste.

### 2. Dashboard

- Donner une lecture immédiate de la semaine et de la prochaine séance.
- Mettre en avant les KPI réellement actionnables.
- Remplacer les zones plates par une hiérarchie de surfaces et de groupes.
- Ajouter des états utiles : première utilisation, aucune donnée récente, objectif atteint.

### 3. Builder de séance

- Parcours guidé : nom, modèle, exercices, séries, notes, sauvegarde.
- Recherche d'exercices rapide avec favoris, muscles et templates visibles.
- Résumé permanent : exercices, séries, volume prévu et validité de la séance.
- Saisie dense mais confortable, réordonnable et sans perte de données.
- Supersets et séries avancées compréhensibles sans explication externe.

### 4. Session active

- Afficher en priorité exercice courant, série courante, repos et progression.
- Contrôles tactiles larges et utilisables à une main.
- Feedback immédiat après validation, undo fiable et prévention des erreurs.
- Timer persistant et comportement robuste lorsque l'écran est verrouillé ou offline.

### 5. Progression et confiance

- Graphiques lisibles avec unités, périodes, tendances et états sans données.
- Import/export et synchronisation transparents, avec erreurs explicites.
- Authentification et stockage documentés sans promesse de sécurité trompeuse.

## Méthode par lot

Pour chaque écran : audit du parcours, inventaire des états, proposition visuelle, implémentation, tests responsive/accessibilité, puis validation des régressions.

## Critères d'exigence

```text
pnpm test        -> vert
pnpm check       -> vert
pnpm build       -> vert
git diff --check -> vert
```

Une fonctionnalité n'est pas terminée si elle fonctionne uniquement dans le cas nominal.
