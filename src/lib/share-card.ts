/**
 * share-card — Canvas-based session share card generator.
 *
 * Builds a 1080x1080 PNG summary of a session and returns a data URL.
 * Pure canvas API — no external dependencies. Browser-only (uses DOM).
 */

import type { Session } from './storage';
import { exerciseVolume } from './workout-helpers';
import { formatDateTime, formatVolume } from './format';
import { statusLabel as statusLabelFn, type StatusLabels } from './session-utils';

// ── Types ───────────────────────────────────────────────────────

export interface ShareCardLabels {
  exercises: string;
  shareSetsLabel: string;
  volume: string;
  setSingular: string;
  setPlural: string;
  moreSingular: string;
  morePlural: string;
  shareFooter: string;
  completed: string;
  inProgress: string;
  planned: string;
}

export interface ShareCardOptions {
  labels: ShareCardLabels;
}

// ── Canvas Helpers ──────────────────────────────────────────────

/** Truncate text with ellipsis until it fits within maxWidth. */
export function truncateForCanvas(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (
    truncated.length > 0 &&
    ctx.measureText(truncated + '\u2026').width > maxWidth
  ) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '\u2026';
}

/** Trace a rounded rectangle path. Caller fills/strokes after. */
export function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// ── Main ────────────────────────────────────────────────────────

/**
 * Generate a 1080x1080 PNG share card for a session.
 * Returns a data URL (data:image/png;base64,...).
 */
export function generateSessionShareCard(
  session: Session,
  options: ShareCardOptions,
): Promise<string> {
  const { labels } = options;

  const W = 1080;
  const H = 1080;
  const PAD = 80;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('Canvas context unavailable'));

  const statusLabels: StatusLabels = {
    completed: labels.completed,
    inProgress: labels.inProgress,
    planned: labels.planned,
  };

  // ── Palette (dark theme) ──
  const bg = '#050505';
  const surface = '#0F0F0F';
  const text = '#F6F6F6';
  const muted = '#9CA3AF';
  const accent = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-accent')
    .trim();
  const border = 'rgba(255, 255, 255, 0.08)';
  const accentSoft = accent
    ? accent.replace(/\)$/, ' / 0.15)')
    : 'transparent';
  const fontCond = '"Inter", sans-serif';
  const fontBody = '"Inter", sans-serif';

  // ── Background ──
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Header: logo + date ──
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = accent;
  ctx.font = `bold 42px ${fontCond}`;
  ctx.textAlign = 'left';
  ctx.fillText('Gym Empire', PAD, 100);

  ctx.fillStyle = muted;
  ctx.font = `28px ${fontBody}`;
  ctx.textAlign = 'right';
  ctx.fillText(formatDateTime(session.date), W - PAD, 100);

  // Accent underline
  ctx.fillStyle = accent;
  ctx.fillRect(PAD, 130, 80, 4);

  // ── Title ──
  ctx.fillStyle = text;
  ctx.font = `bold 64px ${fontCond}`;
  ctx.textAlign = 'left';
  const title = truncateForCanvas(ctx, session.name, W - 2 * PAD);
  ctx.fillText(title, PAD, 220);

  // ── Status badge ──
  const statusText = statusLabelFn(session.status, statusLabels).toUpperCase();
  ctx.font = `600 22px ${fontCond}`;
  const statusW = ctx.measureText(statusText).width;
  const badgeW = statusW + 32;
  const badgeH = 40;
  const badgeX = PAD;
  const badgeY = 248;

  ctx.fillStyle = accentSoft;
  drawRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 20);
  ctx.fill();

  ctx.fillStyle = accent;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(statusText, badgeX + badgeW / 2, badgeY + badgeH / 2);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // ── Stat cards ──
  const statsY = 360;
  const statsH = 150;
  const cardGap = 20;
  const cardW = (W - 2 * PAD - 2 * cardGap) / 3;

  const totalSets = session.exercises.reduce((s, ex) => s + ex.sets.length, 0);
  const totalVolume = session.exercises.reduce((s, ex) => s + exerciseVolume(ex), 0);

  const stats: ReadonlyArray<{ value: string; label: string }> = [
    { value: String(session.exercises.length), label: labels.exercises.toUpperCase() },
    { value: String(totalSets), label: labels.shareSetsLabel },
    { value: formatVolume(totalVolume), label: labels.volume.toUpperCase() },
  ];

  stats.forEach((stat, i) => {
    const x = PAD + i * (cardW + cardGap);

    ctx.fillStyle = surface;
    drawRoundRect(ctx, x, statsY, cardW, statsH, 14);
    ctx.fill();

    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    drawRoundRect(ctx, x, statsY, cardW, statsH, 14);
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.font = `bold 56px ${fontCond}`;
    ctx.textAlign = 'center';
    const value = truncateForCanvas(ctx, stat.value, cardW - 32);
    ctx.fillText(value, x + cardW / 2, statsY + 78);

    ctx.fillStyle = muted;
    ctx.font = `600 18px ${fontCond}`;
    ctx.fillText(stat.label, x + cardW / 2, statsY + 118);
  });

  ctx.textAlign = 'left';

  // ── Exercise list ──
  const sectionY = 580;

  ctx.fillStyle = muted;
  ctx.font = `700 22px ${fontCond}`;
  ctx.fillText(labels.exercises.toUpperCase(), PAD, sectionY);

  ctx.fillStyle = border;
  ctx.fillRect(PAD, sectionY + 16, W - 2 * PAD, 1);

  const listY = sectionY + 64;
  const rowH = 50;
  const maxVisible = 7;
  const visible = session.exercises.slice(0, maxVisible);
  const remaining = session.exercises.length - visible.length;

  ctx.font = `30px ${fontBody}`;

  visible.forEach((ex, i) => {
    const y = listY + i * rowH;

    ctx.fillStyle = text;
    const name = truncateForCanvas(ctx, ex.name, W - 2 * PAD - 220);
    ctx.fillText(name, PAD, y);

    const n = ex.sets.length;
    ctx.fillStyle = muted;
    ctx.textAlign = 'right';
    ctx.fillText(
      `${n} ${n > 1 ? labels.setPlural : labels.setSingular}`,
      W - PAD,
      y,
    );
    ctx.textAlign = 'left';
  });

  if (remaining > 0) {
    const y = listY + visible.length * rowH;
    ctx.fillStyle = muted;
    ctx.font = `italic 28px ${fontBody}`;
    ctx.fillText(
      `+ ${remaining} ${remaining > 1 ? labels.morePlural : labels.moreSingular}`,
      PAD,
      y,
    );
  }

  // ── Footer ──
  ctx.fillStyle = muted;
  ctx.font = `24px ${fontBody}`;
  ctx.textAlign = 'center';
  ctx.fillText(labels.shareFooter, W / 2, 1030);
  ctx.textAlign = 'left';

  // ── Convert to data URL ──
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve('');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    }, 'image/png');
  });
}

/**
 * Trigger a browser download for a data URL.
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(dataUrl), 1000);
}
