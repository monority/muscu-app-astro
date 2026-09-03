# Calculator Page Rework

## 1. Current State

### Architecture

```
calculator.astro (995 lines)
├── Frontmatter (1-14)
│   └── Imports: i18n, AppLayout, PageHeader, Card*, Input, Select, icons
├── Template (16-283)
│   ├── PageHeader
│   ├── Custom tab bar (barbell / dumbbell)
│   ├── Input card (target weight, bar weight, shortcuts)
│   └── Result card
│       ├── Error display
│       ├── Bar mode: stats grid + barbell diagram + plate breakdown
│       └── Dumbbell mode: summary + stats + visual dumbbells + breakdown
├── Script (285-578)
│   ├── i18n import (duplicated from frontmatter)
│   ├── formatTemplate() helper
│   ├── PLATE_INVENTORY / DUMBBELL_PLATE_INVENTORY constants
│   ├── PlateCount / DumbbellResult interfaces
│   ├── computePlatesPerSide() — pure function
│   ├── groupPlates() — pure function
│   ├── computeDumbbells() — pure function
│   └── Alpine.data('plateCalculator') — component state + computed + helpers
└── Style (581-995)
    └── ~415 lines of scoped CSS
```

### Key Observations

- The FR page is the canonical source; EN (`en/calculator.astro`) simply imports and renders it — no actual localization.
- Alpine.js handles all client-side interactivity via `x-data="plateCalculator()"`.
- The `<script>` block re-imports `t()` from i18n (line 286) to use labels inside Alpine — this is a second import of the same module.
- The custom tab bar (`.calc__tabs`) duplicates functionality that the existing `Segmented` component provides.
- The barbell diagram and dumbbell diagram share similar structure (visual representation + breakdown list) but are implemented independently.
- No tests exist for the calculation logic.

---

## 2. Problems Found

### P0 — Critical

**Problem:** Business logic (plate calculation, dumbbell calculation) is embedded inside an Alpine.js `<script>` block and cannot be unit tested.

**Why:** `computePlatesPerSide`, `computeDumbbells`, and `groupPlates` are pure functions defined inside a `<script>` tag that also registers an Alpine component. They depend on a module-level `LABELS` variable for error messages but are otherwise pure. Vitest cannot import them.

**Impact:** Zero test coverage on core calculation logic. Regressions in plate/dumbbell math would go undetected.

**Recommended solution:** Extract `computePlatesPerSide`, `computeDumbbells`, `groupPlates`, `formatTemplate`, constants (`PLATE_INVENTORY`, `DUMBBELL_PLATE_INVENTORY`), and interfaces (`PlateCount`, `DumbbellResult`) into `src/lib/calculator.ts`. Error message labels can be passed as parameters.

**Priority:** P0

---

### P1 — Important

**Problem:** Custom tab implementation duplicates the existing `Segmented` component.

**Why:** The calculator hand-rolls a tab bar (`.calc__tabs` / `.calc__tab` / `.calc__tab--active`) with Alpine directives. The project already has `Segmented.astro` — a design-system primitive used on `/progression/stats` and the UI showcase page — that does exactly this with `role="group"` + `aria-pressed`.

**Impact:** Two competing tab/segmented patterns. Visual drift risk. CSS duplication.

**Recommended solution:** Replace the custom tab bar with `<Segmented>`. The icons (barbell/dumbbell) would need to be added as slot content or the Segmented component extended to support leading icons. Alternatively, keep the current tab bar if the icon requirement is considered a legitimate divergence — but document the decision.

**Priority:** P1

---

**Problem:** Duplicate i18n import — `t()` is called in both the frontmatter (line 13) and the client script (line 286-288).

**Why:** The frontmatter `L` is used for template literals. The script `LABELS` is used inside Alpine expressions and computation functions. Both import from the same module.

**Impact:** Two separate dictionary objects are created. The script-side one uses `getLocale()` which reads from `window.__LOCALE__`, while the frontmatter one uses the server-set `currentLocale`. This works correctly but is confusing and wasteful.

**Recommended solution:** After extracting calculation logic to `src/lib/calculator.ts`, error message strings can be passed as parameters to the calculation functions, eliminating the need for the script-side `LABELS` entirely. The Alpine component would only need labels for display, which can be passed via `x-init` data or kept as a single `LABELS` reference.

**Priority:** P1

---

### P2 — Improvement

**Problem:** ~415 lines of scoped CSS, much of which could be shared or simplified.

**Why:** The CSS contains:
- Tab styles (`.calc__tabs`, `.calc__tab`, `.calc__tab--active`) that overlap with `Segmented`
- Result grid styles (`.calc__result-grid`, `.calc__stat`) that are generic enough to be shared
- Breakdown list styles (`.calc__breakdown-*`) specific to the calculator
- Plate color definitions (`.calc__plate--25`, `.calc__plate--20`, etc.) that are calculator-specific

**Impact:** Large CSS bundle for a single page. Some patterns (stat grid, breakdown list) could benefit other pages.

**Recommended solution:** Keep calculator-specific CSS scoped. Extract the stat grid pattern if reused elsewhere. Replace tab CSS with `Segmented` import.

**Priority:** P2

---

**Problem:** No tests for calculation logic.

**Why:** `computePlatesPerSide`, `computeDumbbells`, `groupPlates` are untestable in their current location.

**Impact:** High risk of regressions when modifying calculation logic.

**Recommended solution:** After extraction to `src/lib/calculator.ts`, add `src/lib/__tests__/calculator.test.ts` covering:
- Edge cases (0, negative, equal to bar, below bar)
- Greedy algorithm correctness
- Dumbbell calculation
- Grouping logic

**Priority:** P2

---

**Problem:** Hardcoded visual constants scattered in the Alpine component.

**Why:** `plateHeight()` (line 533-547), `dumbbellHeight()` (line 561-566), `dumbbellWidth()` (line 571-576) contain magic numbers for visual scaling.

**Impact:** Difficult to adjust visual appearance without understanding the Alpine component internals.

**Recommended solution:** Move these to a constants object or CSS custom properties. The plate height map could be a `Record<number, number>` constant.

**Priority:** P2

---

### P3 — Nice-to-have

**Problem:** `init()` method (line 421-423) is empty.

**Why:** Contains only a comment `// Sensible defaults; user can override via the inputs.`

**Impact:** Negligible. Slightly noisy code.

**Recommended solution:** Remove the empty `init()` method.

**Priority:** P3

---

**Problem:** The `formatKg` helper is defined both as a method on the Alpine component (line 524-527) and could be a standalone utility.

**Why:** It's a pure formatting function: `Math.round(value * 100) / 100 + ' kg'`.

**Impact:** If reused elsewhere, it would need duplication.

**Recommended solution:** Extract to `src/lib/format.ts` (which already exists) or `src/lib/calculator.ts`.

**Priority:** P3

---

## 3. Dead Code

| Item | Location | Status |
|------|----------|--------|
| `init()` method | Line 421-423 | Empty, can be removed |
| Comment blocks (`{/* ═══ Result card ═══ */}` etc.) | Lines 107, 141, 176, 206, 229, 254 | Decorative, optional cleanup |
| Second `t()` import in `<script>` | Line 286 | Becomes unnecessary after logic extraction |

---

## 4. Componentization

### A. Keep in page

| Element | Reason |
|---------|--------|
| PageHeader usage | Single use, thin wrapper |
| Card/CardHeader/CardTitle/CardContent usage | Already components, correctly composed |
| Input/Select usage | Already components, correctly composed |
| Quick shortcuts bar | Small, page-specific, no own logic |

### B. Extract to component

**Current:** Barbell diagram (lines 142-174) + barbell result grid (lines 118-139) + barbell breakdown (lines 177-195)

**Target:** `src/components/calculator/BarbellResult.astro`

**Responsibility:** Display barbell calculation results — stats grid, visual barbell diagram, and plate breakdown list.

**Why:** ~80 lines of template + associated CSS. Visually independent. Would simplify the main page significantly.

**Reusable:** No (calculator-specific).

**Priority:** P2

---

**Current:** Dumbbell diagram (lines 230-252) + dumbbell result grid (lines 210-227) + dumbbell breakdown (lines 255-270)

**Target:** `src/components/calculator/DumbbellResult.astro`

**Responsibility:** Display dumbbell calculation results — summary, stats grid, visual dumbbells, and breakdown list.

**Why:** ~60 lines of template + associated CSS. Visually independent.

**Reusable:** No (calculator-specific).

**Priority:** P2

---

**Current:** Error display (lines 113-115)

**Target:** Keep inline — it's 3 lines.

### C. Use existing component

**Current:** Custom tab bar (`.calc__tabs`)

**Target:** `Segmented.astro` (with possible icon extension)

**Why:** Already exists in the design system. The calculator tabs are a perfect use case.

**Priority:** P1

---

## 5. Logic Extraction

### Calculation Logic → `src/lib/calculator.ts`

```
Current:
  src/pages/calculator.astro (<script> block, lines 285-578)

Target:
  src/lib/calculator.ts

Contents:
  - PLATE_INVENTORY constant
  - DUMBBELL_PLATE_INVENTORY constant
  - PlateCount interface
  - DumbbellResult interface
  - computePlatesPerSide(target, bar) → { plates, remainder, error }
  - computeDumbbells(target, barWeight) → DumbbellResult
  - groupPlates(plates) → PlateCount[]
  - formatTemplate(tpl, vars) → string
  - formatKg(value) → string
  - plateHeight(weight) → number
  - plateClass(weight) → string
  - dumbbellHeight(weight) → number
  - dumbbellWidth(weight) → number

Reason:
  Pure data transformation / business logic. Zero DOM dependency.
  Enables unit testing. Removes ~200 lines from the page script.

Note on error messages:
  computePlatesPerSide and computeDumbbells currently reference LABELS
  for error messages. Two options:
  1. Return error keys instead of formatted strings (e.g. "targetBelowBar")
     and let the caller format with i18n.
  2. Accept a labels/config object parameter.

  Option 1 is cleaner — return error codes, format in the Alpine component.
```

---

## 6. CSS Rework

### Changes

1. **Remove tab CSS** (`.calc__tabs`, `.calc__tab`, `.calc__tab--active`, `.calc__tab:hover`) — replaced by `Segmented` styles (~30 lines saved).

2. **Keep scoped** — all other CSS stays scoped to the calculator. The plate colors, barbell diagram, dumbbell visualization, breakdown list, and stat grid are calculator-specific.

3. **Consider extracting** — `.calc__stat` / `.calc__stat-label` / `.calc__stat-value` pattern if reused on other pages (currently not).

### No migration needed

- CSS uses the project's design tokens (`--color-*`, `--radius-*`, `--font-*`)
- No Tailwind migration
- No CSS-in-JS
- Scoped styles are appropriate for page-specific visuals

---

## 7. TypeScript Rework

### Current issues

1. `eslint-disable-next-line @typescript-eslint/no-explicit-any` on line 410-411 — accessing `window.Alpine`
2. `PlateCount` and `DumbbellResult` interfaces are defined inside `<script>` — not exported
3. `formatKg` returns `string` but has no explicit return type annotation on the method

### Improvements

1. After extraction to `src/lib/calculator.ts`, all types become exported and reusable.
2. The `window.Alpine` access can use a proper type declaration:
   ```typescript
   // In src/env.d.ts or a dedicated file
   interface Window {
     Alpine: typeof import('alpinejs').default;
   }
   ```
3. Add explicit return types to exported functions.

---

## 8. Astro Rework

### Islands / Hydration

- The calculator uses `x-data="plateCalculator()"` which requires Alpine.js.
- Alpine is already loaded globally by `AppLayout.astro`.
- **No `client:*` directives needed** — Alpine handles hydration via DOM ready.
- This is correct and appropriate for a fully interactive calculator.

### Server/Client Boundary

- **Server (frontmatter):** i18n labels, layout, component composition
- **Client (Alpine):** All calculation state, computed properties, display helpers
- **Boundary is clean** — no unnecessary server-side computation for client-only data.

### Data Fetching

- None needed — this is a pure calculation tool with no data persistence.

### Recommendation

No changes needed to the Astro architecture. The Alpine.js island pattern is appropriate here.

---

## 9. Accessibility

### Current state — Good

- `role="tablist"` and `role="tab"` on the mode switcher (lines 28-50)
- `aria-selected` bound to Alpine state
- `role="alert"` and `aria-live="assertive"` on error message (line 114)
- `aria-label` on the barbell diagram (line 142)
- `aria-label` on the dumbbell container (line 232)
- `aria-hidden="true"` on decorative bar marks and dumbbell body elements

### Improvements

1. **Tab keyboard navigation** — The custom tabs lack `ArrowLeft`/`ArrowRight` keyboard handling. The `Segmented` component also doesn't have this, but the `TabList` component does. If staying with custom tabs, add keyboard support.

2. **Shortcut buttons** — The quick shortcut buttons (lines 97-101) have no `aria-label`. They display "60", "80", etc. which is self-explanatory, but `aria-label="Set target to 60 kg"` would be better for screen readers.

3. **Plate labels** — The `.calc__plate-label` uses `writing-mode: vertical-rl` which may be difficult to read on some screen readers. The `x-text` binding provides the text content which is accessible.

4. **Diagram alt text** — The barbell diagram has `:aria-label` which is good. Consider adding a visually hidden description of the full loading.

---

## 10. Performance

### Current state — Good

- No unnecessary JavaScript — Alpine handles all interactivity
- No framework overhead (vanilla Alpine, not React/Vue)
- CSS is scoped and small
- No images or external assets loaded by this page
- No data fetching

### Potential improvements

1. **Reduce CSS** — Removing tab styles (~30 lines) and potentially sharing stat grid styles.
2. **Lazy computation** — Alpine getters recompute on every state change. The greedy algorithm is O(n) per plate weight, which is negligible. No optimization needed.

### No action required

The page is already performant. The main improvement is code organization, not runtime performance.

---

## 11. Proposed Architecture

```
src/
├── lib/
│   ├── calculator.ts              ← NEW: pure calculation logic
│   │   ├── PLATE_INVENTORY
│   │   ├── DUMBBELL_PLATE_INVENTORY
│   │   ├── PlateCount (type)
│   │   ├── DumbbellResult (type)
│   │   ├── computePlatesPerSide()
│   │   ├── computeDumbbells()
│   │   ├── groupPlates()
│   │   ├── formatTemplate()
│   │   ├── formatKg()
│   │   ├── plateHeight()
│   │   ├── plateClass()
│   │   ├── dumbbellHeight()
│   │   └── dumbbellWidth()
│   └── __tests__/
│       └── calculator.test.ts     ← NEW: unit tests
│
├── components/
│   └── calculator/                ← NEW: calculator-specific components
│       ├── BarbellResult.astro    ← NEW: barbell results + diagram + breakdown
│       └── DumbbellResult.astro   ← NEW: dumbbell results + visual + breakdown
│
└── pages/
    └── calculator.astro           ← SIMPLIFIED: ~400-500 lines
        ├── Frontmatter: imports + i18n
        ├── Template: PageHeader + Segmented + Input card + Result card
        │   └── Result card: <BarbellResult> or <DumbbellResult>
        ├── Script: Alpine.data('plateCalculator') — state + computed only
        └── Style: ~200 lines (input grid, shortcuts, error, empty state)
```

---

## 12. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Calculation logic extraction breaks Alpine bindings | Low | High | Keep Alpine computed properties as thin wrappers calling extracted functions. Test manually. |
| Segmented component doesn't support icons | Medium | Low | Keep custom tabs if needed. Document decision. |
| EN locale breaks (it just re-imports FR) | Low | Low | EN already works by wrapping FR. No change needed. |
| CSS specificity changes after refactor | Low | Medium | Keep scoped styles. Test both themes. |
| Alpine reactivity breaks with extracted functions | Low | High | Ensure Alpine getters call functions with `this.*` state. Manual QA. |

---

## 13. Things NOT To Change

- **Design** — Visual appearance must remain identical (both light and dark themes)
- **Behavior** — Calculation logic must produce identical results
- **Routing** — `/calculator` and `/en/calculator` routes stay the same
- **i18n** — All localized strings remain in `fr/calculateur.ts` and `en/calculateur.ts`
- **Alpine.js** — Keep Alpine as the client-side framework (no migration to React/Vue)
- **EN page strategy** — `en/calculator.astro` wrapping FR is the project convention (same pattern as other EN pages)
- **Default values** — target=80, barWeight=20, dumbbellBarWeight=2
- **Shortcut values** — 60, 80, 100, 120, 140
- **Plate inventory** — [25, 20, 15, 10, 5, 2.5, 2, 1.5, 1.25, 1]
- **Dumbbell plate inventory** — [10, 7.5, 5, 4, 3, 2.5, 2, 1.5, 1.25, 1, 0.5]
- **Greedy algorithm** — Conservative (floor) approach with remainder display
- **Visual scaling** — Plate height mapping, dumbbell size mapping
- **Plate colors** — Olympic convention maintained via CSS classes
- **Service worker** — No impact (registered globally by AppLayout)
- **Global CSS** — No changes to tokens, reset, or utilities

---

## Roadmap

### Phase 1 — Extract Calculation Logic

**Goal:** Make business logic testable and reusable.

**Tasks:**
- Create `src/lib/calculator.ts` with all pure functions, constants, and types
- Update `src/pages/calculator.astro` to import from `src/lib/calculator.ts`
- Remove duplicated code from the `<script>` block
- Remove the second `i18n` import from the script
- Return error keys from computation functions instead of formatted strings

**Files affected:**
- `src/lib/calculator.ts` (new)
- `src/pages/calculator.astro` (script block modified)

**Dependencies:** None

**Validation:**
- `pnpm check` passes
- Manual test: barbell mode with target=100, bar=20 → per side=40, plates=[25,10,2.5]
- Manual test: dumbbell mode with target=14, bar=2 → plates=[10, 1.5, 0.5] (or similar)
- Both themes render correctly

**Risk:** Low

---

### Phase 2 — Add Unit Tests

**Goal:** Cover calculation logic with tests.

**Tasks:**
- Create `src/lib/__tests__/calculator.test.ts`
- Test `computePlatesPerSide`: 0, negative, below bar, equal to bar, normal, non-integer
- Test `computeDumbbells`: 0, negative, below bar, equal to bar, normal
- Test `groupPlates`: empty, single weight, mixed weights
- Test `formatKg`: 0, negative, decimals, rounding
- Test `formatTemplate`: single placeholder, multiple placeholders

**Files affected:**
- `src/lib/__tests__/calculator.test.ts` (new)

**Dependencies:** Phase 1

**Validation:**
- `pnpm test` passes

**Risk:** Low

---

### Phase 3 — Replace Custom Tabs with Segmented

**Goal:** Use the design-system primitive instead of hand-rolled tabs.

**Tasks:**
- Evaluate if `Segmented.astro` can accept leading icons (slot or prop)
- If yes: replace `.calc__tabs` with `<Segmented>`
- If no: keep custom tabs, remove this task, document decision
- Remove `.calc__tabs`, `.calc__tab`, `.calc__tab--active` CSS

**Files affected:**
- `src/pages/calculator.astro` (template + style)

**Dependencies:** None (can run in parallel with Phase 1)

**Validation:**
- `pnpm check` passes
- Mode switching works (bar ↔ dumbbell)
- Active state visually correct in both themes
- Keyboard navigation works

**Risk:** Medium — depends on Segmented component flexibility

---

### Phase 4 — Extract Calculator Components

**Goal:** Break the result display into focused sub-components.

**Tasks:**
- Create `src/components/calculator/BarbellResult.astro`
  - Accept props: stats (perSide, target, remainder), platesPerSide, plateBreakdown, formatKg, plateClass, plateHeight, barbellAria
  - Move barbell result grid, diagram, and breakdown template
  - Move associated CSS
- Create `src/components/calculator/DumbbellResult.astro`
  - Accept props: stats (dumbbellWeight, dumbbellRemainder, etc.), dumbbellsToShow, dumbbellBreakdown, dumbbellSummary, dumbbellsAria, formatKg, dumbbellWidth, dumbbellHeight
  - Move dumbbell result grid, visual, and breakdown template
  - Move associated CSS
- Simplify `calculator.astro` template to compose these components

**Files affected:**
- `src/components/calculator/BarbellResult.astro` (new)
- `src/components/calculator/DumbbellResult.astro` (new)
- `src/pages/calculator.astro` (template simplified, CSS reduced)

**Dependencies:** Phase 1 (extracted functions must be available for props)

**Validation:**
- `pnpm check` passes
- Both modes render identically to before
- Both themes correct
- No visual regressions

**Risk:** Low — template extraction only, no logic changes

---

### Phase 5 — CSS Cleanup

**Goal:** Reduce and organize CSS.

**Tasks:**
- Remove tab CSS (if Phase 3 succeeded)
- Remove CSS that moved to sub-components (Phase 4)
- Verify no unused CSS selectors remain
- Ensure all CSS uses design tokens (no hardcoded values except in plate colors which are semantic)

**Files affected:**
- `src/pages/calculator.astro` (style block)
- `src/components/calculator/BarbellResult.astro` (style block)
- `src/components/calculator/DumbbellResult.astro` (style block)

**Dependencies:** Phase 3 and Phase 4

**Validation:**
- `pnpm check` passes
- Visual regression check (both themes, both modes)

**Risk:** Low

---

### Phase 6 — TypeScript & Cleanup

**Goal:** Improve type safety and remove noise.

**Tasks:**
- Add explicit return types to exported functions in `calculator.ts`
- Remove empty `init()` method from Alpine component
- Clean up comment blocks (optional)
- Verify no `any` types remain (except the necessary `window.Alpine` access)

**Files affected:**
- `src/lib/calculator.ts`
- `src/pages/calculator.astro`

**Dependencies:** Phase 1-4

**Validation:**
- `pnpm check` passes
- `pnpm test` passes

**Risk:** Low

---

### Phase 7 — Accessibility Polish

**Goal:** Improve keyboard navigation and screen reader support.

**Tasks:**
- Add `aria-label` to quick shortcut buttons (e.g. "Définir la cible à 60 kg")
- If tabs remain custom (Phase 3 skipped), add ArrowLeft/ArrowRight keyboard handling
- Add visually hidden summary text for the barbell diagram

**Files affected:**
- `src/pages/calculator.astro`

**Dependencies:** Phase 3 (if tabs are replaced, this is mostly done)

**Validation:**
- Keyboard-only navigation works
- Screen reader announces shortcut buttons correctly
- Tab switching accessible

**Risk:** Low

---

### Phase 8 — Validation

**Goal:** Full regression check.

**Tasks:**
- `pnpm check` — no type errors
- `pnpm test` — all tests pass (including new calculator tests)
- `pnpm build` — builds successfully
- Manual QA:
  - Barbell mode: target=60,80,100,120,140 (shortcut buttons)
  - Barbell mode: custom target values
  - Barbell mode: target < bar → error
  - Barbell mode: target = bar → empty
  - Dumbbell mode: various targets
  - Dumbbell mode: target < bar → error
  - Both themes (light/dark)
  - Mobile responsive
  - Keyboard navigation
  - EN locale works

**Files affected:** None

**Dependencies:** All previous phases

**Validation:** All checks pass, no visual regressions

**Risk:** Low

---

## Execution Order

```
DO FIRST  → Phase 1 (extract logic) + Phase 2 (tests)
DO NEXT   → Phase 3 (Segmented) + Phase 4 (components)
DO LATER  → Phase 5 (CSS) + Phase 6 (TypeScript) + Phase 7 (a11y)
DO LAST   → Phase 8 (validation)
```

**Parallelizable:** Phase 3 can run alongside Phase 1-2. Phase 7 can run alongside Phase 5-6.

**Estimated total:** ~4-6 hours of focused work.
