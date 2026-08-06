/**
 * FR → EN dictionaries for user-stored exercise data.
 *
 * Exercise names, muscles and categories are stored in French in the
 * user's localStorage (see `src/lib/storage.ts` DEFAULT_EXERCISES).
 * These are DATA, not UI strings — they are also used as lookup keys
 * (exercise tips, rest times, template matching, etc.). So instead of
 * mutating the stored records, we translate at render time: keep the
 * French value as the canonical key and only map the display string.
 *
 * When the current locale is FR (or a name is not in the dictionary),
 * the helper returns the input unchanged.
 */

import { getLocale, defaultLocale } from './index';

/** Translate a stored exercise name for display. */
export function trExercise(name: string): string {
  if (getLocale() === defaultLocale) return name;
  return EXERCISE_NAMES_EN[name] ?? name;
}

/** Translate a stored muscle group for display. */
export function trMuscle(muscle: string): string {
  if (getLocale() === defaultLocale) return muscle;
  return MUSCLES_EN[muscle] ?? muscle;
}

/** Translate a stored equipment category for display. */
export function trCategory(category: string): string {
  if (getLocale() === defaultLocale) return category;
  return CATEGORIES_EN[category] ?? category;
}

/** Translate a training template's display name (server-rendered). */
export function trTemplateName(name: string): string {
  if (getLocale() === defaultLocale) return name;
  return TEMPLATE_NAMES_EN[name] ?? name;
}

/** Translate a training template's description (server-rendered). */
export function trTemplateDesc(id: string): string {
  if (getLocale() === defaultLocale) return id;
  return TEMPLATE_DESCS_EN[id] ?? '';
}

const EXERCISE_NAMES_EN: Record<string, string> = {
  // ── Pectoraux ──
  'Développé couché barre': 'Barbell Bench Press',
  'Développé couché haltères': 'Dumbbell Bench Press',
  'Développé incliné barre': 'Incline Barbell Press',
  'Développé incliné haltères': 'Incline Dumbbell Press',
  'Développé décliné barre': 'Decline Barbell Press',
  'Écarté poulie haute': 'High Cable Fly',
  'Écarté poulie basse': 'Low Cable Fly',
  'Pullover haltère': 'Dumbbell Pullover',
  'Pec deck': 'Pec Deck',
  'Dips pectoraux': 'Chest Dips',

  // ── Dos ──
  'Soulevé de terre barre': 'Barbell Deadlift',
  'Rowing barre': 'Barbell Row',
  'Rowing haltère unilatéral': 'One-Arm Dumbbell Row',
  'Rowing poulie basse': 'Seated Cable Row',
  'Tractions pronation': 'Pull-Up (Pronated)',
  'Tractions supination': 'Pull-Up (Supinated)',
  'Tractions neutral grip': 'Pull-Up (Neutral Grip)',
  'Tirage vertical poulie': 'Lat Pulldown',
  'Tirage horizontal poulie': 'Cable Row',
  'Tirage nuque': 'Behind-Neck Pulldown',
  'Rack pull': 'Rack Pull',
  'Hyperextension': 'Back Extension',
  'Rowing T-bar': 'T-Bar Row',

  // ── Épaules ──
  'Développé militaire barre': 'Barbell Overhead Press',
  'Développé haltères assis': 'Seated Dumbbell Press',
  'Développé Arnold': 'Arnold Press',
  'Élévations latérales haltères': 'Dumbbell Lateral Raise',
  'Élévations latérales poulie': 'Cable Lateral Raise',
  'Élévations frontales haltères': 'Dumbbell Front Raise',
  'Élévations frontales barre': 'Barbell Front Raise',
  'Face pulls poulie': 'Cable Face Pull',
  'Shrugs barre': 'Barbell Shrug',
  'Shrugs haltères': 'Dumbbell Shrug',
  'Oiseau haltères': 'Rear Delt Fly',
  'Rowing menton barre': 'Barbell Upright Row',

  // ── Biceps ──
  'Curl barre droite': 'Barbell Curl',
  'Curl barre EZ': 'EZ-Bar Curl',
  'Curl haltères': 'Dumbbell Curl',
  'Curl marteau haltères': 'Hammer Curl',
  'Curl concentré': 'Concentration Curl',
  'Curl incliné haltères': 'Incline Dumbbell Curl',
  'Curl poulie basse': 'Low Cable Curl',
  'Curl poulie haute': 'Cable Curl',
  'Curl pupitre': 'Preacher Curl',

  // ── Triceps ──
  'Extension poulie haute': 'Triceps Pushdown',
  'Extension haltère nuque': 'Overhead Dumbbell Extension',
  'Barre au front': 'Skull Crusher',
  'Dips triceps': 'Triceps Dips',
  'Kickbacks haltères': 'Dumbbell Kickback',
  'Extension corde poulie': 'Rope Pushdown',
  'Skull crushers': 'Skull Crushers',

  // ── Quadriceps ──
  'Squat barre': 'Barbell Squat',
  'Squat goblet': 'Goblet Squat',
  'Front squat': 'Front Squat',
  'Presse à cuisses': 'Leg Press',
  'Fentes marche haltères': 'Walking Dumbbell Lunge',
  'Fentes barre': 'Barbell Lunge',
  'Leg extension': 'Leg Extension',
  'Squat hack': 'Hack Squat',
  'Bulgarian split squat': 'Bulgarian Split Squat',
  'Pistol squat': 'Pistol Squat',

  // ── Ischio-jambiers ──
  'Leg curl couché': 'Lying Leg Curl',
  'Leg curl assis': 'Seated Leg Curl',
  'Soulevé de terre jambes tendues': 'Stiff-Leg Deadlift',
  'Soulevé de terre roumain': 'Romanian Deadlift',
  'Good morning barre': 'Barbell Good Morning',
  'Hip thrust barre': 'Barbell Hip Thrust',
  'Nordic curl': 'Nordic Curl',

  // ── Fessiers ──
  'Hip thrust barre (fessiers)': 'Barbell Hip Thrust (Glutes)',
  'Cable pull-through': 'Cable Pull-Through',
  'Squat sumo haltère': 'Dumbbell Sumo Squat',
  'Fentes marche (fessiers)': 'Walking Lunge (Glutes)',
  'Step-up haltères': 'Dumbbell Step-Up',
  'Pont fessier': 'Glute Bridge',

  // ── Mollets ──
  'Mollets debout machine': 'Standing Calf Raise',
  'Mollets assis machine': 'Seated Calf Raise',
  'Mollets marche': 'Walking Calf Raise',
  'Mollets cheval': 'Donkey Calf Raise',

  // ── Abdominaux ──
  'Crunch': 'Crunch',
  'Crunch poulie': 'Cable Crunch',
  'Planche': 'Plank',
  'Russian twists': 'Russian Twists',
  'Relevé de jambes': 'Leg Raise',
  'Roue abdominale': 'Ab Wheel Rollout',
  'Pallof press': 'Pallof Press',
  'Dead bug': 'Dead Bug',
  'Mountain climbers': 'Mountain Climbers',

  // ── Avant-bras ──
  'Curl revers haltères': 'Reverse Dumbbell Curl',
  'Curl revers barre': 'Reverse Barbell Curl',
  'Curl poignet barre': 'Barbell Wrist Curl',
};

const MUSCLES_EN: Record<string, string> = {
  Pectoraux: 'Chest',
  Dos: 'Back',
  Épaules: 'Shoulders',
  Biceps: 'Biceps',
  Triceps: 'Triceps',
  Quadriceps: 'Quadriceps',
  'Ischio-jambiers': 'Hamstrings',
  Fessiers: 'Glutes',
  Mollets: 'Calves',
  Abdominaux: 'Abs',
  'Avant-bras': 'Forearms',
  Jambes: 'Legs',
};

const CATEGORIES_EN: Record<string, string> = {
  Barre: 'Barbell',
  Haltère: 'Dumbbell',
  Poulie: 'Cable',
  Machine: 'Machine',
  'Poids du corps': 'Bodyweight',
  Câble: 'Cable',
  Autre: 'Other',
};

export { EXERCISE_NAMES_EN, MUSCLES_EN, CATEGORIES_EN };

const TEMPLATE_NAMES_EN: Record<string, string> = {
  'PPL — Push': 'PPL — Push',
  'PPL — Pull': 'PPL — Pull',
  'PPL — Legs': 'PPL — Legs',
  'Upper / Lower — Upper': 'Upper / Lower — Upper',
  'Upper / Lower — Lower': 'Upper / Lower — Lower',
  'Full Body': 'Full Body',
  'Bro Split — Pectoraux': 'Bro Split — Chest',
  'Bro Split — Dos': 'Bro Split — Back',
};

const TEMPLATE_DESCS_EN: Record<string, string> = {
  'ppl-push': 'Chest, shoulders and triceps. The "Push" day of the Push/Pull/Legs split.',
  'ppl-pull': 'Back and biceps. The "Pull" day of the Push/Pull/Legs split.',
  'ppl-legs': 'Quadriceps, hamstrings and calves. The "Legs" day of the Push/Pull/Legs split.',
  'upper-lower-upper': 'Upper body of the 4-day Upper/Lower split.',
  'upper-lower-lower': 'Lower body of the 4-day Upper/Lower split.',
  'full-body': 'Full session: upper + lower + core. Ideal 3x a week.',
  'bro-split-chest': 'A classic bodybuilding split "Chest" day (one group per day).',
  'bro-split-back': 'Classic bodybuilding split "Back" day.',
};