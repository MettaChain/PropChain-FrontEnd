import { logger } from '@/utils/logger';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTransactionStore } from "@/store/transactionStore";
import type { Transaction, TransactionType, TransactionStatus } from "@/store/transactionStore";

// Mock transaction service - in production this would call actual APIs
const transactionService = {
  async getTransactions(): Promise<Transaction[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    // Return mock data - in production this would fetch from API
    return [];
  },
  
  async retryTransaction(transactionId: string): Promise<Transaction> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Return updated transaction - in production this would call retry API
    const transaction = {} as Transaction;
    return transaction;
  }
};

/**
 * Query key factory for transaction queries
 */
export const transactionQueryKeys = {
  all: ["transactions"] as const,
  list: () => ["transactions", "list"] as const,
  byType: (type: TransactionType) => ["transactions", "type", type] as const,
  byId: (id: string) => ["transactions", "id", id] as const,
};

/**
 * Hook for fetching all transactions
 */
export function useTransactionsQuery() {
  return useQuery({
    queryKey: transactionQueryKeys.list(),
    queryFn: () => transactionService.getTransactions(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook for retrying a failed transaction
 */
export function useRetryTransactionMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (transactionId: string) => transactionService.retryTransaction(transactionId),
    onSuccess: () => {
      // Invalidate transactions list to refetch
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.list() });
    },
    retry: 1,
  });
}

/**
 * Combined hook that maintains the same API as the original transaction store
 * but uses React Query for data fetching
 */
export function useTransactionHistory() {
  const transactionStore = useTransactionStore();
  const { transactions, getTransactionsByType } = transactionStore;
  const retryMutation = useRetryTransactionMutation();
  
  // For now, we'll keep using the store data but could migrate to React Query
  // This provides a migration path while maintaining existing functionality
  
  const handleRetry = async (transaction: Transaction) => {
    if (transaction.status === 'failed') {
      try {
        await retryMutation.mutateAsync(transaction.id);
        return true;
      } catch (error) {
        logger.error('Failed to retry transaction:', error);
        return false;
      }
    }
    return false;
  };

  return {
    // Data from store (maintaining existing API)
    transactions,
    getTransactionsByType,
    
    // Actions
    retryTransaction: handleRetry,
    isRetrying: retryMutation.isPending,
    
    // Query state
    isLoading: false, // Store data is synchronous
    error: null,
  };
}
