# Dashboard Page Rework

## 1. Current State

### Architecture

```
index.astro (1507 lines)
├── Frontmatter (1-11)
│   └── Imports: AppLayout, PageHeader, Badge, StatusBadge, Button, Icon, KpiItem, i18n
├── Template (13-320)
│   ├── PageHeader
│   ├── Main dashboard (x-show="hasSessions")
│   │   ├── Overview section
│   │   │   ├── Hero: today's volume
│   │   │   ├── Weekly goal card (ring SVG + progress bar)
│   │   │   └── Next session card
│   │   ├── KPI band (4 × KpiItem)
│   │   ├── Weekly volume trend (bar chart)
│   │   └── Recent sessions list (5 items)
│   └── Empty state (x-show="!hasSessions")
│       ├── Decorative ring + dumbbell icon
│       ├── Welcome text
│       └── Action buttons
├── Script (322-671) — Alpine.js dashboardApp component
│   ├── Imports: storage (getSessions, getExercises, getSessionsThisWeek, getSettings, calculate1RM)
│   ├── Pure helpers: statusLabel, formatDate, formatVolume, dateKey
│   └── Alpine.data("dashboardApp")
│       ├── State: sessions, settings, weeklyDone, labels (25+ entries)
│       ├── Init: loads sessions, settings, weekly count
│       ├── Derived: hasSessions, recentSessions, nextSession, weeklyProgress
│       ├── Today: todayVolume, todaySessions, todayExercises
│       ├── Weekly trend: weeklyVolumeByDay, todayIdx, weeklyVolumeTotal, maxVol, dayLabels
│       ├── KPIs: kpis getter → { totalSessions, totalVolume, bestPRs, top1RM, streak }
│       ├── Business logic: totalVolume, bestPRs, top1RM, streak (complex)
│       ├── Per-session: sessionVolume, sessionExercisesCount, sessionPrimaryMuscle, muscleLabel
│       └── Formatters: statusLabel, formatDate, formatVolume (wrappers)
└── Style (675-1507) — ~830 lines scoped CSS
```

### Key Observations

- EN page wraps FR (same pattern as calculator).
- Alpine.js component is ~350 lines — handles data loading, computation, display helpers.
- `sessionVolume()` duplicated: defined as method AND used inside `totalVolume()` and `todayVolume` getter.
- `labels` object copies 25+ i18n strings into Alpine state — verbose, maintainability risk.
- `statusLabel`, `formatDate`, `formatVolume` defined twice: module scope + Alpine wrapper.
- `getExercises()` called in `init()` purely for side effect (seed), result discarded.
- No tests for any dashboard logic.
- CSS contains dead selectors (`.dash__kpi-*` classes that belonged to pre-KpiItem markup).

---

## 2. Problems Found

### P0 — Critical

**Problem:** Business logic (streak, totalVolume, bestPRs, top1RM) is embedded in Alpine component, untestable.

**Why:** `streak()`, `totalVolume()`, `bestPRs()`, `top1RM()` are pure functions that depend only on session data. They're trapped in Alpine.data() and cannot be imported by Vitest.

**Impact:** Zero test coverage on critical business logic. Streak calculation is complex (consecutive-day algorithm). Regressions go undetected.

**Recommended solution:** Extract to `src/lib/dashboard-stats.ts`: `computeStreak()`, `computeTotalVolume()`, `computeBestPRs()`, `computeTop1RM()`, `computeSessionVolume()`, `computeWeeklyVolumeByDay()`.

**Priority:** P0

---

### P1 — Important

**Problem:** Session volume calculation duplicated 3 times.

**Why:**
1. `sessionVolume(s)` — Alpine method (line 618-627)
2. `totalVolume()` — calls `sessionVolume` per session (line 533-547) but reimplements the reduce pattern
3. `todayVolume` getter — calls `this.sessionVolume(s)` (line 446-451)

Actually `totalVolume()` reimplements the nested reduce instead of calling `sessionVolume()`. Inconsistency.

**Impact:** Logic drift risk. If volume formula changes, must update 3 places.

**Recommended solution:** Single `computeSessionVolume(session)` in extracted module. Alpine methods delegate to it.

**Priority:** P1

---

**Problem:** `labels` object copies 25+ i18n strings into Alpine state.

**Why:** Alpine expressions can't call `t()` directly (it's a module function). The `labels` object bridges i18n → Alpine. But it's 25+ lines of manual mapping.

**Impact:** Every new i18n key requires updating the `labels` object. Maintenance burden.

**Recommended solution:** Acceptable pattern for Alpine. No change unless a cleaner bridge is found. Document as known limitation.

**Priority:** P1 (accepted, no fix)

---

**Problem:** `getExercises()` called for side-effect only in `init()`.

**Why:** Line 411: `getExercises()` — comment says "Touch the storage so the exercise seed is created on first load." Result never used.

**Impact:** Confusing code. Reader wonders why exercises are loaded but unused.

**Recommended solution:** Replace with explicit `seedExercisesIfEmpty()` or document inline with clearer comment.

**Priority:** P1

---

### P2 — Improvement

**Problem:** Dead CSS selectors from pre-KpiItem era.

**Why:** `.dash__kpi-content`, `.dash__kpi-row`, `.dash__kpi-head`, `.dash__kpi-icon`, `.dash__kpi-label`, `.dash__kpi-value`, `.dash__kpi-unit`, `.dash__kpi-sub` — these target markup that KpiItem.astro now renders internally with `.kpi-item__*` classes.

**Impact:** ~65 lines of unused CSS. Confusing for maintainers.

**Recommended solution:** Delete dead selectors.

**Priority:** P2

---

**Problem:** `statusLabel`, `formatDate`, `formatVolume` defined twice.

**Why:** Module scope (lines 337-358) + Alpine wrapper methods (lines 658-668) that just call the module functions.

**Impact:** Minor duplication. Wrappers exist because Alpine expressions can't call module-scope functions directly.

**Recommended solution:** Keep wrappers (necessary for Alpine), but remove module-scope `statusLabel` if only used via Alpine. Actually all three are used in the Alpine component only, so keep as-is.

**Priority:** P2 (accepted)

---

**Problem:** No tests for dashboard logic.

**Why:** Streak calculation, volume computation, bestPRs, top1RM — all untested.

**Impact:** High regression risk for complex algorithms.

**Recommended solution:** After extraction to `dashboard-stats.ts`, add `src/lib/__tests__/dashboard-stats.test.ts`.

**Priority:** P2

---

### P3 — Nice-to-have

**Problem:** `dateKey()` function duplicates date formatting logic.

**Why:** Creates "YYYY-MM-DD" string from Date. Used for day-level comparisons. Could share with other pages.

**Impact:** Minor. Self-contained.

**Recommended solution:** Keep in extracted module. Consider sharing if other pages need it.

**Priority:** P3

---

## 3. Dead Code

| Item | Location | Status |
|------|----------|--------|
| `.dash__kpi-content` | CSS line 974-978 | Dead — KpiItem uses `.kpi-item__*` |
| `.dash__kpi-row` | CSS line 980-983 | Dead |
| `.dash__kpi-head` | CSS line 985-989 | Dead |
| `.dash__kpi-icon` | CSS line 991-999 | Dead |
| `.dash__kpi-icon svg` | CSS line 1001-1005 | Dead |
| `.dash__kpi-label` | CSS line 1007-1013 | Dead |
| `.dash__kpi-value` | CSS line 1015-1022 | Dead |
| `.dash__kpi-unit` | CSS line 1024-1031 | Dead |
| `.dash__kpi-sub` | CSS line 1033-1038 | Dead |
| Total: ~65 lines CSS | | |

---

## 4. Componentization

### A. Keep in page

| Element | Reason |
|---------|--------|
| PageHeader usage | Single use, thin wrapper |
| Empty state | Page-specific, decorative |
| KpiItem usage | Already a component, correctly composed |
| StatusBadge usage | Already a component |

### B. Extract to component

**Current:** Hero section (today's volume) — lines 26-47

**Target:** `src/components/dashboard/HeroSection.astro`

**Responsibility:** Display today's volume with icon, number, unit, session/exercise count context.

**Why:** ~22 lines template + associated CSS (~80 lines). Visually independent section.

**Reusable:** No (dashboard-specific).

**Priority:** P2

---

**Current:** Weekly goal card — lines 50-116

**Target:** `src/components/dashboard/WeeklyGoal.astro`

**Responsibility:** Ring SVG, progress bar, goal text, hint text.

**Why:** ~67 lines template + associated CSS (~145 lines). Self-contained visual unit.

**Reusable:** No.

**Priority:** P2

---

**Current:** Next session card — lines 119-146

**Target:** `src/components/dashboard/NextSession.astro`

**Responsibility:** Display next workout with action link.

**Why:** ~28 lines template + associated CSS (~45 lines). Visually independent.

**Reusable:** No.

**Priority:** P2

---

**Current:** Weekly volume trend — lines 184-228

**Target:** `src/components/dashboard/VolumeTrend.astro`

**Responsibility:** Bar chart for weekly volume by day.

**Why:** ~45 lines template + associated CSS (~80 lines). Complex visualization.

**Reusable:** No.

**Priority:** P2

---

**Current:** Recent sessions list — lines 231-286

**Target:** `src/components/dashboard/RecentSessions.astro`

**Responsibility:** List of 5 recent sessions with status, date, volume, muscle badge.

**Why:** ~56 lines template + associated CSS (~80 lines). Self-contained list.

**Reusable:** No.

**Priority:** P2

---

### C. Use existing component

All components used are already existing (KpiItem, StatusBadge, Badge, Button, Icon). No new design-system components needed.

---

## 5. Logic Extraction

### Dashboard Stats → `src/lib/dashboard-stats.ts`

```
Current:
  src/pages/index.astro (Alpine component, lines 322-671)

Target:
  src/lib/dashboard-stats.ts

Contents:
  - computeSessionVolume(session) → number
  - computeTotalVolume(sessions) → number
  - computeTodayVolume(sessions) → number
  - computeTodaySessions(sessions) → number
  - computeTodayExercises(sessions) → number
  - computeWeeklyVolumeByDay(sessions) → number[]
  - computeWeeklyVolumeTotal(sessions) → number
  - computeBestPRs(sessions) → number
  - computeTop1RM(sessions) → number
  - computeStreak(sessions) → number
  - computeSessionPrimaryMuscle(session) → string
  - dateKey(date) → string

Reason:
  Pure data transformation. Zero DOM dependency.
  Enables unit testing. Removes ~200 lines from Alpine component.
```

### Formatters → `src/lib/format.ts` (existing, extend)

```
Current:
  formatDate, formatVolume defined in index.astro script

Target:
  src/lib/format.ts (already exists, add these)

Contents:
  - formatDate(iso, locale) → string
  - formatVolume(volume, locale) → string

Reason:
  Reusable across pages. formatDate used in sessions list too.
```

---

## 6. CSS Rework

### Dead CSS to remove (~65 lines)

All `.dash__kpi-*` selectors that target pre-KpiItem markup:
- `.dash__kpi-content`
- `.dash__kpi-row`
- `.dash__kpi-head`
- `.dash__kpi-icon`, `.dash__kpi-icon svg`
- `.dash__kpi-label`
- `.dash__kpi-value`
- `.dash__kpi-unit`
- `.dash__kpi-sub`

### CSS to move to components (if extracting)

| Component | CSS lines (approx) |
|-----------|-------------------|
| HeroSection | 701-774 (~74 lines) |
| WeeklyGoal | 779-923 (~145 lines) |
| NextSession | 1101-1147 (~47 lines) |
| VolumeTrend | 1149-1243 (~95 lines) |
| RecentSessions | 1248-1359 (~112 lines) |
| Empty state | 1364-1469 (~106 lines) |

### No migration needed

- CSS uses design tokens correctly
- Scoped styles appropriate for page sections
- No Tailwind migration

---

## 7. TypeScript Rework

### Current issues

1. `eslint-disable-next-line @typescript-eslint/no-explicit-any` on line 369-370 — `window.Alpine`
2. `sessionVolume(s: Session)` — return type not annotated
3. `sessionExercisesCount(s: Session)` — trivial, could be inline
4. `sessionPrimaryMuscle(s: Session)` — return type not annotated
5. `muscleLabel(name: string)` — uses unsafe `window` cast

### Improvements

1. After extraction, all functions get explicit return types
2. `muscleLabel` can use the global `trMuscle` exposed by AppLayout
3. Add return type annotations to all Alpine computed properties

---

## 8. Astro Rework

### Islands / Hydration

- Dashboard uses `x-data="dashboardApp()"` — Alpine.js island.
- Alpine loaded globally by AppLayout.
- **No `client:*` directives needed.**
- Appropriate for fully interactive dashboard.

### Server/Client Boundary

- **Server (frontmatter):** i18n labels, layout, component composition
- **Client (Alpine):** All data loading, computation, display
- **Boundary is clean.** Storage access (localStorage) correctly client-only.

### Data Fetching

- All data from localStorage via `getSessions()`, `getSettings()`, etc.
- No server-side data fetching needed.
- `init()` loads data synchronously — acceptable for localStorage.

### Recommendation

No changes to Astro architecture. Alpine.js island pattern is correct.

---

## 9. Accessibility

### Current state — Good

- `aria-label` on major sections (today volume, weekly goal, KPIs, trend, recent sessions)
- `role="progressbar"` with `aria-valuemin/max/now` on goal bar
- `role="img"` with `aria-label` on trend bar columns
- `aria-current="date"` on today's trend column
- `aria-hidden="true"` on decorative elements (icons, dots, separators)
- `role="status"` on empty trend state
- Focus-visible styles on interactive elements

### Improvements

1. **Empty state** — The `<h1>` inside empty state should be the page's main heading. Currently PageHeader renders a separate title. Consider removing PageHeader in empty state or making empty state use `<h2>`.

2. **Session links** — Each recent session is an `<a>` tag. The link text includes the session name (via `x-text`). Add visually hidden text for screen readers if needed.

3. **Trend chart** — Each bar has `role="img"` with `aria-label`. Good. Consider adding a visually hidden table as alternative content.

---

## 10. Performance

### Current state — Good

- No unnecessary JavaScript
- Alpine handles all interactivity
- localStorage reads are synchronous but fast
- No images or external assets
- CSS is scoped and reasonably sized

### Potential improvements

1. **Reduce Alpine computed re-evaluation** — Some getters create new objects/arrays on each call (e.g., `kpis`, `weeklyVolumeByDay`). Alpine caches getter results, but if multiple templates reference the same getter, it may recompute. Consider memoizing expensive computations.

2. **Session sorting** — `getSessions().sort()` in `init()` creates a new sorted array every time. Acceptable for typical session counts (<1000).

### No action required

Performance is good. Main improvement is code organization.

---

## 11. Proposed Architecture

```
src/
├── lib/
│   ├── dashboard-stats.ts        ← NEW: pure computation functions
│   │   ├── computeSessionVolume()
│   │   ├── computeTotalVolume()
│   │   ├── computeTodayVolume()
│   │   ├── computeTodaySessions()
│   │   ├── computeTodayExercises()
│   │   ├── computeWeeklyVolumeByDay()
│   │   ├── computeBestPRs()
│   │   ├── computeTop1RM()
│   │   ├── computeStreak()
│   │   ├── computeSessionPrimaryMuscle()
│   │   └── dateKey()
│   ├── format.ts                 ← EXTEND: add formatDate, formatVolume
│   └── __tests__/
│       └── dashboard-stats.test.ts  ← NEW: unit tests
│
├── components/
│   └── dashboard/                ← NEW: dashboard-specific components
│       ├── HeroSection.astro     ← NEW: today's volume
│       ├── WeeklyGoal.astro      ← NEW: ring + progress bar
│       ├── NextSession.astro     ← NEW: next workout card
│       ├── VolumeTrend.astro     ← NEW: bar chart
│       └── RecentSessions.astro  ← NEW: session list
│
└── pages/
    └── index.astro               ← SIMPLIFIED: ~500-600 lines
        ├── Frontmatter: imports
        ├── Template: compose dashboard components
        ├── Script: Alpine.data — state + delegation only
        └── Style: ~300 lines (layout, empty state, shared)
```

---

## 12. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Extracting components breaks Alpine scope | Medium | High | Alpine x-data scope propagates to children. Test manually. |
| CSS specificity changes after extraction | Low | Medium | Keep styles global (is:global). Test both themes. |
| Stats extraction introduces calculation differences | Low | High | Extract functions verbatim. Test with real data. |
| localStorage access breaks in SSR | Low | High | Keep storage calls inside Alpine init() (client-only). |
| EN locale breaks | Low | Low | EN wraps FR. No change. |

---

## 13. Things NOT To Change

- **Design** — Visual appearance identical (both themes)
- **Behavior** — All calculations produce identical results
- **Routing** — `/` and `/en/` routes unchanged
- **i18n** — All strings stay in `fr/dashboard.ts` and `en/dashboard.ts`
- **Alpine.js** — Keep as client framework
- **Storage pattern** — localStorage reads in init()
- **EN page strategy** — `en/index.astro` wrapping FR
- **Data loading** — Synchronous localStorage in init()
- **KPI band** — 4 metrics in same order
- **Session sorting** — Newest first
- **Recent sessions limit** — 5 items
- **Weekly goal ring** — SVG circle with stroke-dasharray
- **Bar chart** — Volume by day, Sun→Sat
- **Empty state** — Ring + dumbbell + welcome text + 3 actions
- **Service worker** — No impact (registered globally)

---

## Roadmap

### Phase 1 — Extract Dashboard Stats

**Goal:** Make business logic testable.

**Tasks:**
- Create `src/lib/dashboard-stats.ts`
- Move `computeSessionVolume`, `computeTotalVolume`, `computeTodayVolume`, `computeTodaySessions`, `computeTodayExercises`, `computeWeeklyVolumeByDay`, `computeWeeklyVolumeTotal`, `computeBestPRs`, `computeTop1RM`, `computeStreak`, `computeSessionPrimaryMuscle`, `dateKey`
- Update `index.astro` to import from extracted module
- Remove duplicated logic from Alpine component

**Files affected:**
- `src/lib/dashboard-stats.ts` (new)
- `src/pages/index.astro` (script modified)

**Dependencies:** None

**Validation:**
- `pnpm check` passes
- `pnpm build` succeeds
- Manual test: dashboard loads, KPIs display correctly, streak computes

**Risk:** Low

---

### Phase 2 — Extend Format Utilities

**Goal:** Share formatting functions.

**Tasks:**
- Add `formatDate(iso, locale)` and `formatVolume(volume, locale)` to `src/lib/format.ts`
- Update `index.astro` to import from `format.ts`
- Remove local definitions

**Files affected:**
- `src/lib/format.ts` (extended)
- `src/pages/index.astro` (script modified)

**Dependencies:** None (can run parallel with Phase 1)

**Validation:**
- `pnpm check` passes
- Date/volume formatting identical

**Risk:** Low

---

### Phase 3 — Add Unit Tests

**Goal:** Cover dashboard logic.

**Tasks:**
- Create `src/lib/__tests__/dashboard-stats.test.ts`
- Test `computeStreak`: no sessions, single day, multi-day, gap in middle, today vs yesterday
- Test `computeTotalVolume`: empty, single session, multiple sessions, incomplete sets
- Test `computeSessionVolume`: empty sets, mixed completed/incomplete
- Test `computeBestPRs`: no sessions, single exercise, multiple exercises
- Test `computeTop1RM`: weight×reps formula edge cases
- Test `computeWeeklyVolumeByDay`: current week, empty week
- Test `dateKey`: timezone handling

**Files affected:**
- `src/lib/__tests__/dashboard-stats.test.ts` (new)

**Dependencies:** Phase 1

**Validation:**
- `pnpm test` passes

**Risk:** Low

---

### Phase 4 — Remove Dead CSS

**Goal:** Clean up unused selectors.

**Tasks:**
- Remove `.dash__kpi-content`, `.dash__kpi-row`, `.dash__kpi-head`, `.dash__kpi-icon`, `.dash__kpi-icon svg`, `.dash__kpi-label`, `.dash__kpi-value`, `.dash__kpi-unit`, `.dash__kpi-sub`
- Verify KpiItem still renders correctly (uses `.kpi-item__*` classes)

**Files affected:**
- `src/pages/index.astro` (style block)

**Dependencies:** None

**Validation:**
- `pnpm build` succeeds
- KPI band renders correctly in both themes

**Risk:** Low

---

### Phase 5 — Extract Dashboard Components

**Goal:** Break template into focused sub-components.

**Tasks:**
- Create `src/components/dashboard/HeroSection.astro`
- Create `src/components/dashboard/WeeklyGoal.astro`
- Create `src/components/dashboard/NextSession.astro`
- Create `src/components/dashboard/VolumeTrend.astro`
- Create `src/components/dashboard/RecentSessions.astro`
- Move associated CSS to each component (use `is:global` or pass via parent)
- Simplify `index.astro` template

**Files affected:**
- `src/components/dashboard/*.astro` (new)
- `src/pages/index.astro` (template simplified)

**Dependencies:** Phase 1, Phase 2

**Validation:**
- `pnpm check` passes
- All sections render identically
- Both themes correct

**Risk:** Medium — Alpine scope propagation must be verified

---

### Phase 6 — TypeScript & Cleanup

**Goal:** Improve type safety.

**Tasks:**
- Add explicit return types to all extracted functions
- Clean up `labels` object (document as Alpine/i18n bridge)
- Remove `sessionExercisesCount` wrapper (inline in template)
- Add return type annotations to Alpine getters

**Files affected:**
- `src/lib/dashboard-stats.ts`
- `src/pages/index.astro`

**Dependencies:** Phase 1-5

**Validation:**
- `pnpm check` passes

**Risk:** Low

---

### Phase 7 — Accessibility Polish

**Goal:** Improve screen reader experience.

**Tasks:**
- Add visually hidden table as chart alternative
- Ensure empty state heading hierarchy is correct
- Add `aria-live="polite"` to volume number (updates on load)

**Files affected:**
- `src/pages/index.astro` or extracted components

**Dependencies:** Phase 5

**Validation:**
- Keyboard navigation works
- Screen reader announces sections correctly

**Risk:** Low

---

### Phase 8 — Validation

**Goal:** Full regression check.

**Tasks:**
- `pnpm check` — no type errors
- `pnpm test` — all tests pass
- `pnpm build` — builds successfully
- Manual QA:
  - Empty state (no sessions) — welcome + actions
  - With sessions — hero, goal, KPIs, trend, recent list
  - Weekly goal progress bar + ring
  - Next session card (in-progress vs planned)
  - Today's volume correct
  - Streak calculation correct
  - Both themes
  - Mobile responsive
  - EN locale

**Dependencies:** All phases

**Risk:** Low

---

## Execution Order

```
DO FIRST  → Phase 1 (extract stats) + Phase 2 (format utils) + Phase 3 (tests)
DO NEXT   → Phase 4 (dead CSS) + Phase 5 (components)
DO LATER  → Phase 6 (TypeScript) + Phase 7 (a11y)
DO LAST   → Phase 8 (validation)
```

**Parallelizable:** Phase 1 + 2 + 4 can run in parallel. Phase 7 can run alongside Phase 6.

**Estimated total:** 6-8 hours of focused work.
