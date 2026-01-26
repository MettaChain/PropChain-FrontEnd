"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, DollarSign } from "lucide-react";

const incomeData = [
  { month: "Aug", income: 15200, projected: 16000 },
  { month: "Sep", income: 16800, projected: 16500 },
  { month: "Oct", income: 17500, projected: 17000 },
  { month: "Nov", income: 16200, projected: 17500 },
  { month: "Dec", income: 18900, projected: 18000 },
  { month: "Jan", income: 18240, projected: 18500 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-lg p-3 shadow-lg border border-border">
        <p className="text-sm text-muted-foreground mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-sm">
            <span className="text-muted-foreground">Actual: </span>
            <span className="font-bold text-primary">
              ${payload[0].value.toLocaleString()}
            </span>
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Projected: </span>
            <span className="font-medium text-accent">
              ${payload[1]?.value?.toLocaleString()}
            </span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export const IncomeTracker = () => {
  const totalIncome = incomeData.reduce((sum, d) => sum + d.income, 0);
  const averageIncome = Math.round(totalIncome / incomeData.length);
  const latestIncome = incomeData[incomeData.length - 1].income;
  const previousIncome = incomeData[incomeData.length - 2].income;
  const changePercent = (
    ((latestIncome - previousIncome) / previousIncome) *
    100
  ).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="glass-card rounded-xl p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold">Rental Income</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Monthly income from all properties
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">This Month</p>
            <p className="text-xl font-bold text-primary font-mono">
              ${latestIncome.toLocaleString()}
            </p>
            <div className="flex items-center gap-1 text-success text-xs font-medium">
              <TrendingUp className="w-3 h-3" />+{changePercent}%
            </div>
          </div>
          <div className="w-px bg-border" />
          <div className="text-right">
            <p className="text-xs text-muted-foreground">6-Mo Average</p>
            <p className="text-xl font-bold font-mono">
              ${averageIncome.toLocaleString()}
            </p>
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <DollarSign className="w-3 h-3" />
              per month
            </div>
          </div>
        </div>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={incomeData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(222, 30%, 16%)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "hsl(222, 30%, 16%, 0.5)" }}
            />
            <Bar
              dataKey="income"
              fill="#10B77F"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="projected"
              fill="#A6D8F8"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: "#10B77F" }}
          />
          <span className="text-muted-foreground">Actual Income</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: "#A6D8F8" }}
          />
          <span className="text-muted-foreground">Projected</span>
        </div>
      </div>
    </motion.div>
  );
};
