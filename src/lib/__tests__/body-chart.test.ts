import { describe, it, expect } from 'vitest';
import { renderWeightChart, type ChartDeps } from '../body-chart';
import type { BodyRecord } from '../storage';

const deps: ChartDeps = {
  cssVar: (name: string) => `var(${name})`,
  formatDate: (iso: string) => iso,
  chartTitle: 'Weight chart',
};

function record(date: string, weight: number): BodyRecord {
  return { date, weight } as BodyRecord;
}

describe('renderWeightChart', () => {
  it('returns empty string for no records', () => {
    expect(renderWeightChart([], deps)).toBe('');
  });

  it('returns SVG string for single record', () => {
    const svg = renderWeightChart([record('2026-01-01', 80)], deps);
    expect(svg).toContain('<svg');
    expect(svg).toContain('role="img"');
    expect(svg).toContain('Weight chart');
    expect(svg).toContain('80 kg');
  });

  it('returns SVG with two records', () => {
    const svg = renderWeightChart(
      [record('2026-01-01', 80), record('2026-02-01', 82)],
      deps,
    );
    expect(svg).toContain('<path');
    expect(svg).toContain('<circle');
    expect(svg).toContain('80 kg');
    expect(svg).toContain('82 kg');
  });

  it('includes gradient definition', () => {
    const svg = renderWeightChart(
      [record('2026-01-01', 80), record('2026-02-01', 82)],
      deps,
    );
    expect(svg).toContain('linearGradient');
    expect(svg).toContain('poids-grad');
  });

  it('handles identical weights (span < 1)', () => {
    const svg = renderWeightChart(
      [record('2026-01-01', 80), record('2026-02-01', 80)],
      deps,
    );
    expect(svg).toContain('<svg');
    expect(svg).toContain('80 kg');
  });
});
