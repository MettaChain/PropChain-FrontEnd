'use client';

import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';
import type { Transaction } from '@/store/transactionStore';
import { format } from 'date-fns';
import React, { useMemo } from 'react';

/**
 * Heaviest dependencies (recharts) are intentionally isolated to this file so
 * the bundler can code-split it away from `TransactionHistory`. The chart UI
 * primitives come along for the ride, but are lightweight wrappers.
 */
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';

const CHART_CONFIG = {
  confirmed: { label: 'Confirmed', color: '#22c55e' },
  pending: { label: 'Pending', color: '#eab308' },
  processing: { label: 'Processing', color: '#3b82f6' },
  failed: { label: 'Failed', color: '#ef4444' },
  cancelled: { label: 'Cancelled', color: '#6b7280' },
  purchase: { label: 'Purchase', color: '#3b82f6' },
  transfer: { label: 'Transfer', color: '#8b5cf6' },
  management: { label: 'Management', color: '#f97316' },
  other: { label: 'Other', color: '#6b7280' },
};

interface TransactionAnalyticsProps {
  transactions: Transaction[];
  isLoading: boolean;
}

/**
 * Pure aggregation helpers used by the `useMemo` calls below.
 *
 * Exported as named functions so the structural split introduced by #506
 * (`statusChartData`, `typeChartData`, `volumeChartData`) is observable
 * in tests at the function boundary rather than only via React render
 * side-effects. Each is independently testable, swappable, and free of
 * chart-component / DOM dependencies.
 *
 * Kept intentionally small and pure: input is a Transaction slice, output
 * is the data shape the corresponding Recharts element expects, with no
 * shared module state.
 */
export type ChartDatum = { name: string; value: number };

/** Counts transactions by `status`. */
export const computeStatusChartData = (transactions: Transaction[]): ChartDatum[] => {
  const counts: Record<string, number> = {};
  for (const tx of transactions) {
    counts[tx.status] = (counts[tx.status] ?? 0) + 1;
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
};

/** Counts transactions by `type`. */
export const computeTypeChartData = (transactions: Transaction[]): ChartDatum[] => {
  const counts: Record<string, number> = {};
  for (const tx of transactions) {
    counts[tx.type] = (counts[tx.type] ?? 0) + 1;
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
};

export type VolumeDatum = { date: string; value: number };

/**
 * Daily sum of `value` per timestamp, sorted ascending by `yyyy-MM-dd`
 * date string, capped at the 30 most recent buckets. Missing or empty
 * `value` short-circuits to 0 via `parseFloat(tx.value || '0')`.
 */
export const computeVolumeChartData = (
  transactions: Transaction[]
): VolumeDatum[] => {
  const dailyVolume: Record<string, number> = {};
  for (const tx of transactions) {
    const date = format(new Date(tx.timestamp), 'yyyy-MM-dd');
    dailyVolume[date] = (dailyVolume[date] ?? 0) + parseFloat(tx.value || '0');
  }
  return Object.entries(dailyVolume)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);
};

export const TransactionAnalytics: React.FC<TransactionAnalyticsProps> = ({
  transactions,
  isLoading,
}) => {
  // #506: each chart slice delegates to a pure derivation above. Wrapping
  // each in its own `useMemo` (with `transactions` as the dep) means the
  // slices are independently testable and individually swappable, even
  // though their shared dep means they invalidate together.
  const statusChartData = useMemo(
    () => computeStatusChartData(transactions),
    [transactions]
  );

  const typeChartData = useMemo(
    () => computeTypeChartData(transactions),
    [transactions]
  );

  const volumeChartData = useMemo(
    () => computeVolumeChartData(transactions),
    [transactions]
  );

  if (isLoading) {
    return null;
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        title="No Data Available"
        description="Load transactions to view analytics"
        icon={BarChart3}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PieChart className="h-5 w-5" />
            Transaction Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={CHART_CONFIG} className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        CHART_CONFIG[entry.name as keyof typeof CHART_CONFIG]
                          ?.color ?? '#8884d8'
                      }
                    />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            Transaction Type Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={CHART_CONFIG} className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeChartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            Transaction Volume Over Time (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={CHART_CONFIG} className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volumeChartData}>
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionAnalytics;
