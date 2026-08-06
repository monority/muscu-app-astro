/**
 * Centralized WebAudio cues.
 *
 * All rest-timer / countdown beeps across the app route through
 * `playBeep()` so behaviour stays consistent and the sound can be
 * parametrized (pattern + volume) from one place.
 */

export type BeepPattern = 'triple' | 'single' | 'double' | 'long';

export interface BeepTone {
  freq: number;
  at: number; // seconds offset from start
  dur: number; // seconds
}

const PATTERNS: Record<BeepPattern, ReadonlyArray<BeepTone>> = {
  // Three-note rising arpeggio — the classic "rest over" cue.
  triple: [
    { freq: 660, at: 0.0, dur: 0.18 },
    { freq: 780, at: 0.22, dur: 0.18 },
    { freq: 990, at: 0.44, dur: 0.35 },
  ],
  single: [{ freq: 880, at: 0.0, dur: 0.3 }],
  double: [
    { freq: 740, at: 0.0, dur: 0.15 },
    { freq: 980, at: 0.18, dur: 0.15 },
  ],
  long: [{ freq: 620, at: 0.0, dur: 0.8 }],
};

export interface BeepOptions {
  pattern?: BeepPattern;
  /** Peak gain, 0..1. Defaults to 0.35 (matches the original cue). */
  volume?: number;
}

export function playBeep(options: BeepOptions = {}): void {
  const { pattern = 'triple', volume = 0.35 } = options;
  try {
    const Ctor: typeof AudioContext =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const tones = PATTERNS[pattern];
    let lastEnd = 0;
    for (const t of tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = t.freq;
      const t0 = ctx.currentTime + t.at;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + t.dur);
      osc.start(t0);
      osc.stop(t0 + t.dur + 0.02);
      lastEnd = Math.max(lastEnd, t.at + t.dur);
    }
    // Close the context once the last tone has finished.
    window.setTimeout(() => {
      ctx.close().catch(() => {});
    }, (lastEnd + 0.3) * 1000);
  } catch {
    /* audio unavailable — silent */
  }
}
