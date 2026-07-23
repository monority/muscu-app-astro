export interface ChartPoint {
  label: string;
  value: number;
}

export function barChart(data: ChartPoint[], width = 600, height = 240): string {
  const max = Math.max(...data.map((d) => d.value), 1);
  const padTop = 16;
  const padBottom = 28;
  const padLeft = 0;
  const padRight = 0;
  const chartH = height - padTop - padBottom;
  const count = data.length;
  if (count === 0) return "";

  const cellW = width / count;
  const barW = Math.max(4, cellW * 0.6);
  const gap = cellW - barW;

  const bars = data
    .map((d, i) => {
      const barH = (d.value / max) * chartH;
      const x = i * cellW + gap / 2;
      const y = padTop + chartH - barH;
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${barH.toFixed(1)}" rx="3" fill="var(--accent)" opacity="0.85" data-value="${d.value}"/>`;
    })
    .join("");

  const labels = data
    .map((d, i) => {
      const x = i * cellW + cellW / 2;
      return `<text x="${x.toFixed(1)}" y="${(height - 6).toFixed(1)}" text-anchor="middle" font-size="10" fill="var(--muted)">${d.label}</text>`;
    })
    .join("");

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">${bars}${labels}</svg>`;
}
