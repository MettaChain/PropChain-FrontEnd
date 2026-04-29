'use client';

/**
 * QuickStats - Quick statistics overview for referral dashboard
 */

import { ReferralStats } from '@/types/referral';
import { formatUnits } from 'viem';

export interface QuickStatsProps {
  stats: ReferralStats;
}

export default function QuickStats({ stats }: QuickStatsProps) {
  const rewardAmount = formatUnits(BigInt(stats.totalRewardsEarned || 0), 18);
  const claimedAmount = formatUnits(BigInt(stats.totalRewardsClaimed || 0), 18);
  const pendingAmount = formatUnits(BigInt(stats.pendingRewards || 0), 18);

  const statCards = [
    {
      label: 'Total Clicks',
      value: stats.totalClicks.toLocaleString(),
      icon: '👆',
      color: 'blue',
    },
    {
      label: 'Total Signups',
      value: stats.totalSignups.toLocaleString(),
      icon: '👤',
      color: 'green',
    },
    {
      label: 'Conversion Rate',
      value: `${stats.conversionRate.toFixed(1)}%`,
      icon: '📈',
      color: 'purple',
    },
    {
      label: 'Total Rewards',
      value: `${parseFloat(rewardAmount).toFixed(2)} tokens`,
      icon: '💰',
      color: 'yellow',
    },
  ];

  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      accent: 'text-blue-600',
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      accent: 'text-green-600',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-900',
      accent: 'text-purple-600',
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-900',
      accent: 'text-yellow-600',
    },
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {statCards.map((card) => {
        const colors = colorMap[card.color as keyof typeof colorMap];
        return (
          <div
            key={card.label}
            className={`rounded-lg border ${colors.border} ${colors.bg} p-4`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-sm font-medium ${colors.text}`}>
                  {card.label}
                </p>
                <p className={`mt-2 text-2xl font-bold ${colors.accent}`}>
                  {card.value}
                </p>
              </div>
              <span className="text-2xl">{card.icon}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
