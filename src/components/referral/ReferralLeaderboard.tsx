'use client';

/**
 * ReferralLeaderboard - Displays referral leaderboard with top performers
 */

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useLeaderboardCache, useReferralStore } from '@/store/referralStore';
import { referralService } from '@/lib/referralService';
import { LeaderboardEntry, ReferralTier } from '@/types/referral';
import { formatUnits } from 'viem';

export interface ReferralLeaderboardProps {
  limit?: number;
  compact?: boolean;
  sortBy?: 'totalRewards' | 'totalSignups' | 'recentActivity';
}

const tierBadges = {
  [ReferralTier.BRONZE]: '🥉',
  [ReferralTier.SILVER]: '🥈',
  [ReferralTier.GOLD]: '🥇',
  [ReferralTier.PLATINUM]: '👑',
};

export default function ReferralLeaderboard({
  limit = 50,
  compact = false,
  sortBy = 'totalRewards',
}: ReferralLeaderboardProps) {
  const { address, chainId } = useAccount();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSort, setCurrentSort] = useState<'totalRewards' | 'totalSignups' | 'recentActivity'>(sortBy);

  const { setLeaderboardLoading, setError: setStoreError } = useReferralStore();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        setLeaderboardLoading(true);
        setError(null);

        const response = await referralService.getLeaderboard({
          limit,
          sortBy: currentSort,
          chainId,
        });

        setEntries(response.entries);
        setUserRank(response.userEntry || null);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to load leaderboard';
        setError(message);
        setStoreError(message);
      } finally {
        setIsLoading(false);
        setLeaderboardLoading(false);
      }
    };

    fetchLeaderboard();
  }, [currentSort, chainId, limit]);

  if (!address) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
        <h3 className="mb-2 text-lg font-semibold text-yellow-900">
          Connect Wallet
        </h3>
        <p className="text-yellow-800">
          Please connect your wallet to view the leaderboard
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg bg-slate-200"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${compact ? 'space-y-4' : ''}`}>
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Referral Leaderboard
          </h1>
          <p className="mt-1 text-slate-600">
            Top performers in the PropChain referral program
          </p>
        </div>

        {/* Sort Options */}
        <div className="flex gap-2">
          {(['totalRewards', 'totalSignups', 'recentActivity'] as const).map(
            (option) => (
              <button
                key={option}
                onClick={() => setCurrentSort(option)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  currentSort === option
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {option === 'totalRewards' && 'Top Rewards'}
                {option === 'totalSignups' && 'Top Signups'}
                {option === 'recentActivity' && 'Most Active'}
              </button>
            )
          )}
        </div>
      </div>

      {/* Your Position */}
      {userRank && (
        <div className="rounded-lg border-2 border-blue-500 bg-blue-50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-xl font-bold text-white">
                #{userRank.rank}
              </div>
              <div>
                <p className="font-semibold text-slate-900">Your Position</p>
                <p className="text-sm text-slate-600">
                  {userRank.displayName ||
                    `${userRank.referrerId.slice(0, 6)}...${userRank.referrerId.slice(-4)}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Total Rewards</p>
              <p className="text-2xl font-bold text-blue-600">
                {parseFloat(
                  formatUnits(BigInt(userRank.totalRewardsEarned), 18)
                ).toFixed(2)}{' '}
                tokens
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                  Referrer
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">
                  Tier
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">
                  Rewards
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">
                  Signups
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr
                  key={`${entry.referrerId}-${index}`}
                  className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg font-bold text-white ${
                          entry.rank === 1
                            ? 'bg-yellow-500'
                            : entry.rank === 2
                            ? 'bg-slate-400'
                            : entry.rank === 3
                            ? 'bg-orange-500'
                            : 'bg-slate-300'
                        }`}
                      >
                        {entry.rank}
                      </div>
                      {entry.rank <= 3 && (
                        <span className="text-xl">
                          {entry.rank === 1
                            ? '🥇'
                            : entry.rank === 2
                            ? '🥈'
                            : '🥉'}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {entry.profileImage && (
                        <img
                          src={entry.profileImage}
                          alt={entry.displayName}
                          className="h-8 w-8 rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-medium text-slate-900">
                          {entry.displayName ||
                            `${entry.referrerId.slice(0, 6)}...${entry.referrerId.slice(-4)}`}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xl">
                        {tierBadges[entry.tier]}
                      </span>
                      <span className="text-sm font-medium text-slate-700">
                        {entry.tier.charAt(0).toUpperCase() +
                          entry.tier.slice(1)}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <p className="font-semibold text-slate-900">
                      {parseFloat(
                        formatUnits(BigInt(entry.totalRewardsEarned), 18)
                      ).toFixed(2)}{' '}
                      <span className="text-xs font-normal text-slate-600">
                        tokens
                      </span>
                    </p>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <p className="font-semibold text-slate-900">
                      {entry.totalSignups}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* No Results */}
      {entries.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-slate-600">No leaderboard entries found</p>
        </div>
      )}

      {/* Legend */}
      <div className="rounded-lg bg-slate-50 p-4 text-xs text-slate-600">
        <p className="mb-2 font-semibold text-slate-700">Tier System</p>
        <div className="grid gap-2 md:grid-cols-4">
          <div>🥉 Bronze: 0-10 signups</div>
          <div>🥈 Silver: 11-50 signups</div>
          <div>🥇 Gold: 51-100 signups</div>
          <div>👑 Platinum: 100+ signups</div>
        </div>
      </div>
    </div>
  );
}
