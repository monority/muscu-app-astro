# Refactor Plan — muscu-app-astro

## Stratégie : Centraliser → Observer → Abstraire → Migrer

> Un seul fichier à la fois. Aucun changement de comportement. Build vérifié après chaque étape.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Astro 7.1 |
| Client interactivity | Alpine.js 3.14.1 (CDN) |
| Styling | Tailwind CSS v4 + scoped `<style>` |
| i18n | `setLocale` + `t()` pattern (FR/EN) |
| State | LocalStorage (Supabase for auth/sync) |
| UI primitives | Card, Button, Badge, Dialog, Input, Select, etc. (`src/components/ui/`) |

---

## Phase 1 — CENTRALISER

> Rassembler tout le code dupliqué dans des fichiers partagés. Zéro création de composant. Zéro changement visible.

### 1.1 Icons → `src/lib/icons.ts` ★ priorité max

Même SVGs copiés-collés dans 8+ fichiers. Extraire TOUS les icônes partagés :

| Icon | Où dupliqué | Count |
|------|------------|-------|
| Dumbbell | index, progression, seances/index, exercices/index, detail, comparer, creer, ui | 8+ |
| List (lines) | progression/index, exercices/index, index, ui | 4+ |
| Trending-up | progression/index, exercices/index, index, ui | 4+ |
| Calendar | progression/index, index, ui | 3+ |
| Flame | index, detail, creer | 3+ |
| Search | seances/index, exercices/index | 2+ |
| Trash | seances/index, exercices/index | 2+ |
| Star | exercices/index, ui | 2+ |
| Chevron-left/right | calendrier, ui | 2+ |

**Action** : Créer `src/lib/icons.ts` avec TOUS les icônes en named exports. Les composants utilisent `<Fragment set:html={iconName} />` au lieu de SVG inline.

### 1.2 Alpine CDN → `AppLayout.astro`

20 pages répètent :
```astro
<script is:inline defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.1/dist/cdn.min.js"></script>
```

**Action** : Déplacer dans `AppLayout.astro`. 20 lignes supprimées.

### 1.3 `[x-cloak]` → `globals.css`

5+ pages répètent :
```css
[x-cloak] { display: none !important; }
```

**Action** : Déplacer dans `globals.css`. Une seule ligne, globale.

### 1.4 `setLocale` + `const L = t()` → `AppLayout.astro`

21 pages commencent par :
```ts
setLocale(Astro.currentLocale ?? defaultLocale);
const L = t();
```

**Action** : Déplacer dans le frontmatter de `AppLayout.astro`.

### 1.5 `DATE_LOCALE` → `src/i18n/index.ts`

8+ pages répètent :
```ts
const DATE_LOCALE = getLocale() === 'en' ? 'en-GB' : 'fr-FR';
```

**Action** : Exporter `DATE_LOCALE` depuis `src/i18n/index.ts`.

### 1.6 `statusLabel()` → `src/lib/session-utils.ts`

Dupliqué dans seances/index, calendrier, detail.

**Action** : Ajouter l'export dans `session-utils.ts` (fichier déjà existant).

### 1.7 `formatDate` / `formatNumber` → `src/lib/format.ts`

Chaque page ré-implante le formatage date/nombre avec de légères variations.

**Action** : Créer `src/lib/format.ts` avec les formatters partagés.

### 1.8 Mood SVGs → `src/lib/mood.ts`

seances/index et seances/detail définissent tous les deux MOOD_SVG_ATTRS + 5 mood SVGs.

**Action** : Extraire dans `src/lib/mood.ts`.

### 1.9 Grid responsive → `globals.css`

5+ pages répètent :
```css
.grid { grid-template-columns: 1fr; }
@media (min-width: 640px) { .grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .grid { grid-template-columns: repeat(3, 1fr); } }
```

**Action** : Créer des classes utilitaires dans `globals.css` : `grid-responsive-2`, `grid-responsive-3`.

### 1.10 Reduced motion → `globals.css`

8+ pages répètent `@media (prefers-reduced-motion: reduce) { ... }`.

**Action** : Créer des classes utilitaires partagées dans `globals.css`.

### Vérification Phase 1
- [ ] `pnpm run check` après chaque fichier
- [ ] `pnpm run build` à la fin de la phase
- [ ] Aucun changement visible, comportement identique

---

## Phase 2 — OBSERVER

> Vérifier que la centralisation n'a rien cassé. Audit complet avant de passer à l'abstraction.

### Checklist audit

| # | Vérification | Comment |
|---|-------------|---------|
| 1 | Build sans erreur | `pnpm run build` |
| 2 | Typecheck propre | `pnpm run check` |
| 3 | Toutes les pages accessibles | Navigation complète (FR + EN) |
| 4 | Icons rendus correctement | Vérifier chaque page contenant des SVGs |
| 5 | Alpine.js fonctionne | x-data, x-show, x-for, x-cloak sur toutes les pages interactives |
| 6 | Locale FR/EN bascule | Test navigation FR ↔ EN |
| 7 | Date formatting | Vérifier formatDate sur progression, calendrier, seances |
| 8 | Status labels | Vérifier badges status sur seances/index, detail, calendrier |
| 9 | Mood emojis | Vérifier rendu sur seances/index, detail |
| 10 | Grid responsive | Vérifier responsive sur mobile/tablet/desktop |
| 11 | Reduced motion | Tester avec prefers-reduced-motion: reduce |

### Règles
- **Un fichier à la fois** — éditer, tester build, commit, suivant
- **Aucun changement de comportement** — refactor pur, output identique
- **EN wrapper pages intouches** — elles ré-exportent simplement le composant FR
- **Chaînes i18n intouches** — on ne fait que déplacer où elles sont importées
- **Variables CSS intouches** — on ne fait que consolider les patterns répétés
- **Commit après chaque changement vérifié** — commits atomiques

---

## Phase 3 — ABSTRAIRE

> Créer les composants réutilisables à partir des patterns répétés identifiés. Chaque composant est créé, testé isolément, puis validé dans le build.

### Composants à créer (`src/components/ui/`)

| # | Composant | Remplace | Pages impactées |
|---|-----------|----------|-----------------|
| 1 | `SearchInput.astro` | Input recherche avec icône magnifier (markup identique) | seances/index, exercices/index |
| 2 | `IconButton.astro` | Petit bouton circulaire icône (size/variant/danger) | exercices, seances, settings (10+ variations) |
| 3 | `StatusBadge.astro` | Badge 3 états (completed/in-progress/planned) | seances/index, detail |
| 4 | `BackLink.astro` | Flèche-left + label link | detail, historique, comparer |
| 5 | `FormField.astro` | Label + input/select + error/hint wrapper | poids, calculateur, exercices forms |
| 6 | `SectionHeading.astro` | Icône + titre pour sections settings | settings/index |
| 7 | `StatItem.astro` | Stat individuelle : icône + valeur + label | progression/index, detail, records, stats |
| 8 | `StatGrid.astro` | Conteneur pour lignes de StatItem | progression/index, detail, stats |
| 9 | `DialogFooter.astro` | Paire Cancel + Confirm | seances/index, exercices/index |
| 10 | `PageContainer.astro` | Wrapper x-data + x-init + x-cloak | 10+ pages |
| 11 | `KbdHint.astro` | Indice raccourci clavier (touche + description) | timer/index |
| 12 | `EmptyFilterState.astro` | Carte "aucun résultat" avec bouton reset | exercices/index, seances/index |

### Vérification Phase 3
- [ ] Chaque composant a une interface Props typée
- [ ] Chaque composant est importé et utilisé dans au moins 1 page
- [ ] `pnpm run check` passe après chaque création
- [ ] `pnpm run build` passe à la fin de la phase

---

## Phase 4 — MIGRER

> Convertir les pages une par une pour utiliser les libs centralisées et les composants abstraits. C'est la phase la plus longue mais la plus sûre : chaque migration est isolée et testable.

### Ordre de migration (par impact décroissant)

| # | Fichier | Utilise | Notes |
|---|---------|---------|-------|
| 1 | `src/pages/index.astro` | icons.ts, format.ts, StatGrid, remove CDN, remove x-cloak | Dashboard = page principale, haut impact |
| 2 | `src/pages/seances/index.astro` | icons.ts, mood.ts, session-utils.ts, SearchInput, StatusBadge, IconButton, EmptyFilterState | Plus gros fichier, max refactor |
| 3 | `src/pages/exercices/index.astro` | icons.ts, SearchInput, IconButton, EmptyFilterState, FormField | |
| 4 | `src/pages/progression/index.astro` | icons.ts, format.ts, StatGrid, StatItem | |
| 5 | `src/pages/calendrier.astro` | icons.ts, format.ts, StatGrid | |
| 6 | `src/pages/seances/detail.astro` | icons.ts, mood.ts, StatusBadge, StatGrid, BackLink, IconButton | |
| 7 | `src/pages/calculateur.astro` | icons.ts, FormField | |
| 8 | `src/pages/seances/comparer.astro` | icons.ts, BackLink, FormField | |
| 9 | `src/pages/seances/creer/index.astro` | icons.ts, FormField | |
| 10 | `src/pages/seances/rapide.astro` | icons.ts, KbdHint, ProgressBar | |
| 11 | `src/pages/settings/index.astro` | icons.ts, SectionHeading, FormField | |
| 12 | `src/pages/progression/stats.astro` | format.ts, StatGrid | |
| 13 | `src/pages/progression/poids.astro` | format.ts, FormField | |
| 14 | `src/pages/progression/records.astro` | icons.ts, SearchInput, StatGrid | |
| 15 | `src/pages/exercices/tendance.astro` | icons.ts | |
| 16 | `src/pages/exercices/historique.astro` | icons.ts, BackLink, StatGrid | |

### Règles de migration
1. **Un fichier à la fois** — éditer, `pnpm run check`, `pnpm run build`, commit, suivant
2. **Aucun changement de comportement** — le rendu HTML doit rester identique
3. **EN wrapper pages intouches**
4. **Vérifier visuellement** après chaque migration (ouphan checking)

---

## Fichiers à créer

### Utilities (`src/lib/`)

| Fichier | Rôle |
|---------|------|
| `src/lib/icons.ts` | Toutes les icônes SVG partagées |
| `src/lib/format.ts` | formatDate, formatNumber, formatVolume, formatDuration, DATE_LOCALE |
| `src/lib/mood.ts` | MOOD_SVG_ATTRS + 5 mood SVGs + moodLabel/moodEmoji |

### Extensions

| Fichier | Ajout |
|---------|-------|
| `src/lib/session-utils.ts` | Ajouter export statusLabel |
| `src/styles/globals.css` | Ajouter [x-cloak], grid utils, reduced-motion utils |
| `src/layouts/AppLayout.astro` | Ajouter Alpine CDN, setLocale |

---

## Impact estimé

| Métrique | Avant | Après |
|----------|-------|-------|
| SVGs inline dans les pages | ~100+ | ~0 (dans icons.ts) |
| Balises Alpine CDN | 20 | 1 (layout) |
| Blocs `[x-cloak]` | 5+ | 1 (globals.css) |
| Appels `setLocale` | 21 | 0 (layout gère) |
| Implémentations `formatDate` | 5+ | 1 (format.ts) |
| Implémentations `statusLabel` | 3+ | 1 (session-utils.ts) |
| Variations icon button | 10+ inline | 1 composant IconButton |
| Markup search input | 2 identiques | 1 composant SearchInput |
| Markup status badge | 3-way conditionals | 1 composant StatusBadge |
| Markup back link | 3+ identiques | 1 composant BackLink |
| Markup form field | 5+ identiques | 1 composant FormField |
| Markup stats grid | 4+ identiques | 1 composant StatGrid |
| Markup dialog footer | 3+ identiques | 1 composant DialogFooter |
| Réduction taille moyenne page | — | ~40-60% moins de markup |

---

## Principes de structure (DX)

1. **`src/components/ui/`** — Primitives design system. Zéro logique métier. Réutilisables partout.
2. **`src/components/layout/`** — App shell uniquement. Sidebar, header, background.
3. **`src/components/workout/`** — Spécifique au domaine (exercise, set, workout cards). Utilise ui/ à l'intérieur.
4. **`src/lib/`** — Utilitaires TypeScript purs. Pas d'Astro, pas d'UI. Testables unitairement.
5. **`src/i18n/`** — Traductions. Un fichier par feature, un index.
6. **`src/pages/`** — Routes uniquement. Orchestrateurs fins qui composent components + lib.

**Règle** : Un nouveau dev doit trouver n'importe quel fichier en < 3 clics. Composants nommés par ce qu'ils SONT, pas par où ils sont utilisés.
