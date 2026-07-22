import { RestTimer } from "./rest-timer";

const display = document.querySelector("[data-timer-display]")!;
const bar = document.querySelector<HTMLElement>("[data-timer-bar]")!;
const startBtn = document.querySelector<HTMLButtonElement>("[data-timer-start]")!;
const stopBtn = document.querySelector<HTMLButtonElement>("[data-timer-stop]")!;
const presets = document.querySelectorAll<HTMLButtonElement>("[data-preset]");
const customInput = document.querySelector<HTMLInputElement>("[data-preset-custom]");

let duration = 90;
let timer: RestTimer | null = null;
let running = false;
let completed = false;

class SimpleTimer {
  private totalMs = 0;
  private startTime = 0;
  private rafId = 0;

  start(seconds: number, onTick: (remaining: number) => void, onComplete: () => void) {
    this.totalMs = seconds * 1000;
    this.startTime = Date.now();
    running = true;
    display.classList.remove("urgent");
    bar.classList.remove("urgent");

    const tick = () => {
      if (!running) return;
      const elapsed = Date.now() - this.startTime;
      const remaining = Math.max(0, this.totalMs - elapsed);
      const secs = Math.ceil(remaining / 1000);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      display.textContent = String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
      bar.style.width = (remaining / this.totalMs) * 100 + "%";

      if (secs <= 10 && secs > 0) {
        display.classList.add("urgent");
        bar.classList.add("urgent");
      }

      if (remaining <= 0) {
        display.textContent = "00:00";
        bar.style.width = "0%";
        running = false;
        completed = true;
        onComplete();
      } else {
        this.rafId = requestAnimationFrame(tick);
      }
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stop() {
    running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    display.classList.remove("urgent");
    bar.classList.remove("urgent");
  }
}

const simpleTimer = new SimpleTimer();

function onComplete() {
  startBtn.textContent = "Terminé";
  startBtn.disabled = false;
  stopBtn.hidden = true;
}

function startTimer(secs: number) {
  duration = secs;
  running = true;
  completed = false;
  startBtn.textContent = "En cours…";
  startBtn.disabled = true;
  stopBtn.hidden = false;
  simpleTimer.start(secs, () => {}, onComplete);
}

startBtn.addEventListener("click", () => {
  if (completed) {
    display.textContent = "00:00";
    bar.style.width = "100%";
    startBtn.textContent = "Démarrer";
    completed = false;
    return;
  }
  startTimer(duration);
});

stopBtn.addEventListener("click", () => {
  simpleTimer.stop();
  running = false;
  startBtn.textContent = "Démarrer";
  startBtn.disabled = false;
  stopBtn.hidden = true;
  display.classList.remove("urgent");
  bar.classList.remove("urgent");
});

presets.forEach((btn) => {
  btn.addEventListener("click", () => {
    presets.forEach((p) => p.removeAttribute("data-active"));
    btn.setAttribute("data-active", "");
    const secs = parseInt(btn.getAttribute("data-preset")!, 10);
    duration = secs;
    if (!running) {
      display.textContent = String(Math.floor(secs / 60)).padStart(2, "0") + ":" + String(secs % 60).padStart(2, "0");
      bar.style.width = "100%";
    }
  });
});

customInput?.addEventListener("change", () => {
  const val = parseInt(customInput.value, 10);
  if (val > 0) {
    presets.forEach((p) => p.removeAttribute("data-active"));
    duration = val;
    if (!running) {
      display.textContent = String(Math.floor(val / 60)).padStart(2, "0") + ":" + String(val % 60).padStart(2, "0");
      bar.style.width = "100%";
    }
  }
});
