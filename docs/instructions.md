# Mission

Tu es un développeur frontend senior spécialisé en **Astro, TypeScript, CSS moderne et design systems**.

Je construis une application web de musculation permettant notamment de :

* tracker ses séances ;
* gérer ses exercices ;
* enregistrer ses séries, répétitions et charges ;
* consulter son historique ;
* suivre sa progression ;
* afficher des statistiques ;
* créer/gérer des entraînements.

Je veux commencer par construire une **base frontend extrêmement solide et réutilisable**, avant de développer les fonctionnalités métier.

## Référence visuelle

Le style général doit s'inspirer de cette interface :

https://www.palworld.tools/best-pals

Attention : **ne copie pas le contenu, les textes, les assets ou l'identité visuelle du site**.

Je veux uniquement reprendre certains principes de design :

* interface moderne et sombre ;
* cartes riches en informations ;
* grille responsive ;
* bordures et séparateurs subtils ;
* hiérarchie visuelle forte ;
* badges ;
* filtres ;
* recherche ;
* éléments interactifs avec des hover states propres ;
* design dense mais lisible ;
* excellent responsive design ;
* sensation d'application moderne plutôt que de site vitrine.

L'application finale est une **application de musculation**, pas une application liée à Palworld.

---

# Stack

Utilise :

* Astro
* TypeScript
* Tailwind CSS
* CSS Variables
* HTML sémantique
* Lucide Icons ou une autre librairie d'icônes cohérente

Évite d'ajouter des dépendances inutiles.

Si le projet possède déjà une configuration Astro/Tailwind, **analyse-la avant de modifier quoi que ce soit**.

Ne remplace pas inutilement l'architecture existante.

---

# Objectif principal

Construire un petit **design system frontend réutilisable**.

Je veux pouvoir construire ensuite toutes les pages de l'application uniquement en assemblant des composants génériques.

Le code doit être :

* propre ;
* maintenable ;
* accessible ;
* responsive ;
* fortement typé ;
* cohérent ;
* facilement extensible ;
* sans duplication inutile.

---

# Architecture souhaitée

Organise les composants de manière similaire à :

src/
├── components/
│   ├── ui/
│   │   ├── Button.astro
│   │   ├── Card.astro
│   │   ├── Badge.astro
│   │   ├── Input.astro
│   │   ├── Select.astro
│   │   ├── Checkbox.astro
│   │   ├── Toggle.astro
│   │   ├── Tabs.astro
│   │   ├── Dialog.astro
│   │   ├── Dropdown.astro
│   │   ├── Table.astro
│   │   ├── Pagination.astro
│   │   ├── Tooltip.astro
│   │   ├── Skeleton.astro
│   │   ├── Avatar.astro
│   │   ├── Progress.astro
│   │   └── EmptyState.astro
│   │
│   ├── layout/
│   │   ├── AppShell.astro
│   │   ├── Header.astro
│   │   ├── Sidebar.astro
│   │   ├── MobileNav.astro
│   │   └── PageHeader.astro
│   │
│   └── workout/
│       ├── WorkoutCard.astro
│       ├── ExerciseCard.astro
│       ├── SetRow.astro
│       └── StatsCard.astro
│
├── layouts/
│   └── AppLayout.astro
│
└── styles/
├── globals.css
└── tokens.css

Adapte cette structure si celle du projet existant est meilleure.

---

# Design tokens

Crée un véritable système de design avec des CSS variables.

Centralise au minimum :

## Couleurs

* background principal
* background secondaire
* surface
* surface élevée
* border
* texte principal
* texte secondaire
* texte muted
* primary
* primary hover
* success
* warning
* danger
* info

Prévois des variables permettant de changer facilement le thème plus tard.

## Espacements

Utilise une échelle cohérente.

## Border radius

Définis quelques niveaux :

* small
* medium
* large
* full

## Shadows

Définis quelques niveaux d'ombres, mais utilise-les avec parcimonie.

## Typography

Définis une hiérarchie claire :

* display
* h1
* h2
* h3
* body
* small
* caption
* label

---

# Direction artistique

Je veux une esthétique :

**dark / athletic / premium / data-driven / modern**

Évite :

* les gradients excessifs ;
* les effets glassmorphism partout ;
* les animations inutiles ;
* les ombres trop fortes ;
* les couleurs flashy partout ;
* les énormes border-radius ;
* le style "dashboard SaaS générique".

Le résultat doit donner l'impression d'une **application sportive sérieuse et premium**.

Le contenu doit rester très lisible.

---

# Composants UI

Tous les composants génériques doivent être conçus pour être réutilisables.

Par exemple :

Button :

* variant
* size
* disabled
* loading
* icon
* fullWidth

Card :

* variant
* padding
* hover
* clickable

Badge :

* variant
* size

Input :

* label
* hint
* error
* disabled
* required

Select :

* label
* error
* disabled

Tabs :

* active
* disabled
* responsive

Progress :

* value
* max
* variant
* size

Etc.

Ne crée pas de composants avec des props spécifiques à la musculation dans `components/ui`.

Un composant générique doit rester générique.

---

# Accessibilité

Respecte les bonnes pratiques WCAG.

Notamment :

* HTML sémantique ;
* labels associés aux inputs ;
* focus states visibles ;
* navigation clavier ;
* `aria-*` lorsque nécessaire ;
* contrastes suffisants ;
* boutons réellement utilisables au clavier ;
* états disabled compréhensibles ;
* ne pas utiliser uniquement la couleur pour transmettre une information.

---

# Responsive

Mobile-first.

Le design doit fonctionner correctement sur :

* mobile ;
* tablette ;
* desktop ;
* grands écrans.

Ne te contente pas de réduire le desktop sur mobile.

Réfléchis réellement à l'ergonomie mobile.

Pour l'application de musculation, considère notamment que l'utilisateur peut être **dans une salle de sport avec un téléphone**, donc :

* zones tactiles suffisamment grandes ;
* informations importantes immédiatement visibles ;
* actions principales facilement accessibles ;
* formulaires utilisables rapidement ;
* éviter les tableaux impossibles à utiliser sur mobile.

---

# États UI

Chaque composant important doit réfléchir à ses états :

* default
* hover
* focus
* active
* disabled
* loading
* error
* empty

Les composants de données doivent également pouvoir gérer :

* loading
* empty state
* error state

---

# Page de démonstration

Crée une page `/ui` ou `/components` permettant de visualiser le design system.

Cette page doit présenter :

## Typography

Tous les niveaux de texte.

## Colors

Les différents tokens.

## Buttons

Toutes les variantes et tailles.

## Cards

Différentes variantes.

## Forms

Inputs, selects, checkbox, toggle.

## Feedback

Badges, alerts, progress, skeleton.

## Navigation

Tabs, pagination, breadcrumbs si pertinent.

## Data

Table, liste, statistiques.

## Workout examples

Crée quelques exemples de composants métier :

* carte d'entraînement ;
* carte d'exercice ;
* ligne de série ;
* statistique de progression.

Ces exemples doivent utiliser les composants génériques.

---

# Exemple d'interface à viser

Imagine une page :

"Mes entraînements"

avec :

* un header de page ;
* une description courte ;
* un bouton "Nouvel entraînement" ;
* une barre de recherche ;
* des filtres ;
* une grille responsive ;
* des cartes d'entraînements ;
* des badges ;
* quelques statistiques ;
* un état vide correctement conçu.

Le résultat doit visuellement rappeler la densité et la structure de Palworld.tools, tout en ayant une identité propre à une application de musculation.

---

# CSS

Évite les hacks CSS.

Évite notamment :

* `!important` sauf nécessité absolue ;
* styles inline ;
* valeurs arbitraires répétées ;
* duplication de styles ;
* sélecteurs CSS trop complexes ;
* CSS spécifique à une page lorsqu'un composant peut résoudre le problème.

Utilise Tailwind pour la majorité des styles d'interface.

Utilise le CSS classique uniquement lorsqu'il apporte une vraie valeur :

* tokens ;
* styles globaux ;
* animations complexes ;
* éléments difficiles à exprimer proprement avec Tailwind.

---

# Architecture des composants

Les composants doivent privilégier la composition.

Par exemple :

Card
→ CardHeader
→ CardTitle
→ CardContent
→ CardFooter

plutôt qu'un composant gigantesque avec 40 props.

Mais ne crée pas non plus une abstraction pour chaque élément HTML.

Cherche un équilibre pragmatique.

---

# TypeScript

Les props des composants doivent être typées.

Évite :

* `any`
* casts inutiles
* types dupliqués

Privilégie des types simples et réutilisables.

---

# Icônes

Utilise une seule librairie d'icônes.

Les icônes doivent être cohérentes visuellement.

Ne mélange pas plusieurs familles d'icônes.

---

# Performance

Astro doit rester principalement statique lorsque c'est possible.

N'utilise pas de JavaScript côté client sans raison.

Pour les composants interactifs, utilise l'approche Astro adaptée.

Évite de transformer toute l'interface en SPA inutilement.

---

# Règles importantes

Avant de coder :

1. Analyse la structure actuelle du projet.
2. Analyse les dépendances déjà présentes.
3. Analyse la configuration Astro/Tailwind existante.
4. Réutilise ce qui peut l'être.
5. Ne casse pas les fonctionnalités existantes.

Ensuite seulement, implémente le design system.

---

# Qualité attendue

Je ne veux pas un simple prototype visuel.

Je veux une **base de production**.

Chaque décision doit répondre à cette question :

> "Est-ce que ce choix permettra de construire facilement les 20 prochaines pages de cette application ?"

Si une solution fonctionne uniquement pour la page de démonstration, elle n'est probablement pas suffisamment générique.

À la fin :

1. Résume les fichiers créés/modifiés.
2. Explique brièvement l'architecture.
3. Explique comment créer un nouveau composant UI.
4. Explique comment créer une nouvelle page en réutilisant le design system.
5. Signale les éventuels choix qui pourraient être améliorés plus tard.

Ne génère pas de fonctionnalités métier complexes pour l'instant.

La priorité absolue est :

**Design System → composants génériques → layout → responsive → page de démonstration → seulement ensuite fonctionnalités métier.**
