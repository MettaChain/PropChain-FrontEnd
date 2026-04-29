'use client';
import { logger } from '@/utils/logger';

import { useCallback } from 'react';
import { ethers } from 'ethers';
import { useTransactionStore } from '@/store/transactionStore';
import type { Transaction, TransactionType } from '@/store/transactionStore';
import { useWalletStore } from '@/store/walletStore';
import { useSecureTransaction } from '@/hooks/useSecureTransaction';
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
  signer?: ethers.JsonRpcSigner;
  useSecureSigning?: boolean;
  gasLimit?: string;
  gasPrice?: string;
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
  const { signAndVerifyTransaction, broadcastTransaction, validateTransaction } = useSecureTransaction();

  /**
   * Adds a new transaction to the monitoring queue.
   * 
   * @param params - The transaction details including hash, type, and optional metadata.
   */
  const addTransactionToQueue = useCallback(
    async (params: TransactionParams) => {
      if (!address) {
        toast.error('Wallet not connected');
        return;
      }

      // Use secure signing if enabled and signer is provided
      if (params.useSecureSigning && params.signer && params.to && params.value) {
        try {
          // Validate transaction first
          const validation = validateTransaction({
            to: params.to,
            value: params.value,
            data: params.data,
            gasLimit: params.gasLimit,
            gasPrice: params.gasPrice,
            type: params.type,
            description: params.description,
            propertyId: params.propertyId,
          });

          if (!validation.isValid) {
            toast.error('Transaction validation failed', {
              description: validation.warnings.join(', ')
            });
            return;
          }

          // Sign and verify the transaction
          const signedTransaction = await signAndVerifyTransaction({
            to: params.to,
            value: params.value,
            data: params.data,
            gasLimit: params.gasLimit,
            gasPrice: params.gasPrice,
            type: params.type,
            description: params.description,
            propertyId: params.propertyId,
          }, params.signer);

          if (signedTransaction) {
            // Broadcast the transaction
            const txHash = await broadcastTransaction(signedTransaction, params.signer);
            if (txHash) {
              // Update the transaction hash
              params.hash = txHash;
            }
          }
        } catch (error) {
          logger.error('Secure transaction failed:', error);
          toast.error('Secure transaction failed', {
            description: error instanceof Error ? error.message : 'Unknown error'
          });
          return;
        }
      }

      // Add to transaction store for monitoring
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
    [addTransaction, address, chainId, signAndVerifyTransaction, broadcastTransaction, validateTransaction]
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
