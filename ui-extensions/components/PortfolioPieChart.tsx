'use client';

import React, { useEffect, useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export interface PortfolioSegment {
  name: string;
  value: number;
}

export interface PortfolioPieChartProps {
  data: PortfolioSegment[];
  colors?: string[];
}

const DEFAULT_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#14b8a6', '#ec4899', '#64748b',
];

export function PortfolioPieChart({ data, colors = DEFAULT_COLORS }: PortfolioPieChartProps) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const segments = data.slice(0, 8);
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="h-72 w-full text-gray-900 dark:text-gray-100" role="img" aria-label="Portfolio distribution">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={segments}
            dataKey="value"
            nameKey="name"
            innerRadius="55%"
            outerRadius="80%"
            isAnimationActive={!reduceMotion}
          >
            {segments.map((s, i) => (
              <Cell key={s.name} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [
              `${value.toLocaleString()} (${total ? ((value / total) * 100).toFixed(1) : 0}%)`,
              name,
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PortfolioPieChart;
