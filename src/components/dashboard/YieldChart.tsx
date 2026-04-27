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
  Cell,
} from "recharts";

const yieldData = [
  { name: "Manhattan Luxury", yield: 12.5, color: "hsl(160, 84%, 39%)" },
  { name: "Miami Resort", yield: 9.8, color: "hsl(199, 89%, 48%)" },
  { name: "Austin Tech Hub", yield: 11.2, color: "hsl(38, 92%, 50%)" },
  { name: "Denver Mixed", yield: 8.7, color: "hsl(280, 65%, 60%)" },
  { name: "Seattle Water", yield: 7.9, color: "hsl(340, 75%, 55%)" },
  { name: "Chicago Ind.", yield: 6.5, color: "hsl(20, 90%, 60%)" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-lg p-3 shadow-lg border border-border">
        <p className="text-sm font-medium mb-1">{label}</p>
        <p className="text-lg font-bold text-primary">
          {payload[0].value}% <span className="text-xs text-muted-foreground font-normal">Annual Yield</span>
        </p>
      </div>
    );
  }
  return null;
};

export const YieldChart = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass-card rounded-xl p-6 h-full"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Yield per Property</h3>
        <p className="text-sm text-muted-foreground mt-1">Annual ROI breakdown by asset</p>
      </div>

      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={yieldData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(222, 30%, 16%)" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            <Bar 
              dataKey="yield" 
              radius={[0, 4, 4, 0]}
              barSize={20}
            >
              {yieldData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
