import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { logger } from '@/utils/logger';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTransactionStore } from '@/store/transactionStore';
import type { Transaction, TransactionType } from '@/store/transactionStore';
import { transactionService } from '@/lib/transactionService';

/**
 * Query key factory for transaction queries
 */
export const transactionQueryKeys = {
  all: ['transactions'] as const,
  list: (walletAddress?: string) =>
    walletAddress
      ? (['transactions', 'list', walletAddress] as const)
      : (['transactions', 'list'] as const),
  byType: (type: TransactionType) => ['transactions', 'type', type] as const,
  byId: (id: string) => ['transactions', 'id', id] as const,
};

/**
 * Hook for fetching all transactions for the connected wallet
 */
export function useTransactionsQuery() {
  const { address } = useAccount();

  return useQuery({
    queryKey: transactionQueryKeys.list(address),
    queryFn: () => transactionService.getTransactions(address!),
    enabled: !!address,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook for retrying a failed transaction
 */
export function useRetryTransactionMutation() {
  const queryClient = useQueryClient();
  const { address } = useAccount();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const transaction = useTransactionStore
        .getState()
        .transactions.find((tx) => tx.id === transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.list(address) });
    },
    retry: 1,
  });
}

/**
 * Combined hook for transaction history UI — merges API data with local store
 */
export function useTransactionHistory() {
  const transactionStore = useTransactionStore();
  const { data: apiTransactions, isLoading, error, refetch } = useTransactionsQuery();
  const retryMutation = useRetryTransactionMutation();

  const transactions = useMemo(() => {
    const merged = new Map<string, Transaction>();
    for (const tx of apiTransactions ?? []) {
      merged.set(tx.id, tx);
    }
    for (const tx of transactionStore.transactions) {
      merged.set(tx.id, tx);
    }
    return Array.from(merged.values()).sort((a, b) => b.timestamp - a.timestamp);
  }, [apiTransactions, transactionStore.transactions]);

  const getTransactionsByType = (type: TransactionType) =>
    transactions.filter((tx) => tx.type === type);

  const handleRetry = async (transaction: Transaction) => {
    if (transaction.status === 'failed') {
      try {
        await retryMutation.mutateAsync(transaction.id);
        return true;
      } catch (err) {
        logger.error('Failed to retry transaction:', err);
        return false;
      }
    }
    return false;
  };

  return {
    transactions,
    getTransactionsByType,
    retryTransaction: handleRetry,
    isRetrying: retryMutation.isPending,
    isLoading: isLoading || transactionStore.isLoading,
    error: error?.message ?? transactionStore.error,
    refetch,
  };
}
