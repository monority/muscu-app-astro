import { TimerEngine, type TimerMode, type TimerTick } from "./timer-engine";
import { playAlarm, setMuted, isMuted } from "./timer-alarm";

const engine = new TimerEngine();

const display = document.querySelector<HTMLElement>("[data-tm-display]")!;
const ringFg = document.querySelector<HTMLElement>("[data-tm-ring-fg]")!;
const barFill = document.querySelector<HTMLElement>("[data-tm-bar-fill]")!;
const bar = document.querySelector<HTMLElement>("[data-tm-bar]")!;
const info = document.querySelector<HTMLElement>("[data-tm-info]")!;

const startBtn = document.querySelector<HTMLButtonElement>("[data-tm-start]")!;
const pauseBtn = document.querySelector<HTMLButtonElement>("[data-tm-pause]")!;
const resetBtn = document.querySelector<HTMLButtonElement>("[data-tm-reset]")!;
const lapBtn = document.querySelector<HTMLButtonElement>("[data-tm-lap]")!;

const presets = document.querySelectorAll<HTMLButtonElement>("[data-tm-preset]");
const customInput = document.querySelector<HTMLInputElement>("[data-tm-custom]");
const repeatCheck = document.querySelector<HTMLInputElement>("[data-tm-repeat]");
const muteCheck = document.querySelector<HTMLInputElement>("[data-tm-mute]");
const countdownControls = document.querySelector<HTMLElement>("[data-tm-countdown-controls]")!;
const lapsContainer = document.querySelector<HTMLElement>("[data-tm-laps]")!;
const lapList = document.querySelector<HTMLElement>("[data-tm-lap-list]")!;
const tabs = document.querySelectorAll<HTMLButtonElement>("[data-tm-mode]");

const RING_CIRCUMFERENCE = 553;
let currentMode: TimerMode = "countdown";
let durationSecs = 90;
let lastLapTime = 0;
let lapCount = 0;

function formatSecs(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h > 0
    ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function setDisplay(tick: TimerTick, completed = false) {
  display.textContent = tick.hhmmss;

  if (completed && currentMode === "countdown") {
    display.className = "tm-display completed";
  } else if (tick.remaining <= 10000 && tick.remaining > 0 && currentMode === "countdown") {
    display.className = "tm-display urgent";
  } else {
    display.className = "tm-display";
  }

  const offset = RING_CIRCUMFERENCE * (1 - tick.progress);
  ringFg.style.strokeDashoffset = String(offset);

  if (tick.remaining <= 10000 && tick.remaining > 0 && currentMode === "countdown") {
    ringFg.classList.add("urgent");
  } else {
    ringFg.classList.remove("urgent");
  }

  if (currentMode === "stopwatch") {
    ringFg.classList.add("stopwatch");
  } else {
    ringFg.classList.remove("stopwatch");
  }

  barFill.style.width = (tick.progress * 100) + "%";

  if (tick.remaining <= 10000 && tick.remaining > 0 && currentMode === "countdown") {
    barFill.classList.add("urgent");
  } else {
    barFill.classList.remove("urgent");
  }
}

engine.setCallbacks(
  (tick) => setDisplay(tick),
  () => {
    if (currentMode === "countdown") {
      bar.hidden = false;
      display.className = "tm-display completed";
      ringFg.classList.remove("urgent");
      barFill.classList.remove("urgent");
      if (!isMuted()) {
        playAlarm();
        setTimeout(() => playAlarm(), 250);
        setTimeout(() => playAlarm(), 500);
      }
      if (repeatCheck?.checked) {
        setTimeout(() => {
          engine.setCountdown(durationSecs);
          setDisplay({
            elapsed: 0, remaining: durationSecs * 1000, total: durationSecs * 1000,
            hhmmss: formatSecs(durationSecs), progress: 1,
          });
          engine.start();
          updateButtons();
        }, 1500);
      } else {
        startBtn.textContent = "Recommencer";
        startBtn.disabled = false;
        pauseBtn.hidden = true;
        resetBtn.hidden = true;
        lapBtn.hidden = true;
      }
    }
  },
);

function updateButtons() {
  const s = engine.state;
  startBtn.hidden = s === "running" || s === "paused";
  pauseBtn.hidden = s !== "running";
  resetBtn.hidden = s === "idle";
  lapBtn.hidden = currentMode !== "stopwatch" || s === "idle" || s === "completed";
  startBtn.textContent =
    s === "paused" ? "Reprendre" :
    s === "completed" ? "Recommencer" :
    currentMode === "stopwatch" ? "Démarrer" : "Démarrer";
  startBtn.disabled = false;
}

function switchMode(mode: TimerMode) {
  engine.stop();
  currentMode = mode;
  lastLapTime = 0;
  lapCount = 0;
  lapList.innerHTML = "";
  lapsContainer.classList.add("hidden");

  tabs.forEach((t) => {
    t.classList.toggle("tm-tab-active", t.getAttribute("data-tm-mode") === mode);
  });

  countdownControls.hidden = mode === "stopwatch";
  bar.hidden = true;
  display.className = "tm-display";
  ringFg.classList.remove("urgent", "stopwatch");
  ringFg.style.strokeDashoffset = "0";
  barFill.style.width = "100%";
  barFill.classList.remove("urgent");

  if (mode === "countdown") {
    engine.setCountdown(durationSecs);
    display.textContent = formatSecs(durationSecs);
  } else {
    engine.setStopwatch();
    display.textContent = "00:00";
  }
  updateButtons();
}

startBtn.addEventListener("click", () => {
  const s = engine.state;
  if (s === "paused") {
    engine.resume();
    updateButtons();
    return;
  }
  if (s === "completed" || s === "idle") {
    if (currentMode === "countdown") {
      engine.setCountdown(durationSecs);
    } else {
      engine.setStopwatch();
      lastLapTime = 0;
      lapCount = 0;
      lapList.innerHTML = "";
      lapsContainer.classList.remove("hidden");
      lapBtn.hidden = false;
    }
    engine.start();
    bar.hidden = false;
    updateButtons();
  }
});

pauseBtn.addEventListener("click", () => {
  engine.pause();
  updateButtons();
});

resetBtn.addEventListener("click", () => {
  engine.stop();
  bar.hidden = true;
  lapList.innerHTML = "";
  lapsContainer.classList.add("hidden");
  lapBtn.hidden = true;
  lastLapTime = 0;
  lapCount = 0;
  if (currentMode === "countdown") {
    display.textContent = formatSecs(durationSecs);
    ringFg.style.strokeDashoffset = "0";
    barFill.style.width = "100%";
  } else {
    display.textContent = "00:00";
    ringFg.style.strokeDashoffset = "553";
    barFill.style.width = "0%";
  }
  display.className = "tm-display";
  ringFg.classList.remove("urgent", "stopwatch");
  barFill.classList.remove("urgent");
  updateButtons();
});

lapBtn?.addEventListener("click", () => {
  const elapsedMs = engine.getElapsedMs();
  const lapMs = elapsedMs - lastLapTime;
  lastLapTime = elapsedMs;
  lapCount++;
  const li = document.createElement("li");
  li.innerHTML = `<span class="tm-lap-num">Tour ${lapCount}</span><span class="tm-lap-time">${formatSecs(Math.round(lapMs / 1000))}</span>`;
  lapList.appendChild(li);
  lapList.scrollTop = lapList.scrollHeight;
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    switchMode(tab.getAttribute("data-tm-mode") as TimerMode);
  });
});

presets.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (engine.state !== "idle") return;
    presets.forEach((p) => p.removeAttribute("data-active"));
    btn.setAttribute("data-active", "");
    durationSecs = parseInt(btn.getAttribute("data-tm-preset")!, 10);
    display.textContent = formatSecs(durationSecs);
    ringFg.style.strokeDashoffset = "0";
    barFill.style.width = "100%";
  });
});

customInput?.addEventListener("change", () => {
  const val = parseInt(customInput.value, 10);
  if (val > 0) {
    if (engine.state !== "idle") return;
    presets.forEach((p) => p.removeAttribute("data-active"));
    durationSecs = val;
    display.textContent = formatSecs(val);
    ringFg.style.strokeDashoffset = "0";
    barFill.style.width = "100%";
  }
});

muteCheck?.addEventListener("change", () => {
  setMuted(muteCheck.checked);
});

// Init
engine.setCountdown(durationSecs);
display.textContent = formatSecs(durationSecs);
ringFg.style.strokeDashoffset = "0";
