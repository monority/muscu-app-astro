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
}

export interface ProgressRecord {
  exerciseId: string;
  date: string;
  estimated1RM: number;
  bestWeight: number;
  bestReps: number;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEYS = {
  exercises: 'muscu:exercises',
  sessions: 'muscu:sessions',
  progress: 'muscu:progress',
} as const;

const DEFAULT_EXERCISES: ReadonlyArray<{
  name: string;
  muscle: string;
  category: string;
}> = [
  { name: 'Développé couché', muscle: 'Pectoraux', category: 'Barre' },
  { name: 'Squat barre', muscle: 'Quadriceps', category: 'Barre' },
  { name: 'Soulevé de terre', muscle: 'Dos', category: 'Barre' },
  { name: 'Développé militaire', muscle: 'Épaules', category: 'Barre' },
  { name: 'Rowing barre', muscle: 'Dos', category: 'Barre' },
  { name: 'Tractions', muscle: 'Dos', category: 'Poids du corps' },
  { name: 'Curl biceps', muscle: 'Biceps', category: 'Haltère' },
  { name: 'Extension triceps', muscle: 'Triceps', category: 'Machine' },
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
  if (existing.length > 0) return existing;

  // Seed with defaults on first run
  const now = new Date().toISOString();
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
