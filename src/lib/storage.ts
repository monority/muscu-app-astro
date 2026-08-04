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
}

export type SetType = 'warmup' | 'work' | 'top' | 'drop' | 'failure';

export interface SessionSet {
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
  type: SetType;
  completed: boolean;
}

export type SessionStatus = 'in-progress' | 'completed' | 'planned';

export type SessionMood = 'great' | 'good' | 'ok' | 'tired' | 'bad';

export interface SessionExercise {
  exerciseId: string;
  name: string;
  muscle: string;
  sets: SessionSet[];
}

export interface Session {
  id: string;
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
}

export interface ProgressRecord {
  exerciseId: string;
  date: string;
  estimated1RM: number;
  bestWeight: number;
  bestReps: number;
}

export type WeightUnit = 'kg' | 'lbs';
export type RepsFormat = 'simple' | 'range';

export interface Settings {
  pseudo: string;
  email: string;
  unit: WeightUnit;
  repsFormat: RepsFormat;
  defaultRestTime: number; // seconds
  soundAlerts: boolean;
  weeklyGoal: number; // sessions per week (1-7)
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEYS = {
  exercises: 'muscu:exercises',
  sessions: 'muscu:sessions',
  progress: 'muscu:progress',
  settings: 'muscu-settings',
} as const;

export const DEFAULT_SETTINGS: Settings = {
  pseudo: '',
  email: '',
  unit: 'kg',
  repsFormat: 'simple',
  defaultRestTime: 90,
  soundAlerts: true,
  weeklyGoal: 3,
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

function removeStore(key: string): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
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

// ============================================================================
// Sessions
// ============================================================================

export function getSessions(): Session[] {
  return getStore<Session[]>(STORAGE_KEYS.sessions, []);
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

export function getSessionsByExercise(exerciseId: string): Session[] {
  return getSessions().filter((s) =>
    s.exercises.some((se) => se.exerciseId === exerciseId),
  );
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
// Progress
// ============================================================================

export function getProgressRecords(exerciseId: string): ProgressRecord[] {
  return getStore<ProgressRecord[]>(STORAGE_KEYS.progress, []).filter(
    (r) => r.exerciseId === exerciseId,
  );
}

export function addProgressRecord(
  record: Omit<ProgressRecord, 'estimated1RM'>,
): void {
  const estimated1RM = calculate1RM(record.bestWeight, record.bestReps);
  const all = getStore<ProgressRecord[]>(STORAGE_KEYS.progress, []);
  all.push({ ...record, estimated1RM });
  setStore(STORAGE_KEYS.progress, all);
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
  settings: Settings;
}

const SNAPSHOT_VERSION = 1;
const APP_DATA_KEYS: ReadonlyArray<{ key: string; match: RegExp }> = [
  { key: STORAGE_KEYS.exercises, match: /^muscu:exercises$/ },
  { key: STORAGE_KEYS.sessions, match: /^muscu:sessions$/ },
  { key: STORAGE_KEYS.progress, match: /^muscu:progress$/ },
  { key: STORAGE_KEYS.settings, match: /^muscu-settings$/ },
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
 * Builds a CSV string of all sessions with one row per set, suitable for
 * import into a spreadsheet. Columns:
 *   Date, Nom, Exercice, Série, Type, Charge (kg), Répétitions, 1RM estimé.
 * The estimated 1RM uses the Epley formula via `calculate1RM`.
 */
export function exportSessionsAsCSV(): string {
  const sessions = getSessions();
  const header = 'Date,Nom,Exercice,Série,Type,Charge (kg),Répétitions,1RM estimé';
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
        ].join(','),
      ),
    ),
  );
  return [header, ...rows].join('\n');
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
  if (data.settings && typeof data.settings !== 'object') {
    throw new Error('Réglages invalides.');
  }

  if (data.exercises) setStore(STORAGE_KEYS.exercises, data.exercises);
  if (data.sessions) setStore(STORAGE_KEYS.sessions, data.sessions);
  if (data.progress) setStore(STORAGE_KEYS.progress, data.progress);
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
