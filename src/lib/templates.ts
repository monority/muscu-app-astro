/**
 * Pre-built training templates surfaced in the session builder.
 *
 * Each template references exercises by `name` (matched against the
 * current exercise library at insertion time). The builder fills in
 * the real `exerciseId` + `muscle` from the library so the saved
 * session stays self-contained even if a template is later removed.
 */

export interface TemplateExercise {
  name: string;
  muscle: string;
  defaultSets: number;
  defaultReps: number;
}

export interface TrainingTemplate {
  id: string;
  name: string;
  description: string;
  exercises: TemplateExercise[];
}

export const TRAINING_TEMPLATES: ReadonlyArray<TrainingTemplate> = [
  {
    id: 'ppl-push',
    name: 'PPL — Push',
    description: 'Pectoraux, épaules et triceps. Jour "Push" du split Push/Pull/Legs.',
    exercises: [
      { name: 'Développé couché barre', muscle: 'Pectoraux', defaultSets: 4, defaultReps: 6 },
      { name: 'Développé incliné haltères', muscle: 'Pectoraux', defaultSets: 3, defaultReps: 8 },
      { name: 'Développé militaire barre', muscle: 'Épaules', defaultSets: 4, defaultReps: 6 },
      { name: 'Élévations latérales haltères', muscle: 'Épaules', defaultSets: 3, defaultReps: 12 },
      { name: 'Dips triceps', muscle: 'Triceps', defaultSets: 3, defaultReps: 8 },
      { name: 'Extension poulie haute', muscle: 'Triceps', defaultSets: 3, defaultReps: 12 },
    ],
  },
  {
    id: 'ppl-pull',
    name: 'PPL — Pull',
    description: 'Dos et biceps. Jour "Pull" du split Push/Pull/Legs.',
    exercises: [
      { name: 'Soulevé de terre barre', muscle: 'Dos', defaultSets: 3, defaultReps: 5 },
      { name: 'Tractions pronation', muscle: 'Dos', defaultSets: 4, defaultReps: 6 },
      { name: 'Rowing barre', muscle: 'Dos', defaultSets: 4, defaultReps: 8 },
      { name: 'Tirage vertical poulie', muscle: 'Dos', defaultSets: 3, defaultReps: 10 },
      { name: 'Curl barre EZ', muscle: 'Biceps', defaultSets: 3, defaultReps: 10 },
      { name: 'Curl marteau haltères', muscle: 'Biceps', defaultSets: 3, defaultReps: 12 },
    ],
  },
  {
    id: 'ppl-legs',
    name: 'PPL — Legs',
    description: 'Quadriceps, ischios et mollets. Jour "Legs" du split Push/Pull/Legs.',
    exercises: [
      { name: 'Squat barre', muscle: 'Quadriceps', defaultSets: 4, defaultReps: 6 },
      { name: 'Presse à cuisses', muscle: 'Quadriceps', defaultSets: 3, defaultReps: 10 },
      { name: 'Fentes marche haltères', muscle: 'Quadriceps', defaultSets: 3, defaultReps: 10 },
      { name: 'Leg curl couché', muscle: 'Ischio-jambiers', defaultSets: 3, defaultReps: 12 },
      { name: 'Soulevé de terre roumain', muscle: 'Ischio-jambiers', defaultSets: 3, defaultReps: 8 },
      { name: 'Mollets debout machine', muscle: 'Mollets', defaultSets: 4, defaultReps: 12 },
    ],
  },
  {
    id: 'upper-lower-upper',
    name: 'Upper / Lower — Upper',
    description: 'Haut du corps (Upper) du split Upper/Lower 4 jours.',
    exercises: [
      { name: 'Développé couché barre', muscle: 'Pectoraux', defaultSets: 4, defaultReps: 6 },
      { name: 'Rowing barre', muscle: 'Dos', defaultSets: 4, defaultReps: 6 },
      { name: 'Développé militaire barre', muscle: 'Épaules', defaultSets: 3, defaultReps: 8 },
      { name: 'Tractions pronation', muscle: 'Dos', defaultSets: 3, defaultReps: 8 },
      { name: 'Curl barre EZ', muscle: 'Biceps', defaultSets: 3, defaultReps: 10 },
      { name: 'Extension poulie haute', muscle: 'Triceps', defaultSets: 3, defaultReps: 10 },
    ],
  },
  {
    id: 'upper-lower-lower',
    name: 'Upper / Lower — Lower',
    description: 'Bas du corps (Lower) du split Upper/Lower 4 jours.',
    exercises: [
      { name: 'Squat barre', muscle: 'Quadriceps', defaultSets: 4, defaultReps: 6 },
      { name: 'Soulevé de terre roumain', muscle: 'Ischio-jambiers', defaultSets: 3, defaultReps: 8 },
      { name: 'Presse à cuisses', muscle: 'Quadriceps', defaultSets: 3, defaultReps: 10 },
      { name: 'Leg curl couché', muscle: 'Ischio-jambiers', defaultSets: 3, defaultReps: 10 },
      { name: 'Mollets debout machine', muscle: 'Mollets', defaultSets: 4, defaultReps: 12 },
      { name: 'Planche', muscle: 'Abdominaux', defaultSets: 3, defaultReps: 30 },
    ],
  },
  {
    id: 'full-body',
    name: 'Full Body',
    description: 'Séance complète haut + bas + core. Idéale 3×/semaine.',
    exercises: [
      { name: 'Squat barre', muscle: 'Quadriceps', defaultSets: 3, defaultReps: 6 },
      { name: 'Développé couché barre', muscle: 'Pectoraux', defaultSets: 3, defaultReps: 6 },
      { name: 'Rowing barre', muscle: 'Dos', defaultSets: 3, defaultReps: 8 },
      { name: 'Développé militaire haltères assis', muscle: 'Épaules', defaultSets: 3, defaultReps: 8 },
      { name: 'Soulevé de terre roumain', muscle: 'Ischio-jambiers', defaultSets: 3, defaultReps: 8 },
      { name: 'Planche', muscle: 'Abdominaux', defaultSets: 3, defaultReps: 30 },
    ],
  },
  {
    id: 'bro-split-chest',
    name: 'Bro Split — Pectoraux',
    description: 'Jour "Pecs" du split bodybuilding classique (1 groupe par jour).',
    exercises: [
      { name: 'Développé couché barre', muscle: 'Pectoraux', defaultSets: 4, defaultReps: 8 },
      { name: 'Développé incliné haltères', muscle: 'Pectoraux', defaultSets: 4, defaultReps: 8 },
      { name: 'Développé décliné barre', muscle: 'Pectoraux', defaultSets: 3, defaultReps: 10 },
      { name: 'Écarté poulie haute', muscle: 'Pectoraux', defaultSets: 3, defaultReps: 12 },
      { name: 'Pec deck', muscle: 'Pectoraux', defaultSets: 3, defaultReps: 12 },
    ],
  },
  {
    id: 'bro-split-back',
    name: 'Bro Split — Dos',
    description: 'Jour "Dos" du split bodybuilding classique.',
    exercises: [
      { name: 'Soulevé de terre barre', muscle: 'Dos', defaultSets: 4, defaultReps: 5 },
      { name: 'Tractions pronation', muscle: 'Dos', defaultSets: 4, defaultReps: 8 },
      { name: 'Rowing haltère unilatéral', muscle: 'Dos', defaultSets: 3, defaultReps: 10 },
      { name: 'Tirage vertical poulie', muscle: 'Dos', defaultSets: 3, defaultReps: 10 },
      { name: 'Tirage horizontal poulie', muscle: 'Dos', defaultSets: 3, defaultReps: 12 },
    ],
  },
];

/**
 * Look up a template by id. Returns undefined when the id is unknown.
 */
export function getTemplateById(id: string): TrainingTemplate | undefined {
  return TRAINING_TEMPLATES.find((t) => t.id === id);
}
