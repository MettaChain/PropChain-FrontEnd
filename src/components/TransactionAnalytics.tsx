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

export const TransactionAnalytics: React.FC<TransactionAnalyticsProps> = ({
  transactions,
  isLoading,
}) => {
  // #506: derive each chart slice in isolation. They all read from the same
  // `transactions` reference, so they invalidate together; the value of the
  // split is structural: each slice can be replaced or filtered independently
  // (e.g. feeding only confirmed transactions into the trend chart) without
  // touching the others, and each one is straightforward to test in isolation.
  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tx of transactions) {
      counts[tx.status] = (counts[tx.status] ?? 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const typeChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tx of transactions) {
      counts[tx.type] = (counts[tx.type] ?? 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const volumeChartData = useMemo(() => {
    const dailyVolume: Record<string, number> = {};
    for (const tx of transactions) {
      const date = format(new Date(tx.timestamp), 'yyyy-MM-dd');
      dailyVolume[date] = (dailyVolume[date] ?? 0) + parseFloat(tx.value || '0');
    }
    return Object.entries(dailyVolume)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);
  }, [transactions]);

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
