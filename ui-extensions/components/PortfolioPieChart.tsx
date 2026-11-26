'use client';

import React, { useEffect, useId, useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { COLOR_BLIND_SAFE_PALETTE, type DataVisualizationPattern } from './colorBlindPalette';

export interface PortfolioSegment {
  name: string;
  value: number;
}

export interface PortfolioPieChartProps {
  data: PortfolioSegment[];
  colors?: string[];
}

interface PaletteLegendEntry {
  value?: string;
  color?: string;
  payload?: { pattern?: DataVisualizationPattern; color?: string };
}

function contrastingInk(hex: string): string {
  if (!/^#?[0-9a-f]{6}$/i.test(hex)) return '#FFFFFF';
  const value = hex.startsWith('#') ? hex.slice(1) : hex;
  const channels = value.match(/[0-9a-f]{2}/gi)!.map((part) => Number.parseInt(part, 16) / 255);
  const linear = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  return luminance > 0.179 ? '#000000' : '#FFFFFF';
}

export function PatternMarker({ pattern, color }: { pattern: DataVisualizationPattern; color: string }) {
  const common = { fill: color };
  switch (pattern) {
    case 'circle': return <circle cx="8" cy="8" r="5" {...common} />;
    case 'square': return <rect x="3" y="3" width="10" height="10" {...common} />;
    case 'triangle': return <path d="M8 2 14 13H2L8 2Z" {...common} />;
    case 'diamond': return <path d="m8 1 7 7-7 7-7-7 7-7Z" {...common} />;
    case 'cross': return <path d="M8 2v12M2 8h12" fill="none" stroke={color} strokeWidth="3" />;
    case 'stripe': return <path d="M3 13 7 3m2 10 4-10" fill="none" stroke={color} strokeWidth="3" />;
    case 'dash': return <path d="M2 5h12M2 11h12" fill="none" stroke={color} strokeWidth="3" />;
    case 'ring': return <circle cx="8" cy="8" r="5" fill="none" stroke={color} strokeWidth="2.5" />;
    default: return null;
  }
}

function PaletteLegend({ payload }: { payload?: PaletteLegendEntry[] }) {
  if (!payload?.length) return null;

  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs" aria-label="Portfolio chart legend">
      {payload.map((entry, index) => {
        const pattern = entry.payload?.pattern ?? COLOR_BLIND_SAFE_PALETTE[index % COLOR_BLIND_SAFE_PALETTE.length].pattern;
        return (
          <li key={`${entry.value ?? 'segment'}-${index}`} className="inline-flex items-center gap-1.5">
            <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 16 16">
              <PatternMarker pattern={pattern} color={entry.payload?.color ?? entry.color ?? '#000000'} />
            </svg>
            <span>{entry.value}</span>
            <span className="text-gray-500 dark:text-gray-400">({pattern})</span>
          </li>
        );
      })}
    </ul>
  );
}

export function PortfolioPieChart({ data, colors }: PortfolioPieChartProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const chartId = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const segments = data.slice(0, COLOR_BLIND_SAFE_PALETTE.length).map((segment, index) => ({
    ...segment,
    color: colors?.[index] ?? COLOR_BLIND_SAFE_PALETTE[index].color,
    pattern: COLOR_BLIND_SAFE_PALETTE[index].pattern,
  }));
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="h-72 w-full text-gray-900 dark:text-gray-100" role="group" aria-label="Portfolio distribution chart">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            {segments.map((segment, index) => (
              <pattern key={segment.name} id={`${chartId}-pattern-${index}`} width="16" height="16" patternUnits="userSpaceOnUse">
                <rect width="16" height="16" fill={segment.color} />
                <PatternMarker pattern={segment.pattern} color={contrastingInk(segment.color)} />
              </pattern>
            ))}
          </defs>
          <Pie
            data={segments}
            dataKey="value"
            nameKey="name"
            innerRadius="55%"
            outerRadius="80%"
            isAnimationActive={!reduceMotion}
          >
            {segments.map((s, index) => (
              <Cell key={s.name} fill={`url(#${chartId}-pattern-${index})`} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [
              `${value.toLocaleString()} (${total ? ((value / total) * 100).toFixed(1) : 0}%)`,
              name,
            ]}
          />
          <Legend content={<PaletteLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PortfolioPieChart;
