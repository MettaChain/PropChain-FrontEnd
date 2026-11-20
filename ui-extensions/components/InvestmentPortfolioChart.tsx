'use client';

import React from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface PortfolioHolding {
  name: string;
  value: number;
  change: number;
}

export interface InvestmentPortfolioChartProps {
  holdings: PortfolioHolding[];
  loading?: boolean;
  dark?: boolean;
  height?: number;
}

const POSITIVE = '#10b981';
const NEGATIVE = '#ef4444';

/**
 * Allocation chart for an investment portfolio (#1437).
 *
 * Bars are coloured by the holding's return so a losing position is visible at
 * a glance. The component is presentational: all data comes from `holdings`.
 */
export function InvestmentPortfolioChart({
  holdings,
  loading = false,
  dark = false,
  height = 288,
}: InvestmentPortfolioChartProps) {
  const total = holdings.reduce((sum, holding) => sum + holding.value, 0);

  if (loading) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Loading portfolio chart"
        className={`animate-pulse rounded-lg ${dark ? 'bg-slate-800' : 'bg-slate-100'}`}
        style={{ height }}
      />
    );
  }

  return (
    <div
      className={`w-full ${dark ? 'text-slate-100' : 'text-slate-900'}`}
      style={{ height }}
      role="img"
      aria-label="Investment portfolio allocation"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={holdings}>
          <XAxis dataKey="name" stroke={dark ? '#94a3b8' : '#475569'} />
          <YAxis stroke={dark ? '#94a3b8' : '#475569'} />
          <Tooltip
            formatter={(value: number, _name: string, entry) => {
              const change = (entry?.payload as PortfolioHolding | undefined)?.change ?? 0;
              const share = total ? ((value / total) * 100).toFixed(1) : '0.0';
              return [`${value.toLocaleString()} (${share}%, ${change > 0 ? '+' : ''}${change}%)`, 'Value'];
            }}
          />
          <Bar dataKey="value" name="Value">
            {holdings.map((holding) => (
              <Cell
                key={holding.name}
                fill={holding.change < 0 ? NEGATIVE : POSITIVE}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
