/**
 * Per-exercise coaching tips surfaced in the exercise pickers
 * (`/seances/creer` and `/exercices`).
 *
 * The key is the exact exercise `name` as stored on `Exercise.name`
 * (see `DEFAULT_EXERCISES` in `src/lib/storage.ts`). Lookups fall
 * back to the first case-insensitive match when the name doesn't
 * match exactly (handles minor accent/variant drift).
 *
 * Each value is a short, French-language coaching note that
 * combines form cues, target muscles, and common mistakes.
 */

export const EXERCISE_TIPS: Readonly<Record<string, string>> = {
  'Développé couché barre':
    "Garder les omoplates serrées et les pieds bien à plat. Descendre la barre au niveau du sternum, coudes à ~75°. Gaine abdominale gainée pour protéger les lombaires.",
  'Développé couché haltères':
    "Permet une plus grande amplitude qu'à la barre. Contrôler la descente, ne pas rebondir en haut. Épaule en légère rétroversion pour protéger le deltoïde.",
  'Développé incliné barre':
    "Banc entre 30° et 45° — au-delà on transfère le travail sur les deltoïdes. Coudes sous la barre, trajectoire légèrement diagonale.",
  'Développé incliné haltères':
    "Idéal pour cibler le faisceau claviculaire du pec. Garder les haltères alignés avec le sternum, pas avec les épaules.",
  'Développé décliné barre':
    "Variante pec bas. Mousqueton ou pieds accrochés pour la stabilité. Moins de charge qu'au plat.",
  'Écarté poulie haute':
    "Travail en ouverture horizontale. Coudes légèrement fléchis et fixes, mouvement lent. Le point de tension maximale est en bas.",
  'Écarté poulie basse':
    "Variante pec moyen/haut. Garder le buste droit et le sternum sorti. Ne pas cambrer excessivement.",
  'Pullover haltère':
    "Exercice polyarticulaire pec + grand dorsal. Mouvement large, coudes légèrement fléchis. Sentir l'étirement en haut.",
  'Pec deck':
    "Isolateur pec. Coudes calés contre les pads, contraction brève en fin de mouvement. Ne pas charger trop lourd.",
  'Dips pectoraux':
    "Buste penché en avant (30-45°) pour cibler les pecs, pas les triceps. Descendre jusqu'à 90° de flexion d'épaule, pas plus bas.",
  'Soulevé de terre barre':
    "Dos neutre, barre au-dessus des pieds, engagement des ischios puis extension des hanches. Le verrouillage final = hanches + genoux. Éviter le tirage du bas du dos.",
  'Rowing barre':
    "Penché ~45°, dos plat, tirage vers le bas du sternum. Tirer les coudes vers l'arrière, pas les mains vers le haut. Pause d'1s en contraction.",
  'Rowing haltère unilatéral':
    "Un genou sur le banc pour le soutien, dos parallèle au sol. Tirer le coude vers la hanche opposée. Pas de rotation du buste.",
  'Rowing poulie basse':
    "Tirage vers le nombril, coudes serrés le long du corps. Pause en contraction 1-2s. Variante neutre = plus grand dorsal.",
  'Tractions pronation':
    "Largeur d'emprise > largeur d'épaules pour cibler le grand dorsal. Descendre le menton au-dessus de la barre, pas seulement les yeux.",
  'Tractions supination':
    "Emprise supination, mains à largeur d'épaules. Recrute davantage le biceps et le brachial. Tirer le sternum vers la barre.",
  'Tractions neutral grip':
    "Prise neutre (paumes face à face). Plus confortable pour les épaules. Excellent pour le grand dorsal.",
  'Tirage vertical poulie':
    "Alternative aux tractions. Tirer le sternum vers la barre, coudes qui pointent vers le bas. Pas de tirage avec les bras seuls.",
  'Tirage horizontal poulie':
    "Tirage vers le sternum, coudes serrés. Pincer les omoplates en fin de mouvement. Ne pas se pencher en arrière.",
  'Tirage nuque':
    "Attention aux épaules. Tirer derrière la nuque uniquement si la mobilité est parfaite. Privilégier le tirage sternum sinon.",
  'Rack pull':
    "Soulevé de terre partiel depuis les genoux. Excellent pour le verrouillage et le haut du dos. Charge plus lourde possible.",
  'Hyperextension':
    "Mouvement à partir des hanches, pas de la taille. Descendre jusqu'à ce que le corps soit droit, pas plus bas. Ajouter une charge sur la poitrine si trop facile.",
  'Rowing T-bar':
    "Tirage en utilisant le cou comme point pivot. Tirer les coudes en arrière, pincer les omoplates. Variante : prise neutre ou pronation.",
  'Développé militaire barre':
    "Debout, barre posée sur le haut des pecs. Gainage actif du tronc pour éviter l'hyperlordose. Poussée verticale, trajectoire légèrement diagonale.",
  'Développé haltères assis':
    "Banc à 80-85° d'inclinaison. Poussée verticale, pas en avant. Plus de stabilité que debout grâce au dossier.",
  'Développé Arnold':
    "Rotation des paumes pendant le mouvement : pronation en bas, supination en haut. Recrute les 3 faisceaux du deltoïde.",
  'Élévations latérales haltères':
    "Coudes légèrement fléchis et fixes, montée jusqu'à hauteur d'épaules. Légère rotation des paumes vers le bas en haut. Pas d'élan.",
  'Élévations latérales poulie':
    "Tension constante contrairement aux haltères. Main opposée sur un point d'appui. Parfait pour les répétitions en fin de séance.",
  'Élévations frontales haltères':
    "Une haltère ou deux, à deux mains. Montée jusqu'à hauteur des yeux, pas plus. Coudes légèrement fléchis.",
  'Élévations frontales barre':
    "Variante à la barre EZ. Prise pronation serrée, travail le deltoïde antérieur. Éviter l'élan du buste.",
  'Face pulls poulie':
    "Poulie haute, tirage vers le front avec les coudes hauts. Excellent pour la santé de l'épaule et le deltoïde postérieur.",
  'Shrugs barre':
    "Simplement monter les épaules vers les oreilles. Pause d'1s en haut. Pas de rotation (laisse le travail aux trapèzes supérieurs).",
  'Shrugs haltères':
    "Variante haltères pour un travail unilatéral. Descendre complètement, contraction brève en haut. Légère inclinaison avant possible.",
  'Oiseau haltères':
    "Banc incliné, bras quasi tendus avec légère flexion. Trajectoire en arc de cercle, pincer les omoplates en haut.",
  'Rowing menton barre':
    "Tirage vertical le long du corps, coudes qui montent plus haut que les mains. Travailler les trapèzes et deltoïdes postérieurs.",
  'Curl barre droite':
    "Coudes fixes le long du corps, mouvement uniquement aux coudes. Ne pas balancer le buste. Montée complète, descente contrôlée.",
  'Curl barre EZ':
    "Prise semi-supination plus confortable pour les poignets. Mêmes principes que le curl droit. Permet de cibler le brachial.",
  'Curl haltères':
    "En supination, coudes serrés. Possibilité de rotation (haut supination → bas pronation) pour recruter le brachio-radial.",
  'Curl marteau haltères':
    "Prise neutre (marteau). Cible le brachial et le long supinateur. Excellent pour l'épaisseur du bras.",
  'Curl concentré':
    "Assis, coude calé contre la cuisse interne. Permet une contraction maximale du biceps. Charge modérée, tempo lent.",
  'Curl incliné haltères':
    "Banc à 45-60°, bras tendus vers le bas. Grande amplitude = étirement maximal sur la longue portion du biceps.",
  'Curl poulie basse':
    "Coudes contre le buste, supination. Variante plus stable que la barre pour certains pratiquants.",
  'Curl poulie haute':
    "Travail bilatéral avec poulie haute. Permet une tension constante sur tout le mouvement.",
  'Curl pupitre':
    "Bras en appui sur le pupitre = isole parfaitement le biceps. Empêche la triche. Tempo lent, descente en 3-4s.",
  'Extension poulie haute':
    "Coudes serrés le long du corps, extension complète en bas. Ne pas laisser les coudes partir en arrière. Longue portion du triceps.",
  'Extension haltère nuque':
    "Debout, haltère tenue à deux mains derrière la tête. Coudes serrés vers le haut. Mouvement uniquement aux coudes.",
  'Barre au front':
    "Allongé sur le banc, barre au front. Coudes fixes, extension complète. Recrute les 3 faisceaux du triceps.",
  'Dips triceps':
    "Buste droit, coudes serrés contre le buste. Descendre à 90° puis extension complète. Si trop facile : ajouter une charge.",
  'Kickbacks haltères':
    "Buste penché, bras collé au buste. Extension complète en arrière. Tempo lent, contraction 1-2s en haut.",
  'Extension corde poulie':
    "Poulie haute avec corde. Ouvrir la corde en bas pour maximiser la contraction. Coudes fixes.",
  'Skull crushers':
    "Allongé, barre EZ. Coudes restent au-dessus des épaules, mouvement uniquement à l'articulation du coude. Attention aux coudes valgus.",
  'Squat barre':
    "Pieds à largeur d'épaules, pointes légèrement sorties. Descendre jusqu'à parallèle minimum (hanches au niveau des genoux). Genoux dans l'axe des pieds.",
  'Squat goblet':
    "Haltère ou kettlebell contre la poitrine. Excellent pour l'apprentissage du pattern. Permet une grande amplitude.",
  'Front squat':
    "Barre sur l'avant des épaules (position front rack). Plus de travail sur le droit fémoral. Gainage obligatoire.",
  'Presse à cuisses':
    "Pieds à largeur d'épaules sur la plateforme. Ne pas verrouiller les genoux en haut. Descente contrôlée, pas de rebond en bas.",
  'Fentes marche haltères':
    "Grand pas en avant, genou arrière qui frôle le sol. Genou avant au-dessus de la cheville, pas devant. Torsion du buste = déséquilibre.",
  'Fentes barre':
    "Même principes qu'avec haltères mais charge répartie. Plus difficile pour la stabilité du tronc.",
  'Leg extension':
    "Isolateur quad. Coussinet calé sur la cheville, mouvement uniquement à l'articulation du genou. Pause 1-2s en haut.",
  'Squat hack':
    "Machine guidée. Pieds position haut sur la plateforme pour cibler les ischios, bas pour les quads. Descendre profondément.",
  'Bulgarian split squat':
    "Pied arrière sur un banc. Descente verticale, genou avant au-dessus de la cheville. Très exigeant pour la stabilité.",
  'Pistol squat':
    "Squat sur une jambe, jambe tendue en avant. Grande mobilité de cheville et de hanche requise. Tenir un support pour débuter.",
  'Leg curl couché':
    "Allongé sur le ventre, coussinet contre la cheville. Descente contrôlée, contraction en haut. Ne pas cambrer.",
  'Leg curl assis':
    "Assis, jambes à plat sur le coussinet. Plus grande amplitude que la version couchée. Travail de l'ischio en flexion de genou.",
  'Soulevé de terre jambes tendues':
    "Jambes quasi tendues (légère flexion), dos plat. Descendre la barre le long des cuisses, sentir l'étirement des ischios.",
  'Soulevé de terre roumain':
    "Variante du soulevé avec moins d'amplitude. Mouvement à partir des hanches, dos plat. Sentir l'étirement en bas.",
  'Good morning barre':
    "Buste penché en avant, barre sur les trapèzes. Dos plat obligatoire. Étirement des ischios en bas, retour à la position debout.",
  'Hip thrust barre':
    "Dos sur un banc, barre sur les hanches avec un pad. Poussée des hanches vers le haut, contraction maximale en haut. Excellent pour les fessiers.",
  'Nordic curl':
    "À genoux, pieds fixes. Descente lente vers l'avant, freiner avec les ischios. Repousser avec les mains au sol si besoin.",
  'Hip thrust barre (fessiers)':
    "Variante spécifique pour les fessiers. Banc plus bas, amplitude complète, contraction 2-3s en haut.",
  'Cable pull-through':
    "Poulie basse, corde entre les jambes. Mouvement à partir des hanches, dos plat. Poussée des hanches en arrière et en haut.",
  'Squat sumo haltère':
    "Prise large, pointes des pieds très sorties. Travail mixte ischios + adducteurs + fessiers. Descente profonde.",
  'Fentes marche (fessiers)':
    "Buste légèrement penché en avant, genou avant qui pousse vers l'extérieur. Recrute davantage les fessiers que la fente classique.",
  'Step-up haltères':
    "Step surélevé, monter en poussant sur la jambe d'appui. Pas de propulsion avec la jambe arrière. Hauteur = défi principal.",
  'Pont fessier':
    "Sol ou pieds surélevés. Poussée des hanches, contraction en haut. Sentir les fessiers travailler, pas les ischios.",
  'Mollets debout machine':
    "Épaules sous les pads, descente complète, montée sur la pointe des pieds. Pause 1-2s en haut.",
  'Mollets assis machine':
    "Pieds sur la plateforme, genoux sous le pad. Recrute davantage le soléaire (ischios de la cheville).",
  'Mollets marche':
    "Marcher sur la pointe des pieds avec une charge (haltères, gilet). Travail en déplacement, recrutement des stabilisateurs.",
  'Mollets cheval':
    "Mollets sur une plateforme inclinée. Amplitude plus grande qu'à plat. Excellent pour l'étirement du gastrocnémien.",
  'Crunch':
    "Décollement des omoplates du sol, pas du bas du dos. Regarder le plafond, pas les genoux. Expiration à la contraction.",
  'Crunch poulie':
    "Poulie haute, câble au-dessus de la tête. Permet une résistance progressive. Ne pas tirer avec les bras.",
  'Planche':
    "Avant-bras au sol, corps droit comme une planche. Gainage actif, nombril rentré. Respiration normale. 30-60s en travail.",
  'Russian twists':
    "Assis, pieds décollés. Rotation du buste, pas des bras. Tenir un poids (medecine ball ou haltère) pour plus de résistance.",
  'Relevé de jambes':
    "Allongé sur le dos, jambes tendues. Montée à la verticale, descente contrôlée sans toucher le sol. Exercice intense pour le bas des abdos.",
  'Roue abdominale':
    "À genoux ou debout. Roulement vers l'avant puis retour en contractant les abdominaux. Anti-extension = qualité du gainage.",
  'Pallof press':
    "Poulie à hauteur de poitrine, câble tenu à deux mains. Pousser vers l'avant, résister à la rotation. Excellent pour le tronc en anti-rotation.",
  'Dead bug':
    "Allongé sur le dos, bras et jambes en l'air. Étendre le bras opposé à la jambe opposée. Mouvement lent et contrôlé.",
  'Mountain climbers':
    "Position de planche, ramener les genoux vers la poitrine en alternance. Tempo rapide pour le cardio, lent pour le gainage.",
  'Curl revers haltères':
    "Prise pronation (dos des mains vers le haut). Cible l'avant-bras (extenseurs) et le brachio-radial.",
  'Curl revers barre':
    "Même principe qu'aux haltères, en barre. Prise pronation serrée. Plus facile à charger qu'avec des haltères.",
  'Curl poignet barre':
    "Avant-bras sur un banc, paumes vers le haut. Flexion des poignets uniquement, amplitude complète. Cible les fléchisseurs de l'avant-bras.",
};

/**
 * Returns the tip for an exercise name, or undefined if no tip exists.
 * Matches the exact name first, then falls back to a case-insensitive
 * accent-insensitive match so the picker still finds the tip when the
 * stored name has a minor variant (e.g. "haltère" vs "haltere").
 */
export function getExerciseTip(name: string): string | undefined {
  if (!name) return undefined;
  if (EXERCISE_TIPS[name]) return EXERCISE_TIPS[name];
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
