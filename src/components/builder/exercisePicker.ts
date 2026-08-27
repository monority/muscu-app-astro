/**
 * exercisePicker — Pure logic for exercise picker dialog.
 *
 * Handles: search filtering, exercise addition, template loading,
 * exercise tips. State stays in Alpine; logic here for testability.
 */

import { getExerciseTip } from "../../lib/exercise-tips";
import { getTemplateById, type TemplateExercise } from "../../lib/templates";
import type { Exercise } from "../../lib/storage";
import {
  buildExerciseFromTemplate,
  type BuilderExercise,
} from "../../lib/session-builder-stats";

const TEMPLATE_FALLBACK_CATEGORY = "Autre";

// ── Search / filter ────────────────────────────────────────────

export function filterExercises(
  available: Exercise[],
  addedIds: Set<string>,
  query: string,
): Exercise[] {
  const q = query.trim().toLowerCase();
  return available
    .filter((e) => {
      if (addedIds.has(e.id)) return false;
      if (q && !e.name.toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => {
      if (Boolean(a.favorite) !== Boolean(b.favorite)) {
        return a.favorite ? -1 : 1;
      }
      return a.name.localeCompare(b.name, "fr");
    });
}

// ── Exercise addition ──────────────────────────────────────────

export function buildNewExercise(exercise: Exercise): BuilderExercise {
  return {
    exerciseId: exercise.id,
    name: exercise.name,
    muscle: exercise.muscle,
    sets: [
      {
        exerciseId: exercise.id,
        setNumber: 1,
        weight: 0,
        reps: 0,
        type: "work",
        completed: false,
      },
    ],
    supersetId: null,
  };
}

export function buildFromTemplate(
  exercise: Exercise,
  template: TemplateExercise,
): BuilderExercise {
  return buildExerciseFromTemplate(exercise, template);
}

export function findExerciseByName(
  available: Exercise[],
  name: string,
): Exercise | undefined {
  return available.find((e) => e.name === name);
}

// ── Template loading ───────────────────────────────────────────

export interface TemplateLoadResult {
  exercises: BuilderExercise[];
  newAvailable: Exercise[];
}

export function loadTemplate(
  templateId: string,
  available: Exercise[],
): TemplateLoadResult | null {
  const tpl = getTemplateById(templateId);
  if (!tpl) return null;

  const result: TemplateLoadResult = {
    exercises: [],
    newAvailable: [...available],
  };

  for (const te of tpl.exercises) {
    let ex = findExerciseByName(result.newAvailable, te.name);
    if (!ex) {
      ex = {
        id: `template:${te.name}`,
        name: te.name,
        muscle: te.muscle,
        category: TEMPLATE_FALLBACK_CATEGORY,
        createdAt: new Date().toISOString(),
      };
      result.newAvailable = [...result.newAvailable, ex];
    }
    result.exercises.push(buildFromTemplate(ex, te));
  }

  return result;
}

// ── Exercise tips ──────────────────────────────────────────────

export function hasExerciseTip(name: string): boolean {
  return getExerciseTip(name) != null;
}

export function getExerciseTipText(name: string): string {
  return getExerciseTip(name)?.description ?? "";
}

export function getExerciseTipVideoUrl(name: string): string {
  return getExerciseTip(name)?.videoUrl ?? "";
}
