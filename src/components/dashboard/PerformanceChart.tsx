"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const generateData = (months: number) => {
  const data = [];
  let value = 2000000;
  const now = new Date();

  for (let i = months; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);

    // Add some realistic variation
    const change = (Math.random() - 0.4) * 100000;
    value = Math.max(value + change, 1500000);

    data.push({
      date: date.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      }),
      value: Math.round(value),
      projected: Math.round(value * 1.08),
    });
  }
  return data;
};

const timeframes = [
  { label: "1M", months: 1 },
  { label: "3M", months: 3 },
  { label: "6M", months: 6 },
  { label: "1Y", months: 12 },
  { label: "All", months: 24 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-lg p-4 shadow-lg border border-border">
        <p className="text-sm text-muted-foreground mb-2">{label}</p>
        <p className="text-lg font-bold text-primary">
          ${payload[0].value.toLocaleString()}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Projected: ${payload[1]?.value?.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export const PerformanceChart = () => {
  const [activeTimeframe, setActiveTimeframe] = useState("1Y");
  const selectedTimeframe = timeframes.find((t) => t.label === activeTimeframe);
  const data = generateData(selectedTimeframe?.months || 12);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card rounded-xl p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold">Portfolio Performance</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Track your investment growth over time
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg">
          {timeframes.map((tf) => (
            <button
              key={tf.label}
              onClick={() => setActiveTimeframe(tf.label)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTimeframe === tf.label
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px] md:h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B77F" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B77F" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A6D8F8" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#A6D8F8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(222, 30%, 16%)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="projected"
              stroke="#A6D8F8"
              strokeWidth={2}
              strokeDasharray="5 5"
              fillOpacity={1}
              fill="url(#colorProjected)"
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10B77F"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: "#10B77F" }}
          />
          <span className="text-muted-foreground">Actual Value</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: "#A6D8F8" }}
          />
          <span className="text-muted-foreground">Projected</span>
        </div>
      </div>
    </motion.div>
  );
};
