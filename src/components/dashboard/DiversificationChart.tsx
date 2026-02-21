'use client';

import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const propertyTypeData = [
  { name: "Residential", value: 45, color: "hsl(160, 84%, 39%)" },
  { name: "Commercial", value: 30, color: "hsl(199, 89%, 48%)" },
  { name: "Industrial", value: 15, color: "hsl(38, 92%, 50%)" },
  { name: "Mixed-Use", value: 10, color: "hsl(280, 65%, 60%)" },
];

const geographicData = [
  { name: "North America", value: 50, color: "hsl(160, 84%, 39%)" },
  { name: "Europe", value: 25, color: "hsl(199, 89%, 48%)" },
  { name: "Asia Pacific", value: 15, color: "hsl(38, 92%, 50%)" },
  { name: "Other", value: 10, color: "hsl(280, 65%, 60%)" },
];

interface PieTooltipPayloadItem {
  name?: string;
  value?: number;
  payload?: { color?: string };
}

interface PieTooltipProps {
  active?: boolean;
  payload?: PieTooltipPayloadItem[];
}

const CustomTooltip = ({ active, payload }: PieTooltipProps) => {
  const firstPayload = payload?.[0];

  if (active && firstPayload && typeof firstPayload.value === "number") {
    return (
      <div className="glass-card rounded-lg p-3 shadow-lg border border-border">
        <p className="text-sm font-medium">{firstPayload.name}</p>
        <p className="text-lg font-bold" style={{ color: firstPayload.payload?.color }}>
          {firstPayload.value}%
        </p>
      </div>
    );
  }
  return null;
};

interface DiversificationPieProps {
  data: typeof propertyTypeData;
  title: string;
}

const DiversificationPie = ({ data, title }: DiversificationPieProps) => {
  return (
    <div className="flex-1">
      <h4 className="text-sm font-medium text-muted-foreground mb-4 text-center">{title}</h4>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-muted-foreground">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DiversificationChart = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card rounded-xl p-6"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Portfolio Diversification</h3>
        <p className="text-sm text-muted-foreground mt-1">Asset allocation breakdown</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <DiversificationPie data={propertyTypeData} title="By Property Type" />
        <div className="hidden md:block w-px bg-border" />
        <DiversificationPie data={geographicData} title="By Geography" />
      </div>
    </motion.div>
  );
};
