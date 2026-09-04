# Gym Empire

[Open gymempire.vercel.app](https://gymempire.vercel.app)

Offline-first strength training log. 100% client-side — no backend, no accounts, no tracking.

## Stack

- **Framework:** [Astro 7](https://astro.build/) (static output)
- **UI:** [Alpine.js 3.14](https://alpinejs.dev/) (client-side interactivity)
- **Styles:** CSS custom properties + Tailwind CSS v4
- **Tests:** [Vitest](https://vitest.dev/) (457 tests)
- **Language:** TypeScript
- **Package manager:** pnpm

## Install

```bash
pnpm install
```

Requires Node.js ≥ 22.13.0.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build |
| `pnpm test` | Run tests |
| `pnpm check` | TypeScript check |

## Architecture

```
src/
├── pages/          # Astro pages (static routes)
├── layouts/        # AppLayout (shell, Alpine bootstrap, locale)
├── components/
│   ├── ui/         # Button, Card, Input, Dialog, Badge, etc.
│   ├── layout/     # AppShell, Header, Sidebar, QuickSearch
│   └── workout/    # Session builder components
├── lib/            # Pure TypeScript (no DOM)
│   ├── storage.ts  # localStorage CRUD + validation
│   ├── sync.ts     # WebDAV sync client
│   ├── auth.ts     # Fake auth gate (dev only)
│   └── *.ts        # Stats, format, calculator, etc.
├── i18n/           # fr/ + en/ dictionaries
└── styles/         # tokens.css, reset.css, utilities.css
```

### Alpine Componentization Rule

- Runtime markup (`x-for`, `x-if`) stays in `.astro` parent
- Pure logic → `src/lib/*.ts`
- Alpine state/methods → TypeScript modules
- Static markup → Astro components

## Data Model

All data lives in `localStorage`:

| Key | Type | Description |
|-----|------|-------------|
| `muscu:exercises` | `Exercise[]` | Exercise catalog |
| `muscu:sessions` | `Session[]` | Workout sessions |
| `muscu:progress` | `ProgressRecord[]` | 1RM history |
| `muscu:body` | `BodyRecord[]` | Weight/measurements |
| `muscu-settings` | `Settings` | User preferences |

### Migrations

Data is validated at read boundary (`storage.ts`). Invalid records are filtered silently. No explicit migration system — schema changes add optional fields with defaults.

## Auth

**Fake dev gate only.** No password check, no token, no server-side validation. Stores `{ email, name }` in localStorage. Exists solely for UI gating during development.

See `src/lib/auth.ts` for security model documentation.

## WebDAV Sync

Manual sync to any WebDAV server (Nextcloud, ownCloud, Syncthing, etc.):

- **Push:** PUT snapshot to server (overwrite)
- **Pull:** GET + validate + import
- **Conflict policy:** Last-write-wins (v1)
- **Credentials:** Stored in plain localStorage (deliberate tradeoff)
- **Auth:** HTTP Basic (pre-emptive)

Password note displayed in UI. Never pretend this is secure — the app is 100% local-first.

## Offline

Service worker (`public/sw.js`) precaches all routes:

- Network-first for HTML navigations
- Cache-first for `/_astro/` assets (content-hashed)
- Fallback to cached dashboard `/`
- Inline offline page when nothing cached

## Routes

| FR | EN | Description |
|----|----|-------------|
| `/` | `/en` | Dashboard |
| `/sessions` | `/en/sessions` | Session list |
| `/sessions/create` | `/en/sessions/create` | Create session |
| `/sessions/detail` | `/en/sessions/detail` | Session detail |
| `/sessions/quick` | `/en/sessions/quick` | Quick session |
| `/exercises` | `/en/exercises` | Exercise list |
| `/progression` | `/en/progression` | Progression hub |
| `/calendar` | `/en/calendar` | Calendar |
| `/timer` | `/en/timer` | Rest timer |
| `/settings` | `/en/settings` | Settings |
| `/calculator` | `/en/calculator` | Plate calculator |

## i18n

- **Default locale:** French (`fr`)
- **English:** prefixed with `/en/`
- **Toggle:** Globe button in header
- Exercise names stored in French, translated at render time on EN locale

## Themes

- **Dark:** Default. `color-scheme: dark`
- **Light:** `data-theme="light"` on `<html>`. `color-scheme: light`
- **Toggle:** Moon/sun button in header
- **Persistence:** `muscu-theme` in localStorage
- **Flash prevention:** Inline theme bootstrap in `<head>`

## Tests

```bash
pnpm test        # Run all 457 tests
pnpm test:watch  # Watch mode
```

Coverage: auth, storage, sync, stats (6 modules), builder, calculator, timer, benchmarks, body-chart, calendar-grid, exercises-stats, rest-times, settings-stats, session-utils.

## Build

```bash
pnpm build
```

Output: `dist/` (static HTML + hashed assets). 42 pages, ~2.8 MB total.

## Deployment

Static output — deploy anywhere:

- Vercel, Netlify, Cloudflare Pages
- Any static file server
- GitHub Pages

No server runtime required.

## Backup / Restore

- **Export:** Settings → Download JSON (all data)
- **Import:** Settings → Upload JSON
- **WebDAV:** Push/pull to remote server
- **CSV:** Export sessions as CSV

## Known Limits

- No real auth (fake dev gate only)
- No merge strategy (last-write-wins)
- Password stored in plain localStorage
- No E2E tests
- No accessibility automation
- No lint/format configured

## License

Private project.
