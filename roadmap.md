# Roadmap — muscu-app-astro

> Implémenter dans l'ordre. Un fichier à la fois. Build vérifié après chaque étape.

---

## Phase 1 — CENTRALISER LES TYPES

> Extraire les types partagés dupliqués. Zéro changement visible.

### Étape 1.1 — Créer `src/lib/types.ts`

Créer le fichier avec les types NavLeaf, NavItem, NavGroup exportés.

### Étape 1.2 — Modifier `src/layouts/AppLayout.astro`

Remplacer les définitions locales (lignes 17-27) par un import depuis `src/lib/types.ts`.

### Étape 1.3 — Modifier `src/components/layout/AppShell.astro`

Remplacer les définitions locales (lignes 19-28) par un import depuis `src/lib/types.ts`.

### Vérification Phase 1
- [ ] `pnpm run check` passe
- [ ] `pnpm run build` passe
- [ ] Aucun changement visible

---

## Phase 2 — CRÉER UTILITIES.CSS + DÉDUPLIQUER REDUCED-MOTION

> Regrouper les classes partagées. Réduire `@media (prefers-reduced-motion)` à une seule déclaration.

### Étape 2.1 — Créer `src/styles/utilities.css`

Déplacer depuis `globals.css` :
- `.type-pill` + tous les variants (lignes 215-247)
- `.tone--*` (lignes 249-296)
- `.text-label`, `.text-body-secondary`, `.text-caption`, `.text-settings-label`, `.text-stat-value` (lignes 309-337)
- `.text-display` (lignes 340-342)
- `.dt-label` (lignes 344-352)
- `.set-row-grid` (lignes 355-367)
- `.card-surface` (lignes 377-381)
- `.grid-responsive-2`, `.grid-responsive-3` (lignes 172-189)
- `.anim-fade-in` (lignes 162-169)
- `.section-gap` (lignes 370-374)
- `.border-b-separator` (lignes 304-306)

### Étape 2.2 — Modifier `src/styles/globals.css`

Supprimer les classes déplacées. Ajouter `@import './utilities.css';` après les imports existants.

### Étape 2.3 — Modifier `src/styles/button.css`

Supprimer le bloc `@media (prefers-reduced-motion)` (lignes 167-169). Le reset global le couvre.

### Étape 2.4 — Modifier `src/components/layout/AppShell.astro`

Supprimer le bloc `@media (prefers-reduced-motion)` (lignes 749-762).

### Étape 2.5 — Modifier `src/components/layout/Header.astro`

Supprimer le bloc `@media (prefers-reduced-motion)` (lignes 479-483).

### Étape 2.6 — Modifier `src/components/layout/Sidebar.astro`

Supprimer le bloc `@media (prefers-reduced-motion)` (lignes 624-636).

### Étape 2.7 — Modifier `src/components/ui/Card.astro`

Supprimer le bloc `@media (prefers-reduced-motion)` (lignes 55-59).

### Étape 2.8 — Modifier `src/components/ui/Dialog.astro`

Supprimer le bloc `@media (prefers-reduced-motion)` (lignes 136-141).

### Vérification Phase 2
- [ ] `pnpm run check` passe
- [ ] `pnpm run build` passe
- [ ] `prefers-reduced-motion: reduce` toujours fonctionnel

---

## Phase 3 — SÉPARER LE RESET

> Extraire le reset CSS de globals.css dans reset.css dédié.

### Étape 3.1 — Créer `src/styles/reset.css`

Extraire le bloc `@layer base` de `globals.css` (lignes 10-209) :
- Box-sizing reset
- html/body base
- Typography (h1-h6, p, a, button)
- ul/ol, img/svg
- :focus-visible
- ::selection
- Scrollbar
- [x-cloak]
- Reduced motion (version globale, UNIQUEMENT celle de `globals.css` lignes 197-207)

### Étape 3.2 — Modifier `src/styles/globals.css`

Remplacer le bloc `@layer base` par :
```css
@import './reset.css';
```
Garder uniquement les imports :
```css
@import './tokens.css';
@import './reset.css';
@import './button.css';
@import './utilities.css';
```

### Vérification Phase 3
- [ ] `pnpm run check` passe
- [ ] `pnpm run build` passe
- [ ] Reset toujours appliqué
- [ ] Aucun changement visuel

---

## Phase 4 — NETTOYER TABLE.ASTRO

> Supprimer le `<style is:global>` polluant.

### Étape 4.1 — Analyser `src/components/ui/Table.astro`

Identifier les styles globaux et les convertir en scoped styles.

### Étape 4.2 — Modifier `src/components/ui/Table.astro`

Remplacer `<style is:global>` par `<style>` standard. Ajouter une classe racine `.ui-table` au markup et convertir les sélecteurs `[data-ui-table] th` en `.ui-table th`.

### Vérification Phase 4
- [ ] `pnpm run check` passe
- [ ] `pnpm run build` passe
- [ ] Tableaux toujours stylés correctement

---

## Phase 5 — NETTOYER HEADER.ASTRO

> Supprimer les overrides en bas de fichier.

### Étape 5.1 — Analyser `src/components/layout/Header.astro`

Le fichier a des styles en double : bloc principal + overrides en bas (lignes 485-491).

### Étape 5.2 — Modifier `src/components/layout/Header.astro`

Fusionner les overrides dans le bloc de styles principal. Supprimer les doublons.

### Vérification Phase 5
- [ ] `pnpm run check` passe
- [ ] `pnpm run build` passe
- [ ] Header visuellement identique

---

## Phase 6 — NETTOYER SIDEBAR.ASTRO

> Supprimer les overrides en bas de fichier.

### Étape 6.1 — Analyser `src/components/layout/Sidebar.astro`

Le fichier a des styles en double : bloc principal + overrides en bas (lignes 637-661).

### Étape 6.2 — Modifier `src/components/layout/Sidebar.astro`

Fusionner les overrides dans le bloc de styles principal. Supprimer les doublons.

### Vérification Phase 6
- [ ] `pnpm run check` passe
- [ ] `pnpm run build` passe
- [ ] Sidebar visuellement identique

---

## Phase 7 — CONVERTIR LES COMPOSANTS TAILWIND SIMPLES

> Convertir les composants pure Tailwind en scoped CSS. Priorité aux plus simples.

### Étape 7.1 — `src/components/ui/Icon.astro`

Ajouter un `<style>` scoped pour remplacer les classes Tailwind.

### Étape 7.2 — `src/components/ui/Avatar.astro`

Ajouter un `<style>` scoped pour remplacer `h-8 w-8 rounded-full` etc.

### Étape 7.3 — `src/components/ui/EmptyState.astro`

Ajouter un `<style>` scoped.

### Étape 7.4 — `src/components/ui/FormField.astro`

Ajouter un `<style>` scoped.

### Étape 7.5 — `src/components/ui/KbdHint.astro`

Ajouter un `<style>` scoped.

### Étape 7.6 — `src/components/ui/PageContainer.astro`

Ajouter un `<style>` scoped.

### Étape 7.7 — `src/components/ui/PanelHeader.astro`

Ajouter un `<style>` scoped.

### Étape 7.8 — `src/components/ui/Progress.astro`

Ajouter un `<style>` scoped.

### Étape 7.9 — `src/components/ui/StatGrid.astro`

Ajouter un `<style>` scoped.

### Étape 7.10 — `src/components/ui/Tooltip.astro`

Ajouter un `<style>` scoped.

### Vérification Phase 7
- [ ] `pnpm run check` après chaque fichier
- [ ] `pnpm run build` à la fin
- [ ] Chaque composant visuellement identique

---

## Phase 8 — CONVERTIR LES COMPOSANTS TAILWIND MOYENS

> Composants avec plus de markup Tailwind.

### Étape 8.1 — `src/components/ui/Input.astro`

15+ classes Tailwind → scoped CSS avec tokens.

### Étape 8.2 — `src/components/ui/Card.astro`

Déjà hybride. Nettoyer le mix Tailwind/scoped.

### Étape 8.3 — `src/components/ui/Badge.astro`

Classes Tailwind + scoped. Unifier.

### Étape 8.4 — `src/components/ui/Select.astro`

Ajouter un `<style>` scoped.

### Étape 8.5 — `src/components/ui/Checkbox.astro`

Ajouter un `<style>` scoped.

### Étape 8.6 — `src/components/ui/EmptyFilterState.astro`

Ajouter un `<style>` scoped.

### Étape 8.7 — `src/components/ui/Pagination.astro`

Ajouter un `<style>` scoped.

### Vérification Phase 8
- [ ] `pnpm run check` après chaque fichier
- [ ] `pnpm run build` à la fin
- [ ] Chaque composant visuellement identique

---

## Phase 9 — CONVERTIR LES COMPOSANTS TAILWIND COMPLEXES

> Dialog, Toast, Toggle, Tabs — markup dense.

### Étape 9.1 — `src/components/ui/Dialog.astro`

Déjà hybride. Nettoyer le mix.

### Étape 9.2 — `src/components/ui/Toast.astro`

Déjà hybride. Nettoyer.

### Étape 9.3 — `src/components/ui/Toggle.astro`

Déjà hybride. Nettoyer.

### Étape 9.4 — `src/components/ui/Tabs.astro`

Ajouter un `<style>` scoped.

### Étape 9.5 — `src/components/ui/TabList.astro`

Ajouter un `<style>` scoped.

### Étape 9.6 — `src/components/ui/TabPanel.astro`

Ajouter un `<style>` scoped.

### Étape 9.7 — `src/components/ui/Segmented.astro`

Déjà hybride. Nettoyer.

### Étape 9.8 — `src/components/ui/SearchInput.astro`

Déjà hybride. Nettoyer.

### Étape 9.9 — `src/components/ui/IconButton.astro`

Déjà hybride. Nettoyer.

### Étape 9.10 — `src/components/ui/Dropdown.astro`

Ajouter un `<style>` scoped.

### Vérification Phase 9
- [ ] `pnpm run check` après chaque fichier
- [ ] `pnpm run build` à la fin
- [ ] Chaque composant visuellement identique

---

## Phase 10 — CONVERTIR LES COMPOSANTS WORKOUT

> workout/ utilise Tailwind + scoped. Unifier.

### Étape 10.1 — `src/components/workout/WorkoutCard.astro`

Convertir le mix Tailwind en scoped CSS.

### Étape 10.2 — `src/components/workout/ExerciseCard.astro`

Convertir.

### Étape 10.3 — `src/components/workout/SetRow.astro`

Convertir.

### Étape 10.4 — `src/components/workout/RestTimer.astro`

Convertir.

### Étape 10.5 — `src/components/workout/StatsCard.astro`

Convertir.

### Vérification Phase 10
- [ ] `pnpm run check` après chaque fichier
- [ ] `pnpm run build` à la fin
- [ ] Composants workout visuellement identiques

---

## Phase 11 — CONVERTIR LES COMPOSANTS LAYOUT

> Les plus gros fichiers. Faire en dernier.

### Étape 11.1 — `src/components/params/ReminderSettings.astro`

Convertir.

### Étape 11.2 — `src/components/layout/SettingsBottomBar.astro`

Convertir.

### Vérification Phase 11
- [ ] `pnpm run check` après chaque fichier
- [ ] `pnpm run build` à la fin

---

## Phase 12 — NETTOYER TOKENS.CSS

> Quand tous les composants sont convertis, retirer Tailwind.

### Étape 12.1 — Modifier `src/styles/tokens.css`

Supprimer `@import "tailwindcss"` et le bloc `@theme`. Convertir en `:root` CSS variables classiques.

### Étape 12.2 — Modifier `astro.config.mjs`

Supprimer le plugin `@tailwindcss/vite`.

### Étape 12.3 — Modifier `package.json`

Supprimer les dépendances `tailwindcss` et `@tailwindcss/vite`.

### Étape 12.4 — Exécuter `pnpm install`

Nettoyer le lockfile.

### Vérification Phase 12
- [ ] `pnpm run check` passe
- [ ] `pnpm run build` passe
- [ ] Aucun composant n'utilise plus de classes Tailwind
- [ ] Tous les styles proviennent de scoped CSS + tokens

---

## Phase 13 — VALIDATION FINALE

> Vérification complète de l'application.

### Checklist

| # | Vérification | Comment |
|---|-------------|---------|
| 1 | Build sans erreur | `pnpm run build` |
| 2 | Typecheck propre | `pnpm run check` |
| 3 | Toutes les routes accessibles | Navigation FR + EN |
| 4 | Icons rendus correctement | Vérifier chaque page |
| 5 | Alpine.js fonctionne | x-data, x-show, x-for, x-cloak |
| 6 | Locale FR/EN bascule | Navigation FR ↔ EN |
| 7 | Date formatting | progression, calendrier, sessions |
| 8 | Status badges | sessions/index, detail, calendrier |
| 9 | Grid responsive | Mobile, tablet, desktop |
| 10 | Reduced motion | prefers-reduced-motion: reduce |
| 11 | Dark/Light theme | Toggle fonctionne partout |
| 12 | Dialog/Toast | Modals et notifications |
| 13 | Tableaux | Toutes les pages avec Table.astro |

---

## Règles pendant l'implémentation

1. **Un fichier à la fois** — éditer, `pnpm run check`, `pnpm run build`, commit
2. **Aucun changement de comportement** — output HTML identique
3. **Pas de nouvelles dépendances** — CSS natif uniquement
4. **BEM pour tout** — `.block__element--modifier`
5. **Tokens pour tout** — jamais de valeurs hardcodées
6. **EN wrapper pages intouches** — elles ré-exportent simplement le composant FR
7. **Variables CSS intouches** — on ne fait que consolider les patterns
8. **Commit après chaque étape vérifiée** — commits atomiques
9. **Arrêter si build casse** — corriger avant de continuer
10. **Tester visuellement** après chaque phase majeure
