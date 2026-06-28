/**
 * Tests for useRewardDistribution and related hooks
 */

// Mock wagmi
const mockUseAccount = jest.fn();
const mockUseWriteContract = jest.fn();
const mockUseWaitForTransactionReceipt = jest.fn();
const mockWriteContract = jest.fn();

jest.mock('wagmi', () => ({
  useAccount: (...args: any[]) => mockUseAccount(...args),
  useWriteContract: (...args: any[]) => mockUseWriteContract(...args),
  useWaitForTransactionReceipt: (...args: any[]) => mockUseWaitForTransactionReceipt(...args),
}));

// Mock viem
const mockParseUnits = jest.fn();
jest.mock('viem', () => ({
  parseUnits: (...args: any[]) => mockParseUnits(...args),
}));

// Mock referral store
const mockSetIsClaimingRewards = jest.fn();
const mockSetNotification = jest.fn();
jest.mock('@/store/referralStore', () => ({
  useReferralStore: () => ({
    setIsClaimingRewards: mockSetIsClaimingRewards,
    setNotification: mockSetNotification,
  }),
}));

import { renderHook, act } from '@testing-library/react';
import {
  useRewardDistribution,
  useClaimRewards,
  useRewardDistributionStatus,
  useRewardDistributionValidator,
} from '../useRewardDistribution';

describe('useRewardDistribution', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      chainId: 1,
    });

    mockUseWriteContract.mockReturnValue({
      writeContract: mockWriteContract,
      isPending: false,
    });

    mockUseWaitForTransactionReceipt.mockReturnValue({
      data: null,
      isLoading: false,
    });

    mockParseUnits.mockReturnValue(BigInt('1000000000000000000'));
  });

  describe('initial state', () => {
    it('should return correct initial state', () => {
      const { result } = renderHook(() => useRewardDistribution());

      expect(result.current.isDistributing).toBe(false);
      expect(result.current.isConfirming).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.txHash).toBeNull();
      expect(result.current.receipt).toBeNull();
      expect(typeof result.current.distributeRewards).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('distributeRewards - validation', () => {
    it('should set error when wallet is not connected', async () => {
      mockUseAccount.mockReturnValue({ address: null, chainId: null });

      const { result } = renderHook(() => useRewardDistribution());

      await act(async () => {
        await result.current.distributeRewards('1', '0xToken', 1);
      });

      expect(result.current.error).toBe('Wallet not connected');
      expect(mockWriteContract).not.toHaveBeenCalled();
    });

    it('should set error when chain ID does not match', async () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      const { result } = renderHook(() => useRewardDistribution());

      await act(async () => {
        await result.current.distributeRewards('1', '0xToken', 137);
      });

      expect(result.current.error).toContain('Please switch to the correct network');
      expect(result.current.error).toContain('Chain ID: 137');
      expect(mockWriteContract).not.toHaveBeenCalled();
    });

    it('should handle missing address but with chainId', async () => {
      mockUseAccount.mockReturnValue({ address: undefined, chainId: 1 });

      const { result } = renderHook(() => useRewardDistribution());

      await act(async () => {
        await result.current.distributeRewards('1', '0xToken', 1);
      });

      expect(result.current.error).toBe('Wallet not connected');
    });
  });

  describe('distributeRewards - successful distribution', () => {
    it('should call writeContract with correct params', async () => {
      const { result } = renderHook(() => useRewardDistribution());

      await act(async () => {
        await result.current.distributeRewards(
          '1',
          '0x1234567890123456789012345678901234567890',
          1
        );
      });

      expect(mockParseUnits).toHaveBeenCalledWith('1', 18);
      expect(mockWriteContract).toHaveBeenCalledWith({
        address: '0x1234567890123456789012345678901234567890',
        abi: expect.any(Array),
        functionName: 'transfer',
        args: ['0x1234567890123456789012345678901234567890', expect.any(BigInt)],
      });
      expect(mockSetIsClaimingRewards).toHaveBeenCalledWith(true);
      expect(mockSetNotification).toHaveBeenCalledWith(
        'Distribution initiated on-chain...',
        'info'
      );
    });

    it('should set isDistributing to true during distribution', async () => {
      mockUseWriteContract.mockReturnValue({
        writeContract: mockWriteContract,
        isPending: true,
      });

      const { result } = renderHook(() => useRewardDistribution());

      expect(result.current.isDistributing).toBe(true);
    });

    it('should reflect confirming state from receipt', () => {
      mockUseWaitForTransactionReceipt.mockReturnValue({
        data: null,
        isLoading: true,
      });

      const { result } = renderHook(() => useRewardDistribution());

      expect(result.current.isConfirming).toBe(true);
    });
  });

  describe('distributeRewards - error handling', () => {
    it('should handle writeContract errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockWriteContract.mockImplementation(() => {
        throw new Error('Contract call failed');
      });

      const { result } = renderHook(() => useRewardDistribution());

      await act(async () => {
        await result.current.distributeRewards(
          '1',
          '0x1234567890123456789012345678901234567890',
          1
        );
      });

      expect(result.current.error).toBe('Contract call failed');
      expect(mockSetNotification).toHaveBeenCalledWith(
        'Contract call failed',
        'error'
      );
      expect(mockSetIsClaimingRewards).toHaveBeenCalledWith(false);

      consoleErrorSpy.mockRestore();
    });

    it('should handle non-Error objects thrown during writeContract', async () => {
      mockWriteContract.mockImplementation(() => {
        throw 'String error';
      });

      const { result } = renderHook(() => useRewardDistribution());

      await act(async () => {
        await result.current.distributeRewards(
          '1',
          '0x1234567890123456789012345678901234567890',
          1
        );
      });

      expect(result.current.error).toBe('Distribution failed');
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', async () => {
      const { result } = renderHook(() => useRewardDistribution());

      // First cause an error
      mockUseAccount.mockReturnValue({ address: null, chainId: null });
      await act(async () => {
        await result.current.distributeRewards('1', '0xToken', 1);
      });
      expect(result.current.error).not.toBeNull();

      // Then reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.txHash).toBeNull();
      expect(result.current.isDistributing).toBe(false);
    });
  });
});

describe('useClaimRewards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successful claims', () => {
    it('should return a mock transaction hash on successful claim', async () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      const { result } = renderHook(() => useClaimRewards());

      let claimResult: any;
      await act(async () => {
        claimResult = await result.current.claimRewards(['1', '2'], BigInt(1000));
      });

      expect(claimResult).toBeDefined();
      expect(claimResult.transactionHash).toMatch(/^0x/);
      expect(claimResult.claimedAmount).toBe('1000');
      expect(claimResult.claimStatus).toBe('pending');
    });

    it('should handle single reward claim', async () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      const { result } = renderHook(() => useClaimRewards());

      let claimResult: any;
      await act(async () => {
        claimResult = await result.current.claimRewards(['1'], BigInt(500));
      });

      expect(claimResult.claimedAmount).toBe('500');
    });

    it('should handle large BigInt amounts correctly', async () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      const largeAmount = BigInt('1000000000000000000000'); // 1000 tokens with 18 decimals

      const { result } = renderHook(() => useClaimRewards());

      let claimResult: any;
      await act(async () => {
        claimResult = await result.current.claimRewards(['1'], largeAmount);
      });

      expect(claimResult.claimedAmount).toBe('1000000000000000000000');
    });
  });

  describe('validation errors', () => {
    it('should set error when wallet is not connected', async () => {
      mockUseAccount.mockReturnValue({ address: null, chainId: null });

      const { result } = renderHook(() => useClaimRewards());

      let claimResult: any;
      await act(async () => {
        claimResult = await result.current.claimRewards(['1'], BigInt(100));
      });

      expect(claimResult).toBeNull();
      expect(result.current.error).toBe('Wallet not connected');
    });

    it('should throw when reward IDs array is empty', async () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      const { result } = renderHook(() => useClaimRewards());

      await act(async () => {
        try {
          await result.current.claimRewards([], BigInt(100));
        } catch (e: any) {
          expect(e.message).toBe('No rewards to claim');
        }
      });

      expect(result.current.error).toBe('No rewards to claim');
    });

    it('should throw when totalAmount is zero', async () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      const { result } = renderHook(() => useClaimRewards());

      await act(async () => {
        try {
          await result.current.claimRewards(['1'], BigInt(0));
        } catch (e: any) {
          expect(e.message).toBe('Invalid claim amount');
        }
      });

      expect(result.current.error).toBe('Invalid claim amount');
    });

    it('should throw when totalAmount is negative', async () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      const { result } = renderHook(() => useClaimRewards());

      // BigInt(0) <= 0n is true, so it should error
      await act(async () => {
        try {
          await result.current.claimRewards(['1'], BigInt(0));
        } catch (e: any) {
          expect(e.message).toBe('Invalid claim amount');
        }
      });
    });

    it('should handle null/undefined reward IDs gracefully', async () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      const { result } = renderHook(() => useClaimRewards());

      await act(async () => {
        try {
          await result.current.claimRewards(null as any, BigInt(100));
        } catch (e: any) {
          expect(e.message).toBe('No rewards to claim');
        }
      });
    });
  });

  describe('loading state', () => {
    it('should set isLoading to true during claim process', async () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      const { result } = renderHook(() => useClaimRewards());

      expect(result.current.isLoading).toBe(false);

      const claimPromise = act(async () => {
        await result.current.claimRewards(['1'], BigInt(100));
      });

      // After completion, isLoading should be false
      await claimPromise;
      expect(result.current.isLoading).toBe(false);
    });
  });
});

describe('useRewardDistributionStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be in pending state when no txHash is provided', () => {
    mockUseWaitForTransactionReceipt.mockReturnValue({
      data: null,
    });

    const { result } = renderHook(() => useRewardDistributionStatus(null));

    expect(result.current.status).toBe('pending');
    expect(result.current.confirmations).toBe(0);
    expect(result.current.isConfirmed).toBe(false);
    expect(result.current.isFailed).toBe(false);
  });

  it('should be in confirming state when receipt is not yet available', () => {
    mockUseWaitForTransactionReceipt.mockReturnValue({
      data: null,
    });

    const { result } = renderHook(() =>
      useRewardDistributionStatus('0x1234567890abcdef')
    );

    expect(result.current.status).toBe('confirming');
  });

  it('should be in confirmed state when receipt status is success', () => {
    mockUseWaitForTransactionReceipt.mockReturnValue({
      data: { status: 'success', confirmations: 3 },
    });

    const { result } = renderHook(() =>
      useRewardDistributionStatus('0x1234567890abcdef')
    );

    expect(result.current.status).toBe('confirmed');
    expect(result.current.confirmations).toBe(3);
    expect(result.current.isConfirmed).toBe(true);
    expect(result.current.isFailed).toBe(false);
  });

  it('should be in failed state when receipt status is not success', () => {
    mockUseWaitForTransactionReceipt.mockReturnValue({
      data: { status: 'reverted', confirmations: undefined },
    });

    const { result } = renderHook(() =>
      useRewardDistributionStatus('0x1234567890abcdef')
    );

    expect(result.current.status).toBe('failed');
    expect(result.current.isFailed).toBe(true);
  });

  it('should use 1 as default confirmations when undefined', () => {
    mockUseWaitForTransactionReceipt.mockReturnValue({
      data: { status: 'success' },
    });

    const { result } = renderHook(() =>
      useRewardDistributionStatus('0x1234567890abcdef')
    );

    expect(result.current.confirmations).toBe(1);
  });

  it('should reset to pending when txHash changes to null', () => {
    mockUseWaitForTransactionReceipt.mockReturnValue({
      data: { status: 'success', confirmations: 5 },
    });

    const { result, rerender } = renderHook(
      ({ txHash }) => useRewardDistributionStatus(txHash),
      { initialProps: { txHash: '0x1234567890abcdef' as string | null } }
    );

    expect(result.current.status).toBe('confirmed');

    rerender({ txHash: null });

    expect(result.current.status).toBe('pending');
    expect(result.current.confirmations).toBe(0);
  });
});

describe('useRewardDistributionValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate a correct reward claim', () => {
    const { result } = renderHook(() => useRewardDistributionValidator());

    const validation = result.current.validateRewardClaim(
      ['1', '2', '3'],
      BigInt(1000)
    );

    expect(validation.isValid).toBe(true);
    expect(validation.error).toBeUndefined();
  });

  it('should reject empty reward IDs array', () => {
    const { result } = renderHook(() => useRewardDistributionValidator());

    const validation = result.current.validateRewardClaim([], BigInt(100));

    expect(validation.isValid).toBe(false);
    expect(validation.error).toBe('No rewards selected');
  });

  it('should reject zero amount', () => {
    const { result } = renderHook(() => useRewardDistributionValidator());

    const validation = result.current.validateRewardClaim(['1'], BigInt(0));

    expect(validation.isValid).toBe(false);
    expect(validation.error).toBe('Invalid claim amount');
  });

  it('should reject amount below minimum', () => {
    const { result } = renderHook(() => useRewardDistributionValidator());

    const validation = result.current.validateRewardClaim(
      ['1'],
      BigInt(50),
      BigInt(100)
    );

    expect(validation.isValid).toBe(false);
    expect(validation.error).toBe('Minimum claimable amount is 100');
  });

  it('should accept amount above minimum', () => {
    const { result } = renderHook(() => useRewardDistributionValidator());

    const validation = result.current.validateRewardClaim(
      ['1'],
      BigInt(200),
      BigInt(100)
    );

    expect(validation.isValid).toBe(true);
    expect(validation.error).toBeUndefined();
  });

  it('should detect duplicate reward IDs', () => {
    const { result } = renderHook(() => useRewardDistributionValidator());

    const validation = result.current.validateRewardClaim(
      ['1', '2', '1'],
      BigInt(100)
    );

    expect(validation.isValid).toBe(false);
    expect(validation.error).toBe('Duplicate reward IDs');
  });

  it('should handle single reward ID correctly', () => {
    const { result } = renderHook(() => useRewardDistributionValidator());

    const validation = result.current.validateRewardClaim(
      ['1'],
      BigInt(100)
    );

    expect(validation.isValid).toBe(true);
  });

  it('should use BigInt(0) as default minimum when not provided', () => {
    const { result } = renderHook(() => useRewardDistributionValidator());

    // Amount > 0, so it should be valid with default min of 0
    const validation = result.current.validateRewardClaim(
      ['1'],
      BigInt(1)
    );

    expect(validation.isValid).toBe(true);
  });
});
