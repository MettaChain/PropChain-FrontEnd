'use client';

/**
 * ClaimRewardsModal - Modal for claiming on-chain rewards
 */

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useReferralStore, useReferralStats } from '@/store/referralStore';
import { referralService } from '@/lib/referralService';
import { createWalletAddress } from '@/types/referral';
import { formatUnits } from 'viem';

export interface ClaimRewardsModalProps {
  rewardIds: string[];
  totalAmount: bigint;
  onClose: () => void;
}

export default function ClaimRewardsModal({
  rewardIds,
  totalAmount,
  onClose,
}: ClaimRewardsModalProps) {
  const { address, chainId } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [step, setStep] = useState<'confirm' | 'claiming' | 'success' | 'error'>(
    'confirm'
  );

  const { setIsClaimingRewards, setNotification } = useReferralStore();
  const stats = useReferralStats();

  const formattedAmount = formatUnits(totalAmount, 18);

  const handleClaim = async () => {
    if (!address || !chainId) {
      setError('Wallet not connected');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setStep('claiming');
      setIsClaimingRewards(true);

      const response = await referralService.claimRewards({
        referrerId: createWalletAddress(address),
        rewardIds,
        chainId,
      });

      setTxHash(response.transactionHash);
      setStep('success');
      setNotification('Rewards claimed successfully!', 'success');

      // Close modal after 3 seconds
      setTimeout(onClose, 3000);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to claim rewards';
      setError(message);
      setStep('error');
      setNotification(message, 'error');
    } finally {
      setIsLoading(false);
      setIsClaimingRewards(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        {step === 'confirm' && (
          <>
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              Claim Rewards
            </h2>

            <div className="mb-6 space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">Total Amount</span>
                <span className="text-2xl font-bold text-blue-600">
                  {parseFloat(formattedAmount).toFixed(4)} tokens
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Number of Rewards</span>
                <span className="font-semibold">{rewardIds.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Network</span>
                <span className="font-semibold capitalize">
                  {chainId === 1 ? 'Ethereum' : chainId === 137 ? 'Polygon' : 'BSC'}
                </span>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
              ⚠️ Gas fees will be deducted from the claimed amount
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleClaim}
                disabled={isLoading}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Confirm Claim'}
              </button>
            </div>
          </>
        )}

        {step === 'claiming' && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
            </div>
            <h2 className="mb-4 text-center text-xl font-bold text-slate-900">
              Processing Claim
            </h2>
            <p className="text-center text-slate-600">
              Your rewards are being claimed on the blockchain...
            </p>
          </>
        )}

        {step === 'success' && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <span className="text-3xl">✓</span>
              </div>
            </div>
            <h2 className="mb-4 text-center text-xl font-bold text-slate-900">
              Rewards Claimed!
            </h2>
            <p className="mb-4 text-center text-slate-600">
              {parseFloat(formattedAmount).toFixed(4)} tokens have been sent to your
              wallet
            </p>
            {txHash && (
              <a
                href={`https://etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-4 block text-center text-sm text-blue-600 hover:text-blue-700"
              >
                View Transaction →
              </a>
            )}
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
            >
              Done
            </button>
          </>
        )}

        {step === 'error' && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <span className="text-3xl">✕</span>
              </div>
            </div>
            <h2 className="mb-4 text-center text-xl font-bold text-slate-900">
              Claim Failed
            </h2>
            <p className="mb-4 text-center text-red-600">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setStep('confirm')}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-lg bg-slate-600 px-4 py-2 font-medium text-white transition-colors hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
