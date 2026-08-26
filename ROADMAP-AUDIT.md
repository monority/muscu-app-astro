# Roadmap — Page Component Audit

> Remplacer les éléments natifs (button/select/input/etc.) par les composants UI existants. Page par page.

---

## Phase 1 — PAGES PRINCIPALES

### 1.1 Dashboard (`src/pages/index.astro`) ✅
- [x] `<a class="btn">` → `<Button>`
- [x] Supprimer doublon "New Session"
- [x] Dead code: `hasCompletedSessions` supprimé
- [x] CSS redondant: `.dash__kpi--* .dash__kpi-value` supprimé
- [x] Comment obsolète: "two pill CTAs" → "pill CTAs"

### 1.2 Login (`src/pages/login.astro`)
- [ ] Scanner: `<button>`, `<input>`, `<select>`
- [ ] Remplacer par composants UI
- [ ] Nettoyer dead code

### 1.3 Settings (`src/pages/settings/index.astro`)
- [ ] Scanner: `<button>`, `<input>`, `<select>`, `<toggle>`
- [ ] Remplacer par composants UI
- [ ] Nettoyer dead code

---

## Phase 2 — PAGES TIMER

### 2.1 Timer (`src/pages/timer/index.astro`)
- [ ] Scanner: `<button>`, `<select>`, inputs
- [ ] Remplacer par composants UI
- [ ] Nettoyer dead code

### 2.2 Timer Pop (`src/pages/timer/pop.astro`)
- [ ] Scanner: `<button>`, `<select>`, inputs
- [ ] Remplacer par composants UI
- [ ] Nettoyer dead code

---

## Phase 3 — PAGES EXERCICES

### 3.1 Exercises (`src/pages/exercises/index.astro`)
- [ ] Scanner: `<input type="search">`, `<button>`, `<select>`
- [ ] Remplacer par SearchInput, IconButton, Select
- [ ] Nettoyer dead code

### 3.2 Exercises History (`src/pages/exercises/history.astro`)
- [ ] Scanner: `<button>`, `<select>`, `<table>`
- [ ] Remplacer par composants UI
- [ ] Nettoyer dead code

### 3.3 Exercises Trends (`src/pages/exercises/trends.astro`)
- [ ] Scanner: `<button>`, `<select>`
- [ ] Remplacer par composants UI
- [ ] Nettoyer dead code

---

## Phase 4 — PAGES PROGRESSION

### 4.1 Progression (`src/pages/progression/index.astro`)
- [ ] Scanner: `<button>`, `<select>`
- [ ] Remplacer par composants UI
- [ ] Nettoyer dead code

### 4.2 Progression Poids (`src/pages/progression/poids.astro`)
- [ ] Scanner: `<input>`, `<button>`, `<select>`
- [ ] Remplacer par Input, Button, Select
- [ ] Nettoyer dead code

### 4.3 Progression Records (`src/pages/progression/records.astro`)
- [ ] Scanner: `<input>`, `<button>`, `<select>`
- [ ] Remplacer par SearchInput, Button, Select
- [ ] Nettoyer dead code

### 4.4 Progression Stats (`src/pages/progression/stats.astro`)
- [ ] Scanner: `<button>`, `<select>`
- [ ] Remplacer par composants UI
- [ ] Nettoyer dead code

---

## Phase 5 — PAGES SESSIONS

### 5.1 Sessions (`src/pages/sessions/index.astro`)
- [ ] Scanner: `<input type="search">`, `<button>`, `<select>`, `<dialog>`
- [ ] Remplacer par SearchInput, IconButton, Select, Dialog
- [ ] Nettoyer dead code

### 5.2 Sessions Create (`src/pages/sessions/create/index.astro`)
- [ ] Scanner: `<button>`, `<input>`, `<select>`
- [ ] Remplacer par composants UI
- [ ] Nettoyer dead code

### 5.3 Sessions Detail (`src/pages/sessions/detail.astro`)
- [ ] Scanner: `<button>`, `<dialog>`, `<table>`
- [ ] Remplacer par Button, Dialog, Table
- [ ] Nettoyer dead code

### 5.4 Sessions Quick (`src/pages/sessions/quick.astro`)
- [ ] Scanner: `<button>`, `<input>`
- [ ] Remplacer par composants UI
- [ ] Nettoyer dead code

### 5.5 Sessions Compare (`src/pages/sessions/compare.astro`)
- [ ] Scanner: `<select>`, `<button>`, `<table>`
- [ ] Remplacer par Select, Button, Table
- [ ] Nettoyer dead code

### 5.6 Sessions Print (`src/pages/sessions/print.astro`)
- [ ] Scanner: éléments natifs
- [ ] Remplacer si applicable
- [ ] Nettoyer dead code

---

## Phase 6 — PAGES UTILITAIRES

### 6.1 Calculator (`src/pages/calculator.astro`)
- [ ] Scanner: `<input>`, `<button>`, `<select>`
- [ ] Remplacer par Input, Button, Select
- [ ] Nettoyer dead code

### 6.2 Calendar (`src/pages/calendar.astro`)
- [ ] Scanner: `<button>`, `<select>`
- [ ] Remplacer par composants UI
- [ ] Nettoyer dead code

### 6.3 UI (`src/pages/ui.astro`)
- [ ] Scanner: démo des composants — laisser tel quel ou harmoniser

### 6.4 Debug (`src/pages/debug.astro`)
- [ ] Scanner: éléments natifs
- [ ] Laisser tel quel (page dev)

---

## Phase 7 — PAGES EN (miroir)

> Scanner APRÈS validation FR. Même composant, même structure.

### 7.1 Toutes les pages EN
- [ ] Vérifier que les composants UI sont utilisés (même import que FR)
- [ ] Vérifier i18n (pas de textes FR dans les composants)
- [ ] Build OK

---

## Phase 8 — NETTOYAGE FINAL

### 8.1 CSS global
- [ ] Vérifier que `.btn` n'est plus utilisé (remplacé par `Button` component)
- [ ] Supprimer `.btn` du CSS si plus nécessaire
- [ ] Vérifier classes orphelines

### 8.2 Composants non utilisés
- [ ] Identifier composants créés mais jamais importés
- [ ] Supprimer ou documenter

### 8.3 Validation finale
- [ ] `npx astro build` → 0 erreur
- [ ] Navigation FR → EN → OK
- [ ] Toutes les pages render correctement
- [ ] Alpine.js fonctionne partout

---

## Règles

1. **Page par page** — une page à la fois, pas de scan global
2. **Build après chaque changement** — `npx astro build`
3. **Pas de régression** — rendu visuel identique
4. **Dead code → supprimer** — pas de "pour plus tard"
5. **Composant inadapté → adapter** — créer en dernier recours
6. **EN = miroir FR** — même structure, même composant
