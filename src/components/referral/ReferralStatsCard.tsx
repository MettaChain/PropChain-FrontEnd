'use client';

/**
 * ReferralStatsCard - Displays detailed referral statistics
 */

import { ReferralStats, ReferralTier } from '@/types/referral';
import { formatUnits } from 'viem';

export interface ReferralStatsCardProps {
  stats: ReferralStats;
}

const tierBadges = {
  [ReferralTier.BRONZE]: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  [ReferralTier.SILVER]: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  [ReferralTier.GOLD]: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  [ReferralTier.PLATINUM]: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

export default function ReferralStatsCard({ stats }: ReferralStatsCardProps) {
  const pendingAmount = formatUnits(BigInt(stats.pendingRewards || 0), 18);
  const claimedAmount = formatUnits(BigInt(stats.totalRewardsClaimed || 0), 18);
  
  const tierColors = tierBadges[stats.tier] || tierBadges[ReferralTier.BRONZE];

  const tierInfo = {
    [ReferralTier.BRONZE]: { icon: '🥉', next: 'Silver', nextTarget: 10 },
    [ReferralTier.SILVER]: { icon: '🥈', next: 'Gold', nextTarget: 50 },
    [ReferralTier.GOLD]: { icon: '🥇', next: 'Platinum', nextTarget: 100 },
    [ReferralTier.PLATINUM]: { icon: '👑', next: null, nextTarget: null },
  };

  const current = tierInfo[stats.tier] || tierInfo[ReferralTier.BRONZE];
  const progressToNext =
    current.nextTarget ?
      Math.min(
        (stats.referralsSinceReset / current.nextTarget) * 100,
        100
      )
    : 100;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-6 flex items-center text-xl font-semibold text-slate-900">
        <span className="mr-2">📊</span>
        Your Stats & Tier
      </h2>

      <div className="space-y-6">
        {/* Tier Display */}
        <div>
          <div className={`rounded-lg border ${tierColors.border} ${tierColors.bg} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${tierColors.text}`}>Current Tier</p>
                <p className={`mt-1 text-3xl font-bold ${tierColors.text}`}>
                  {current.icon} {stats.tier.toUpperCase()}
                </p>
              </div>
              {current.nextTarget && (
                <div className="text-right">
                  <p className="text-xs text-slate-600">Next Tier</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {current.next}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {current.nextTarget && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Progress</span>
                <span>
                  {stats.referralsSinceReset} / {current.nextTarget}
                </span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-xs font-medium text-blue-600">Pending Rewards</p>
            <p className="mt-2 text-xl font-bold text-blue-900">
              {parseFloat(pendingAmount).toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-blue-700">Ready to claim</p>
          </div>

          <div className="rounded-lg bg-green-50 p-4">
            <p className="text-xs font-medium text-green-600">Claimed Rewards</p>
            <p className="mt-2 text-xl font-bold text-green-900">
              {parseFloat(claimedAmount).toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-green-700">Total claimed</p>
          </div>

          <div className="rounded-lg bg-purple-50 p-4">
            <p className="text-xs font-medium text-purple-600">Join Date</p>
            <p className="mt-2 text-xl font-bold text-purple-900">
              {new Date(stats.joinedAt).toLocaleDateString()}
            </p>
            <p className="mt-1 text-xs text-purple-700">Member since</p>
          </div>

          <div className="rounded-lg bg-orange-50 p-4">
            <p className="text-xs font-medium text-orange-600">Last Activity</p>
            <p className="mt-2 text-xl font-bold text-orange-900">
              {Math.floor(
                (Date.now() - stats.lastActivityAt) / (1000 * 60 * 60 * 24)
              )}d ago
            </p>
            <p className="mt-1 text-xs text-orange-700">Activity recency</p>
          </div>
        </div>

        {/* Benefits */}
        <div className="border-t border-slate-200 pt-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            {stats.tier.toUpperCase()} Tier Benefits
          </h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <span className="text-blue-500">✓</span>
              Base reward structure
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-500">✓</span>
              Community recognition
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-500">✓</span>
              Exclusive leaderboard ranking
            </li>
            {stats.tier !== ReferralTier.BRONZE && (
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✓</span>
                Bonus reward multiplier
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
