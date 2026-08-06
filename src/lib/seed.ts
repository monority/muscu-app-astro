/**
 * Demo data generator.
 *
 * Fills localStorage with a realistic training history so the whole app
 * (dashboard, séances, progression, calendrier, stats…) can be exercised
 * with meaningful data. Built for testing/demo — it REPLACES the current
 * sessions, progress and body stores with the generated dataset.
 *
 * The exercise library is left untouched: the seed uses `getExercises()`,
 * which lazily seeds the default library on first call.
 */

import {
  STORAGE_KEYS,
  getExercises,
  getSettings,
  getStore,
  setStore,
  resetAllData,
  generateId,
  type Exercise,
  type Session,
  type SessionExercise,
  type SessionSet,
  type SessionMood,
  type ProgressRecord,
  type BodyRecord,
  type Superset,
} from './storage';
import { getTemplateById, type TrainingTemplate } from './templates';

export interface SeedSummary {
  exercises: number;
  sessions: number;
  progressRecords: number;
  bodyRecords: number;
  completed: number;
  inProgress: number;
  planned: number;
  /** Ids useful for quickly jumping to a populated detail/compare view. */
  demoSessionId: string;
  compareId1: string;
  compareId2: string;
}

const DAY_MS = 86_400_000;
const START_WEEKS = 12;

/** UTC ISO date (YYYY-MM-DD), matching the app's session-date convention. */
function isoUTC(d: Date): string {
  return d.toISOString().split('T')[0];
}

function daysFromToday(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString().split('T')[0];
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

// ── Plausible starting weights (kg) for common lifts. Falls back by category.
const BASE_WEIGHT: Record<string, number> = {
  'Développé couché barre': 60,
  'Développé couché haltères': 22,
  'Développé incliné barre': 50,
  'Développé incliné haltères': 20,
  'Développé décliné barre': 55,
  'Développé militaire barre': 35,
  'Développé haltères assis': 18,
  'Développé Arnold': 16,
  'Squat barre': 80,
  'Front squat': 55,
  'Presse à cuisses': 120,
  'Squat goblet': 24,
  'Soulevé de terre barre': 100,
  'Soulevé de terre roumain': 70,
  'Soulevé de terre jambes tendues': 60,
  'Rowing barre': 50,
  'Rowing haltère unilatéral': 24,
  'Rowing poulie basse': 55,
  'Tirage vertical poulie': 55,
  'Tirage horizontal poulie': 50,
  'Leg extension': 55,
  'Leg curl couché': 45,
  'Leg curl assis': 45,
  'Élévations latérales haltères': 8,
  'Élévations latérales poulie': 15,
  'Face pulls poulie': 25,
  'Curl barre EZ': 30,
  'Curl barre droite': 30,
  'Curl haltères': 12,
  'Curl marteau haltères': 12,
  'Curl poulie basse': 30,
  'Extension poulie haute': 35,
  'Extension corde poulie': 30,
  'Barre au front': 30,
  'Écarté poulie haute': 20,
  'Écarté poulie basse': 20,
  'Pec deck': 55,
  'Mollets debout machine': 70,
  'Mollets assis machine': 50,
  'Cable pull-through': 35,
  'Hip thrust barre': 100,
  'Squat sumo haltère': 20,
  'Rack pull': 120,
  'Hip thrust barre (fessiers)': 90,
};

const CATEGORY_BASE: Record<string, number> = {
  Barre: 40,
  Haltère: 14,
  Machine: 50,
  Poulie: 35,
  'Poids du corps': 0,
};

/** Lifts that clearly progress (+12%) over the seeded period. */
const PROGRESSING = new Set<string>([
  'Développé couché barre',
  'Squat barre',
  'Soulevé de terre barre',
  'Développé militaire barre',
  'Rowing barre',
  'Presse à cuisses',
  'Hip thrust barre',
]);

function weightFor(name: string, category: string, t: number): number {
  const base = BASE_WEIGHT[name] ?? CATEGORY_BASE[category] ?? 20;
  if (base <= 0) return 0;
  if (PROGRESSING.has(name)) return Math.round(base * (1 + 0.12 * t));
  return Math.max(1, Math.round(base * (0.97 + Math.random() * 0.06)));
}

function buildSets(
  exerciseId: string,
  defaultSets: number,
  defaultReps: number,
  weight: number,
  completed: boolean,
): SessionSet[] {
  const sets: SessionSet[] = [];
  for (let i = 0; i < defaultSets; i++) {
    if (weight > 0 && i === 0 && defaultSets >= 4) {
      // Compound lift → one light warm-up set first.
      sets.push({
        exerciseId,
        setNumber: i + 1,
        weight: Math.round(weight * 0.5),
        reps: Math.max(8, defaultReps + 2),
        type: 'warmup',
        completed,
      });
    } else {
      const reps = Math.max(
        1,
        defaultReps + (i === defaultSets - 1 ? 1 : 0) + (Math.random() < 0.3 ? -1 : 0),
      );
      sets.push({
        exerciseId,
        setNumber: i + 1,
        weight,
        reps,
        rpe: completed ? 7 + Math.round(Math.random() * 2) : undefined,
        type: 'work',
        completed,
      });
    }
  }
  return sets;
}

const MOODS: SessionMood[] = ['great', 'good', 'good', 'ok'];
const NOTES = [
  'Bonne séance, sensations au rendez-vous.',
  'Progression sur les deux premiers mouvements.',
  'Fatigué en fin de séance mais série complète.',
  'Dos bien engagé, exécution propre.',
  'Repos insuffisant hier, séance correcte quand même.',
];

function templateExercises(
  template: TrainingTemplate,
  byName: Map<string, Exercise>,
  t: number,
  completed: boolean,
): SessionExercise[] {
  return template.exercises
    .map((te) => {
      const ex = byName.get(te.name);
      if (!ex) return null;
      const weight = weightFor(te.name, ex.category, t);
      return {
        exerciseId: ex.id,
        name: ex.name,
        muscle: ex.muscle,
        sets: buildSets(ex.id, te.defaultSets, te.defaultReps, weight, completed),
      };
    })
    .filter((x): x is SessionExercise => x !== null);
}

/**
 * Replaces the sessions / progress / body stores with a full demo dataset:
 * ~12 weeks of completed sessions (PPL + Upper/Lower + Full Body rotation),
 * one in-progress and one planned session, per-lift progress records and
 * weekly body measurements. Returns a summary + a few ids for quick demos.
 */
export function generateDemoData(): SeedSummary {
  const exercises = getExercises();
  const byName = new Map(exercises.map((e) => [e.name, e]));

  // Replace the demo-able stores (exercises/settings handled separately).
  setStore(STORAGE_KEYS.sessions, []);
  setStore(STORAGE_KEYS.progress, []);
  setStore(STORAGE_KEYS.body, []);

  const sessions: Session[] = [];
  const progress: ProgressRecord[] = [];
  const body: BodyRecord[] = [];

  // ── 12-week schedule: Mon/Wed/Fri, cycling through the templates ──
  const templateIds = ['ppl-push', 'ppl-pull', 'ppl-legs', 'upper-lower-upper', 'upper-lower-lower', 'full-body', 'bro-split-chest', 'bro-split-back'];
  const startDate = new Date(Date.now() - START_WEEKS * 7 * DAY_MS);
  const spanMs = Date.now() - startDate.getTime();

  let ti = 0;
  const cursor = new Date(startDate.getTime());
  while (cursor.getTime() <= Date.now()) {
    const dow = cursor.getDay();
    if (dow === 1 || dow === 3 || dow === 5) {
      const t = (cursor.getTime() - startDate.getTime()) / spanMs;
      const template = getTemplateById(templateIds[ti % templateIds.length]);
      if (template) {
        const ses = templateExercises(template, byName, t, true);
        if (ses.length > 0) {
          const session: Session = {
            id: generateId(),
            name: template.name,
            date: isoUTC(cursor),
            duration: Math.round((42 + Math.random() * 22) * 60),
            exercises: ses,
            status: 'completed',
            mood: MOODS[Math.floor(Math.random() * MOODS.length)],
            rpe: 7 + Math.round(Math.random() * 2),
            fatigue: 2 + Math.floor(Math.random() * 3),
            notes: Math.random() < 0.3 ? NOTES[Math.floor(Math.random() * NOTES.length)] : undefined,
          };
          if (Math.random() < 0.35 && ses.length >= 4) {
            const supersets: Superset[] = [
              { exercises: [ses[1].exerciseId, ses[2].exerciseId] },
            ];
            session.supersets = supersets;
          }
          sessions.push(session);
        }
      }
      ti++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  // ── Today: in-progress session (first two exercises done) ──
  const todayTemplate = getTemplateById('ppl-push');
  if (todayTemplate) {
    const todaySes = todayTemplate.exercises
      .map((te, idx) => {
        const ex = byName.get(te.name);
        if (!ex) return null;
        const weight = weightFor(te.name, ex.category, 1);
        return {
          exerciseId: ex.id,
          name: ex.name,
          muscle: ex.muscle,
          sets: buildSets(ex.id, te.defaultSets, te.defaultReps, weight, idx <= 1),
        };
      })
      .filter((x): x is SessionExercise => x !== null);
    sessions.push({
      id: generateId(),
      name: `${todayTemplate.name} — en cours`,
      date: daysFromToday(0),
      exercises: todaySes,
      status: 'in-progress',
      notes: 'Séance démarrée, à terminer.',
    });
  }

  // ── Tomorrow: planned session ──
  const plannedTemplate = getTemplateById('ppl-pull');
  if (plannedTemplate) {
    const plannedSes = templateExercises(plannedTemplate, byName, 1, false);
    sessions.push({
      id: generateId(),
      name: plannedTemplate.name,
      date: daysFromToday(1),
      exercises: plannedSes,
      status: 'planned',
    });
  }

  // ── Body measurements: weekly over the same period ──
  for (let w = 0; w <= START_WEEKS; w++) {
    body.push({
      date: daysFromToday(-(START_WEEKS - w) * 7),
      weight: round1(78 + 0.38 * w),
      arm: round1(36 + 0.14 * w),
      chest: round1(100 + 0.38 * w),
      waist: round1(84 - 0.18 * w),
    });
  }

  // ── Progress records for the main lifts ──
  const LIFTS: { name: string; start: number; end: number }[] = [
    { name: 'Squat barre', start: 95, end: 128 },
    { name: 'Développé couché barre', start: 72, end: 100 },
    { name: 'Soulevé de terre barre', start: 118, end: 150 },
    { name: 'Développé militaire barre', start: 42, end: 58 },
    { name: 'Rowing barre', start: 62, end: 82 },
    { name: 'Presse à cuisses', start: 135, end: 175 },
  ];
  for (const lift of LIFTS) {
    const ex = byName.get(lift.name);
    if (!ex) continue;
    for (let w = 0; w <= START_WEEKS - 1; w++) {
      const tt = w / (START_WEEKS - 1);
      const oneRM = lift.start + (lift.end - lift.start) * tt + (Math.random() - 0.5) * 2;
      const reps = 5;
      progress.push({
        exerciseId: ex.id,
        date: daysFromToday(-(START_WEEKS - 1 - w) * 7),
        estimated1RM: Math.round(oneRM),
        bestWeight: Math.round(oneRM / (1 + reps / 30)),
        bestReps: reps,
      });
    }
  }

  // ── Settings: a recognizable test profile ──
  const lastBody = body[body.length - 1];
  setStore(STORAGE_KEYS.settings, {
    ...getSettings(),
    pseudo: 'Alex',
    email: 'alex@demo.fr',
    unit: 'kg',
    repsFormat: 'simple',
    defaultRestTime: 90,
    soundAlerts: true,
    weeklyGoal: 3,
    bodyWeight: lastBody ? lastBody.weight : undefined,
  });

  setStore(STORAGE_KEYS.sessions, sessions);
  setStore(STORAGE_KEYS.progress, progress);
  setStore(STORAGE_KEYS.body, body);

  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const mid = completedSessions[Math.floor(completedSessions.length / 2)];
  return {
    exercises: exercises.length,
    sessions: sessions.length,
    progressRecords: progress.length,
    bodyRecords: body.length,
    completed: completedSessions.length,
    inProgress: sessions.filter((s) => s.status === 'in-progress').length,
    planned: sessions.filter((s) => s.status === 'planned').length,
    demoSessionId: mid?.id ?? '',
    compareId1: completedSessions[0]?.id ?? '',
    compareId2: completedSessions[1]?.id ?? '',
  };
}

/** Current in-app counters, for the debug page header. */
export function currentCounts(): {
  sessions: number;
  progress: number;
  body: number;
  exercises: number;
} {
  const count = (key: string): number => {
    const arr = getStore<unknown[]>(key, []);
    return Array.isArray(arr) ? arr.length : 0;
  };
  return {
    sessions: count(STORAGE_KEYS.sessions),
    progress: count(STORAGE_KEYS.progress),
    body: count(STORAGE_KEYS.body),
    exercises: count(STORAGE_KEYS.exercises),
  };
}

/** Re-export so the debug page can wipe data in one call. */
export { resetAllData };
