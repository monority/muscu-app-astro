import { describe, it, expect } from 'vitest';
import { pickBuilderLabels } from '../../components/builder/builderLabels';

const LABELS = {
  builder: {
    saveSession: 'Enregistrer la séance',
    editSaveSession: 'Enregistrer les modifications',
    collapseAll: 'Tout réduire',
    expandAll: 'Tout développer',
    noExoAdded: 'Aucun exercice ajouté',
    noExoDesc: 'Commencez par sélectionner des exercices.',
    needName: 'Ajoutez un nom à la séance.',
    needExo: 'Ajoutez au moins un exercice.',
    needSets: 'Chaque exercice doit contenir au moins une série.',
    emptyLibrary: 'Votre bibliothèque est vide.',
    createExoLink: 'Créer des exercices →',
    allAdded: 'Tous vos exercices sont déjà ajoutés.',
    noSearchMatch: 'Aucun exercice ne correspond.',
    addExoAria: 'Ajouter',
    toSession: 'à la séance',
    showTipAria: 'Afficher les conseils pour',
    seeTechnique: 'Voir la technique',
    videoAria: 'Voir des vidéos pour',
    onYoutube: 'sur YouTube',
    supersetLabel: 'Superset',
    supersetFor: 'Superset pour',
    newSuperset: '+ Nouveau superset',
    supersetRemove: 'Retirer du superset',
    setsFor: 'Séries pour',
    setTypeLabel: 'Type de la série',
    weightForSet: 'Poids de la série',
    repsForSet: 'Reps de la série',
    deleteSet: 'Supprimer la série',
    noSets: 'Aucune série',
    setsPlural: 'séries',
    setsSingular: 'série',
    warmupTitle: 'Générer échauffement',
    warmupHint: 'Renseignez le poids.',
    warmupBtn: 'Générer',
    fatigueOn: 'Fatigue',
    fatigueOutOf5: 'sur 5',
    moodLabel: 'Humeur',
    moodGreat: 'très bonne',
    moodGood: 'bonne',
    moodOk: 'moyenne',
    moodTired: 'fatiguée',
    moodBad: 'mauvaise',
    discardConfirm: 'Annuler la séance ?',
    top: 'top',
    units: 'unités',
    discardTitle: 'Annuler ?',
    mrvSuggestFor: 'Suggérer une charge',
    mrvNoHistory: 'Aucun historique',
    mrvFromHistory: 'Basé sur historique',
    mrvCapped: 'Plafonné à 95%',
    mrvToast: 'Charge suggérée : {weight} kg',
    removeExerciseTitle: "Retirer l'exercice",
    setTypeHeader: 'Type',
    weightHeader: 'Poids (kg)',
    fatigueTitle: 'Fatigue',
    fatigueAria: 'Niveau de fatigue',
    moodTitle: 'Humeur',
    notesLabel: 'Notes',
    pickerTitle: 'Choisir un exercice',
    tipTitle: 'Conseils',
    videoTitle: 'Voir la technique sur YouTube',
  } as Record<string, string>,
};

describe('pickBuilderLabels', () => {
  it('returns all expected keys', () => {
    const labels = pickBuilderLabels(LABELS);
    const keys = Object.keys(labels);

    expect(keys).toContain('saveSession');
    expect(keys).toContain('editSaveSession');
    expect(keys).toContain('collapseAll');
    expect(keys).toContain('expandAll');
    expect(keys).toContain('noExoAdded');
    expect(keys).toContain('needName');
    expect(keys).toContain('needExo');
    expect(keys).toContain('needSets');
    expect(keys).toContain('fatigueOn');
    expect(keys).toContain('fatigueTitle');
    expect(keys).toContain('fatigueAria');
    expect(keys).toContain('moodLabel');
    expect(keys).toContain('moodTitle');
    expect(keys).toContain('notesLabel');
    expect(keys).toContain('pickerTitle');
    expect(keys).toContain('tipTitle');
    expect(keys).toContain('videoTitle');
    expect(keys).toContain('removeExerciseTitle');
    expect(keys).toContain('setTypeHeader');
    expect(keys).toContain('weightHeader');
  });

  it('maps values from builder namespace', () => {
    const labels = pickBuilderLabels(LABELS);

    expect(labels.saveSession).toBe('Enregistrer la séance');
    expect(labels.fatigueTitle).toBe('Fatigue');
    expect(labels.moodTitle).toBe('Humeur');
    expect(labels.pickerTitle).toBe('Choisir un exercice');
  });

  it('returns exactly 61 keys', () => {
    const labels = pickBuilderLabels(LABELS);
    expect(Object.keys(labels)).toHaveLength(61);
  });

  it('does not include non-label keys', () => {
    const labels = pickBuilderLabels(LABELS);
    // @ts-expect-error — testing runtime
    expect(labels.types).toBeUndefined();
    // @ts-expect-error — testing runtime
    expect(labels.title).toBeUndefined();
  });
});
