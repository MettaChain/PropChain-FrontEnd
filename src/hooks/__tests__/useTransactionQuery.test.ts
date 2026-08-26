import { renderHook } from '@testing-library/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { useTransactionStore } from '@/store/transactionStore';
import { transactionService } from '@/lib/transactionService';
import { logger } from '@/utils/logger';
import {
  useTransactionsQuery,
  useTransactionHistory,
  transactionQueryKeys,
} from '../useTransactionQuery';
import type { Transaction } from '@/store/transactionStore';

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('@/store/transactionStore', () => ({
  useTransactionStore: jest.fn(),
}));

jest.mock('@/lib/transactionService', () => ({
  transactionService: {
    getTransactions: jest.fn(),
  },
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockUseAccount = useAccount as jest.MockedFunction<typeof useAccount>;
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
const mockUseQueryClient = useQueryClient as jest.MockedFunction<typeof useQueryClient>;
const mockTransactionService = transactionService as jest.Mocked<typeof transactionService>;
const mockUseTransactionStore = useTransactionStore as unknown as jest.Mock;

const baseTransaction: Transaction = {
  id: 'tx-1',
  hash: '0xabc',
  type: 'purchase',
  status: 'confirmed',
  chainId: 1,
  from: '0xwallet1',
  confirmations: 12,
  requiredConfirmations: 12,
  timestamp: 1000,
};

describe('transactionQueryKeys', () => {
  it('produces correct keys', () => {
    expect(transactionQueryKeys.all).toEqual(['transactions']);
    expect(transactionQueryKeys.list('0xabc')).toEqual([
      'transactions',
      'list',
      '0xabc',
    ]);
    expect(transactionQueryKeys.list(undefined)).toEqual(['transactions', 'list']);
    expect(transactionQueryKeys.byType('purchase')).toEqual([
      'transactions',
      'type',
      'purchase',
    ]);
    expect(transactionQueryKeys.byId('tx-1')).toEqual([
      'transactions',
      'id',
      'tx-1',
    ]);
  });
});

describe('useTransactionsQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccount.mockReturnValue({ address: '0xwallet1' } as any);
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    } as any);
  });

  it('returns query with correct key', () => {
    renderHook(() => useTransactionsQuery());

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: transactionQueryKeys.list('0xwallet1'),
      })
    );
  });

  it('is disabled when no address', () => {
    mockUseAccount.mockReturnValue({ address: undefined } as any);

    renderHook(() => useTransactionsQuery());

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    );
  });

  it('fetches from transactionService', () => {
    renderHook(() => useTransactionsQuery());

    const queryFn = mockUseQuery.mock.calls[0][0].queryFn;
    mockTransactionService.getTransactions.mockResolvedValue([baseTransaction]);

    const result = queryFn();
    expect(mockTransactionService.getTransactions).toHaveBeenCalledWith('0xwallet1');
    return expect(result).resolves.toEqual([baseTransaction]);
  });
});

describe('useTransactionHistory', () => {
  const storeTransactions: Transaction[] = [
    { ...baseTransaction, id: 'tx-store', timestamp: 3000 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccount.mockReturnValue({ address: '0xwallet1' } as any);
    mockUseTransactionStore.mockReturnValue({
      transactions: storeTransactions,
      isLoading: false,
      error: null,
    });
    mockUseQueryClient.mockReturnValue({ invalidateQueries: jest.fn() } as any);
    mockUseQuery.mockReturnValue({
      data: [baseTransaction],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);
    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    } as any);
  });

  it('merges API and store transactions sorted by timestamp descending', () => {
    const { result } = renderHook(() => useTransactionHistory());

    const ids = result.current.transactions.map((tx: Transaction) => tx.id);
    expect(ids).toEqual(['tx-store', 'tx-1']);

    const timestamps = result.current.transactions.map(
      (tx: Transaction) => tx.timestamp
    );
    expect(timestamps).toEqual([3000, 1000]);
  });

  it('getTransactionsByType filters correctly', () => {
    const mixedTransactions: Transaction[] = [
      { ...baseTransaction, id: 'tx-1', type: 'purchase', timestamp: 1000 },
      { ...baseTransaction, id: 'tx-2', type: 'transfer', timestamp: 2000 },
      { ...baseTransaction, id: 'tx-3', type: 'purchase', timestamp: 3000 },
    ];

    mockUseQuery.mockReturnValue({
      data: mixedTransactions,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);
    mockUseTransactionStore.mockReturnValue({
      transactions: [],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useTransactionHistory());

    const purchases = result.current.getTransactionsByType('purchase');
    expect(purchases).toHaveLength(2);
    expect(purchases.map((tx: Transaction) => tx.id)).toEqual(['tx-3', 'tx-1']);

    const transfers = result.current.getTransactionsByType('transfer');
    expect(transfers).toHaveLength(1);
    expect(transfers[0].id).toBe('tx-2');
  });

  it('retryTransaction retries failed transactions', async () => {
    const failedTx: Transaction = {
      ...baseTransaction,
      id: 'tx-failed',
      status: 'failed',
    };
    const mutateAsync = jest.fn().mockResolvedValue(failedTx);
    mockUseMutation.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as any);

    const { result } = renderHook(() => useTransactionHistory());

    const retryResult = await result.current.retryTransaction(failedTx);
    expect(retryResult).toBe(true);
    expect(mutateAsync).toHaveBeenCalledWith('tx-failed');
  });

  it('retryTransaction returns false for non-failed transactions', async () => {
    const confirmedTx: Transaction = {
      ...baseTransaction,
      id: 'tx-confirmed',
      status: 'confirmed',
    };

    const { result } = renderHook(() => useTransactionHistory());

    const retryResult = await result.current.retryTransaction(confirmedTx);
    expect(retryResult).toBe(false);
  });
});
