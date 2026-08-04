/**
 * Per-exercise suggested rest time (in seconds) between working sets.
 *
 * Compound lifts get longer rest (2:30 – 3:00) so the central nervous
 * system can recover enough load to express strength on the next set.
 * Isolation work gets shorter rest (0:45 – 1:30) because the local
 * muscle recovers quickly and the metabolic cost is small.
 *
 * The key is the exact `Exercise.name` (see `DEFAULT_EXERCISES` in
 * `src/lib/storage.ts`). Unknown exercises fall back to `DEFAULT_REST`
 * which mirrors `Settings.defaultRestTime` (90s).
 *
 * Values are tuned for hypertrophy / strength work on a 3-5 rep range.
 * Adjust per-exercise if the user programs a different rep range
 * (e.g. higher-rep isolation can rest less).
 */

const DEFAULT_REST = 90; // seconds — matches DEFAULT_SETTINGS.defaultRestTime

const REST_TIMES: Record<string, number> = {
  // Compound lifts — longer rest
  'Squat barre': 180,
  'Squat goblet': 150,
  'Front squat': 180,
  'Soulevé de terre barre': 180,
  'Soulevé de terre roumain': 150,
  'Développé couché barre': 150,
  'Développé couché haltères': 150,
  'Développé incliné barre': 150,
  'Développé militaire barre': 150,
  'Développé haltères assis': 120,
  'Rowing barre': 150,
  'Rowing haltère unilatéral': 120,
  'Presse à cuisses': 150,
  'Hip thrust barre': 120,
  'Tractions pronation': 120,

  // Isolation — shorter rest
  'Curl barre droite': 60,
  'Curl barre EZ': 60,
  'Curl haltères': 60,
  'Curl marteau haltères': 60,
  'Extension poulie haute': 60,
  'Élévations latérales haltères': 60,
  'Élévations frontales haltères': 60,
  'Leg curl couché': 60,
  'Leg extension': 60,
  'Crunch': 45,
  'Pec deck': 60,
  'Shrugs barre': 60,
  'Shrugs haltères': 60,
};

/**
 * Returns the recommended rest time in seconds for the given exercise.
 * Falls back to the default rest time when the name is unknown.
 */
export function getRestTime(exerciseName: string): number {
  if (!exerciseName) return DEFAULT_REST;
  return REST_TIMES[exerciseName] ?? DEFAULT_REST;
}

/**
 * Formats a duration in seconds as a short `M:SS` label suitable for
 * inline display next to an exercise name (e.g. "3:00", "0:45").
 */
export function formatRestTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const REST_TIMES_MAP = REST_TIMES;
export { DEFAULT_REST };
