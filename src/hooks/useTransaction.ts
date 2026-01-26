'use client';

import { useCallback } from 'react';
import { useTransactionStore, TransactionType } from '@/store/transactionStore';
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

export const useTransaction = () => {
  const { addTransaction } = useTransactionStore();
  const { address, chainId } = useWalletStore();

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

  const retryTransaction = useCallback(
    (originalTransaction: any) => {
      // This would need to be implemented based on the specific transaction type
      // For now, just show a message
      toast.info('Retry functionality needs to be implemented for each transaction type');
    },
    []
  );

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