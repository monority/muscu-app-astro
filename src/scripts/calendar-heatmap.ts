export interface CalendarDay {
  date: string;
  count: number;
}

export function renderHeatmap(container: HTMLElement, data: CalendarDay[], months = 6) {
  const cellSize = 12;
  const cellGap = 2;
  const step = cellSize + cellGap;
  const labelW = 28;

  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1);

  const endDate = new Date(today);

  const dayMap = new Map<string, number>();
  for (const d of data) {
    dayMap.set(d.date, d.count);
  }

  const days: { date: string; level: number }[] = [];
  const cur = new Date(startDate);
  while (cur <= endDate) {
    const key = cur.toISOString().slice(0, 10);
    const count = dayMap.get(key) ?? 0;
    const level = count === 0 ? 0 : count <= 1 ? 1 : count <= 2 ? 2 : count <= 3 ? 3 : 4;
    days.push({ date: key, level });
    cur.setDate(cur.getDate() + 1);
  }

  const weeks: { date: string; level: number }[][] = [];
  let currentWeek: { date: string; level: number }[] = [];
  const startDow = startDate.getDay();
  for (let i = 0; i < startDow; i++) {
    currentWeek.push({ date: "", level: -1 });
  }
  for (const d of days) {
    currentWeek.push(d);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const w = weeks.length * step + labelW;
  const h = 7 * step + 2;

  const monthLabels: string[] = [];
  let lastMonth = -1;
  for (let i = 0; i < weeks.length; i++) {
    const firstDay = weeks[i].find((d) => d.date !== "");
    if (firstDay) {
      const m = new Date(firstDay.date).getMonth();
      if (m !== lastMonth) {
        monthLabels.push(`<text x="${labelW + i * step + step / 2}" y="10" text-anchor="middle" font-size="9" fill="var(--muted)">${["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Aoû","Sep","Oct","Nov","Déc"][m]}</text>`);
        lastMonth = m;
      }
    }
  }

  const colors = [
    "hsl(0 0% 100% / 0.04)",
    "hsl(24 100% 55% / 0.15)",
    "hsl(24 100% 55% / 0.35)",
    "hsl(24 100% 55% / 0.55)",
    "hsl(24 100% 55% / 0.85)",
  ];

  const cells = weeks
    .map((week, wi) =>
      week
        .map((d, di) => {
          if (d.level < 0) return "";
          const x = labelW + wi * step;
          const y = 16 + di * step;
          const fill = colors[d.level] ?? colors[0];
          const title = d.date ? `${new Date(d.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} — ${d.level === 0 ? "Repos" : d.level + " séance" + (d.level > 1 ? "s" : "")}` : "";
          return d.date ? `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${fill}" title="${title}"/>` : "";
        })
        .join(""),
    )
    .join("");

  const legendItems = colors.map((c, i) =>
    `<rect x="${labelW + weeks.length * step + 8 + i * (cellSize + cellGap)}" y="${h - 6}" width="${cellSize}" height="${cellSize}" rx="2" fill="${c}"/>`
  ).join("");

  container.innerHTML = `<svg viewBox="0 0 ${labelW + weeks.length * step + 8 + colors.length * step} ${h + 10}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;min-width:${labelW + 4 * step}px">
    ${monthLabels.join("")}
    ${cells}
    ${legendItems}
    <text x="${labelW + weeks.length * step + 4}" y="${h - 6 + cellSize - 1}" font-size="8" fill="var(--muted)">Moins</text>
    <text x="${labelW + weeks.length * step + 8 + colors.length * step + 4}" y="${h - 6 + cellSize - 1}" font-size="8" fill="var(--muted)">Plus</text>
  </svg>`;
}
