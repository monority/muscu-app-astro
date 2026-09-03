/**
 * body-chart — SVG line chart for body weight tracking.
 *
 * Pure function: records → SVG string. No DOM dependency.
 */

import type { BodyRecord } from './storage';

export interface ChartDeps {
  cssVar(name: string): string;
  formatDate(iso: string): string;
  chartTitle: string;
}

export function renderWeightChart(
  records: BodyRecord[],
  deps: ChartDeps,
): string {
  if (records.length === 0) return '';

  const W = 1000;
  const H = 260;
  const PAD_L = 50;
  const PAD_R = 30;
  const PAD_T = 30;
  const PAD_B = 50;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const accent = deps.cssVar('--color-accent');
  const bg = deps.cssVar('--color-bg');
  const muted = deps.cssVar('--color-muted');
  const text = deps.cssVar('--color-text');
  const grid = deps.cssVar('--color-border');

  const weights = records.map((r) => r.weight);
  let minW = Math.min(...weights);
  let maxW = Math.max(...weights);
  const span = maxW - minW;
  if (span < 1) {
    minW = minW - 0.5;
    maxW = maxW + 0.5;
  } else {
    minW = minW - span * 0.1;
    maxW = maxW + span * 0.1;
  }

  const xAt = (i: number) => {
    if (records.length === 1) return PAD_L + plotW / 2;
    return PAD_L + (i / (records.length - 1)) * plotW;
  };
  const yAt = (w: number) => {
    if (maxW === minW) return PAD_T + plotH / 2;
    return PAD_T + (1 - (w - minW) / (maxW - minW)) * plotH;
  };

  const ticks: number[] = [];
  for (let k = 0; k <= 3; k++) {
    ticks.push(minW + ((maxW - minW) * k) / 3);
  }

  const path = records
    .map((r, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(r.weight).toFixed(1)}`)
    .join(' ');

  const first = records[0];
  const last = records[records.length - 1];

  const labelIdxs: number[] = [];
  if (records.length === 1) {
    labelIdxs.push(0);
  } else {
    labelIdxs.push(0);
    if (records.length > 2) {
      labelIdxs.push(Math.floor((records.length - 1) / 2));
    }
    labelIdxs.push(records.length - 1);
  }

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" class="poids__chart" role="img" aria-label="${deps.chartTitle}">`;

  svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="transparent"/>`;

  for (const t of ticks) {
    const y = yAt(t);
    svg += `<line x1="${PAD_L}" y1="${y.toFixed(1)}" x2="${W - PAD_R}" y2="${y.toFixed(1)}" stroke="${grid}" stroke-width="1"/>`;
    svg += `<text x="${PAD_L - 8}" y="${(y + 4).toFixed(1)}" font-size="14" fill="${muted}" text-anchor="end" font-family="var(--font-display, sans-serif)">${Math.round(t * 10) / 10}</text>`;
  }

  const areaPath =
    `M ${xAt(0).toFixed(1)} ${(H - PAD_B).toFixed(1)} ` +
    records
      .map((r, i) => `L ${xAt(i).toFixed(1)} ${yAt(r.weight).toFixed(1)}`)
      .join(' ') +
    ` L ${xAt(records.length - 1).toFixed(1)} ${(H - PAD_B).toFixed(1)} Z`;
  svg += `<defs><linearGradient id="poids-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${accent}" stop-opacity="0.35"/><stop offset="100%" stop-color="${accent}" stop-opacity="0"/></linearGradient></defs>`;
  svg += `<path d="${areaPath}" fill="url(#poids-grad)"/>`;

  svg += `<path d="${path}" fill="none" stroke="${accent}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`;

  svg += `<circle cx="${xAt(0).toFixed(1)}" cy="${yAt(first.weight).toFixed(1)}" r="5" fill="${accent}" stroke="${bg}" stroke-width="2"/>`;
  svg += `<circle cx="${xAt(records.length - 1).toFixed(1)}" cy="${yAt(last.weight).toFixed(1)}" r="6" fill="${accent}" stroke="${bg}" stroke-width="2"/>`;

  for (const i of labelIdxs) {
    const r = records[i];
    svg += `<text x="${xAt(i).toFixed(1)}" y="${(H - PAD_B + 24).toFixed(1)}" font-size="14" fill="${muted}" text-anchor="middle" font-family="var(--font-body, sans-serif)">${deps.formatDate(r.date)}</text>`;
  }

  svg += `<text x="${(xAt(0) - 12).toFixed(1)}" y="${(yAt(first.weight) + 4).toFixed(1)}" font-size="14" font-weight="700" fill="${text}" text-anchor="end" font-family="var(--font-display, sans-serif)">${Math.round(first.weight * 10) / 10} kg</text>`;
  svg += `<text x="${(xAt(records.length - 1) + 12).toFixed(1)}" y="${(yAt(last.weight) + 4).toFixed(1)}" font-size="14" font-weight="700" fill="${text}" text-anchor="start" font-family="var(--font-display, sans-serif)">${Math.round(last.weight * 10) / 10} kg</text>`;

  svg += `</svg>`;
  return svg;
}
