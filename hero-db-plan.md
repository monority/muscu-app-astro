# Plan DB — SQLite + API pour Muscu App

## Stack
- **DB**: `better-sqlite3` (1 runtime dep)
- **Adapter**: `@astrojs/node` (mode `standalone`)
- **Output**: Astro `hybrid` (page statique + endpoints serveur)
- **Pas d'ORM**: SQL brut typé

## Phase 1: Foundation

| # | Fichier | Action | Type |
|---|---------|--------|------|
| 1 | `package.json` | Ajouter `better-sqlite3` + `@astrojs/node` | modify |
| 2 | `astro.config.mjs` | `output: 'hybrid'`, `adapter: node({ mode: 'standalone' })` | modify |
| 3 | `.gitignore` | Ajouter `data/`, `*.db` | modify |
| 4 | `src/lib/types.ts` | Interfaces `Session`, `Exercise`, `ExerciseSet` | create |
| 5 | `src/lib/db.ts` | Singleton DB, schema (3 tables), helpers typés | create |

## Phase 2: API Endpoints

| # | Fichier | Action | Type |
|---|---------|--------|------|
| 6 | `src/pages/api/session.ts` | `GET` — session active + dernier set + meta | create |
| 7 | `src/pages/api/sets.ts` | `POST` — logger une série | create |
| 8 | `src/pages/api/migrate.ts` | `POST` — importer données localStorage | create |

## Phase 3: Frontend

| # | Fichier | Action | Type |
|---|---------|--------|------|
| 9 | `src/pages/index.astro` | Remplacer script localStorage par `fetch('/api/session')` + migration auto | modify |

## Phase 4: Vérification

| # | Fichier | Action | Type |
|---|---------|--------|------|
| 10 | — | `npm install` + `astro dev` | verify |
| 11 | — | Smoke-test 3 endpoints (`curl`) | verify |
| 12 | `data/.gitkeep` | Préserver le dossier vide | create |

## Schéma (3 tables)

```sql
sessions:
  id INTEGER PRIMARY KEY AUTOINCREMENT
  started_at TEXT DEFAULT (datetime('now'))
  ended_at TEXT NULL
  notes TEXT NULL

exercises:
  id INTEGER PRIMARY KEY AUTOINCREMENT
  session_id INTEGER NOT NULL REFERENCES sessions(id)
  name TEXT NOT NULL
  sort_order INTEGER NOT NULL DEFAULT 0

exercise_sets:
  id INTEGER PRIMARY KEY AUTOINCREMENT
  exercise_id INTEGER NOT NULL REFERENCES exercises(id)
  reps INTEGER NOT NULL
  weight REAL NOT NULL
  rest_seconds INTEGER NULL
  set_order INTEGER NOT NULL DEFAULT 0
```

## Flux données hero

```
index.astro (statique)
  ↓ fetch('/api/session')
  ↓
/api/session.ts (server)
  ↓ getDb()
  ↓
better-sqlite3 → data/muscu.db
  ↓
Retour JSON: { active, exercise, rest_s, last_set }
  ↓
index.astro → remplace [data-meta] pills
```

**Migration localStorage**: script inline POST `/api/migrate` si clés `muscu-*` détectées, puis efface localStorage.
