/**
 * useRewardDistribution - Hook for on-chain reward distribution
 * Handles smart contract interactions for distributing referral rewards
 */

import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { useReferralStore } from '@/store/referralStore';

/**
 * Reward distribution hook interface
 */
export interface UseRewardDistributionResult {
  isDistributing: boolean;
  isConfirming: boolean;
  error: string | null;
  txHash: string | null;
  receipt: any | null;
  distributeRewards: (
    amount: string,
    tokenAddress: string,
    chainId: number
  ) => Promise<void>;
  reset: () => void;
}

/**
 * ERC20 Transfer ABI for reward token transfers
 */
const ERC20_TRANSFER_ABI = [
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const;

/**
 * Referral Rewards Contract ABI
 * This would be the actual contract that distributes referral rewards
 */
const REFERRAL_REWARDS_ABI = [
  {
    type: 'function',
    name: 'claimRewards',
    inputs: [
      { name: 'rewardIds', type: 'uint256[]' },
      { name: 'amounts', type: 'uint256[]' },
      { name: 'token', type: 'address' },
    ],
    outputs: [{ name: 'totalClaimed', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'distributeBulkRewards',
    inputs: [
      { name: 'recipients', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' },
      { name: 'token', type: 'address' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'RewardsClaimed',
    inputs: [
      { name: 'claimer', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'token', type: 'address', indexed: false },
    ],
  },
] as const;

/**
 * Use reward distribution hook
 */
export function useRewardDistribution(): UseRewardDistributionResult {
  const { address, chainId } = useAccount();
  const [isDistributing, setIsDistributing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { setIsClaimingRewards, setNotification } = useReferralStore();

  // Contract write hook
  const { writeContract, isPending } = useWriteContract();
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  /**
   * Distribute rewards via smart contract
   */
  const distributeRewards = useCallback(
    async (
      amount: string,
      tokenAddress: string,
      distributionChainId: number
    ) => {
      if (!address || !chainId) {
        setError('Wallet not connected');
        return;
      }

      if (chainId !== distributionChainId) {
        setError(
          `Please switch to the correct network (Chain ID: ${distributionChainId})`
        );
        return;
      }

      try {
        setIsDistributing(true);
        setError(null);
        setIsClaimingRewards(true);

        // Parse amount with 18 decimals (standard for ERC20 tokens)
        const parsedAmount = parseUnits(amount, 18);

        // Call the referral rewards contract
        writeContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_TRANSFER_ABI,
          functionName: 'transfer',
          args: [address, parsedAmount],
        });

        setNotification('Distribution initiated on-chain...', 'info');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Distribution failed';
        setError(message);
        setNotification(message, 'error');
        setIsClaimingRewards(false);
      } finally {
        setIsDistributing(false);
      }
    },
    [address, chainId, writeContract, setIsClaimingRewards, setNotification]
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setTxHash(null);
    setError(null);
    setIsDistributing(false);
  }, []);

  return {
    isDistributing: isDistributing || isPending,
    isConfirming,
    error,
    txHash,
    receipt,
    distributeRewards,
    reset,
  };
}

/**
 * Hook for handling referral reward claims with enhanced error handling
 */
export function useClaimRewards() {
  const { address, chainId } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const claimRewards = useCallback(
    async (rewardIds: string[], totalAmount: bigint) => {
      if (!address || !chainId) {
        setError('Wallet not connected');
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Validate reward IDs
        if (!rewardIds || rewardIds.length === 0) {
          throw new Error('No rewards to claim');
        }

        // Validate amount
        if (totalAmount <= 0n) {
          throw new Error('Invalid claim amount');
        }

        // In a real scenario, this would call a smart contract
        // For now, we'll simulate the transaction
        const mockTxHash = `0x${Math.random().toString(16).slice(2)}`;

        return {
          transactionHash: mockTxHash,
          claimedAmount: totalAmount.toString(),
          claimStatus: 'pending' as const,
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to claim rewards';
        setError(message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [address, chainId]
  );

  return {
    claimRewards,
    isLoading,
    error,
  };
}

/**
 * Hook for tracking reward distribution status
 */
export function useRewardDistributionStatus(txHash: string | null) {
  const [status, setStatus] = useState<'pending' | 'confirming' | 'confirmed' | 'failed'>(
    'pending'
  );
  const [confirmations, setConfirmations] = useState(0);

  const { data: receipt } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  useEffect(() => {
    if (!txHash) {
      setStatus('pending');
      setConfirmations(0);
      return;
    }

    if (!receipt) {
      setStatus('confirming');
      return;
    }

    if (receipt.status === 'success') {
      setStatus('confirmed');
      setConfirmations(receipt.confirmations || 1);
    } else {
      setStatus('failed');
    }
  }, [txHash, receipt]);

  return {
    status,
    confirmations,
    isConfirmed: status === 'confirmed',
    isFailed: status === 'failed',
  };
}

/**
 * Hook to validate reward distribution before submission
 */
export function useRewardDistributionValidator() {
  const validateRewardClaim = useCallback(
    (
      rewardIds: string[],
      amount: bigint,
      minAmount: bigint = BigInt(0)
    ): { isValid: boolean; error?: string } => {
      if (!rewardIds || rewardIds.length === 0) {
        return { isValid: false, error: 'No rewards selected' };
      }

      if (amount <= 0n) {
        return { isValid: false, error: 'Invalid claim amount' };
      }

      if (amount < minAmount) {
        return {
          isValid: false,
          error: `Minimum claimable amount is ${minAmount}`,
        };
      }

      // Check for duplicate IDs
      if (new Set(rewardIds).size !== rewardIds.length) {
        return { isValid: false, error: 'Duplicate reward IDs' };
      }

      return { isValid: true };
    },
    []
  );

  return { validateRewardClaim };
}

// Import useEffect for the status tracking hook
import { useEffect } from 'react';
