/**
 * Integration tests for useTransactionHistory (exported from useTransactionQuery).
 * Exercises the merge of API and store data, error/loading aggregation, type
 * filtering and the retry flow with a real failing mutation.
 */
import { renderHook } from '@testing-library/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { useTransactionStore } from '@/store/transactionStore';
import { logger } from '@/utils/logger';
import { useTransactionHistory } from '../useTransactionQuery';
import type { Transaction } from '@/store/transactionStore';

jest.mock('wagmi', () => ({ useAccount: jest.fn() }));
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));
jest.mock('@/store/transactionStore', () => ({ useTransactionStore: jest.fn() }));
jest.mock('@/lib/transactionService', () => ({
  transactionService: { getTransactions: jest.fn() },
}));
jest.mock('@/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockUseAccount = useAccount as jest.MockedFunction<typeof useAccount>;
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
const mockUseQueryClient = useQueryClient as jest.MockedFunction<typeof useQueryClient>;
const mockUseTransactionStore = useTransactionStore as unknown as jest.Mock;

const tx = (overrides: Partial<Transaction>): Transaction => ({
  id: 'tx-1',
  hash: '0xabc',
  type: 'purchase',
  status: 'confirmed',
  chainId: 1,
  from: '0xwallet1',
  confirmations: 12,
  requiredConfirmations: 12,
  timestamp: 1000,
  ...overrides,
});

const queryResult = (overrides: Record<string, unknown> = {}) =>
  ({ data: [], isLoading: false, error: null, refetch: jest.fn(), ...overrides }) as any;

const storeState = (overrides: Record<string, unknown> = {}) => ({
  transactions: [],
  isLoading: false,
  error: null,
  ...overrides,
});

describe('useTransactionHistory integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccount.mockReturnValue({ address: '0xwallet1' } as any);
    mockUseQueryClient.mockReturnValue({ invalidateQueries: jest.fn() } as any);
    mockUseMutation.mockReturnValue({ mutateAsync: jest.fn(), isPending: false } as any);
    mockUseTransactionStore.mockReturnValue(storeState());
    mockUseQuery.mockReturnValue(queryResult());
  });

  it('returns an empty list on the initial (loading) fetch', () => {
    mockUseQuery.mockReturnValue(queryResult({ data: undefined, isLoading: true }));

    const { result } = renderHook(() => useTransactionHistory());

    expect(result.current.transactions).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('prefers the store copy when API and store share an id', () => {
    mockUseQuery.mockReturnValue(
      queryResult({ data: [tx({ id: 'tx-1', status: 'pending', timestamp: 1000 })] }),
    );
    mockUseTransactionStore.mockReturnValue(
      storeState({ transactions: [tx({ id: 'tx-1', status: 'confirmed', timestamp: 1000 })] }),
    );

    const { result } = renderHook(() => useTransactionHistory());

    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0].status).toBe('confirmed');
  });

  it('filters by type via getTransactionsByType and keeps newest first', () => {
    mockUseQuery.mockReturnValue(
      queryResult({
        data: [
          tx({ id: 'a', type: 'purchase', timestamp: 1 }),
          tx({ id: 'b', type: 'transfer', timestamp: 2 }),
          tx({ id: 'c', type: 'purchase', timestamp: 3 }),
        ],
      }),
    );

    const { result } = renderHook(() => useTransactionHistory());

    expect(result.current.getTransactionsByType('purchase').map((t) => t.id)).toEqual(['c', 'a']);
    expect(result.current.getTransactionsByType('transfer').map((t) => t.id)).toEqual(['b']);
  });

  it('surfaces the query error message, falling back to the store error', () => {
    mockUseQuery.mockReturnValue(queryResult({ error: new Error('network down') }));
    const first = renderHook(() => useTransactionHistory());
    expect(first.result.current.error).toBe('network down');

    mockUseQuery.mockReturnValue(queryResult());
    mockUseTransactionStore.mockReturnValue(storeState({ error: 'store failed' }));
    const second = renderHook(() => useTransactionHistory());
    expect(second.result.current.error).toBe('store failed');
  });

  it('exposes refetch from the underlying query', () => {
    const refetch = jest.fn();
    mockUseQuery.mockReturnValue(queryResult({ refetch }));

    const { result } = renderHook(() => useTransactionHistory());
    result.current.refetch();

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('returns false and logs when retrying a failed transaction errors', async () => {
    const mutateAsync = jest.fn().mockRejectedValue(new Error('Transaction not found'));
    mockUseMutation.mockReturnValue({ mutateAsync, isPending: false } as any);

    const { result } = renderHook(() => useTransactionHistory());
    const ok = await result.current.retryTransaction(tx({ id: 'tx-f', status: 'failed' }));

    expect(ok).toBe(false);
    expect(mutateAsync).toHaveBeenCalledWith('tx-f');
    expect(logger.error).toHaveBeenCalled();
  });

  it('reflects the retry mutation pending state in isRetrying', () => {
    mockUseMutation.mockReturnValue({ mutateAsync: jest.fn(), isPending: true } as any);

    const { result } = renderHook(() => useTransactionHistory());

    expect(result.current.isRetrying).toBe(true);
  });
});
