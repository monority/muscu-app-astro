/**
 * Type-safe localStorage wrapper for the muscu app.
 *
 * Provides CRUD for exercises, sessions, and progress records.
 * Falls back gracefully when localStorage is unavailable
 * (private browsing, SSR, disabled storage).
 */

// ============================================================================
// Types
// ============================================================================

export interface Exercise {
  id: string;
  name: string;
  muscle: string; // e.g. "Pectoraux", "Dos", "Jambes"
  category: string; // e.g. "Barre", "Haltère", "Machine", "Poids du corps"
  createdAt: string; // ISO date
  // ── User preference (added 2026-08-06) ──
  favorite?: boolean;
}

export type SetType = 'warmup' | 'work' | 'top' | 'drop' | 'failure';

export type RpeType = 'rpe' | 'urpe';

/** Selectable per-set RPE values (10 → 4 by 0.5 steps). */
export const RPE_OPTIONS: number[] = [10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6, 5.5, 5, 4.5, 4];

export interface SessionSet {
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  /**
   * Perceived effort for this set, 0-10 in 0.5 steps (e.g. 7.5).
   * Optional + nullable so sessions saved before the per-set RPE feature
   * stay parseable — callers must treat null/undefined as "not logged".
   */
  rpe?: number | null;
  /** Whether `rpe` is an RPE or uRPE value. Absent ⇒ treat as 'rpe'. */
  rpeType?: RpeType;
  type: SetType;
  completed: boolean;
}

export type SessionStatus = 'in-progress' | 'completed' | 'planned';

export type SessionMood = 'great' | 'good' | 'ok' | 'tired' | 'bad';

/**
 * A superset groups 2+ exercises that are performed back-to-back
 * without rest. Stored on the session as an array of groups; each
 * group references the `exerciseId` of the participating exercises.
 */
export interface Superset {
  exercises: string[]; // exerciseIds
}

export interface SessionExercise {
  exerciseId: string;
  name: string;
  muscle: string;
  sets: SessionSet[];
}

export interface Session {
  id: string;
  sourceSessionId?: string;
  name: string;
  date: string; // ISO date
  duration?: number; // seconds
  exercises: SessionExercise[];
  status: SessionStatus;
  // ── Optional post-session notes (added 2026-08-04) ──
  notes?: string;
  rpe?: number; // session-level RPE, 1-10
  fatigue?: number; // fatigue level, 1-5
  mood?: SessionMood;
  // ── Superset groups (added 2026-08-04) ──
  // Optional to keep older sessions clean. Each entry lists 2+ exerciseIds
  // that the user has grouped into a superset/circuit.
  supersets?: Superset[];
}

export interface ProgressRecord {
  exerciseId: string;
  date: string;
  estimated1RM: number;
  bestWeight: number;
  bestReps: number;
}

/**
 * Body composition snapshot. Stored under `muscu:body` and used by
 * the /progression/poids page to chart weight + measurements over time.
 * All measurements are optional except `date` and `weight`.
 */
export interface BodyRecord {
  date: string; // ISO date (YYYY-MM-DD)
  weight: number; // kg
  arm?: number; // cm
  chest?: number; // cm
  waist?: number; // cm
  hips?: number; // cm
}

export type WeightUnit = 'kg' | 'lbs';
export type RepsFormat = 'simple' | 'range';

/**
 * Session reminder configuration (added 2026-08-09).
 * `days` uses JavaScript `Date#getDay()` indexing: 0 = Sunday …
 * 6 = Saturday. `time` is a "HH:MM" string in 24h local time.
 */
export interface ReminderSettings {
  enabled: boolean;
  days: number[];
  time: string; // "HH:MM"
}

export interface Settings {
  pseudo: string;
  email: string;
  unit: WeightUnit;
  repsFormat: RepsFormat;
  defaultRestTime: number; // seconds
  soundAlerts: boolean;
  weeklyGoal: number; // sessions per week (1-7)
  // ── Latest known body weight (added 2026-08-04) ──
  // Mirrored from the most recent BodyRecord so the settings
  // page can show a quick "current weight" without reading
  // the body store separately.
  bodyWeight?: number;
  // ── Session reminders (added 2026-08-09) ──
  // Nested object so older localStorage payloads merge safely
  // through the DEFAULT_SETTINGS fallback in `getSettings()`.
  reminders: ReminderSettings;
  // ── WebDAV sync (added 2026-08-10) ──
  // Credentials live in localStorage only (never sent anywhere but the
  // user-configured WebDAV host). `lastSyncAt` drives the "last sync"
  // status line on the settings page.
  webdav: WebdavSettings;
  // ── Community benchmarks opt-in (added 2026-08-10) ──
  // Records INTENT only: no server exists yet, so enabling this never
  // triggers a network request. It is the flag a future anonymized
  // cohort upload will read once Supabase sync ships.
  benchmarksOptIn: boolean;
}

/**
 * WebDAV account for the manual sync section on the settings page.
 * The password is stored in plain localStorage — a deliberate tradeoff
 * documented in the UI (this app is 100% offline/local-first).
 */
export interface WebdavSettings {
  url: string;
  username: string;
  password: string;
  /** ISO timestamp of the last successful push/pull ('' when never). */
  lastSyncAt?: string;
}

// ============================================================================
// Constants
// ============================================================================

export const STORAGE_KEYS = {
  exercises: 'muscu:exercises',
  sessions: 'muscu:sessions',
  progress: 'muscu:progress',
  settings: 'muscu-settings',
  body: 'muscu:body',
  // Cooldown marker for the session reminder watcher: stores the
  // last notified "YYYY-MM-DD HH:MM" slot so a minutely reminder is
  // never fired repeatedly for the same minute/session.
  reminderNotified: 'muscu:reminder-notified',
} as const;

export const DEFAULT_REMINDERS: ReminderSettings = {
  enabled: false,
  days: [1, 3, 5], // Mon, Wed, Fri
  time: '18:00',
};

export const DEFAULT_WEBDAV: WebdavSettings = {
  url: '',
  username: '',
  password: '',
};

export const DEFAULT_SETTINGS: Settings = {
  pseudo: '',
  email: '',
  unit: 'kg',
  repsFormat: 'simple',
  defaultRestTime: 90,
  soundAlerts: true,
  weeklyGoal: 3,
  reminders: DEFAULT_REMINDERS,
  webdav: DEFAULT_WEBDAV,
  benchmarksOptIn: false,
};

const DEFAULT_EXERCISES: ReadonlyArray<{
  name: string;
  muscle: string;
  category: string;
}> = [
  // ── Pectoraux ──
  { name: 'Développé couché barre', muscle: 'Pectoraux', category: 'Barre' },
  { name: 'Développé couché haltères', muscle: 'Pectoraux', category: 'Haltère' },
  { name: 'Développé incliné barre', muscle: 'Pectoraux', category: 'Barre' },
  { name: 'Développé incliné haltères', muscle: 'Pectoraux', category: 'Haltère' },
  { name: 'Développé décliné barre', muscle: 'Pectoraux', category: 'Barre' },
  { name: 'Écarté poulie haute', muscle: 'Pectoraux', category: 'Poulie' },
  { name: 'Écarté poulie basse', muscle: 'Pectoraux', category: 'Poulie' },
  { name: 'Pullover haltère', muscle: 'Pectoraux', category: 'Haltère' },
  { name: 'Pec deck', muscle: 'Pectoraux', category: 'Machine' },
  { name: 'Dips pectoraux', muscle: 'Pectoraux', category: 'Poids du corps' },

  // ── Dos ──
  { name: 'Soulevé de terre barre', muscle: 'Dos', category: 'Barre' },
  { name: 'Rowing barre', muscle: 'Dos', category: 'Barre' },
  { name: 'Rowing haltère unilatéral', muscle: 'Dos', category: 'Haltère' },
  { name: 'Rowing poulie basse', muscle: 'Dos', category: 'Poulie' },
  { name: 'Tractions pronation', muscle: 'Dos', category: 'Poids du corps' },
  { name: 'Tractions supination', muscle: 'Dos', category: 'Poids du corps' },
  { name: 'Tractions neutral grip', muscle: 'Dos', category: 'Poids du corps' },
  { name: 'Tirage vertical poulie', muscle: 'Dos', category: 'Poulie' },
  { name: 'Tirage horizontal poulie', muscle: 'Dos', category: 'Poulie' },
  { name: 'Tirage nuque', muscle: 'Dos', category: 'Poulie' },
  { name: 'Rack pull', muscle: 'Dos', category: 'Barre' },
  { name: 'Hyperextension', muscle: 'Dos', category: 'Poids du corps' },
  { name: 'Rowing T-bar', muscle: 'Dos', category: 'Machine' },

  // ── Épaules ──
  { name: 'Développé militaire barre', muscle: 'Épaules', category: 'Barre' },
  { name: 'Développé haltères assis', muscle: 'Épaules', category: 'Haltère' },
  { name: 'Développé Arnold', muscle: 'Épaules', category: 'Haltère' },
  { name: 'Élévations latérales haltères', muscle: 'Épaules', category: 'Haltère' },
  { name: 'Élévations latérales poulie', muscle: 'Épaules', category: 'Poulie' },
  { name: 'Élévations frontales haltères', muscle: 'Épaules', category: 'Haltère' },
  { name: 'Élévations frontales barre', muscle: 'Épaules', category: 'Barre' },
  { name: 'Face pulls poulie', muscle: 'Épaules', category: 'Poulie' },
  { name: 'Shrugs barre', muscle: 'Épaules', category: 'Barre' },
  { name: 'Shrugs haltères', muscle: 'Épaules', category: 'Haltère' },
  { name: 'Oiseau haltères', muscle: 'Épaules', category: 'Haltère' },
  { name: 'Rowing menton barre', muscle: 'Épaules', category: 'Barre' },

  // ── Biceps ──
  { name: 'Curl barre droite', muscle: 'Biceps', category: 'Barre' },
  { name: 'Curl barre EZ', muscle: 'Biceps', category: 'Barre' },
  { name: 'Curl haltères', muscle: 'Biceps', category: 'Haltère' },
  { name: 'Curl marteau haltères', muscle: 'Biceps', category: 'Haltère' },
  { name: 'Curl concentré', muscle: 'Biceps', category: 'Haltère' },
  { name: 'Curl incliné haltères', muscle: 'Biceps', category: 'Haltère' },
  { name: 'Curl poulie basse', muscle: 'Biceps', category: 'Poulie' },
  { name: 'Curl poulie haute', muscle: 'Biceps', category: 'Poulie' },
  { name: 'Curl pupitre', muscle: 'Biceps', category: 'Machine' },

  // ── Triceps ──
  { name: 'Extension poulie haute', muscle: 'Triceps', category: 'Poulie' },
  { name: 'Extension haltère nuque', muscle: 'Triceps', category: 'Haltère' },
  { name: 'Barre au front', muscle: 'Triceps', category: 'Barre' },
  { name: 'Dips triceps', muscle: 'Triceps', category: 'Poids du corps' },
  { name: 'Kickbacks haltères', muscle: 'Triceps', category: 'Haltère' },
  { name: 'Extension corde poulie', muscle: 'Triceps', category: 'Poulie' },
  { name: 'Skull crushers', muscle: 'Triceps', category: 'Barre' },

  // ── Quadriceps ──
  { name: 'Squat barre', muscle: 'Quadriceps', category: 'Barre' },
  { name: 'Squat goblet', muscle: 'Quadriceps', category: 'Haltère' },
  { name: 'Front squat', muscle: 'Quadriceps', category: 'Barre' },
  { name: 'Presse à cuisses', muscle: 'Quadriceps', category: 'Machine' },
  { name: 'Fentes marche haltères', muscle: 'Quadriceps', category: 'Haltère' },
  { name: 'Fentes barre', muscle: 'Quadriceps', category: 'Barre' },
  { name: 'Leg extension', muscle: 'Quadriceps', category: 'Machine' },
  { name: 'Squat hack', muscle: 'Quadriceps', category: 'Machine' },
  { name: 'Bulgarian split squat', muscle: 'Quadriceps', category: 'Haltère' },
  { name: 'Pistol squat', muscle: 'Quadriceps', category: 'Poids du corps' },

  // ── Ischio-jambiers ──
  { name: 'Leg curl couché', muscle: 'Ischio-jambiers', category: 'Machine' },
  { name: 'Leg curl assis', muscle: 'Ischio-jambiers', category: 'Machine' },
  { name: 'Soulevé de terre jambes tendues', muscle: 'Ischio-jambiers', category: 'Barre' },
  { name: 'Soulevé de terre roumain', muscle: 'Ischio-jambiers', category: 'Barre' },
  { name: 'Good morning barre', muscle: 'Ischio-jambiers', category: 'Barre' },
  { name: 'Hip thrust barre', muscle: 'Ischio-jambiers', category: 'Barre' },
  { name: 'Nordic curl', muscle: 'Ischio-jambiers', category: 'Poids du corps' },

  // ── Fessiers ──
  { name: 'Hip thrust barre (fessiers)', muscle: 'Fessiers', category: 'Barre' },
  { name: 'Cable pull-through', muscle: 'Fessiers', category: 'Poulie' },
  { name: 'Squat sumo haltère', muscle: 'Fessiers', category: 'Haltère' },
  { name: 'Fentes marche (fessiers)', muscle: 'Fessiers', category: 'Haltère' },
  { name: 'Step-up haltères', muscle: 'Fessiers', category: 'Haltère' },
  { name: 'Pont fessier', muscle: 'Fessiers', category: 'Poids du corps' },

  // ── Mollets ──
  { name: 'Mollets debout machine', muscle: 'Mollets', category: 'Machine' },
  { name: 'Mollets assis machine', muscle: 'Mollets', category: 'Machine' },
  { name: 'Mollets marche', muscle: 'Mollets', category: 'Haltère' },
  { name: 'Mollets cheval', muscle: 'Mollets', category: 'Machine' },

  // ── Abdominaux ──
  { name: 'Crunch', muscle: 'Abdominaux', category: 'Poids du corps' },
  { name: 'Crunch poulie', muscle: 'Abdominaux', category: 'Poulie' },
  { name: 'Planche', muscle: 'Abdominaux', category: 'Poids du corps' },
  { name: 'Russian twists', muscle: 'Abdominaux', category: 'Haltère' },
  { name: 'Relevé de jambes', muscle: 'Abdominaux', category: 'Poids du corps' },
  { name: 'Roue abdominale', muscle: 'Abdominaux', category: 'Machine' },
  { name: 'Pallof press', muscle: 'Abdominaux', category: 'Poulie' },
  { name: 'Dead bug', muscle: 'Abdominaux', category: 'Poids du corps' },
  { name: 'Mountain climbers', muscle: 'Abdominaux', category: 'Poids du corps' },

  // ── Avant-bras ──
  { name: 'Curl revers haltères', muscle: 'Avant-bras', category: 'Haltère' },
  { name: 'Curl revers barre', muscle: 'Avant-bras', category: 'Barre' },
  { name: 'Curl poignet barre', muscle: 'Avant-bras', category: 'Barre' },
];

// ============================================================================
// Generic helpers
// ============================================================================

export function getStore<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setStore<T>(key: string, value: T): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded, private mode, or storage disabled — silently no-op
  }
}

// ============================================================================
// Utilities
// ============================================================================

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // fall through to fallback
    }
  }
  // Fallback: time + random base36
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/**
 * Estimated 1RM via the Epley formula: weight × (1 + reps / 30).
 * Returns 0 for non-positive inputs, weight as-is for a single rep.
 */
export function calculate1RM(weight: number, reps: number): number {
  if (!Number.isFinite(weight) || !Number.isFinite(reps)) return 0;
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

// ============================================================================
// Exercises
// ============================================================================

export function getExercises(): Exercise[] {
  const existing = getStore<Exercise[]>(STORAGE_KEYS.exercises, []);

  // Merge: find defaults not yet in the user's list (by name+muscle match)
  const now = new Date().toISOString();
  const existingKeys = new Set(
    existing.map((e) => `${e.name}|||${e.muscle}`),
  );
  const missing = DEFAULT_EXERCISES.filter(
    (d) => !existingKeys.has(`${d.name}|||${d.muscle}`),
  );

  if (missing.length > 0) {
    const merged = [
      ...existing,
      ...missing.map((ex) => ({
        id: generateId(),
        name: ex.name,
        muscle: ex.muscle,
        category: ex.category,
        createdAt: now,
      })),
    ];
    setStore(STORAGE_KEYS.exercises, merged);
    return merged;
  }

  if (existing.length > 0) return existing;

  // First run: seed everything
  const seeded: Exercise[] = DEFAULT_EXERCISES.map((ex) => ({
    id: generateId(),
    name: ex.name,
    muscle: ex.muscle,
    category: ex.category,
    createdAt: now,
  }));
  setStore(STORAGE_KEYS.exercises, seeded);
  return seeded;
}

export function saveExercise(
  exercise: Omit<Exercise, 'id' | 'createdAt'>,
): Exercise {
  const all = getExercises();
  const created: Exercise = {
    ...exercise,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  all.push(created);
  setStore(STORAGE_KEYS.exercises, all);
  return created;
}

export function updateExercise(id: string, updates: Partial<Exercise>): void {
  const all = getExercises();
  const index = all.findIndex((ex) => ex.id === id);
  if (index === -1) return;
  all[index] = { ...all[index], ...updates, id: all[index].id };
  setStore(STORAGE_KEYS.exercises, all);
}

export function deleteExercise(id: string): void {
  const all = getExercises().filter((ex) => ex.id !== id);
  setStore(STORAGE_KEYS.exercises, all);
}

export function getExerciseById(id: string): Exercise | undefined {
  return getExercises().find((ex) => ex.id === id);
}

/** Toggles the `favorite` flag and returns the new state. */
export function toggleExerciseFavorite(id: string): boolean {
  const all = getExercises();
  const index = all.findIndex((ex) => ex.id === id);
  if (index === -1) return false;
  const next = !all[index].favorite;
  all[index] = { ...all[index], favorite: next };
  setStore(STORAGE_KEYS.exercises, all);
  return next;
}

// ============================================================================
// Sessions
// ============================================================================

/**
 * Normalizes numeric fields at the read boundary. Older local-first
 * versions and JSON imports may contain input values as strings; keeping
 * that detail out of the progression screens prevents valid historical
 * sessions from disappearing when `Number.isFinite` is used in calculations.
 */
function normalizeSession(session: Session): Session {
  return {
    ...session,
    exercises: Array.isArray(session.exercises)
      ? session.exercises.map((exercise) => ({
          ...exercise,
          sets: Array.isArray(exercise.sets)
            ? exercise.sets.map((set) => ({
                ...set,
                setNumber: Number(set.setNumber) || 0,
                weight: Number(set.weight) || 0,
                reps: Number(set.reps) || 0,
                rpe: set.rpe == null ? set.rpe : Number(set.rpe),
              }))
            : [],
        }))
      : [],
  };
}

export function getSessions(): Session[] {
  const raw = getStore<Session[]>(STORAGE_KEYS.sessions, []);
  return Array.isArray(raw) ? raw.map(normalizeSession) : [];
}

export function saveSession(session: Omit<Session, 'id'>): Session {
  const all = getSessions();
  const created: Session = {
    ...session,
    id: generateId(),
  };
  all.push(created);
  setStore(STORAGE_KEYS.sessions, all);
  return created;
}

export function updateSession(id: string, updates: Partial<Session>): void {
  const all = getSessions();
  const index = all.findIndex((s) => s.id === id);
  if (index === -1) return;
  all[index] = { ...all[index], ...updates, id: all[index].id };
  setStore(STORAGE_KEYS.sessions, all);
}

export function deleteSession(id: string): void {
  const all = getSessions().filter((s) => s.id !== id);
  setStore(STORAGE_KEYS.sessions, all);
}

export function getSessionById(id: string): Session | undefined {
  return getSessions().find((s) => s.id === id);
}

/**
 * Returns all sessions whose `date` field exactly matches the given
 * YYYY-MM-DD string. Comparison is strict (no prefix matching) — the
 * app consistently stores session dates as `YYYY-MM-DD` via
 * `new Date().toISOString().split('T')[0]`, so this works for every
 * session produced by the rest of the codebase. Used by the
 * /calendar page to list the sessions for a clicked day.
 */
export function getSessionsByDate(date: string): Session[] {
  return getSessions().filter((s) => s.date === date);
}

/**
 * Returns all sessions whose local-time year/month match the provided
 * values. `month` is zero-indexed (0 = January) to match `Date#getMonth`.
 * Used by the /calendar page to build the monthly summary stats.
 */
export function getSessionsByMonth(year: number, month: number): Session[] {
  return getSessions().filter((s) => {
    const d = new Date(s.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

/**
 * Returns the completed sessions whose date falls in the current week.
 * "Week" is anchored to Sunday (getDay() === 0) at 00:00 local time,
 * matching the dashboard's weekly-goal cadence.
 */
export function getSessionsThisWeek(): Session[] {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  return getSessions().filter((s) => {
    if (s.status !== 'completed') return false;
    const d = new Date(s.date);
    return d >= startOfWeek;
  });
}

// ============================================================================
// Body measurements (added 2026-08-04)
// ============================================================================

/**
 * Returns all body composition records, sorted oldest → newest by date.
 * Defensive sort: invalid dates sort to the end so they don't break the chart.
 */
export function getBodyRecords(): BodyRecord[] {
  const raw = getStore<BodyRecord[]>(STORAGE_KEYS.body, []);
  const normalized = Array.isArray(raw)
    ? raw.map((record) => ({
        ...record,
        weight: Number(record.weight) || 0,
        ...(record.arm == null ? {} : { arm: Number(record.arm) || 0 }),
        ...(record.chest == null ? {} : { chest: Number(record.chest) || 0 }),
        ...(record.waist == null ? {} : { waist: Number(record.waist) || 0 }),
        ...(record.hips == null ? {} : { hips: Number(record.hips) || 0 }),
      }))
    : [];
  // Imports from older versions may contain duplicate daily snapshots.
  // Keep the last value for a date, matching addBodyRecord's upsert rule.
  const byDate = new Map<string, BodyRecord>();
  for (const record of normalized) byDate.set(record.date, record);

  return [...byDate.values()].sort((a, b) => {
    const ta = new Date(a.date).getTime();
    const tb = new Date(b.date).getTime();
    if (isNaN(ta) && isNaN(tb)) return 0;
    if (isNaN(ta)) return 1;
    if (isNaN(tb)) return -1;
    return ta - tb;
  });
}

/**
 * Appends a body record and updates the settings.bodyWeight mirror so
 * the settings page always shows the most recent weight.
 */
export function addBodyRecord(record: BodyRecord): void {
  const all = getStore<BodyRecord[]>(STORAGE_KEYS.body, []);
  const existingIndex = all.findIndex((entry) => entry.date === record.date);
  if (existingIndex >= 0) {
    // A body snapshot is daily: editing today's entry replaces it instead
    // of creating duplicate chart points and ambiguous interval boundaries.
    all[existingIndex] = record;
  } else {
    all.push(record);
  }
  setStore(STORAGE_KEYS.body, all);
  // Mirror the latest weight into settings for quick display.
  if (Number.isFinite(record.weight) && record.weight > 0) {
    updateSettings({ bodyWeight: record.weight });
  }
}

export function deleteBodyRecord(date: string): void {
  const filtered = getStore<BodyRecord[]>(STORAGE_KEYS.body, []).filter(
    (r) => r.date !== date,
  );
  setStore(STORAGE_KEYS.body, filtered);

  // Keep the settings mirror aligned when the latest measurement is removed.
  const bodyRecords = getBodyRecords();
  const latest = bodyRecords[bodyRecords.length - 1];
  const settings = getSettings();
  if (latest) settings.bodyWeight = latest.weight;
  else delete settings.bodyWeight;
  saveSettings(settings);
}

// ============================================================================
// Settings
// ============================================================================

/**
 * Returns the persisted settings, merged with defaults so newly-added keys
 * always have a safe value when an older payload is in localStorage.
 */
export function getSettings(): Settings {
  const stored = getStore<Partial<Settings>>(STORAGE_KEYS.settings, {});
  return { ...DEFAULT_SETTINGS, ...stored };
}

export function saveSettings(settings: Settings): void {
  setStore(STORAGE_KEYS.settings, settings);
}

export function updateSettings(updates: Partial<Settings>): Settings {
  const next = { ...getSettings(), ...updates };
  setStore(STORAGE_KEYS.settings, next);
  return next;
}

// ============================================================================
// Data export / import / reset
// ============================================================================

export interface AppDataSnapshot {
  version: number;
  exportedAt: string;
  exercises: Exercise[];
  sessions: Session[];
  progress: ProgressRecord[];
  body: BodyRecord[];
  settings: Settings;
}

const SNAPSHOT_VERSION = 1;
const APP_DATA_KEYS: ReadonlyArray<{ key: string; match: RegExp }> = [
  { key: STORAGE_KEYS.exercises, match: /^muscu:exercises$/ },
  { key: STORAGE_KEYS.sessions, match: /^muscu:sessions$/ },
  { key: STORAGE_KEYS.progress, match: /^muscu:progress$/ },
  { key: STORAGE_KEYS.settings, match: /^muscu-settings$/ },
  { key: STORAGE_KEYS.body, match: /^muscu:body$/ },
  { key: STORAGE_KEYS.reminderNotified, match: /^muscu:reminder-notified$/ },
];

/**
 * Builds a JSON snapshot of all app data (exercises, sessions, progress,
 * settings) for export. Returns `null` when localStorage is unavailable.
 */
export function exportAllData(): AppDataSnapshot | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return {
    version: SNAPSHOT_VERSION,
    exportedAt: new Date().toISOString(),
    exercises: getExercises(),
    sessions: getSessions(),
    progress: getStore<ProgressRecord[]>(STORAGE_KEYS.progress, []),
    body: getStore<BodyRecord[]>(STORAGE_KEYS.body, []),
    settings: getSettings(),
  };
}

/**
 * RFC 4180 field escaping: wraps the value in double quotes when it contains
 * a comma, quote, CR, or LF, and doubles any internal quotes. Numbers are
 * coerced through `String()` for symmetry with the string branch.
 */
function csvEscape(value: string | number): string {
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * CSV cell for a set's RPE: "RPE 7.5" or "uRPE 7", or '' when absent.
 * uRPE sets are prefixed so the exported spreadsheet stays self-explanatory.
 */
function formatSetRpeCsv(set: SessionSet): string {
  const v = typeof set.rpe === 'string' ? Number(set.rpe) : set.rpe;
  if (v == null || !Number.isFinite(v)) return '';
  return (set.rpeType === 'urpe' ? 'uRPE ' : 'RPE ') + v;
}

/**
 * 1-based ordinal of the superset group the given exercise belongs to
 * (per the persisted `session.supersets` array), or 0 when the exercise
 * is not part of any superset. Sessions saved before the superset feature
 * simply have no `supersets` field → 0 → empty CSV cell.
 */
function supersetGroupOrdinal(session: Session, exerciseId: string): number {
  if (!session.supersets) return 0;
  const idx = session.supersets.findIndex((g) => g.exercises.includes(exerciseId));
  return idx >= 0 ? idx + 1 : 0;
}

/**
 * Builds a CSV string from the given sessions with one row per set, suitable
 * for import into a spreadsheet. Columns:
 *   Date, Nom, Exercice, Série, Type, Charge (kg), Répétitions, 1RM estimé, RPE, Superset.
 * The estimated 1RM uses the Epley formula via `calculate1RM`. The RPE column
 * carries a prefixed label ("RPE 7.5" / "uRPE 7") and is empty when a set has
 * no RPE logged (e.g. sessions saved before the feature existed). The Superset
 * column holds the 1-based group number of the exercise and is empty when the
 * exercise is not grouped (added 2026-08-09).
 */
export function sessionsToCsv(sessions: Session[]): string {
  const header = 'Date,Nom,Exercice,Série,Type,Charge (kg),Répétitions,1RM estimé,RPE,Superset';
  const rows = sessions.flatMap((session) =>
    session.exercises.flatMap((exercise) =>
      exercise.sets.map((set, i) =>
        [
          csvEscape(session.date),
          csvEscape(session.name),
          csvEscape(exercise.name),
          i + 1,
          set.type,
          set.weight,
          set.reps,
          Math.round(calculate1RM(set.weight, set.reps)),
          csvEscape(formatSetRpeCsv(set)),
          supersetGroupOrdinal(session, exercise.exerciseId) || '',
        ].join(','),
      ),
    ),
  );
  return [header, ...rows].join('\n');
}

/**
 * Bulk export: CSV of every session in localStorage. Delegates to the pure
 * `sessionsToCsv` so per-session sheets can reuse the exact same pipeline.
 */
export function exportSessionsAsCSV(): string {
  return sessionsToCsv(getSessions());
}

/**
 * Per-session export: CSV of a single session, using the same columns and
 * formulas as the bulk export (used by the « Fiche » action on the detail
 * page). One row per set.
 */
export function exportSessionAsCsv(session: Session): string {
  return sessionsToCsv([session]);
}

/**
 * Restores a snapshot previously produced by `exportAllData`. Throws on
 * invalid payload so the caller can show a user-facing error.
 */
export function importAllData(snapshot: unknown): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    throw new Error('Stockage local indisponible.');
  }
  if (!snapshot || typeof snapshot !== 'object') {
    throw new Error('Fichier de sauvegarde invalide.');
  }
  const data = snapshot as Partial<AppDataSnapshot>;
  if (typeof data.version !== 'number') {
    throw new Error('Version de sauvegarde manquante.');
  }
  if (data.version > SNAPSHOT_VERSION) {
    throw new Error(
      `Sauvegarde trop récente (v${data.version}). Mettez l'application à jour.`,
    );
  }
  if (data.exercises && !Array.isArray(data.exercises)) {
    throw new Error('Liste d\u2019exercices invalide.');
  }
  if (data.sessions && !Array.isArray(data.sessions)) {
    throw new Error('Liste de séances invalide.');
  }
  if (data.progress && !Array.isArray(data.progress)) {
    throw new Error('Historique de progression invalide.');
  }
  if (data.body && !Array.isArray(data.body)) {
    throw new Error('Historique de mesures corporelles invalide.');
  }
  if (data.settings && typeof data.settings !== 'object') {
    throw new Error('Réglages invalides.');
  }

  if (data.exercises) setStore(STORAGE_KEYS.exercises, data.exercises);
  if (data.sessions) setStore(STORAGE_KEYS.sessions, data.sessions);
  if (data.progress) setStore(STORAGE_KEYS.progress, data.progress);
  if (data.body) setStore(STORAGE_KEYS.body, data.body);
  if (data.settings) {
    setStore(STORAGE_KEYS.settings, { ...DEFAULT_SETTINGS, ...data.settings });
  }
}

/**
 * Wipes every muscu app key from localStorage. Settings fall back to
 * defaults; exercises/sessions/progress are emptied (a re-seed happens
 * lazily on the next `getExercises()` call).
 */
export function resetAllData(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    for (const { key } of APP_DATA_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // ignore — best-effort wipe
  }
}
