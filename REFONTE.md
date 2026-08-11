# MUSCU APP — MASTER PLAN UI/UX V2

> **Source de vérité pour la refonte UI/UX et produit de muscu-app.**
>
> Objectif : transformer l'application en un produit de musculation moderne, élégant, cohérent et agréable à utiliser quotidiennement, sans réécrire son architecture métier.
>
> La priorité n'est pas de rendre chaque écran "joli". La priorité est de construire une expérience cohérente où l'utilisateur comprend immédiatement **où il est, ce qu'il peut faire et quelle action est importante**.

---

# 1. Vision

Muscu App doit donner l'impression d'un produit arrivé à maturité.

La direction recherchée :

> **Premium SaaS + outil de performance + simplicité**

L'application doit être :

* élégante
* calme
* précise
* dense mais respirante
* moderne
* rapide à comprendre
* agréable sur mobile
* excellente sur desktop

Elle ne doit pas ressembler à une fitness app générique.

### À éviter

* néons
* glow
* gradients décoratifs
* glassmorphism omniprésent
* ombres lourdes
* énormes boutons arrondis
* interfaces surchargées
* animations décoratives
* couleurs utilisées uniquement pour embellir

La sophistication doit venir de :

```text
Typographie
+
Espacement
+
Hiérarchie
+
Proportions
+
Contraste
+
Micro-interactions
+
Cohérence
```

---

# 2. Principe produit fondamental

Chaque écran doit répondre immédiatement à trois questions :

### Où suis-je ?

Navigation + titre + contexte.

### Que puis-je faire ?

Actions principales clairement identifiées.

### Que dois-je faire maintenant ?

Une action principale évidente.

Si un écran nécessite plusieurs secondes pour comprendre son fonctionnement, le problème est probablement UX et pas esthétique.

---

# 3. Architecture visuelle globale

Toutes les pages doivent suivre une structure commune :

```text
┌──────────────────────────────────────┐
│ Global Header                        │
│ profil · thème · paramètres          │
├──────────────────────────────────────┤
│                                      │
│ Page title                           │
│ Description                          │
│                                      │
│ Primary action                       │
│                                      │
│ Main content                         │
│                                      │
└──────────────────────────────────────┘
```

Le titre appartient au contenu.

Le header global ne doit pas servir de deuxième système de titres.

---

# 4. Navigation

La navigation doit être immédiatement compréhensible.

Chaque entrée :

```text
[Icon] Label
```

Les icônes doivent utiliser le même langage visuel.

## État actif

L'état actif doit être visible mais discret.

Utiliser principalement :

* surface
* contraste
* poids typographique
* accent subtil

Éviter les couleurs criardes.

## Hiérarchie

La navigation doit distinguer clairement :

### Navigation principale

* Dashboard
* Séances
* Exercices
* Progression

### Outils

* Timer
* Calculateur
* Calendrier

### Compte

* Paramètres
* Profil
* Déconnexion

La navigation accordéon existante est conservée si elle fonctionne correctement.

---

# 5. Design System

Le design system devient la fondation de toute la refonte.

## Tokens

Centraliser :

* couleurs
* surfaces
* borders
* radius
* shadows
* spacing
* typography
* motion
* focus

Aucune couleur arbitraire dans les composants.

---

# 6. Palette

L'interface doit rester majoritairement neutre.

Les couleurs servent à encoder une information.

### Sémantique

```text
Emerald → volume
Sky → séances
Violet → records / PR
Amber → streak / série
Orange → action principale
```

Les couleurs musculaires doivent rester secondaires.

Ne jamais multiplier les couleurs uniquement pour créer de la variété.

### Règle

> Une couleur doit avoir une raison d'exister.

---

# 7. Typographie

Utiliser Inter.

Créer une hiérarchie claire :

```text
Display
H1
H2
H3
Body
Small
Caption
```

Les valeurs numériques importantes utilisent :

```css
font-variant-numeric: tabular-nums;
```

Les chiffres doivent être particulièrement lisibles dans :

* poids
* répétitions
* séries
* timer
* statistiques
* PR

---

# 8. Radius

Utiliser une échelle limitée.

```text
sm
md
lg
xl
```

Les composants ne doivent pas tous être pill.

Les boutons et cards doivent généralement utiliser des radius modérés.

Le produit doit avoir une géométrie cohérente.

---

# 9. Boutons

Créer une hiérarchie stricte :

```text
Primary
Secondary
Tertiary
Ghost
Destructive
Icon
```

## Primary

Réservé à l'action principale.

Exemples :

```text
Commencer la séance
Enregistrer
Valider la série
Créer la séance
```

## Secondary

Actions importantes mais secondaires.

## Ghost / tertiary

Navigation et actions contextuelles.

## Règles

Tous les boutons doivent partager :

* hauteur
* radius
* typographie
* focus
* transition
* disabled state

Aucun glow.

Aucune ombre excessive.

---

# 10. Cards et surfaces

Ne pas mettre une card autour de chaque élément.

Utiliser une card lorsqu'elle apporte une vraie séparation conceptuelle.

Priorité :

```text
Spacing
>
Typography
>
Border
>
Background
>
Shadow
```

Les surfaces doivent être suffisamment contrastées sans devenir lourdes.

---

# 11. Badges

Créer un langage commun pour :

* muscle
* équipement
* statut
* record
* superset
* RPE

Les badges doivent rester compacts.

Ils ne doivent jamais devenir le principal élément visuel d'un écran.

---

# 12. Dashboard

Le dashboard actuel devient la référence visuelle.

Il doit rester :

* data-driven
* honnête
* compact
* lisible

Ne pas réintroduire les anciens concepts rejetés :

* grand hero décoratif
* gradients
* glow
* side stripes

Les empty states doivent rester honnêtes.

Pas de :

```text
0 kg
0 PR
0 %
```

lorsqu'il n'existe simplement aucune donnée.

---

# 13. EXPÉRIENCE SÉANCE — PRIORITÉ N°1

C'est la partie la plus importante de la refonte.

L'utilisateur doit comprendre immédiatement :

> **Comment commencer mon entraînement ?**

## Architecture recommandée

### Continuer

Si une séance est en cours :

```text
Continuer
Séance Push
Exercice 4 / 7
```

CTA principal.

---

### Mes séances

Liste des séances existantes.

Chaque séance doit afficher uniquement les informations utiles :

```text
Nom
Muscles
Nombre d'exercices
Dernière utilisation
Volume éventuel
```

---

### Séance rapide

Action clairement séparée.

Elle doit être compréhensible comme :

> "Je veux m'entraîner maintenant sans préparer une séance."

---

### Créer une séance

Action de construction.

Elle ne doit pas concurrencer le CTA "Commencer".

---

# 14. Page Séances

La page doit répondre à :

> "Quelle séance dois-je faire ?"

Structure :

```text
Titre
Description éventuelle

[Continuer la séance]  ← si applicable

Mes séances
────────────

Workout Card
Workout Card
Workout Card

[Créer une séance]

Séance rapide
```

La priorité visuelle doit être claire.

---

# 15. Séance rapide

La séance rapide doit être extrêmement simple.

Objectif :

> démarrer un entraînement en quelques secondes.

Réduire au minimum :

* configuration
* décisions
* champs
* écrans intermédiaires

La page doit guider vers une seule action principale.

---

# 16. Builder de séance

Le builder est un outil complexe.

Il ne faut pas essayer de tout afficher simultanément.

Organisation :

```text
Informations générales
↓
Exercices
↓
Organisation des séries
↓
Supersets
↓
Options avancées
↓
Résumé
```

Les fonctionnalités avancées doivent être présentes mais secondaires.

Le builder doit rester compréhensible pour quelqu'un qui crée sa première séance.

---

# 17. Détail d'une séance

La page doit permettre de comprendre rapidement :

```text
Nom
Objectif
Muscles

Exercices
─────────

Exercice
Sets
Reps
RPE
Superset
```

Les informations secondaires :

* notes
* historique
* suggestions

doivent être visuellement secondaires.

---

# 18. Workout actif

Pendant une séance, l'application change de priorité.

Le design doit devenir :

> **Focus mode**

Réduire les distractions.

Hiérarchie :

```text
Exercice actuel

Série actuelle

Poids × répétitions

[Valider]

Repos

Exercice suivant
```

Les informations non essentielles peuvent être accessibles secondairement.

---

# 19. SetRow

Le `SetRow` est un composant critique.

Sur desktop :

```text
SET | KG | REPS | RPE | STATUS
```

Sur mobile, privilégier une composition compacte mais tactile.

Toutes les actions importantes doivent avoir une zone tactile ≥ 4.4rem.

La validation d'une série doit être extrêmement évidente.

---

# 20. Timer

Le timer doit devenir une interface calme et premium.

Pas de gros cercle permanent.

Pas de glow.

Pas d'effets agressifs.

Exemple de hiérarchie :

```text
REPOS

01:32

Repos entre les séries

[Passer]
```

Le temps est l'élément dominant.

Les autres contrôles restent secondaires.

## États

```text
Idle
Running
Almost finished
Finished
Paused
```

Chaque état doit être compréhensible sans animation.

---

# 21. Mobile workout

Le mobile devient la référence pour les interfaces actives :

* séance
* timer
* SetRow
* séance rapide

Le design doit être utilisable :

* debout
* rapidement
* avec une seule main
* avec peu d'attention disponible

Éviter les interactions qui demandent de viser de petits éléments.

---

# 22. Progression

La progression doit être construite autour de quatre familles :

```text
Volume
Séances
Records
Streak
```

Chaque famille possède son langage visuel.

Les graphiques doivent rester sobres.

Ne pas afficher un graphique simplement parce qu'il existe des données.

Chaque visualisation doit répondre à une question :

> Qu'est-ce que cette donnée m'apprend ?

---

# 23. Records

Les PR doivent être immédiatement identifiables.

Utiliser le violet comme langage principal.

Afficher :

* exercice
* record
* date
* évolution éventuelle

Éviter les décorations inutiles.

---

# 24. Historique

L'historique doit privilégier la comparaison.

L'utilisateur doit pouvoir comprendre rapidement :

```text
Avant
Aujourd'hui
Évolution
```

Les informations les plus importantes doivent être visibles sans ouvrir plusieurs menus.

---

# 25. Calendrier

Le calendrier doit être informatif mais extrêmement léger visuellement.

Les couleurs servent à identifier :

* séance
* type
* éventuellement muscle

Ne pas transformer le calendrier en tableau multicolore.

---

# 26. Exercices

La page exercices doit privilégier :

```text
Recherche
↓
Filtres
↓
Résultats
```

Les badges muscle / équipement utilisent le même système que partout ailleurs.

Les cards ne doivent pas introduire un nouveau langage visuel.

---

# 27. Settings

Les réglages doivent devenir une vraie page produit.

Sections :

```text
Profil
Objectifs
Unités
Timer
Rappels
Données
Synchronisation
À propos
```

Chaque section doit être clairement identifiable.

Les actions dangereuses doivent être séparées.

---

# 28. Empty states

Créer un système global.

Chaque empty state doit expliquer :

1. pourquoi il n'y a pas de donnée ;
2. ce que l'utilisateur peut faire ;
3. comment commencer.

Exemple :

```text
Aucun record

Les records apparaîtront après vos premiers entraînements.

[Commencer une séance]
```

Jamais de faux KPI.

---

# 29. Loading states

Les états de chargement doivent être cohérents.

Éviter les skeletons excessifs.

Utiliser un loading state uniquement lorsqu'il apporte une information utile.

---

# 30. Error states

Chaque fonctionnalité importante doit avoir un état d'erreur compréhensible.

L'utilisateur doit savoir :

```text
Ce qui s'est passé
+
Ce qu'il peut faire
```

---

# 31. Quick Search

Conserver :

```text
Ctrl / Cmd + K
/
```

La recherche doit devenir une véritable palette produit.

Catégories :

```text
Pages
Séances
Exercices
Actions
```

Les résultats doivent être rapides et lisibles.

Les raccourcis clavier doivent être visibles mais discrets.

---

# 32. Micro-interactions

Utiliser les animations uniquement pour :

* changement d'état
* validation
* navigation
* ouverture/fermeture
* feedback utilisateur

Durée :

```text
150–250ms
```

Respecter :

```text
prefers-reduced-motion
```

---

# 33. Accessibilité

Obligatoire :

* focus-visible
* contraste
* labels
* navigation clavier
* touch targets
* reduced motion
* états disabled
* feedback non uniquement basé sur la couleur

Les interactions importantes doivent être utilisables sans précision excessive.

---

# 34. Responsive

Tester systématiquement :

```text
320px
375px
430px
640px
768px
1024px
1280px+
```

Ne pas simplement réduire le desktop.

Pour chaque page :

### Mobile

Priorité aux actions et informations essentielles.

### Desktop

Priorité à la densité et à la comparaison.

---

# 35. Architecture technique

La refonte ne doit pas modifier :

```text
src/lib/*
localStorage muscu:*
routing
SSR Astro
schema de données
```

Ne pas réécrire les features existantes.

Conserver :

* Astro
* Tailwind v4
* Alpine
* primitives Astro
* système i18n

Le design system doit évoluer à partir des composants existants.

---

# 36. i18n

Aucune nouvelle chaîne directement dans le markup.

Toutes les chaînes doivent exister en :

```text
fr
en
```

Maintenir la parité des clés.

---

# 37. Validation

Après chaque modification significative :

```bash
npm test
npm run build
```

Puis vérifier :

```text
i18n
hardcoded colors
Barlow
focus-visible
touch targets
reduced motion
responsive
```

La refonte ne doit jamais introduire de régression fonctionnelle.

---

# 38. Phases

## PHASE 0 — Audit

Avant toute modification.

Analyser :

* composants
* tokens
* pages
* navigation
* workflows
* responsive
* incohérences

Identifier les problèmes UX avant de modifier le CSS.

---

## PHASE 1 — Foundation

Construire le langage visuel global :

* tokens
* typography
* surfaces
* buttons
* cards
* badges
* inputs
* icons
* focus
* motion

Créer `/ui` comme laboratoire de validation.

---

## PHASE 2 — Application Shell

Refondre :

* Sidebar
* Header
* navigation
* profil
* actions globales
* PageHeader
* QuickSearch

Objectif :

> Toutes les pages doivent avoir la même structure globale.

---

## PHASE 3 — Workout Experience

Priorité maximale.

Refondre :

1. `/seances`
2. `/seances/rapide`
3. `/seances/detail`
4. `/seances/creer`
5. workout actif
6. SetRow
7. timer

Objectif :

> L'utilisateur doit pouvoir passer de "je veux m'entraîner" à "je fais ma première série" sans confusion.

---

## PHASE 4 — Data & Progression

Refondre :

* progression
* records
* stats
* poids
* tendances
* historique

Objectif :

> Les données doivent raconter quelque chose sans surcharge visuelle.

---

## PHASE 5 — Secondary Tools

Refondre :

* exercices
* calendrier
* calculateur
* settings
* login
* print
* timer PiP

---

## PHASE 6 — UX Polish

Audit global :

* empty states
* error states
* loading
* responsive
* accessibilité
* navigation
* recherche
* micro-interactions

---

## PHASE 7 — Final Product Audit

Parcourir l'application comme un nouvel utilisateur.

Scénario :

```text
Arrivée
↓
Dashboard
↓
Je veux m'entraîner
↓
Choix d'une séance
↓
Démarrage
↓
Premier exercice
↓
Première série
↓
Repos
↓
Exercice suivant
↓
Fin
↓
Progression
```

À chaque étape demander :

> Est-ce évident ?

Si non :

> Corriger avant de considérer la refonte terminée.

---

# 39. Règles absolues

### Ne pas casser la logique métier.

### Ne pas ajouter de fausses données.

### Ne pas introduire de couleurs décoratives.

### Ne pas créer plusieurs composants pour résoudre le même problème.

### Ne pas réécrire une feature fonctionnelle uniquement pour la rendre plus jolie.

### Ne pas sacrifier la lisibilité au design.

### Ne pas sacrifier l'UX mobile pour le desktop.

### Ne pas utiliser l'animation pour compenser une mauvaise hiérarchie.

### Ne pas multiplier les cards.

### Ne pas multiplier les badges.

### Ne pas multiplier les couleurs.

---

# 40. Définition de "terminé"

La refonte est terminée lorsque :

* l'application possède un langage visuel unique ;
* la navigation est immédiatement compréhensible ;
* les pages ont une structure cohérente ;
* les CTA ont une hiérarchie claire ;
* commencer une séance est évident ;
* une séance active est utilisable sans friction ;
* le timer est discret et efficace ;
* les données sont honnêtes ;
* mobile et desktop sont cohérents ;
* les états vides sont utiles ;
* les composants sont réutilisables ;
* l'interface ne dépend plus d'effets visuels artificiels ;
* aucun écran ne donne l'impression d'appartenir à une autre application.

Le résultat recherché n'est pas :

> "une app avec un nouveau thème".

Le résultat recherché est :

> **"une app qui semble avoir été conçue comme un seul produit dès le départ."**
