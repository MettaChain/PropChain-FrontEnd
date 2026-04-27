'use client';

/**
 * ReferralDashboard - Main referral dashboard component
 * Displays user's referral stats, links, rewards, and leaderboard
 */

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import {
  useReferralStore,
  useReferralStats,
  useRecentRewards,
  useReferralLoading,
} from '@/store/referralStore';
import { referralService } from '@/lib/referralService';
import { WalletAddress, createWalletAddress } from '@/types/referral';
import Link from 'next/link';

import ReferralLinksCard from './ReferralLinksCard';
import ReferralStatsCard from './ReferralStatsCard';
import RewardsDisplay from './RewardsDisplay';
import QuickStats from './QuickStats';

export interface ReferralDashboardProps {
  showLeaderboard?: boolean;
  compact?: boolean;
}

export default function ReferralDashboard({
  showLeaderboard = true,
  compact = false,
}: ReferralDashboardProps) {
  const { address, isConnected } = useAccount();
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    setDashboardLoading,
    setError,
    updateStats,
    updateRecentRewards,
    updateReferralLinks,
    setNotification,
  } = useReferralStore();

  const stats = useReferralStats();
  const recentRewards = useRecentRewards();
  const { dashboardLoading } = useReferralLoading();

  /**
   * Initialize dashboard data
   */
  useEffect(() => {
    if (!isConnected || !address || isInitialized) return;

    const initializeDashboard = async () => {
      try {
        setDashboardLoading(true);
        const walletAddress = createWalletAddress(address);

        // Fetch dashboard data
        const dashboardData = await referralService.getDashboardData(
          walletAddress
        );

        // Update store with fetched data
        updateStats(dashboardData.stats);
        updateRecentRewards(dashboardData.recentRewards);
        updateReferralLinks(dashboardData.referralLinks);

        setIsInitialized(true);
        setNotification('Referral dashboard loaded successfully', 'success');
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to load referral dashboard';
        setError(message);
        setNotification(message, 'error');
      } finally {
        setDashboardLoading(false);
      }
    };

    initializeDashboard();
  }, [isConnected, address, isInitialized]);

  if (!isConnected) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
        <h3 className="mb-2 text-lg font-semibold text-yellow-900">
          Connect Wallet
        </h3>
        <p className="text-yellow-800">
          Please connect your wallet to access the referral program
        </p>
      </div>
    );
  }

  if (dashboardLoading && !stats) {
    return (
      <div className="space-y-6">
        <div className="h-32 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-48 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-48 animate-pulse rounded-lg bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${compact ? 'space-y-4' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Referral Program
          </h1>
          <p className="mt-1 text-slate-600">
            Earn rewards by inviting investors to PropChain
          </p>
        </div>
        <Link
          href="/referral/terms"
          className="text-sm text-blue-600 underline hover:text-blue-700"
        >
          View Terms
        </Link>
      </div>

      {/* Quick Stats */}
      {stats && <QuickStats stats={stats} />}

      {/* Main Content Grid */}
      <div className={`grid gap-6 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        {/* Referral Links Card */}
        <ReferralLinksCard />

        {/* Stats Card */}
        {stats && <ReferralStatsCard stats={stats} />}
      </div>

      {/* Rewards Display */}
      {recentRewards.length > 0 && <RewardsDisplay rewards={recentRewards} />}

      {/* Leaderboard Link */}
      {showLeaderboard && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h3 className="mb-2 flex items-center text-lg font-semibold text-blue-900">
            <span className="mr-2">🏆</span>
            Top Referrers
          </h3>
          <p className="mb-4 text-blue-800">
            Check how you rank among other referrers in the PropChain community.
          </p>
          <Link
            href="/referral/leaderboard"
            className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            View Leaderboard →
          </Link>
        </div>
      )}
    </div>
  );
}
