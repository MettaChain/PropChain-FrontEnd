'use client';
import { logger } from '@/utils/logger';

import { useCallback, useState } from 'react';
import { ethers } from 'ethers';
import { useWalletStore } from '@/store/walletStore';
import { useTransactionStore, type TransactionType } from '@/store/transactionStore';
import { transactionAudit } from '@/utils/audit/transactionAudit';
import { 
  createSignedTransaction, 
  verifyTypedDataSignature,
  validateTransactionParameters,
  createDomain,
  type TransactionTypedData,
  type SignedTransaction 
} from '@/utils/eip712/eip712Signing';
import { toast } from 'sonner';

interface SecureTransactionParams {
  to: string;
  value?: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  type: TransactionType;
  description?: string;
  propertyId?: string;
  requireVerification?: boolean;
}

interface UseSecureTransactionReturn {
  signAndVerifyTransaction: (
    params: SecureTransactionParams,
    signer: ethers.JsonRpcSigner
  ) => Promise<SignedTransaction | null>;
  broadcastTransaction: (
    signedTransaction: SignedTransaction,
    signer: ethers.JsonRpcSigner
  ) => Promise<string | null>;
  validateTransaction: (params: SecureTransactionParams) => {
    isValid: boolean;
    warnings: string[];
    risks: string[];
  };
  isSigning: boolean;
  isBroadcasting: boolean;
  auditTrail: typeof transactionAudit;
}

export const useSecureTransaction = (): UseSecureTransactionReturn => {
  const { address, chainId } = useWalletStore();
  const { addTransaction } = useTransactionStore();
  const [isSigning, setIsSigning] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  /**
   * Validates transaction parameters before signing
   */
  const validateTransaction = useCallback((params: SecureTransactionParams) => {
    const transactionData: TransactionTypedData = {
      to: params.to,
      value: params.value || '0',
      data: params.data || '0x',
      gasLimit: params.gasLimit,
      gasPrice: params.gasPrice,
    };

    return validateTransactionParameters(transactionData);
  }, []);

  /**
   * Signs and verifies a transaction using EIP-712
   */
  const signAndVerifyTransaction = useCallback(
    async (
      params: SecureTransactionParams,
      signer: ethers.JsonRpcSigner
    ): Promise<SignedTransaction | null> => {
      if (!address || !chainId) {
        toast.error('Wallet not connected');
        return null;
      }

      setIsSigning(true);

      try {
        // Validate transaction parameters
        const validation = validateTransaction(params);
        if (!validation.isValid) {
          toast.error('Transaction validation failed', {
            description: validation.warnings.join(', ')
          });
          return null;
        }

        // Show warnings if any
        if (validation.warnings.length > 0) {
          toast.warning('Transaction warnings', {
            description: validation.warnings.join(', ')
          });
        }

        // Prepare transaction data
        const transactionData: TransactionTypedData = {
          to: params.to,
          value: params.value || '0',
          data: params.data || '0x',
          gasLimit: params.gasLimit,
          gasPrice: params.gasPrice,
          nonce: await signer.getTransactionCount(),
          deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour deadline
        };

        // Create signed transaction
        const signedTransaction = await createSignedTransaction(
          signer,
          transactionData,
          chainId
        );

        // Verify the signature
        if (!signedTransaction.verified) {
          toast.error('Signature verification failed');
          return null;
        }

        // Add to audit trail
        transactionAudit.addEntry(signedTransaction, [...validation.warnings, ...validation.risks]);

        // Add to transaction store for monitoring
        addTransaction({
          hash: `pending-${Date.now()}`,
          type: params.type,
          to: params.to,
          value: params.value || '0',
          data: params.data,
          description: params.description,
          propertyId: params.propertyId,
          requiredConfirmations: 1,
        });

        toast.success('Transaction signed and verified successfully', {
          description: 'Ready to broadcast'
        });

        return signedTransaction;
      } catch (error) {
        logger.error('Failed to sign transaction:', error);
        toast.error('Failed to sign transaction', {
          description: error instanceof Error ? error.message : 'Unknown error'
        });
        return null;
      } finally {
        setIsSigning(false);
      }
    },
    [address, chainId, validateTransaction, addTransaction]
  );

  /**
   * Broadcasts a signed transaction to the network
   */
  const broadcastTransaction = useCallback(
    async (
      signedTransaction: SignedTransaction,
      signer: ethers.JsonRpcSigner
    ): Promise<string | null> => {
      setIsBroadcasting(true);

      try {
        // Verify signature one more time before broadcast
        const verification = verifyTypedDataSignature(
          signedTransaction.transaction,
          signedTransaction.signature,
          signedTransaction.domain
        );

        if (!verification.isValid) {
          toast.error('Pre-broadcast signature verification failed');
          return null;
        }

        // Create raw transaction
        const rawTransaction = {
          to: signedTransaction.transaction.to,
          value: signedTransaction.transaction.value || '0',
          data: signedTransaction.transaction.data || '0x',
          gasLimit: signedTransaction.transaction.gasLimit,
          gasPrice: signedTransaction.transaction.gasPrice,
          nonce: signedTransaction.transaction.nonce,
        };

        // Send transaction
        const txResponse = await signer.sendTransaction(rawTransaction);
        const txHash = txResponse.hash;

        // Update audit trail with transaction hash
        const auditEntries = transactionAudit.getAllEntries();
        const latestEntry = auditEntries.find(entry => 
          entry.signature === signedTransaction.signature
        );
        
        if (latestEntry) {
          transactionAudit.updateEntry(latestEntry.id, {
            transactionHash: txHash,
            status: 'pending',
          });
        }

        toast.success('Transaction broadcast successfully', {
          description: `Hash: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`
        });

        // Wait for confirmation
        const receipt = await txResponse.wait();
        
        if (receipt) {
          if (latestEntry) {
            transactionAudit.updateEntry(latestEntry.id, {
              status: receipt.status === 1 ? 'confirmed' : 'failed',
              gasUsed: receipt.gasUsed.toString(),
              gasPrice: receipt.gasPrice?.toString(),
              blockNumber: receipt.blockNumber,
              blockTimestamp: receipt.blockTimestamp,
            });
          }

          if (receipt.status === 1) {
            toast.success('Transaction confirmed', {
              description: `Block: ${receipt.blockNumber}`
            });
          } else {
            toast.error('Transaction failed');
          }
        }

        return txHash;
      } catch (error) {
        logger.error('Failed to broadcast transaction:', error);
        toast.error('Failed to broadcast transaction', {
          description: error instanceof Error ? error.message : 'Unknown error'
        });
        return null;
      } finally {
        setIsBroadcasting(false);
      }
    },
    []
  );

  return {
    signAndVerifyTransaction,
    broadcastTransaction,
    validateTransaction,
    isSigning,
    isBroadcasting,
    auditTrail: transactionAudit,
  };
};
