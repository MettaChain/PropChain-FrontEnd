"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Distribution } from "../RentalIncomeDistribution";

interface CumulativeIncomeChartProps {
  distributions: Distribution[];
}

const CumulativeIncomeChart = ({ distributions }: CumulativeIncomeChartProps) => {
  const chartData = useMemo(() => {
    // Group by month and calculate cumulative income
    const grouped = new Map<string, { claimed: number; pending: number }>();

    distributions.forEach((dist) => {
      const monthKey = dist.timestamp.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
      });

      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, { claimed: 0, pending: 0 });
      }

      const entry = grouped.get(monthKey)!;
      if (dist.claimed) {
        entry.claimed += dist.amount;
      } else {
        entry.pending += dist.amount;
      }
    });

    // Convert to array and add cumulative total
    let cumulativeTotal = 0;
    const data = Array.from(grouped.entries())
      .sort((a, b) => new Date(`01 ${a[0]}`).getTime() - new Date(`01 ${b[0]}`).getTime())
      .map(([month, { claimed, pending }]) => {
        cumulativeTotal += claimed + pending;
        return {
          month,
          claimed,
          pending,
          total: claimed + pending,
          cumulative: cumulativeTotal,
        };
      });

    return data;
  }, [distributions]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cumulative Income</CardTitle>
          <CardDescription>Track your rental income over time</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center text-muted-foreground">
          <p>No distribution data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cumulative Income</CardTitle>
        <CardDescription>Track your rental income over time</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="month"
                className="text-xs"
                tick={{ fill: "var(--muted-foreground)" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "var(--muted-foreground)" }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                }}
                formatter={(value: number) => `$${value.toLocaleString()}`}
              />
              <Legend />
              <Bar dataKey="claimed" fill="var(--primary)" name="Claimed" />
              <Bar dataKey="pending" fill="var(--muted-foreground)" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="month"
                className="text-xs"
                tick={{ fill: "var(--muted-foreground)" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "var(--muted-foreground)" }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                }}
                formatter={(value: number) => `$${value.toLocaleString()}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="cumulative"
                stroke="var(--primary)"
                name="Cumulative Total"
                strokeWidth={2}
                dot={{ fill: "var(--primary)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Total Claimed</p>
            <p className="text-2xl font-bold">
              $
              {distributions
                .filter((d) => d.claimed)
                .reduce((sum, d) => sum + d.amount, 0)
                .toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Pending</p>
            <p className="text-2xl font-bold">
              $
              {distributions
                .filter((d) => !d.claimed)
                .reduce((sum, d) => sum + d.amount, 0)
                .toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CumulativeIncomeChart;
