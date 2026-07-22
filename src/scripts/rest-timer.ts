export class RestTimer {
  private el: HTMLElement;
  private displayEl: HTMLElement;
  private barEl: HTMLElement;
  private skipEl: HTMLElement;
  private totalMs = 0;
  private startTime = 0;
  private rafId = 0;
  private _running = false;
  onComplete?: () => void;

  constructor(container: HTMLElement) {
    this.el = container;
    this.displayEl = container.querySelector("[data-rest-display]")!;
    this.barEl = container.querySelector("[data-rest-bar]")!;
    this.skipEl = container.querySelector("[data-rest-skip]")!;
    this.skipEl.addEventListener("click", () => this.stop());
  }

  get running() {
    return this._running;
  }

  start(seconds: number) {
    this.totalMs = seconds * 1000;
    this.startTime = Date.now();
    this._running = true;
    this.el.hidden = false;
    this.tick();
  }

  stop() {
    this._running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.el.hidden = true;
    this.displayEl.classList.remove("urgent");
    this.barEl.classList.remove("urgent");
  }

  private tick = () => {
    if (!this._running) return;
    const elapsed = Date.now() - this.startTime;
    const remaining = Math.max(0, this.totalMs - elapsed);
    const secs = Math.ceil(remaining / 1000);

    const m = Math.floor(secs / 60);
    const s = secs % 60;
    this.displayEl.textContent =
      String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");

    const pct = this.totalMs > 0 ? (remaining / this.totalMs) * 100 : 0;
    this.barEl.style.width = pct + "%";

    if (secs <= 10 && secs > 0) {
      this.displayEl.classList.add("urgent");
      this.barEl.classList.add("urgent");
    } else {
      this.displayEl.classList.remove("urgent");
      this.barEl.classList.remove("urgent");
    }

    if (remaining <= 0) {
      this._running = false;
      this.displayEl.textContent = "00:00";
      this.barEl.style.width = "0%";
      this.onComplete?.();
    } else {
      this.rafId = requestAnimationFrame(this.tick);
    }
  };
}
