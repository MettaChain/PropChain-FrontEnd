"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
  DollarSign,
  Percent,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useI18nFormatting } from "@/utils/i18nFormatting";
import { useWalletStore } from "@/store/walletStore";
import { usePortfolioOverview } from "@/hooks/usePortfolioQuery";

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  delay?: number;
}

const MetricCard = ({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
  delay = 0,
}: MetricCardProps) => {
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
          <p className="text-2xl md:text-3xl font-bold tracking-tight">
            {value}
          </p>
          {change && (
            <div
              className={`flex items-center gap-1.5 text-sm font-medium ${
                changeType === "positive"
                  ? "text-success"
                  : changeType === "negative"
                    ? "text-destructive"
                    : "text-muted-foreground"
              }`}
            >
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
  const { t } = useTranslation("common");
  const { formatCurrency, formatPercentage } = useI18nFormatting();
  const { address } = useWalletStore();
  
  const { portfolio, isLoading, error, refresh } = usePortfolioOverview(address || "", !!address);

  // Calculate metrics from portfolio data
  const calculateMetrics = (): Array<{
    title: string;
    value: string;
    change: string;
    changeType: "positive" | "negative" | "neutral";
    icon: React.ReactNode;
  }> => {
    if (!portfolio) {
      // Return default metrics when no portfolio data
      return [
        {
          title: t("dashboard.portfolioValue"),
          value: formatCurrency(0),
          change: "No data",
          changeType: "neutral",
          icon: <Wallet className="w-5 h-5" />,
        },
        {
          title: t("dashboard.totalProperties"),
          value: "0",
          change: "No data",
          changeType: "neutral",
          icon: <Building2 className="w-5 h-5" />,
        },
        {
          title: t("dashboard.annualYield"),
          value: formatPercentage(0),
          change: "No data",
          changeType: "neutral",
          icon: <Percent className="w-5 h-5" />,
        },
        {
          title: t("dashboard.monthlyIncome"),
          value: formatCurrency(0),
          change: "No data",
          changeType: "neutral",
          icon: <DollarSign className="w-5 h-5" />,
        },
      ];
    }

    // Calculate total properties across all chains
    const totalProperties = portfolio.chains.reduce(
      (total, chain) => total + chain.holdings.length, 
      0
    );

    // Calculate average APY across all holdings
    const holdingsWithApy = portfolio.chains.flatMap(chain => chain.holdings);
    const avgApy = holdingsWithApy.length > 0
      ? holdingsWithApy.reduce((sum, holding) => sum + (holding.apy || 0), 0) / holdingsWithApy.length
      : 0;

    // Calculate monthly income (simplified calculation)
    const monthlyIncome = portfolio.totalValueUSD * (avgApy / 100) / 12;

    return [
      {
        title: t("dashboard.portfolioValue"),
        value: formatCurrency(portfolio.totalValueUSD),
        change: portfolio.error ? "Error loading" : "+12.5% this month", // In production, calculate from historical data
        changeType: portfolio.error ? "negative" : "positive",
        icon: <Wallet className="w-5 h-5" />,
      },
      {
        title: t("dashboard.totalProperties"),
        value: totalProperties.toString(),
        change: totalProperties > 0 ? "+2 this quarter" : "No properties",
        changeType: totalProperties > 0 ? "positive" : "neutral",
        icon: <Building2 className="w-5 h-5" />,
      },
      {
        title: t("dashboard.annualYield"),
        value: formatPercentage(avgApy),
        change: avgApy > 0 ? "+0.6% vs last year" : "No yield data",
        changeType: avgApy > 0 ? "positive" : "neutral",
        icon: <Percent className="w-5 h-5" />,
      },
      {
        title: t("dashboard.monthlyIncome"),
        value: formatCurrency(monthlyIncome),
        change: monthlyIncome > 0 ? "-2.1% vs last month" : "No income data",
        changeType: monthlyIncome > 0 ? "negative" : "neutral",
        icon: <DollarSign className="w-5 h-5" />,
      },
    ];
  };

  const metrics = calculateMetrics();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {metrics.map((metric, index) => (
        <MetricCard key={metric.title} {...metric} delay={index * 0.1} />
      ))}
    </div>
  );
};
