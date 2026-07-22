export type TimerMode = "countdown" | "stopwatch";
export type TimerState = "idle" | "running" | "paused" | "completed";

export interface TimerTick {
  elapsed: number;
  remaining: number;
  total: number;
  hhmmss: string;
  progress: number;
}

export class TimerEngine {
  private _mode: TimerMode = "countdown";
  private _state: TimerState = "idle";
  private totalMs = 0;
  private elapsedMs = 0;
  private lastTick = 0;
  private rafId = 0;
  private onTick?: (t: TimerTick) => void;
  private onComplete?: () => void;

  get mode() { return this._mode; }
  get state() { return this._state; }

  setCallbacks(tick: (t: TimerTick) => void, complete: () => void) {
    this.onTick = tick;
    this.onComplete = complete;
  }

  setCountdown(seconds: number) {
    this._mode = "countdown";
    this.totalMs = seconds * 1000;
    this.elapsedMs = 0;
    this._state = "idle";
    this.emitTick(0);
  }

  setStopwatch() {
    this._mode = "stopwatch";
    this.totalMs = 0;
    this.elapsedMs = 0;
    this._state = "idle";
    this.emitTick(0);
  }

  start() {
    if (this._state === "running") return;
    this._state = "running";
    this.lastTick = performance.now();
    this.tick();
  }

  pause() {
    if (this._state !== "running") return;
    this._state = "paused";
    cancelAnimationFrame(this.rafId);
  }

  resume() {
    if (this._state !== "paused") return;
    this._state = "running";
    this.lastTick = performance.now();
    this.tick();
  }

  stop() {
    cancelAnimationFrame(this.rafId);
    this._state = "idle";
    this.elapsedMs = 0;
    this.emitTick(0);
  }

  reset() {
    this.stop();
  }

  getElapsedMs(): number {
    return this.elapsedMs;
  }

  getElapsedSecs(): number {
    return Math.floor(this.elapsedMs / 1000);
  }

  private tick = () => {
    if (this._state !== "running") return;
    const now = performance.now();
    const delta = now - this.lastTick;
    this.lastTick = now;
    this.elapsedMs += delta;

    if (this._mode === "countdown" && this.elapsedMs >= this.totalMs) {
      this.elapsedMs = this.totalMs;
      this._state = "completed";
      this.emitTick(delta);
      cancelAnimationFrame(this.rafId);
      this.onComplete?.();
      return;
    }

    this.emitTick(delta);
    this.rafId = requestAnimationFrame(this.tick);
  };

  private emitTick(delta: number) {
    const elapsed = this._mode === "countdown"
      ? Math.min(this.elapsedMs, this.totalMs)
      : this.elapsedMs;

    const remaining = this._mode === "countdown"
      ? Math.max(0, this.totalMs - elapsed)
      : 0;

    const total = this._mode === "countdown" ? this.totalMs : elapsed;

    const progress = this._mode === "countdown"
      ? remaining / this.totalMs
      : 1;

    const totalSecs = Math.ceil(
      this._mode === "countdown" ? remaining / 1000 : elapsed / 1000,
    );

    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;

    const hhmmss = h > 0
      ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

    this.onTick?.({ elapsed, remaining, total, hhmmss, progress });
  }
}
