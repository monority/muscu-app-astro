# Session Detail Page Rework

## 1. Current State

### Architecture

```
sessions/detail.astro (1930 lines)
├── Frontmatter (1-16)
│   └── Imports: AppLayout, Badge, StatusBadge, Card, Dialog, Icon, i18n, BackLink, Button, DialogFooter, EmptyState
├── Template (18-510)
│   ├── BackLink
│   ├── EmptyState (not found)
│   └── Session content (x-if="!notFound && session")
│       ├── Header (name + status badge + date)
│       ├── StatusSection (status buttons)
│       ├── StatsGrid (duration, volume, exercises)
│       ├── Actions (start, share, compare, CSV, print, edit, delete)
│       ├── RPE Suggestion card
│       ├── NotesSection (RPE, fatigue, mood, notes)
│       ├── Exercise list (table with sets)
│       │   ├── Exercise rows
│       │   ├── Set rows (weight, reps, RPE, type)
│       │   └── Superset badges
│       └── Delete dialog
├── Script (512-1050)
│   ├── Imports: storage, i18n, format, session-utils, workout-helpers, mood
│   ├── Pure helpers (downloadBlob, slugify, formatters, labels)
│   └── Alpine.data('sessionDetailApp')
│       ├── State: session, sessionId, notFound, labels
│       ├── Init: load session from URL params
│       ├── Computed: volume, sets, notes, RPE stats, suggestion
│       ├── Helpers: exerciseVolume, best1RM, superset logic
│       ├── Formatters: formatDateTime, formatDuration, formatVolume, etc.
│       └── Actions: updateStatus, openDeleteDialog, delete, export, share
└── Style (1052-1930)
    └── ~880 lines of scoped CSS
```

### Key Observations

- Alpine.js component handles all state + logic (~540 lines)
- Template is complex with nested conditionals (x-if, x-for)
- CSS is very large (~880 lines) with many sections
- Share card generation is inline (canvas manipulation)
- CSV export is inline
- Superset logic adds complexity to exercise rendering
- RPE/fatigue/mood notes are conditionally displayed

---

## 2. Problems Found

### P0 — Critical

**Problem:** Business logic (RPE stats, suggestion generation, volume calculation) embedded in Alpine component, untestable.

**Why:** `rpeStats`, `rpeSuggestion`, `exerciseVolume`, `best1RM` are pure functions trapped in Alpine.data().

**Impact:** Zero test coverage on critical business logic.

**Recommended solution:** Extract to `src/lib/session-detail-stats.ts`:
- `computeRpeStats(session)` → `{ count, avg, max, allTen }`
- `computeRpeSuggestion(stats)` → `{ headline, detail, tone } | null`
- `computeSessionTotalVolume(session, exerciseVolume)` → number
- `computeBest1RM(exercise, calculate1RM)` → number

**Priority:** P0

---

### P1 — Important

**Problem:** Template is 500+ lines with deeply nested structure.

**Why:** StatusSection, StatsGrid, Actions, NotesSection, ExerciseList are all inline.

**Impact:** Hard to navigate, maintain, and reason about.

**Recommended solution:** Extract to components:
- `SessionHeader.astro` — name, status badge, date
- `StatusSection.astro` — status buttons
- `StatsGrid.astro` — duration, volume, exercises
- `SessionActions.astro` — all action buttons
- `NotesSection.astro` — RPE, fatigue, mood, notes
- `ExerciseList.astro` — table with exercises and sets

**Priority:** P1

---

**Problem:** Share card generation is inline (~100 lines of canvas manipulation).

**Why:** `generateShareCard()` creates a canvas, draws text/shapes, converts to image.

**Impact:** Mixes presentation logic with business logic. Hard to test.

**Recommended solution:** Extract to `src/lib/share-card.ts`:
- `generateSessionShareCard(session, options)` → data URL
- Keep canvas logic isolated

**Priority:** P1

---

**Problem:** CSV export is inline (~50 lines).

**Why:** `downloadSessionCsv()` builds CSV string and triggers download.

**Impact:** Mixes data transformation with DOM manipulation.

**Recommended solution:** Extract to `src/lib/csv-export.ts`:
- `sessionToCsv(session)` → string
- `downloadCsv(filename, csv)` → void (DOM side effect)

**Priority:** P1

---

### P2 — Improvement

**Problem:** ~880 lines of CSS, many sections could be components.

**Why:** CSS contains styles for header, status, stats, actions, notes, exercises, supersets, share card, dialog.

**Impact:** Large CSS bundle, hard to maintain.

**Recommended solution:** Move CSS to extracted components. Keep only layout + shared styles in page.

**Priority:** P2

---

**Problem:** Superset logic adds complexity to exercise rendering.

**Why:** `supersetGroup()`, `supersetTint()`, `supersetLabelFor()`, `supersetMembers()` are presentation helpers.

**Impact:** Mixed concerns in Alpine component.

**Recommended solution:** Extract to `src/lib/superset-helpers.ts` or keep as Alpine methods after extraction.

**Priority:** P2

---

### P3 — Nice-to-have

**Problem:** Many formatter wrapper functions (formatDateTimeFn, formatDurationFn, formatVolumeFn, etc.).

**Why:** Module-scope functions that just call imported formatters.

**Impact:** Minor duplication. Necessary for Alpine bridge.

**Recommended solution:** Keep as-is (Alpine bridge pattern).

**Priority:** P3

---

## 3. Proposed Component Architecture

```
src/
├── lib/
│   ├── session-detail-stats.ts   ← NEW: RPE stats, suggestion, volume
│   ├── share-card.ts             ← NEW: canvas-based share card
│   ├── csv-export.ts             ← NEW: CSV generation + download
│   └── __tests__/
│       └── session-detail-stats.test.ts  ← NEW: tests
│
├── components/
│   └── session-detail/           ← NEW: detail-specific components
│       ├── SessionHeader.astro   ← NEW: name + status badge + date
│       ├── StatusSection.astro   ← NEW: status buttons
│       ├── StatsGrid.astro       ← NEW: duration, volume, exercises
│       ├── SessionActions.astro  ← NEW: action buttons
│       ├── NotesSection.astro    ← NEW: RPE, fatigue, mood, notes
│       └── ExerciseList.astro    ← NEW: table with exercises + sets
│
└── pages/
    └── sessions/
        └── detail.astro          ← SIMPLIFIED: ~600-700 lines
            ├── Frontmatter: imports
            ├── Template: compose components
            ├── Script: Alpine.data — state + delegation only
            └── Style: ~200 lines (layout, shared)
```

---

## 4. Execution Order

```
DO FIRST  → Phase 1 (extract stats) + Phase 2 (tests)
DO NEXT   → Phase 3 (components) + Phase 4 (share card + CSV)
DO LAST   → Phase 5 (CSS cleanup) + Phase 6 (validation)
```

**Estimated total:** ~6-8 hours of focused work.

---

## 5. Things NOT To Change

- **Design** — Visual appearance identical (both themes)
- **Behavior** — All calculations produce identical results
- **Routing** — `/sessions/detail?id=xxx` unchanged
- **i18n** — All strings stay in locale files
- **Alpine.js** — Keep as client framework
- **Storage pattern** — localStorage reads in init()
- **Share card** — Canvas-based generation stays
- **CSV export** — Same format
- **Supersets** — Badge + tint logic unchanged
- **RPE/fatigue/mood** — Same display logic
- **Delete dialog** — Same flow
