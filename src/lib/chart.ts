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

export interface LinePoint {
  label: string;
  value: number;
  secondary?: number;
}

export function lineChart(data: LinePoint[], width = 600, height = 240): string {
  if (data.length === 0) return "";
  const padTop = 16;
  const padBottom = 28;
  const padLeft = 32;
  const padRight = 16;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const allValues = data.flatMap((d) => [d.value, d.secondary ?? d.value]);
  const max = Math.max(...allValues, 1);

  function x(i: number) {
    return padLeft + (i / (data.length - 1)) * chartW;
  }

  function y(v: number) {
    return padTop + chartH - (v / max) * chartH;
  }

  const primaryLine = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`)
    .join(" ");

  const primaryDots = data
    .map((d, i) => {
      if (d.value <= 0) return "";
      return `<circle cx="${x(i).toFixed(1)}" cy="${y(d.value).toFixed(1)}" r="3.5" fill="var(--accent)" stroke="var(--surface)" stroke-width="1.5"/>`;
    })
    .join("");

  let secondaryLine = "";
  let secondaryDots = "";
  if (data.some((d) => d.secondary !== undefined)) {
    secondaryLine = data
      .map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.secondary ?? d.value).toFixed(1)}`)
      .join(" ");
    secondaryDots = data
      .map((d, i) => {
        if ((d.secondary ?? 0) <= 0) return "";
        return `<circle cx="${x(i).toFixed(1)}" cy="${y(d.secondary ?? d.value).toFixed(1)}" r="3" fill="var(--accent-2)" stroke="var(--surface)" stroke-width="1.5"/>`;
      })
      .join("");
  }

  const labels = data
    .map((d, i) => {
      if (data.length > 30 && i % 5 !== 0 && i !== data.length - 1) return "";
      const truncLabel = d.label.length > 6 ? d.label.slice(0, 6) + "…" : d.label;
      return `<text x="${x(i).toFixed(1)}" y="${(height - 6).toFixed(1)}" text-anchor="end" transform="rotate(-25,${x(i).toFixed(1)},${(height - 6).toFixed(1)})" font-size="9" fill="var(--muted)">${truncLabel}</text>`;
    })
    .join("");

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">
    <path d="${primaryLine}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>
    ${primaryDots}
    ${secondaryLine ? `<path d="${secondaryLine}" fill="none" stroke="var(--accent-2)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="4,3" opacity="0.7"/>` : ""}
    ${secondaryDots}
    ${labels}
  </svg>`;
}

export function sparkline(data: number[], color = "var(--accent)", height = 24, width = 100): string {
  if (data.length < 2) return "";

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const polyPoints = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const areaPoints = [`0,${height}`, ...polyPoints, `${width},${height}`].join(" ");

  return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sf" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0.02"/>
      </linearGradient>
    </defs>
    <polygon points="${areaPoints}" fill="url(#sf)"/>
    <polyline points="${polyPoints.join(" ")}" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </svg>`;
}
