import type { Dictionary } from '../i18n/types';
import { playBeep } from './sound';

/**
 * Timer pop-out widget.
 *
 * Self-contained remote view + controller for the timer page. It is mounted
 * either inside a Document Picture-in-Picture window (Chrome/Edge) or on the
 * standalone /timer/pop page (fallback for browsers without the API). The
 * main timer page stays the source of truth; the widget keeps in sync over a
 * BroadcastChannel:
 *
 *   main → widget : { type: 'state', owner, state: TimerSnapshot }
 *   widget → main : { type: 'cmd',  target: owner, cmd, value? }
 *   widget → main : { type: 'hello', target: '*' }   (handshake from /timer/pop)
 */

export const TIMER_CHANNEL = 'muscu-timer-sync';

export type TimerMode = 'countdown' | 'stopwatch';

export interface TimerSnapshot {
  mode: TimerMode;
  totalTime: number;
  remaining: number;
  running: boolean;
  endAt: number;
  swRunning: boolean;
  swStartAt: number;
  swElapsed: number;
  laps: { lapTime: number; totalTime: number }[];
  soundEnabled: boolean;
  now: number;
}

export interface TimerWidgetLabels {
  title: string;
  countdown: string;
  stopwatch: string;
  start: string;
  resume: string;
  pause: string;
  reset: string;
  lap: string;
  lapTime: string;
  total: string;
  custom: string;
  running: string;
  paused: string;
  ready: string;
  done: string;
  connected: string;
  disconnected: string;
}

export interface TimerWidgetHandle {
  sendHello(): void;
  setSnapshot(s: TimerSnapshot, ownerId?: string): void;
  destroy(): void;
}

/** Map a localized dictionary onto the widget labels. */
export function widgetLabelsFrom(d: Dictionary): TimerWidgetLabels {
  const t = d.timer;
  return {
    title: t.title,
    countdown: t.countdown,
    stopwatch: t.stopwatch,
    start: t.start,
    resume: t.resume,
    pause: t.pause,
    reset: t.reset,
    lap: t.lap,
    lapTime: t.lapTime,
    total: t.total,
    custom: t.custom,
    running: t.running,
    paused: t.paused,
    ready: t.ready,
    done: t.done,
    connected: t.connected,
    disconnected: t.disconnected,
  };
}

const PRESETS = [60, 90, 120, 180];

function fmtTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(s / 60)
    .toString()
    .padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

function fmtShort(seconds: number): string {
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  if (mm === 0) return `${ss}s`;
  if (ss === 0) return `${mm}:00`;
  return `${mm}:${ss.toString().padStart(2, '0')}`;
}

function fmtMs(ms: number): string {
  const total = Math.max(0, Math.floor(ms));
  const hours = Math.floor(total / 3600000);
  const minutes = Math.floor((total % 3600000) / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  const centis = Math.floor((total % 1000) / 10);
  const pad = (n: number, w: number) => n.toString().padStart(w, '0');
  if (hours > 0) return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)}`;
  return `${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(centis, 2)}`;
}

function beep(): void {
  playBeep();
}

const WIDGET_CSS = `
.tw {
  --tw-bg: #0d0d0d;
  --tw-surface: #171717;
  --tw-surface-2: #202020;
  --tw-border: rgba(255, 255, 255, 0.09);
  --tw-text: #f2f2f2;
  --tw-muted: #8f8f8f;
  --tw-accent: hsl(32, 95%, 50%);
  --tw-ok: #22c35d;
  --tw-warn: #f0b429;
  --tw-danger: #ef4444;
  box-sizing: border-box;
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 1.5rem 1.5rem 1.8rem;
  background: var(--tw-bg);
  color: var(--tw-text);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 1.6rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  user-select: none;
}
html[data-theme="light"] .tw {
  --tw-bg: #fafafa;
  --tw-surface: #ffffff;
  --tw-surface-2: #efefef;
  --tw-border: rgba(0, 0, 0, 0.13);
  --tw-text: #141414;
  --tw-muted: #6b6b6b;
}
.tw *,
.tw *::before,
.tw *::after { box-sizing: border-box; }
.tw button { font-family: inherit; }
.tw__head { display: flex; align-items: center; justify-content: space-between; gap: 0.8rem; }
.tw__title {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--tw-muted);
}
.tw__conn { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; color: var(--tw-muted); text-transform: uppercase; letter-spacing: 0.08em; }
.tw__dot { width: 0.7rem; height: 0.7rem; border-radius: 50%; background: var(--tw-danger); box-shadow: 0 0 8px var(--tw-danger); flex: 0 0 auto; }
.tw.is-connected .tw__dot { background: var(--tw-ok); box-shadow: 0 0 8px var(--tw-ok); }
.tw__tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
  padding: 0.35rem;
  background: var(--tw-surface-2);
  border: 1px solid var(--tw-border);
  border-radius: 999px;
}
.tw__tab {
  border: none;
  background: transparent;
  color: var(--tw-muted);
  padding: 0.7rem 0.4rem;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: background 0.2s ease, color 0.2s ease;
}
.tw__tab:hover { color: var(--tw-text); }
.tw__tab.is-active { background: var(--tw-accent); color: #fff; }
.tw__clock-wrap { display: flex; flex-direction: column; align-items: center; gap: 0.35rem; padding: 0.9rem 0 0.4rem; }
.tw__clock {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: clamp(3.4rem, 15vw, 5.2rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--tw-text);
}
.tw__clock.is-running { color: var(--tw-accent); }
.tw__clock.is-warning { color: var(--tw-warn); }
.tw__clock.is-done { color: var(--tw-ok); }
.tw__status { font-size: 0.8rem; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: var(--tw-muted); }
.tw__presets { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.45rem; }
.tw__presets[hidden],
.tw__custom[hidden] { display: none !important; }
.tw__preset {
  border: 1px solid var(--tw-border);
  background: var(--tw-surface);
  color: var(--tw-text);
  border-radius: 0.6rem;
  padding: 0.6rem 0;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}
.tw__preset:hover { border-color: var(--tw-accent); }
.tw__preset.is-active { color: var(--tw-accent); border-color: var(--tw-accent); background: color-mix(in srgb, var(--tw-accent) 14%, transparent); }
.tw__custom { display: flex; gap: 0.45rem; }
.tw__custom-input {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--tw-border);
  background: var(--tw-surface);
  color: var(--tw-text);
  border-radius: 0.6rem;
  padding: 0.55rem 0.7rem;
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
  outline: none;
}
.tw__custom-input:focus { border-color: var(--tw-accent); }
.tw__custom-ok { border: 1px solid var(--tw-accent); background: transparent; color: var(--tw-accent); border-radius: 0.6rem; padding: 0 1.1rem; cursor: pointer; font-weight: 700; }
.tw__controls { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.55rem; }
.tw__btn {
  border: 1px solid var(--tw-border);
  border-radius: 0.7rem;
  padding: 0.95rem 0.4rem;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.92rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: var(--tw-surface);
  color: var(--tw-text);
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease, transform 0.1s ease;
}
.tw__btn:hover { border-color: var(--tw-accent); }
.tw__btn:active { transform: scale(0.97); }
.tw__btn--primary {
  background: transparent;
  color: var(--tw-accent);
  border-color: color-mix(in srgb, var(--tw-accent) 55%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tw-accent) 15%, transparent);
}
.tw__btn--primary:hover { background: color-mix(in srgb, var(--tw-accent) 10%, transparent); border-color: var(--tw-accent); }
.tw__btn--ghost { background: var(--tw-surface-2); }
.tw__btn:disabled { opacity: 0.4; cursor: not-allowed; }
.tw__laps { margin-top: 0.2rem; border: 1px solid var(--tw-border); border-radius: 0.7rem; overflow: hidden; }
.tw__laps-head {
  display: grid;
  grid-template-columns: 3.4rem 1fr 1fr;
  gap: 0.5rem;
  padding: 0.5rem 0.8rem;
  background: var(--tw-surface-2);
  color: var(--tw-muted);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.tw__laps-head span:last-child { text-align: right; }
.tw__laps-body { max-height: 13rem; overflow-y: auto; }
.tw__laps-row {
  display: grid;
  grid-template-columns: 3.4rem 1fr 1fr;
  gap: 0.5rem;
  padding: 0.5rem 0.8rem;
  border-top: 1px solid var(--tw-border);
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
}
.tw__laps-row:first-child { border-top: none; }
.tw__laps-row.is-latest { color: var(--tw-accent); background: color-mix(in srgb, var(--tw-accent) 10%, transparent); }
.tw__laps-row span:first-child { color: var(--tw-muted); }
.tw__laps-row span:last-child { text-align: right; color: var(--tw-accent); }
`;

type RemoteMsg = { type: string; [k: string]: unknown };

export function mountTimerWidget(root: HTMLElement, labels: TimerWidgetLabels): TimerWidgetHandle {
  const host = document.createElement('div');
  host.className = 'tw';
  host.innerHTML = `
    <header class="tw__head">
      <span class="tw__title">${labels.title}</span>
      <span class="tw__conn"><i class="tw__dot"></i><span data-ref="conn">${labels.disconnected}</span></span>
    </header>
    <div class="tw__tabs" role="tablist" aria-label="${labels.title}">
      <button type="button" class="tw__tab is-active" data-tab="countdown" role="tab">${labels.countdown}</button>
      <button type="button" class="tw__tab" data-tab="stopwatch" role="tab">${labels.stopwatch}</button>
    </div>
    <div class="tw__clock-wrap">
      <div class="tw__clock" data-ref="clock" aria-live="polite">--:--</div>
      <div class="tw__status" data-ref="status"></div>
    </div>
    <div class="tw__presets" hidden>
      ${PRESETS.map((p) => `<button type="button" class="tw__preset" data-preset="${p}">${fmtShort(p)}</button>`).join('')}
    </div>
    <div class="tw__custom" hidden>
      <input class="tw__custom-input" data-ref="custom" type="number" min="5" max="600" step="5" inputmode="numeric"
        aria-label="${labels.custom}">
      <button type="button" class="tw__custom-ok" data-ref="customOk">OK</button>
    </div>
    <div class="tw__controls">
      <button type="button" class="tw__btn tw__btn--primary" data-ref="toggle">${labels.start}</button>
      <button type="button" class="tw__btn tw__btn--ghost" data-ref="reset">${labels.reset}</button>
      <button type="button" class="tw__btn tw__btn--ghost" data-ref="lap" hidden>${labels.lap}</button>
    </div>
    <div class="tw__laps" data-ref="laps" hidden>
      <div class="tw__laps-head">
        <span>${labels.lap}</span><span>${labels.lapTime}</span><span>${labels.total}</span>
      </div>
      <div class="tw__laps-body" data-ref="lapsBody"></div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = WIDGET_CSS;
  root.appendChild(style);
  root.appendChild(host);

  const $ = <T extends HTMLElement>(sel: string): T => host.querySelector(sel) as T;
  const clock = $<HTMLDivElement>('[data-ref="clock"]');
  const status = $<HTMLDivElement>('[data-ref="status"]');
  const conn = $<HTMLDivElement>('[data-ref="conn"]');
  const toggle = $<HTMLButtonElement>('[data-ref="toggle"]');
  const resetBtn = $<HTMLButtonElement>('[data-ref="reset"]');
  const lapBtn = $<HTMLButtonElement>('[data-ref="lap"]');
  const lapsWrap = $<HTMLDivElement>('[data-ref="laps"]');
  const lapsBody = $<HTMLDivElement>('[data-ref="lapsBody"]');
  const customInput = $<HTMLInputElement>('[data-ref="custom"]');
  const customOk = $<HTMLButtonElement>('[data-ref="customOk"]');
  const presetsWrap = $<HTMLDivElement>('.tw__presets');
  const customWrap = $<HTMLDivElement>('.tw__custom');
  const tabs = Array.from(host.querySelectorAll<HTMLButtonElement>('.tw__tab'));
  const presets = Array.from(host.querySelectorAll<HTMLButtonElement>('.tw__preset'));

  let state: TimerSnapshot | null = null;
  let owner: string | null = null;
  let beeped = false;

  const channel = new BroadcastChannel(TIMER_CHANNEL);

  channel.onmessage = (ev: MessageEvent) => {
    const msg = ev.data as RemoteMsg | undefined;
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'state' && msg.state) {
      applySnapshot(msg.state as TimerSnapshot, (msg.owner as string) || undefined);
    }
  };

  function applySnapshot(s: TimerSnapshot, ownerId?: string): void {
    state = s;
    // The widget must know which main page it is talking to before it can
    // send commands. The BroadcastChannel path sets it from the message;
    // setSnapshot() (used when attaching a PiP window directly) has to pass
    // it explicitly — otherwise every button would be a silent no-op.
    if (ownerId) owner = ownerId;
    beeped = false;
    host.classList.add('is-connected');
    conn.textContent = labels.connected;
    if (document.activeElement !== customInput) customInput.value = String(s.totalTime);
    render();
  }

  function sendCmd(cmd: string, value?: number): void {
    if (!owner) return;
    channel.postMessage({ type: 'cmd', target: owner, cmd, value });
  }

  function render(): void {
    if (!state) {
      clock.textContent = '--:--';
      clock.className = 'tw__clock';
      status.textContent = '';
      return;
    }
    const s = state;
    const now = Date.now();
    const isCountdown = s.mode === 'countdown';

    // Tabs
    tabs.forEach((tb) => tb.classList.toggle('is-active', tb.dataset.tab === s.mode));
    // Presets + custom input are countdown-only controls — hide them in
    // stopwatch mode (the main page keeps them inside the countdown panel).
    presetsWrap.hidden = isCountdown ? false : true;
    customWrap.hidden = isCountdown ? false : true;
    // Presets
    presets.forEach((p) => p.classList.toggle('is-active', Number(p.dataset.preset) === s.totalTime));
    lapBtn.hidden = isCountdown;
    lapsWrap.hidden = isCountdown || s.laps.length === 0;

    let text: string;
    let cls = 'tw__clock';
    let statusText: string;

    if (isCountdown) {
      const rem = s.running ? Math.max(0, Math.ceil((s.endAt - now) / 1000)) : s.remaining;
      text = fmtTime(rem);
      if (rem === 0) cls += ' is-done';
      else if (s.running && rem <= 10) cls += ' is-warning';
      else if (s.running) cls += ' is-running';
      statusText = s.running
        ? labels.running
        : rem === 0
          ? labels.done
          : rem < s.totalTime
            ? labels.paused
            : labels.ready;
      if (s.running && rem === 0 && !beeped && s.soundEnabled) {
        beeped = true;
        beep();
      }
    } else {
      const elapsed = s.swRunning ? now - s.swStartAt : s.swElapsed;
      text = fmtMs(elapsed);
      if (s.swRunning) cls += ' is-running';
      statusText = s.swRunning ? labels.running : elapsed > 0 ? labels.paused : labels.ready;
    }

    clock.textContent = text;
    clock.className = cls;
    status.textContent = statusText;

    // Toggle button
    const runningNow = isCountdown ? s.running : s.swRunning;
    const hasProgress = isCountdown ? s.remaining < s.totalTime || s.remaining === 0 : s.swElapsed > 0 || s.swRunning;
    toggle.textContent = runningNow
      ? labels.pause
      : isCountdown && s.remaining === 0
        ? labels.start
        : hasProgress
          ? labels.resume
          : labels.start;

    // Laps (newest first)
    if (!isCountdown) {
      const rows = s.laps
        .slice()
        .reverse()
        .map(
          (lap, i) => `<div class="tw__laps-row${i === 0 ? ' is-latest' : ''}">
            <span>${s.laps.length - i}</span><span>${fmtMs(lap.lapTime)}</span><span>${fmtMs(lap.totalTime)}</span>
          </div>`,
        )
        .join('');
      lapsBody.innerHTML = rows;
    }
  }

  toggle.addEventListener('click', () => {
    if (!state) return;
    const runningNow = state.mode === 'countdown' ? state.running : state.swRunning;
    sendCmd(runningNow ? 'pause' : 'start');
    render();
  });
  resetBtn.addEventListener('click', () => {
    sendCmd('reset');
    render();
  });
  lapBtn.addEventListener('click', () => {
    sendCmd('lap');
    render();
  });
  tabs.forEach((tb) => {
    tb.addEventListener('click', () => {
      sendCmd('setMode', tb.dataset.tab === 'stopwatch' ? 1 : 0);
      render();
    });
  });
  presets.forEach((p) => {
    p.addEventListener('click', () => {
      sendCmd('setTime', Number(p.dataset.preset));
      render();
    });
  });
  const applyCustom = () => {
    const v = Math.max(5, Math.min(600, Number(customInput.value) || 0));
    if (v > 0) sendCmd('setTime', v);
  };
  customOk.addEventListener('click', applyCustom);
  customInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyCustom();
    }
  });

  const interval = window.setInterval(render, 100);

  return {
    sendHello(): void {
      channel.postMessage({ type: 'hello', target: '*' });
    },
    setSnapshot(s: TimerSnapshot, ownerId?: string): void {
      applySnapshot(s, ownerId);
    },
    destroy(): void {
      window.clearInterval(interval);
      channel.close();
      host.remove();
      style.remove();
    },
  };
}
