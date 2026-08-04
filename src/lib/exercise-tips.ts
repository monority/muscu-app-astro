/**
 * Per-exercise coaching tips surfaced in the exercise pickers
 * (`/seances/creer` and `/exercices`).
 *
 * The key is the exact exercise `name` as stored on `Exercise.name`
 * (see `DEFAULT_EXERCISES` in `src/lib/storage.ts`). Lookups fall
 * back to the first case-insensitive accent-insensitive match when
 * the name doesn't match exactly (handles minor accent/variant drift).
 *
 * Each value is a structured `ExerciseTip` with:
 *   - `description` — short, French-language coaching note combining
 *     form cues, target muscles, and common mistakes.
 *   - `muscles` — optional focus muscle list (kept short for the UI).
 *   - `mistakes` — optional common-mistake list.
 *   - `videoUrl` — YouTube search URL the UI surfaces as a play button.
 *
 * YouTube URLs are generated from the exercise name so the user lands
 * on a results page for "<name> exercise form" instead of relying on
 * a curated list of videos that would go stale quickly.
 */

export interface ExerciseTip {
  description: string;
  muscles: string;
  mistakes: string;
  videoUrl: string;
}

/**
 * Build the YouTube search URL for a given exercise name. The query
 * appends "exercise form" so the results lean toward technique videos
 * rather than memes or transformations.
 */
function buildVideoUrl(name: string): string {
  const q = encodeURIComponent(`${name} exercise form`);
  return `https://www.youtube.com/results?search_query=${q}`;
}

/**
 * Internal helper that turns a flat description into a structured tip.
 * The `muscles` and `mistakes` fields default to empty strings; the
 * existing tips don't break them out into separate fields and the UI
 * only surfaces `description` and `videoUrl` today. Callers can later
 * split the description if/when the UI needs them as standalone lists.
 */
function makeTip(description: string, name: string): ExerciseTip {
  return {
    description,
    muscles: '',
    mistakes: '',
    videoUrl: buildVideoUrl(name),
  };
}

export const EXERCISE_TIPS: Readonly<Record<string, ExerciseTip>> = {
  'Développé couché barre': makeTip(
    "Garder les omoplates serrées et les pieds bien à plat. Descendre la barre au niveau du sternum, coudes à ~75°. Gaine abdominale gainée pour protéger les lombaires.",
    'Développé couché barre',
  ),
  'Développé couché haltères': makeTip(
    "Permet une plus grande amplitude qu'à la barre. Contrôler la descente, ne pas rebondir en haut. Épaule en légère rétroversion pour protéger le deltoïde.",
    'Développé couché haltères',
  ),
  'Développé incliné barre': makeTip(
    "Banc entre 30° et 45° — au-delà on transfère le travail sur les deltoïdes. Coudes sous la barre, trajectoire légèrement diagonale.",
    'Développé incliné barre',
  ),
  'Développé incliné haltères': makeTip(
    "Idéal pour cibler le faisceau claviculaire du pec. Garder les haltères alignés avec le sternum, pas avec les épaules.",
    'Développé incliné haltères',
  ),
  'Développé décliné barre': makeTip(
    "Variante pec bas. Mousqueton ou pieds accrochés pour la stabilité. Moins de charge qu'au plat.",
    'Développé décliné barre',
  ),
  'Écarté poulie haute': makeTip(
    "Travail en ouverture horizontale. Coudes légèrement fléchis et fixes, mouvement lent. Le point de tension maximale est en bas.",
    'Écarté poulie haute',
  ),
  'Écarté poulie basse': makeTip(
    "Variante pec moyen/haut. Garder le buste droit et le sternum sorti. Ne pas cambrer excessivement.",
    'Écarté poulie basse',
  ),
  'Pullover haltère': makeTip(
    "Exercice polyarticulaire pec + grand dorsal. Mouvement large, coudes légèrement fléchis. Sentir l'étirement en haut.",
    'Pullover haltère',
  ),
  'Pec deck': makeTip(
    "Isolateur pec. Coudes calés contre les pads, contraction brève en fin de mouvement. Ne pas charger trop lourd.",
    'Pec deck',
  ),
  'Dips pectoraux': makeTip(
    "Buste penché en avant (30-45°) pour cibler les pecs, pas les triceps. Descendre jusqu'à 90° de flexion d'épaule, pas plus bas.",
    'Dips pectoraux',
  ),
  'Soulevé de terre barre': makeTip(
    "Dos neutre, barre au-dessus des pieds, engagement des ischios puis extension des hanches. Le verrouillage final = hanches + genoux. Éviter le tirage du bas du dos.",
    'Soulevé de terre barre',
  ),
  'Rowing barre': makeTip(
    "Penché ~45°, dos plat, tirage vers le bas du sternum. Tirer les coudes vers l'arrière, pas les mains vers le haut. Pause d'1s en contraction.",
    'Rowing barre',
  ),
  'Rowing haltère unilatéral': makeTip(
    "Un genou sur le banc pour le soutien, dos parallèle au sol. Tirer le coude vers la hanche opposée. Pas de rotation du buste.",
    'Rowing haltère unilatéral',
  ),
  'Rowing poulie basse': makeTip(
    "Tirage vers le nombril, coudes serrés le long du corps. Pause en contraction 1-2s. Variante neutre = plus grand dorsal.",
    'Rowing poulie basse',
  ),
  'Tractions pronation': makeTip(
    "Largeur d'emprise > largeur d'épaules pour cibler le grand dorsal. Descendre le menton au-dessus de la barre, pas seulement les yeux.",
    'Tractions pronation',
  ),
  'Tractions supination': makeTip(
    "Emprise supination, mains à largeur d'épaules. Recrute davantage le biceps et le brachial. Tirer le sternum vers la barre.",
    'Tractions supination',
  ),
  'Tractions neutral grip': makeTip(
    "Prise neutre (paumes face à face). Plus confortable pour les épaules. Excellent pour le grand dorsal.",
    'Tractions neutral grip',
  ),
  'Tirage vertical poulie': makeTip(
    "Alternative aux tractions. Tirer le sternum vers la barre, coudes qui pointent vers le bas. Pas de tirage avec les bras seuls.",
    'Tirage vertical poulie',
  ),
  'Tirage horizontal poulie': makeTip(
    "Tirage vers le sternum, coudes serrés. Pincer les omoplates en fin de mouvement. Ne pas se pencher en arrière.",
    'Tirage horizontal poulie',
  ),
  'Tirage nuque': makeTip(
    "Attention aux épaules. Tirer derrière la nuque uniquement si la mobilité est parfaite. Privilégier le tirage sternum sinon.",
    'Tirage nuque',
  ),
  'Rack pull': makeTip(
    "Soulevé de terre partiel depuis les genoux. Excellent pour le verrouillage et le haut du dos. Charge plus lourde possible.",
    'Rack pull',
  ),
  'Hyperextension': makeTip(
    "Mouvement à partir des hanches, pas de la taille. Descendre jusqu'à ce que le corps soit droit, pas plus bas. Ajouter une charge sur la poitrine si trop facile.",
    'Hyperextension',
  ),
  'Rowing T-bar': makeTip(
    "Tirage en utilisant le cou comme point pivot. Tirer les coudes en arrière, pincer les omoplates. Variante : prise neutre ou pronation.",
    'Rowing T-bar',
  ),
  'Développé militaire barre': makeTip(
    "Debout, barre posée sur le haut des pecs. Gainage actif du tronc pour éviter l'hyperlordose. Poussée verticale, trajectoire légèrement diagonale.",
    'Développé militaire barre',
  ),
  'Développé haltères assis': makeTip(
    "Banc à 80-85° d'inclinaison. Poussée verticale, pas en avant. Plus de stabilité que debout grâce au dossier.",
    'Développé haltères assis',
  ),
  'Développé Arnold': makeTip(
    "Rotation des paumes pendant le mouvement : pronation en bas, supination en haut. Recrute les 3 faisceaux du deltoïde.",
    'Développé Arnold',
  ),
  'Élévations latérales haltères': makeTip(
    "Coudes légèrement fléchis et fixes, montée jusqu'à hauteur d'épaules. Légère rotation des paumes vers le bas en haut. Pas d'élan.",
    'Élévations latérales haltères',
  ),
  'Élévations latérales poulie': makeTip(
    "Tension constante contrairement aux haltères. Main opposée sur un point d'appui. Parfait pour les répétitions en fin de séance.",
    'Élévations latérales poulie',
  ),
  'Élévations frontales haltères': makeTip(
    "Une haltère ou deux, à deux mains. Montée jusqu'à hauteur des yeux, pas plus. Coudes légèrement fléchis.",
    'Élévations frontales haltères',
  ),
  'Élévations frontales barre': makeTip(
    "Variante à la barre EZ. Prise pronation serrée, travail le deltoïde antérieur. Éviter l'élan du buste.",
    'Élévations frontales barre',
  ),
  'Face pulls poulie': makeTip(
    "Poulie haute, tirage vers le front avec les coudes hauts. Excellent pour la santé de l'épaule et le deltoïde postérieur.",
    'Face pulls poulie',
  ),
  'Shrugs barre': makeTip(
    "Simplement monter les épaules vers les oreilles. Pause d'1s en haut. Pas de rotation (laisse le travail aux trapèzes supérieurs).",
    'Shrugs barre',
  ),
  'Shrugs haltères': makeTip(
    "Variante haltères pour un travail unilatéral. Descendre complètement, contraction brève en haut. Légère inclinaison avant possible.",
    'Shrugs haltères',
  ),
  'Oiseau haltères': makeTip(
    "Banc incliné, bras quasi tendus avec légère flexion. Trajectoire en arc de cercle, pincer les omoplates en haut.",
    'Oiseau haltères',
  ),
  'Rowing menton barre': makeTip(
    "Tirage vertical le long du corps, coudes qui montent plus haut que les mains. Travailler les trapèzes et deltoïdes postérieurs.",
    'Rowing menton barre',
  ),
  'Curl barre droite': makeTip(
    "Coudes fixes le long du corps, mouvement uniquement aux coudes. Ne pas balancer le buste. Montée complète, descente contrôlée.",
    'Curl barre droite',
  ),
  'Curl barre EZ': makeTip(
    "Prise semi-supination plus confortable pour les poignets. Mêmes principes que le curl droit. Permet de cibler le brachial.",
    'Curl barre EZ',
  ),
  'Curl haltères': makeTip(
    "En supination, coudes serrés. Possibilité de rotation (haut supination → bas pronation) pour recruter le brachio-radial.",
    'Curl haltères',
  ),
  'Curl marteau haltères': makeTip(
    "Prise neutre (marteau). Cible le brachial et le long supinateur. Excellent pour l'épaisseur du bras.",
    'Curl marteau haltères',
  ),
  'Curl concentré': makeTip(
    "Assis, coude calé contre la cuisse interne. Permet une contraction maximale du biceps. Charge modérée, tempo lent.",
    'Curl concentré',
  ),
  'Curl incliné haltères': makeTip(
    "Banc à 45-60°, bras tendus vers le bas. Grande amplitude = étirement maximal sur la longue portion du biceps.",
    'Curl incliné haltères',
  ),
  'Curl poulie basse': makeTip(
    "Coudes contre le buste, supination. Variante plus stable que la barre pour certains pratiquants.",
    'Curl poulie basse',
  ),
  'Curl poulie haute': makeTip(
    "Travail bilatéral avec poulie haute. Permet une tension constante sur tout le mouvement.",
    'Curl poulie haute',
  ),
  'Curl pupitre': makeTip(
    "Bras en appui sur le pupitre = isole parfaitement le biceps. Empêche la triche. Tempo lent, descente en 3-4s.",
    'Curl pupitre',
  ),
  'Extension poulie haute': makeTip(
    "Coudes serrés le long du corps, extension complète en bas. Ne pas laisser les coudes partir en arrière. Longue portion du triceps.",
    'Extension poulie haute',
  ),
  'Extension haltère nuque': makeTip(
    "Debout, haltère tenue à deux mains derrière la tête. Coudes serrés vers le haut. Mouvement uniquement aux coudes.",
    'Extension haltère nuque',
  ),
  'Barre au front': makeTip(
    "Allongé sur le banc, barre au front. Coudes fixes, extension complète. Recrute les 3 faisceaux du triceps.",
    'Barre au front',
  ),
  'Dips triceps': makeTip(
    "Buste droit, coudes serrés contre le buste. Descendre à 90° puis extension complète. Si trop facile : ajouter une charge.",
    'Dips triceps',
  ),
  'Kickbacks haltères': makeTip(
    "Buste penché, bras collé au buste. Extension complète en arrière. Tempo lent, contraction 1-2s en haut.",
    'Kickbacks haltères',
  ),
  'Extension corde poulie': makeTip(
    "Poulie haute avec corde. Ouvrir la corde en bas pour maximiser la contraction. Coudes fixes.",
    'Extension corde poulie',
  ),
  'Skull crushers': makeTip(
    "Allongé, barre EZ. Coudes restent au-dessus des épaules, mouvement uniquement à l'articulation du coude. Attention aux coudes valgus.",
    'Skull crushers',
  ),
  'Squat barre': makeTip(
    "Pieds à largeur d'épaules, pointes légèrement sorties. Descendre jusqu'à parallèle minimum (hanches au niveau des genoux). Genoux dans l'axe des pieds.",
    'Squat barre',
  ),
  'Squat goblet': makeTip(
    "Haltère ou kettlebell contre la poitrine. Excellent pour l'apprentissage du pattern. Permet une grande amplitude.",
    'Squat goblet',
  ),
  'Front squat': makeTip(
    "Barre sur l'avant des épaules (position front rack). Plus de travail sur le droit fémoral. Gainage obligatoire.",
    'Front squat',
  ),
  'Presse à cuisses': makeTip(
    "Pieds à largeur d'épaules sur la plateforme. Ne pas verrouiller les genoux en haut. Descente contrôlée, pas de rebond en bas.",
    'Presse à cuisses',
  ),
  'Fentes marche haltères': makeTip(
    "Grand pas en avant, genou arrière qui frôle le sol. Genou avant au-dessus de la cheville, pas devant. Torsion du buste = déséquilibre.",
    'Fentes marche haltères',
  ),
  'Fentes barre': makeTip(
    "Même principes qu'avec haltères mais charge répartie. Plus difficile pour la stabilité du tronc.",
    'Fentes barre',
  ),
  'Leg extension': makeTip(
    "Isolateur quad. Coussinet calé sur la cheville, mouvement uniquement à l'articulation du genou. Pause 1-2s en haut.",
    'Leg extension',
  ),
  'Squat hack': makeTip(
    "Machine guidée. Pieds position haut sur la plateforme pour cibler les ischios, bas pour les quads. Descendre profondément.",
    'Squat hack',
  ),
  'Bulgarian split squat': makeTip(
    "Pied arrière sur un banc. Descente verticale, genou avant au-dessus de la cheville. Très exigeant pour la stabilité.",
    'Bulgarian split squat',
  ),
  'Pistol squat': makeTip(
    "Squat sur une jambe, jambe tendue en avant. Grande mobilité de cheville et de hanche requise. Tenir un support pour débuter.",
    'Pistol squat',
  ),
  'Leg curl couché': makeTip(
    "Allongé sur le ventre, coussinet contre la cheville. Descente contrôlée, contraction en haut. Ne pas cambrer.",
    'Leg curl couché',
  ),
  'Leg curl assis': makeTip(
    "Assis, jambes à plat sur le coussinet. Plus grande amplitude que la version couchée. Travail de l'ischio en flexion de genou.",
    'Leg curl assis',
  ),
  'Soulevé de terre jambes tendues': makeTip(
    "Jambes quasi tendues (légère flexion), dos plat. Descendre la barre le long des cuisses, sentir l'étirement des ischios.",
    'Soulevé de terre jambes tendues',
  ),
  'Soulevé de terre roumain': makeTip(
    "Variante du soulevé avec moins d'amplitude. Mouvement à partir des hanches, dos plat. Sentir l'étirement en bas.",
    'Soulevé de terre roumain',
  ),
  'Good morning barre': makeTip(
    "Buste penché en avant, barre sur les trapèzes. Dos plat obligatoire. Étirement des ischios en bas, retour à la position debout.",
    'Good morning barre',
  ),
  'Hip thrust barre': makeTip(
    "Dos sur un banc, barre sur les hanches avec un pad. Poussée des hanches vers le haut, contraction maximale en haut. Excellent pour les fessiers.",
    'Hip thrust barre',
  ),
  'Nordic curl': makeTip(
    "À genoux, pieds fixes. Descente lente vers l'avant, freiner avec les ischios. Repousser avec les mains au sol si besoin.",
    'Nordic curl',
  ),
  'Hip thrust barre (fessiers)': makeTip(
    "Variante spécifique pour les fessiers. Banc plus bas, amplitude complète, contraction 2-3s en haut.",
    'Hip thrust barre (fessiers)',
  ),
  'Cable pull-through': makeTip(
    "Poulie basse, corde entre les jambes. Mouvement à partir des hanches, dos plat. Poussée des hanches en arrière et en haut.",
    'Cable pull-through',
  ),
  'Squat sumo haltère': makeTip(
    "Prise large, pointes des pieds très sorties. Travail mixte ischios + adducteurs + fessiers. Descente profonde.",
    'Squat sumo haltère',
  ),
  'Fentes marche (fessiers)': makeTip(
    "Buste légèrement penché en avant, genou avant qui pousse vers l'extérieur. Recrute davantage les fessiers que la fente classique.",
    'Fentes marche (fessiers)',
  ),
  'Step-up haltères': makeTip(
    "Step surélevé, monter en poussant sur la jambe d'appui. Pas de propulsion avec la jambe arrière. Hauteur = défi principal.",
    'Step-up haltères',
  ),
  'Pont fessier': makeTip(
    "Sol ou pieds surélevés. Poussée des hanches, contraction en haut. Sentir les fessiers travailler, pas les ischios.",
    'Pont fessier',
  ),
  'Mollets debout machine': makeTip(
    "Épaules sous les pads, descente complète, montée sur la pointe des pieds. Pause 1-2s en haut.",
    'Mollets debout machine',
  ),
  'Mollets assis machine': makeTip(
    "Pieds sur la plateforme, genoux sous le pad. Recrute davantage le soléaire (ischios de la cheville).",
    'Mollets assis machine',
  ),
  'Mollets marche': makeTip(
    "Marcher sur la pointe des pieds avec une charge (haltères, gilet). Travail en déplacement, recrutement des stabilisateurs.",
    'Mollets marche',
  ),
  'Mollets cheval': makeTip(
    "Mollets sur une plateforme inclinée. Amplitude plus grande qu'à plat. Excellent pour l'étirement du gastrocnémien.",
    'Mollets cheval',
  ),
  'Crunch': makeTip(
    "Décollement des omoplates du sol, pas du bas du dos. Regarder le plafond, pas les genoux. Expiration à la contraction.",
    'Crunch',
  ),
  'Crunch poulie': makeTip(
    "Poulie haute, câble au-dessus de la tête. Permet une résistance progressive. Ne pas tirer avec les bras.",
    'Crunch poulie',
  ),
  'Planche': makeTip(
    "Avant-bras au sol, corps droit comme une planche. Gainage actif, nombril rentré. Respiration normale. 30-60s en travail.",
    'Planche',
  ),
  'Russian twists': makeTip(
    "Assis, pieds décollés. Rotation du buste, pas des bras. Tenir un poids (medecine ball ou haltère) pour plus de résistance.",
    'Russian twists',
  ),
  'Relevé de jambes': makeTip(
    "Allongé sur le dos, jambes tendues. Montée à la verticale, descente contrôlée sans toucher le sol. Exercice intense pour le bas des abdos.",
    'Relevé de jambes',
  ),
  'Roue abdominale': makeTip(
    "À genoux ou debout. Roulement vers l'avant puis retour en contractant les abdominaux. Anti-extension = qualité du gainage.",
    'Roue abdominale',
  ),
  'Pallof press': makeTip(
    "Poulie à hauteur de poitrine, câble tenu à deux mains. Pousser vers l'avant, résister à la rotation. Excellent pour le tronc en anti-rotation.",
    'Pallof press',
  ),
  'Dead bug': makeTip(
    "Allongé sur le dos, bras et jambes en l'air. Étendre le bras opposé à la jambe opposée. Mouvement lent et contrôlé.",
    'Dead bug',
  ),
  'Mountain climbers': makeTip(
    "Position de planche, ramener les genoux vers la poitrine en alternance. Tempo rapide pour le cardio, lent pour le gainage.",
    'Mountain climbers',
  ),
  'Curl revers haltères': makeTip(
    "Prise pronation (dos des mains vers le haut). Cible l'avant-bras (extenseurs) et le brachio-radial.",
    'Curl revers haltères',
  ),
  'Curl revers barre': makeTip(
    "Même principe qu'aux haltères, en barre. Prise pronation serrée. Plus facile à charger qu'avec des haltères.",
    'Curl revers barre',
  ),
  'Curl poignet barre': makeTip(
    "Avant-bras sur un banc, paumes vers le haut. Flexion des poignets uniquement, amplitude complète. Cible les fléchisseurs de l'avant-bras.",
    'Curl poignet barre',
  ),
};

/**
 * Returns the structured tip for an exercise name, or undefined if
 * no tip exists. Matches the exact name first, then falls back to a
 * case-insensitive accent-insensitive match so the picker still finds
 * the tip when the stored name has a minor variant (e.g. "haltère"
 * vs "haltere").
 */
export function getExerciseTip(name: string): ExerciseTip | undefined {
  if (!name) return undefined;
  const direct = EXERCISE_TIPS[name];
  if (direct) return direct;
  const target = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  for (const [key, value] of Object.entries(EXERCISE_TIPS)) {
    const normalized = key
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
    if (normalized === target) return value;
  }
  return undefined;
}

/**
 * Convenience helper for callers that only need the description text.
 * Mirrors the previous `getExerciseTip` shape so existing call sites
 * stay readable.
 */
export function getExerciseTipText(name: string): string | undefined {
  return getExerciseTip(name)?.description;
}
