'use client';

import { useCallback } from 'react';
import { useTransactionStore } from '@/store/transactionStore';
import type { Transaction, TransactionType } from '@/store/transactionStore';
import { useWalletStore } from '@/store/walletStore';
import { toast } from 'sonner';

interface TransactionParams {
  hash: string;
  type: TransactionType;
  to?: string;
  value?: string;
  data?: string;
  description?: string;
  propertyId?: string;
  requiredConfirmations?: number;
}

/**
 * Hook for managing blockchain transactions within the application.
 * Provides functions to queue, retry, and cancel transactions.
 * 
 * @returns An object containing transaction management functions.
 */
export const useTransaction = () => {
  const { addTransaction } = useTransactionStore();
  const { address, chainId } = useWalletStore();

  /**
   * Adds a new transaction to the monitoring queue.
   * 
   * @param params - The transaction details including hash, type, and optional metadata.
   */
  const addTransactionToQueue = useCallback(
    (params: TransactionParams) => {
      if (!address) {
        toast.error('Wallet not connected');
        return;
      }

      addTransaction({
        ...params,
        chainId: chainId,
        from: address,
        requiredConfirmations: params.requiredConfirmations || 1,
      });

      toast.info('Transaction added to queue', {
        description: `${params.type} transaction is being monitored`,
      });
    },
    [addTransaction, address, chainId]
  );

  /**
   * Attempts to retry a failed transaction.
   * 
   * @param _originalTransaction - The original transaction object to retry.
   */
  const retryTransaction = useCallback(
    (_originalTransaction: Transaction) => {
      // This would need to be implemented based on the specific transaction type
      // For now, just show a message
      toast.info('Retry functionality needs to be implemented for each transaction type');
    },
    []
  );

  /**
   * Attempts to cancel a pending transaction.
   * 
   * @param transactionId - The ID of the transaction to cancel.
   */
  const cancelTransaction = useCallback(
    (transactionId: string) => {
      // This would need blockchain-specific cancellation logic
      toast.info('Transaction cancellation needs to be implemented');
    },
    []
  );

  return {
    addTransactionToQueue,
    retryTransaction,
    cancelTransaction,
  };
};
