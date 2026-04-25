'use client';

/**
 * RewardsDisplay - Displays user's recent referral rewards
 */

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ReferralReward, ReferralRewardStatus } from '@/types/referral';
import { useReferralStore } from '@/store/referralStore';
import { referralService } from '@/lib/referralService';
import { createWalletAddress } from '@/types/referral';
import { formatUnits } from 'viem';
import ClaimRewardsModal from './ClaimRewardsModal';

export interface RewardsDisplayProps {
  rewards: ReferralReward[];
  maxRewardsToShow?: number;
}

const statusColors = {
  [ReferralRewardStatus.PENDING]: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    badge: '⏳',
  },
  [ReferralRewardStatus.PROCESSING]: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    badge: '⚙️',
  },
  [ReferralRewardStatus.COMPLETED]: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    badge: '✓',
  },
  [ReferralRewardStatus.CLAIMED]: {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    badge: '✓✓',
  },
  [ReferralRewardStatus.FAILED]: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    badge: '✕',
  },
};

export default function RewardsDisplay({
  rewards,
  maxRewardsToShow = 5,
}: RewardsDisplayProps) {
  const { address, chainId } = useAccount();
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedRewards, setSelectedRewards] = useState<string[]>([]);

  const displayRewards = rewards.slice(0, maxRewardsToShow);
  const hasMoreRewards = rewards.length > maxRewardsToShow;

  const claimableRewards = rewards.filter(
    (r) => r.status === ReferralRewardStatus.PENDING ||
           r.status === ReferralRewardStatus.COMPLETED
  );

  const handleSelectReward = (rewardId: string) => {
    setSelectedRewards((prev) =>
      prev.includes(rewardId)
        ? prev.filter((id) => id !== rewardId)
        : [...prev, rewardId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRewards.length === claimableRewards.length) {
      setSelectedRewards([]);
    } else {
      setSelectedRewards(claimableRewards.map((r) => r.id));
    }
  };

  const totalClaimable = selectedRewards
    .filter((id) => claimableRewards.find((r) => r.id === id))
    .reduce((sum, id) => {
      const reward = rewards.find((r) => r.id === id);
      return sum + BigInt(reward?.rewardAmount || 0);
    }, BigInt(0));

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center text-xl font-semibold text-slate-900">
            <span className="mr-2">🎁</span>
            Recent Rewards
          </h2>
          {claimableRewards.length > 0 && (
            <button
              onClick={() => setShowClaimModal(true)}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              disabled={selectedRewards.length === 0}
            >
              Claim ({selectedRewards.length})
            </button>
          )}
        </div>

        {displayRewards.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-slate-600">No rewards yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Start referring to earn rewards
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Select All */}
            {claimableRewards.length > 0 && (
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <input
                  type="checkbox"
                  checked={selectedRewards.length === claimableRewards.length}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <label className="text-sm font-medium text-slate-700">
                  Select all claimable rewards
                </label>
              </div>
            )}

            {displayRewards.map((reward) => {
              const colors =
                statusColors[reward.status] ||
                statusColors[ReferralRewardStatus.PENDING];
              const isClaimable =
                reward.status === ReferralRewardStatus.PENDING ||
                reward.status === ReferralRewardStatus.COMPLETED;
              const amount = formatUnits(BigInt(reward.rewardAmount), 18);

              return (
                <div
                  key={reward.id}
                  className={`flex items-center gap-4 rounded-lg border ${colors.border} ${colors.bg} p-4`}
                >
                  {isClaimable && (
                    <input
                      type="checkbox"
                      checked={selectedRewards.includes(reward.id)}
                      onChange={() => handleSelectReward(reward.id)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                  )}

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`font-semibold ${colors.text}`}>
                        {colors.badge} {parseFloat(amount).toFixed(4)}{' '}
                        {reward.rewardToken}
                      </p>
                      <span className={`text-xs font-medium ${colors.text}`}>
                        {reward.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                      <span>Referee: {reward.refereeId.slice(0, 6)}...{reward.refereeId.slice(-4)}</span>
                      <span>
                        {new Date(reward.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {reward.transactionHash && (
                      <a
                        href={`https://etherscan.io/tx/${reward.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 text-xs text-blue-600 hover:text-blue-700"
                      >
                        View Transaction →
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hasMoreRewards && (
          <div className="mt-4 text-center">
            <a
              href="/referral/rewards"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all {rewards.length} rewards →
            </a>
          </div>
        )}
      </div>

      {/* Claim Modal */}
      {showClaimModal && selectedRewards.length > 0 && (
        <ClaimRewardsModal
          rewardIds={selectedRewards}
          totalAmount={totalClaimable}
          onClose={() => {
            setShowClaimModal(false);
            setSelectedRewards([]);
          }}
        />
      )}
    </>
  );
}
