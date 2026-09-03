/**
 * sessionMeta — Pure logic for session metadata (RPE, fatigue, mood).
 *
 * Labels passed as arg — no window dependency.
 */

import { rpeTone as rpeToneFn } from "../../lib/session-builder-stats";
import type { SessionMood } from "../../lib/storage";

export interface SessionMetaLabels {
  rpeEasy: string;
  rpeModerate: string;
  rpeHard: string;
  rpeMax: string;
}

export function rpeLabel(rpe: number, labels: SessionMetaLabels): string {
  const tone = rpeToneFn(rpe);
  if (tone === "easy") return labels.rpeEasy;
  if (tone === "moderate") return labels.rpeModerate;
  if (tone === "hard") return labels.rpeHard;
  return labels.rpeMax;
}

export function toggleFatigue(current: number, level: number): number {
  return current === level ? 0 : Math.max(1, Math.min(5, level));
}

export function toggleMood(current: SessionMood | "", mood: SessionMood): SessionMood | "" {
  return current === mood ? "" : mood;
}
