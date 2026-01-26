import { motion } from "framer-motion";
import { AlertTriangle, Shield, TrendingUp, PieChart, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RiskMetric {
  label: string;
  value: number;
  maxValue: number;
  status: "low" | "medium" | "high";
  description: string;
}

const RiskMeter = ({ metric }: { metric: RiskMetric }) => {
  const percentage = (metric.value / metric.maxValue) * 100;
  const statusColors = {
    low: "bg-success",
    medium: "bg-warning",
    high: "bg-destructive",
  };
  const statusTextColors = {
    low: "text-success",
    medium: "text-warning",
    high: "text-destructive",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{metric.label}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3.5 h-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">{metric.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className={`text-sm font-semibold ${statusTextColors[metric.status]}`}>
          {metric.value.toFixed(1)}%
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full ${statusColors[metric.status]} rounded-full`}
        />
      </div>
    </div>
  );
};

const ConcentrationItem = ({ name, percentage, color }: { name: string; percentage: number; color: string }) => (
  <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-sm">{name}</span>
    </div>
    <span className="text-sm font-medium">{percentage}%</span>
  </div>
);

export const RiskAnalysis = () => {
  const riskMetrics: RiskMetric[] = [
    {
      label: "Portfolio Volatility",
      value: 12.4,
      maxValue: 50,
      status: "low",
      description: "Measures how much your portfolio value fluctuates. Lower is generally better for stable investments.",
    },
    {
      label: "Concentration Risk",
      value: 34.2,
      maxValue: 100,
      status: "medium",
      description: "Indicates how much of your portfolio is concentrated in a few assets. High concentration increases risk.",
    },
    {
      label: "Liquidity Risk",
      value: 18.5,
      maxValue: 100,
      status: "low",
      description: "Measures how easily you can sell your assets without significant price impact.",
    },
    {
      label: "Market Correlation",
      value: 45.8,
      maxValue: 100,
      status: "medium",
      description: "Shows how closely your portfolio moves with the overall real estate market.",
    },
  ];

  const concentrationData = [
    { name: "Manhattan Luxury", percentage: 28, color: "bg-primary" },
    { name: "Miami Beach Resort", percentage: 22, color: "bg-accent" },
    { name: "Austin Tech Hub", percentage: 18, color: "bg-chart-3" },
    { name: "Denver Mixed-Use", percentage: 15, color: "bg-chart-4" },
    { name: "Others", percentage: 17, color: "bg-muted-foreground" },
  ];

  const overallRiskScore = 32;
  const getRiskLevel = (score: number) => {
    if (score < 30) return { level: "Low", color: "text-success", bgColor: "bg-success/10" };
    if (score < 60) return { level: "Medium", color: "text-warning", bgColor: "bg-warning/10" };
    return { level: "High", color: "text-destructive", bgColor: "bg-destructive/10" };
  };
  const riskLevel = getRiskLevel(overallRiskScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Risk Analysis</h3>
          <p className="text-sm text-muted-foreground">Portfolio risk metrics and concentration</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${riskLevel.bgColor}`}>
          <Shield className={`w-4 h-4 ${riskLevel.color}`} />
          <span className={`text-sm font-medium ${riskLevel.color}`}>
            {riskLevel.level} Risk
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Metrics */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h4 className="font-medium">Risk Metrics</h4>
          </div>
          {riskMetrics.map((metric, index) => (
            <RiskMeter key={index} metric={metric} />
          ))}
        </div>

        {/* Concentration Analysis */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-primary" />
            <h4 className="font-medium">Top Holdings Concentration</h4>
          </div>
          <div className="glass-card rounded-lg p-4">
            {concentrationData.map((item, index) => (
              <ConcentrationItem key={index} {...item} />
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning">Concentration Alert</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Top 2 properties represent 50% of your portfolio. Consider diversifying.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Risk Score */}
      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Overall Risk Score</p>
            <p className="text-2xl font-bold">{overallRiskScore}/100</p>
          </div>
          <div className="w-48 h-3 bg-gradient-to-r from-success via-warning to-destructive rounded-full relative">
            <motion.div
              initial={{ left: 0 }}
              animate={{ left: `${overallRiskScore}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-foreground rounded-full border-2 border-background shadow-lg"
              style={{ marginLeft: "-8px" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};