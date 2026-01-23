'use client';

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, Building2, DollarSign, Percent } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  delay?: number;
}

const MetricCard = ({ title, value, change, changeType = "neutral", icon, delay = 0 }: MetricCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass-card rounded-xl p-6 hover:border-primary/30 transition-all duration-300 group"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl md:text-3xl font-bold tracking-tight">{value}</p>
          {change && (
            <div className={`flex items-center gap-1.5 text-sm font-medium ${
              changeType === "positive" ? "text-success" : 
              changeType === "negative" ? "text-destructive" : 
              "text-muted-foreground"
            }`}>
              {changeType === "positive" ? (
                <TrendingUp className="w-4 h-4" />
              ) : changeType === "negative" ? (
                <TrendingDown className="w-4 h-4" />
              ) : null}
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

export const PortfolioOverview = () => {
  const metrics = [
    {
      title: "Total Portfolio Value",
      value: "$2,847,520",
      change: "+12.5% this month",
      changeType: "positive" as const,
      icon: <Wallet className="w-5 h-5" />,
    },
    {
      title: "Total Properties",
      value: "12",
      change: "+2 this quarter",
      changeType: "positive" as const,
      icon: <Building2 className="w-5 h-5" />,
    },
    {
      title: "Annual Yield",
      value: "8.4%",
      change: "+0.6% vs last year",
      changeType: "positive" as const,
      icon: <Percent className="w-5 h-5" />,
    },
    {
      title: "Monthly Income",
      value: "$18,240",
      change: "-2.1% vs last month",
      changeType: "negative" as const,
      icon: <DollarSign className="w-5 h-5" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {metrics.map((metric, index) => (
        <MetricCard
          key={metric.title}
          {...metric}
          delay={index * 0.1}
        />
      ))}
    </div>
  );
};
