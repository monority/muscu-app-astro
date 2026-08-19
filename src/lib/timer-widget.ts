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

/**
 * Widget → app token map. The injected stylesheet only ever references
 * --tw-* vars; resolveTwTokens() fills them at mount time from the host
 * document's app tokens (global.css is in scope both on /timer/pop and in
 * a Picture-in-Picture window, whose document copies the opener's
 * stylesheets). Reading the computed host tokens — AFTER data-theme has been
 * applied — makes the widget inherit the host theme, so the old
 * `html[data-theme="light"] .tw` override block is no longer needed.
 *
 * `fallback` is the pre-existing widget palette default (dark) and is used
 * ONLY when the app token (and its alternate) is absent.
 */
const RING_RADIUS = 88;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const WIDGET_CSS = `
/* Widget inherits the host theme: global.css is imported by pop.astro and
   copied into Picture-in-Picture windows alongside the opener stylesheets,
   so every --color-* / --alpha-* / --shadow-* / --radius-* / --font-*
   resolves to the active [data-theme] palette. No hardcoded colors live
   here on purpose. */
.tw {
  box-sizing: border-box;
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 2rem 1.6rem 2.4rem;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  user-select: none;
}
.tw *,
.tw *::before,
.tw *::after { box-sizing: border-box; }
.tw button { font-family: inherit; }

/* ── Head — kicker title + connection status ── */
.tw__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--color-border);
}
.tw__title {
  font-family: var(--font-display);
  font-size: 1.0rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-muted);
}
.tw__conn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-muted);
}
.tw__dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: var(--color-destructive);
  flex: 0 0 auto;
  transition: background-color var(--transition-fast);
}
.tw.is-connected .tw__dot { background: var(--color-success); }

/* ── Tabs — segmented pill, accent fill on the active one ── */
.tw__tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
  padding: 0.4rem;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-1), inset 0 -1px 0 var(--alpha-bg-subtle);
}
.tw__tab {
  border: 0;
  background: transparent;
  color: var(--color-muted);
  padding: 0.75rem 0.6rem;
  border-radius: var(--radius-pill);
  cursor: pointer;
  font-family: var(--font-display);
  font-size: 1.0rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast),
    box-shadow var(--transition-fast),
    transform var(--transition-fast);
}
.tw__tab:hover:not(.is-active) { color: var(--color-text); }
.tw__tab:active { transform: scale(0.97); }
.tw__tab.is-active {
  background: var(--color-accent);
  color: var(--color-accent-foreground);
  box-shadow: var(--shadow-1), inset 0 1px 0 var(--alpha-highlight);
}

/* ── Stage — centered hero: ring + clock + status ── */
.tw__stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1 / 1;
  max-width: 26rem;
  margin: 0.6rem auto 0.4rem;
}
.tw__stage--no-ring {
  aspect-ratio: auto;
  padding: 0.4rem 0 0.6rem;
}
.tw__ring {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}
.tw__ring-track {
  fill: none;
  stroke: var(--color-surface-3);
  stroke-width: 4;
}
.tw__ring-progress {
  fill: none;
  stroke: var(--color-accent);
  stroke-width: 5;
  stroke-linecap: round;
  transition:
    stroke-dashoffset var(--transition-fast),
    stroke var(--transition-base);
}
.tw__ring-progress.is-warning { stroke: var(--color-warning); }
.tw__ring-progress.is-done { stroke: var(--color-success); }
.tw__readout {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  text-align: center;
}
.tw__clock {
  font-family: var(--font-display);
  font-size: clamp(4rem, 14vw, 6.4rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
  color: var(--color-text);
  transition: color var(--transition-base);
}
.tw__clock.is-running { color: var(--color-accent); }
.tw__clock.is-warning { color: var(--color-warning); }
.tw__clock.is-done { color: var(--color-success); }
.tw__status {
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--color-muted);
}

/* ── Presets — 4-column pill row ── */
.tw__presets {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.6rem;
}
.tw__presets[hidden],
.tw__custom[hidden],
.tw__laps[hidden],
.tw__ring[hidden] { display: none !important; }
.tw__preset {
  height: 4rem;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast),
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    transform var(--transition-fast);
}
.tw__preset:hover {
  background: var(--color-surface-3);
  border-color: var(--alpha-border);
  transform: translateY(-1px);
}
.tw__preset:active { transform: translateY(0) scale(0.97); }
.tw__preset.is-active {
  color: var(--color-accent);
  border-color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
}

/* ── Custom input — slim pill row ── */
.tw__custom {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.tw__custom-input {
  flex: 1 1 auto;
  min-width: 0;
  height: 4rem;
  padding: 0 1.2rem;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 600;
  text-align: center;
  font-variant-numeric: tabular-nums;
  outline: none;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
  -moz-appearance: textfield;
}
.tw__custom-input::-webkit-outer-spin-button,
.tw__custom-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.tw__custom-input:focus {
  border-color: var(--color-accent);
  box-shadow: var(--focus-ring);
}
.tw__custom-ok {
  height: 4rem;
  padding: 0 1.4rem;
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--color-accent) 55%, transparent);
  border-radius: var(--radius-pill);
  color: var(--color-accent);
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast);
}
.tw__custom-ok:hover {
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
  border-color: var(--color-accent);
}

/* ── Controls — primary + secondary + ghost (mirrors .btn system) ── */
.tw__controls {
  display: flex;
  align-items: stretch;
  gap: 0.6rem;
  margin-top: 0.2rem;
}
.tw__btn {
  flex: 1 1 0;
  min-width: 0;
  height: 4.6rem;
  padding: 0 1.2rem;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast),
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    transform var(--transition-fast);
}
.tw__btn:active { transform: translateY(1px); }
.tw__btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
.tw__btn--primary {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-accent-foreground);
  box-shadow: var(--shadow-1), inset 0 1px 0 var(--alpha-highlight);
}
.tw__btn--primary:hover {
  background: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
  color: var(--color-accent-foreground);
}
.tw__btn--primary:active {
  box-shadow: inset 0 1px 2px hsl(30 90% 20% / 0.35);
}
.tw__btn--secondary {
  background: var(--color-surface-2);
  border-color: var(--color-border-strong);
  color: var(--color-text);
}
.tw__btn--secondary:hover {
  background: var(--color-surface-3);
  border-color: var(--alpha-border);
  color: var(--color-text);
}
.tw__btn--ghost {
  background: transparent;
  color: var(--color-muted);
  border-color: transparent;
}
.tw__btn--ghost:hover {
  background: var(--alpha-bg-subtle);
  color: var(--color-text);
}

/* ── Laps — compact list, accent highlight on latest ── */
.tw__laps {
  margin-top: 0.4rem;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-1);
}
.tw__laps-head {
  display: grid;
  grid-template-columns: 4.2rem 1fr 1fr;
  gap: 0.8rem;
  padding: 1rem 1.4rem;
  background: var(--color-surface-3);
  color: var(--color-muted);
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  border-bottom: 1px solid var(--color-border);
}
.tw__laps-head span:last-child { text-align: right; }
.tw__laps-body { max-height: 16rem; overflow-y: auto; }
.tw__laps-row {
  display: grid;
  grid-template-columns: 4.2rem 1fr 1fr;
  gap: 0.8rem;
  padding: 0.9rem 1.4rem;
  border-top: 1px solid var(--color-border);
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-variant-numeric: tabular-nums;
}
.tw__laps-row:first-child { border-top: 0; }
.tw__laps-row.is-latest {
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
  color: var(--color-accent);
}
.tw__laps-num { color: var(--color-muted); font-weight: 600; }
.tw__laps-row.is-latest .tw__laps-num { color: var(--color-accent); font-weight: 700; }
.tw__laps-total { text-align: right; color: var(--color-accent); font-weight: 600; }

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  .tw__ring-progress { transition: stroke 0.01ms; }
  .tw__clock { transition: none; }
  .tw__btn:active,
  .tw__tab:active,
  .tw__preset:active { transform: none; }
}
`;

type RemoteMsg = { type: string; [k: string]: unknown };

export function mountTimerWidget(root: HTMLElement, labels: TimerWidgetLabels): TimerWidgetHandle {
  const host = document.createElement('div');
  host.className = 'tw';
  host.innerHTML = `
    <header class="tw__head">
      <span class="tw__title">${labels.title}</span>
      <span class="tw__conn"><i class="tw__dot" aria-hidden="true"></i><span data-ref="conn">${labels.disconnected}</span></span>
    </header>

    <div class="tw__tabs" role="tablist" aria-label="${labels.title}">
      <button type="button" class="tw__tab is-active" data-tab="countdown" role="tab" aria-selected="true">${labels.countdown}</button>
      <button type="button" class="tw__tab" data-tab="stopwatch" role="tab" aria-selected="false">${labels.stopwatch}</button>
    </div>

    <div class="tw__stage" data-ref="stage">
      <svg class="tw__ring" data-ref="ring" viewBox="0 0 200 200" aria-hidden="true">
        <circle class="tw__ring-track" cx="100" cy="100" r="${RING_RADIUS}" />
        <circle class="tw__ring-progress" data-ref="ringProgress" cx="100" cy="100" r="${RING_RADIUS}"
          stroke-dasharray="${RING_CIRCUMFERENCE}" stroke-dashoffset="0" />
      </svg>
      <div class="tw__readout">
        <div class="tw__clock" data-ref="clock" aria-live="polite">--:--</div>
        <div class="tw__status" data-ref="status"></div>
      </div>
    </div>

    <div class="tw__presets" data-ref="presets" role="group" aria-label="${labels.custom}">
      ${PRESETS.map((p) => `<button type="button" class="tw__preset" data-preset="${p}">${fmtShort(p)}</button>`).join('')}
    </div>

    <div class="tw__custom" data-ref="custom">
      <input class="tw__custom-input" data-ref="customInput" type="number" min="5" max="600" step="5" inputmode="numeric"
        aria-label="${labels.custom}">
      <button type="button" class="tw__custom-ok" data-ref="customOk">OK</button>
    </div>

    <div class="tw__controls">
      <button type="button" class="tw__btn tw__btn--primary" data-ref="toggle">${labels.start}</button>
      <button type="button" class="tw__btn tw__btn--secondary" data-ref="reset">${labels.reset}</button>
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

  const $ = <T extends Element>(sel: string): T => host.querySelector(sel) as T;
  const stage = $<HTMLDivElement>('[data-ref="stage"]');
  const ring = $<SVGSVGElement>('[data-ref="ring"]');
  const ringProgress = $<SVGCircleElement>('[data-ref="ringProgress"]');
  const clock = $<HTMLDivElement>('[data-ref="clock"]');
  const status = $<HTMLDivElement>('[data-ref="status"]');
  const conn = $<HTMLDivElement>('[data-ref="conn"]');
  const toggle = $<HTMLButtonElement>('[data-ref="toggle"]');
  const resetBtn = $<HTMLButtonElement>('[data-ref="reset"]');
  const lapBtn = $<HTMLButtonElement>('[data-ref="lap"]');
  const lapsWrap = $<HTMLDivElement>('[data-ref="laps"]');
  const lapsBody = $<HTMLDivElement>('[data-ref="lapsBody"]');
  const customInput = $<HTMLInputElement>('[data-ref="customInput"]');
  const customOk = $<HTMLButtonElement>('[data-ref="customOk"]');
  const presetsWrap = $<HTMLDivElement>('[data-ref="presets"]');
  const customWrap = $<HTMLDivElement>('[data-ref="custom"]');
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
      ring.setAttribute('hidden', '');
      return;
    }
    const s = state;
    const now = Date.now();
    const isCountdown = s.mode === 'countdown';

    // Tabs
    tabs.forEach((tb) => {
      const active = tb.dataset.tab === s.mode;
      tb.classList.toggle('is-active', active);
      tb.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    // Presets + custom input are countdown-only controls — hide them in
    // stopwatch mode (the main page keeps them inside the countdown panel).
    presetsWrap.hidden = !isCountdown;
    customWrap.hidden = !isCountdown;
    if (isCountdown) ring.removeAttribute('hidden');
    else ring.setAttribute('hidden', '');
    stage.classList.toggle('tw__stage--no-ring', !isCountdown);
    // Presets
    presets.forEach((p) => p.classList.toggle('is-active', Number(p.dataset.preset) === s.totalTime));
    lapBtn.hidden = isCountdown;
    lapsWrap.hidden = isCountdown || s.laps.length === 0;

    let text: string;
    let cls = 'tw__clock';
    let statusText: string;
    let rem = s.remaining;

    if (isCountdown) {
      rem = s.running ? Math.max(0, Math.ceil((s.endAt - now) / 1000)) : s.remaining;
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
      // Ring fill: empty when reset (rem === totalTime), full at done.
      const progress = s.totalTime > 0 ? Math.max(0, Math.min(1, rem / s.totalTime)) : 0;
      ringProgress.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - progress));
      ringProgress.classList.toggle('is-warning', s.running && rem <= 10 && rem > 0);
      ringProgress.classList.toggle('is-done', rem === 0);
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
            <span class="tw__laps-num">${s.laps.length - i}</span>
            <span>${fmtMs(lap.lapTime)}</span>
            <span class="tw__laps-total">${fmtMs(lap.totalTime)}</span>
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
