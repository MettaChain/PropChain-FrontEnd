/**
 * Integration tests for the reward claim flow in useRewardDistribution.ts.
 *
 * Issue #1331 names `useStakingRewards`, which does not exist in this repo, so
 * this covers the closest real reward logic: useRewardDistributionValidator
 * (amount/zero/minimum/duplicate rules) and useClaimRewards, used together.
 */
const mockUseAccount = jest.fn();

jest.mock('wagmi', () => ({
  useAccount: (...args: any[]) => mockUseAccount(...args),
  useWriteContract: jest.fn(),
  useWaitForTransactionReceipt: jest.fn(),
}));
jest.mock('viem', () => ({ parseUnits: jest.fn() }));
jest.mock('@/store/referralStore', () => ({
  useReferralStore: () => ({ setIsClaimingRewards: jest.fn(), setNotification: jest.fn() }),
}));
jest.mock('@/utils/secureId', () => ({ generateMockTxHash: () => '0xmockhash' }));

import { renderHook, act } from '@testing-library/react';
import { useClaimRewards, useRewardDistributionValidator } from '../useRewardDistribution';

describe('reward claim flow', () => {
  beforeEach(() => {
    mockUseAccount.mockReturnValue({ address: '0xabc', chainId: 1 });
  });

  describe('useRewardDistributionValidator', () => {
    const validate = (ids: string[], amount: bigint, min?: bigint) =>
      renderHook(() => useRewardDistributionValidator()).result.current.validateRewardClaim(
        ids,
        amount,
        min,
      );

    it('accepts a valid claim', () => {
      expect(validate(['r1', 'r2'], 100n)).toEqual({ isValid: true });
    });

    it('rejects an empty selection', () => {
      expect(validate([], 100n)).toEqual({ isValid: false, error: 'No rewards selected' });
    });

    it('rejects a zero amount', () => {
      expect(validate(['r1'], 0n)).toEqual({ isValid: false, error: 'Invalid claim amount' });
    });

    it('enforces the minimum claimable amount', () => {
      expect(validate(['r1'], 5n, 10n)).toEqual({
        isValid: false,
        error: 'Minimum claimable amount is 10',
      });
      expect(validate(['r1'], 10n, 10n).isValid).toBe(true);
    });

    it('rejects duplicate reward ids', () => {
      expect(validate(['r1', 'r1'], 10n)).toEqual({ isValid: false, error: 'Duplicate reward IDs' });
    });
  });

  describe('useClaimRewards', () => {
    it('returns a pending claim for a valid request', async () => {
      const { result } = renderHook(() => useClaimRewards());

      let claim: any;
      await act(async () => {
        claim = await result.current.claimRewards(['r1'], 250n);
      });

      expect(claim).toEqual({
        transactionHash: '0xmockhash',
        claimedAmount: '250',
        claimStatus: 'pending',
      });
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('reports an error and returns null when the wallet is disconnected', async () => {
      mockUseAccount.mockReturnValue({ address: undefined, chainId: undefined });
      const { result } = renderHook(() => useClaimRewards());

      let claim: any;
      await act(async () => {
        claim = await result.current.claimRewards(['r1'], 250n);
      });

      expect(claim).toBeNull();
      expect(result.current.error).toBe('Wallet not connected');
    });

    it('throws and sets error for a zero amount', async () => {
      const { result } = renderHook(() => useClaimRewards());

      await act(async () => {
        await expect(result.current.claimRewards(['r1'], 0n)).rejects.toThrow('Invalid claim amount');
      });

      expect(result.current.error).toBe('Invalid claim amount');
    });

    it('throws when there are no rewards to claim', async () => {
      const { result } = renderHook(() => useClaimRewards());

      await act(async () => {
        await expect(result.current.claimRewards([], 10n)).rejects.toThrow('No rewards to claim');
      });
    });
  });
});
