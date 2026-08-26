# Page Audit — muscu-app-astro

> Scan page par page. Remplacer éléments natifs par composants UI existants. Nettoyer dead code.

---

## Composants UI disponibles (`src/components/ui/`)

| Composant | Remplace | Props clés |
|-----------|----------|------------|
| `Button.astro` | `<a class="btn btn--*">`, `<button class="btn">` | variant, size, href, pill, disabled, loading |
| `Badge.astro` | `<span class="badge">` | variant, size |
| `Input.astro` | `<input>` natif | type, placeholder, label, error |
| `Select.astro` | `<select>` natif | label, options, value |
| `Checkbox.astro` | `<input type="checkbox">` | label, checked |
| `Dialog.astro` | `<dialog>` ou modals custom | open, title |
| `Dropdown.astro` | `<select>` ou menus custom | trigger, items |
| `SearchInput.astro` | `<input type="search">` avec icône | placeholder, value |
| `IconButton.astro` | bouton icône circulaire | icon, variant, size |
| `Toggle.astro` | `<input type="checkbox">` toggle | checked, label |
| `Tabs.astro` | onglets nav | items, active |
| `Table.astro` | `<table>` natif | — |
| `Pagination.astro` | nav pagination custom | page, total |
| `Progress.astro` | barre `<div>` custom | value, max |
| `Tooltip.astro` | `title=""` attr | content |
| `Skeleton.astro` | placeholder loading | — |
| `Card.astro` | `<div>` conteneur | — |
| `FormField.astro` | label + input wrapper | label, error, hint |
| `EmptyState.astro` | état vide custom | icon, title, description |
| `BackLink.astro` | lien retour ← | href, label |
| `Segmented.astro` | radio group custom | items, value |
| `PanelHeader.astro` | header de section | title, description |

---

## Méthode d'audit par page

### Étape 1 — Scan template
Chercher dans le `<template>` (hors `<script>` et `<style>`):
- `<a class="btn*">` → `Button`
- `<button class="btn*">` ou `<button>` natif → `Button` ou `IconButton`
- `<select>` natif → `Select` ou `Dropdown`
- `<input>` natif → `Input` ou `SearchInput`
- `<textarea>` natif → `Input` (multiline) ou composant dédié
- `<table>` natif → `Table`
- `<dialog>` → `Dialog`
- `<input type="checkbox">` → `Checkbox` ou `Toggle`
- Badges inline `<span class="badge*">` → `Badge`
- Liens retour custom → `BackLink`
- Barres de progression custom → `Progress`
- États vides custom → `EmptyState`
- Pagination custom → `Pagination`

### Étape 2 — Analyse composant
Pour chaque élément natif trouvé:
1. Le composant UI existant couvre le cas d'usage ? → **Oui** : implémenter
2. Le composant est partiellement adapté ? → **Adapter** : ajuster le composant
3. Aucun composant ne convient ? → **Note** : documenter pour création future

### Étape 3 — Implémentation
1. Importer le composant
2. Remplacer l'élément natif
3. Vérifier props et slots
4. Supprimer le markup/ CSS mort

### Étape 4 — Vérification
1. `npx astro build` → 0 erreur
2. Vérifier rendu visuel (pas de regression)
3. Tester interactions (Alpine.js)

---

## Dead code checklist

Par page, vérifier:
- [ ] Getters/ méthodes Alpine jamais utilisés dans template
- [ ] CSS.redondant (sélecteurs couverts par d'autres règles)
- [ ] Comments obsolètes
- [ ] Imports inutilisés
- [ ] Variables CSS non utilisées
- [ ] `<span>` wrapper inutile autour d'icônes

---

## Pages FR restantes à scanner

| # | Page | Fichier | Status |
|---|------|---------|--------|
| 1 | Dashboard | `src/pages/index.astro` | ✅ Done |
| 2 | Login | `src/pages/login.astro` | ⏳ |
| 3 | Timer | `src/pages/timer/index.astro` | ⏳ |
| 4 | Timer Pop | `src/pages/timer/pop.astro` | ⏳ |
| 5 | Calculator | `src/pages/calculator.astro` | ⏳ |
| 6 | Calendar | `src/pages/calendar.astro` | ⏳ |
| 7 | Exercises | `src/pages/exercises/index.astro` | ⏳ |
| 8 | Exercises History | `src/pages/exercises/history.astro` | ⏳ |
| 9 | Exercises Trends | `src/pages/exercises/trends.astro` | ⏳ |
| 10 | Progression | `src/pages/progression/index.astro` | ⏳ |
| 11 | Progression Poids | `src/pages/progression/poids.astro` | ⏳ |
| 12 | Progression Records | `src/pages/progression/records.astro` | ⏳ |
| 13 | Progression Stats | `src/pages/progression/stats.astro` | ⏳ |
| 14 | Sessions | `src/pages/sessions/index.astro` | ⏳ |
| 15 | Sessions Create | `src/pages/sessions/create/index.astro` | ⏳ |
| 16 | Sessions Detail | `src/pages/sessions/detail.astro` | ⏳ |
| 17 | Sessions Quick | `src/pages/sessions/quick.astro` | ⏳ |
| 18 | Sessions Compare | `src/pages/sessions/compare.astro` | ⏳ |
| 19 | Sessions Print | `src/pages/sessions/print.astro` | ⏳ |
| 20 | Settings | `src/pages/settings/index.astro` | ⏳ |
| 21 | UI | `src/pages/ui.astro` | ⏳ |
| 22 | Debug | `src/pages/debug.astro` | ⏳ |

> Pages EN miroir: scanner APRÈS validation FR. Même composant, même structure.

---

## Règles

1. **Page par page** — scanner, analyser, implémenter, vérifier, page suivante
2. **Un composant à la fois** — ne pas tout casser d'un coup
3. **Build après chaque changement** — `npx astro build`
4. **Pas de régression visuelle** — le rendu doit rester identique
5. **Dead code → supprimer** — pas de "au cas où"
6. **Composant inadapté → adapter** — pas créer de nouveau tant que possible
