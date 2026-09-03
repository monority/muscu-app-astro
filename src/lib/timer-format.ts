/**
 * timer-format — Pure time formatting for the timer page.
 *
 * Format seconds (countdown) and milliseconds (stopwatch) into
 * display strings. Fully testable, no DOM dependency.
 */

/** Seconds → "01:30" (countdown display). */
export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return mm + ':' + ss;
}

/** Seconds → compact label: "45s", "1:00", "2:30". */
export function formatShort(seconds: number): string {
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  if (mm === 0) return ss + 's';
  if (ss === 0) return mm + ':00';
  return mm + ':' + ss.toString().padStart(2, '0');
}

/** Milliseconds → stopwatch display: "01:23.45" or "1:02:03". */
export function formatStopwatch(ms: number): string {
  const totalMs = Math.max(0, Math.floor(ms));
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 600000) / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const centis = Math.floor((totalMs % 1000) / 10);
  const pad = (n: number, w: number) => n.toString().padStart(w, '0');

  if (hours > 0) {
    return pad(hours, 2) + ':' + pad(minutes, 2) + ':' + pad(seconds, 2);
  }
  return pad(minutes, 2) + ':' + pad(seconds, 2) + '.' + pad(centis, 2);
}
