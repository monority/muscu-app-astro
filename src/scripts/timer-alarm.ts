let audioCtx: AudioContext | null = null;
let muted = false;

export function setMuted(v: boolean) {
  muted = v;
}

export function isMuted(): boolean {
  return muted;
}

export function playAlarm(durationMs = 800) {
  if (muted) return;
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.setValueAtTime(660, audioCtx.currentTime + 0.15);
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.3);
    osc.frequency.setValueAtTime(660, audioCtx.currentTime + 0.45);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + durationMs / 1000);
  } catch {
    // Audio not supported
  }
}
