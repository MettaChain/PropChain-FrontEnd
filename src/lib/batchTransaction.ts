import type { CartItem } from '@/types/cart';
import type { BatchTransactionResult } from '@/types/cart';
import { logger } from '@/utils/logger';
import { publicClient } from '@/lib/viem-client';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_TX === 'true';

export class BatchTransactionService {

  static async executeBatchPurchase(
    items: CartItem[],
    walletAddress: string
  ): Promise<BatchTransactionResult> {
    try {
      logger.info('Starting batch transaction', { items: items.length, walletAddress });

      const validationResults = items.map(item => ({
        propertyId: item.property.id,
        success: this.validatePurchase(item),
        error: this.validatePurchase(item) ? undefined : 'Insufficient tokens available'
      }));

      const hasValidationErrors = validationResults.some(result => !result.success);
      if (hasValidationErrors) {
        return {
          success: false,
          results: validationResults,
          error: 'Validation failed for some items'
        };
      }

      if (DEMO_MODE) {
        return this.executeDemoBatchPurchase(items);
      }

      // In production, this would submit a multicall transaction to the contract
      // and wait for the receipt using viem's waitForTransactionReceipt.
      // The actual contract interaction is chain-specific and requires a wallet client.
      throw new Error('Production batch execution requires a configured wallet client');
    } catch (error) {
      logger.error('Batch transaction failed:', error);
      return {
        success: false,
        results: items.map(item => ({
          propertyId: item.property.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })),
        error: error instanceof Error ? error.message : 'Transaction failed'
      };
    }
  }

  private static async executeDemoBatchPurchase(
    items: CartItem[]
  ): Promise<BatchTransactionResult> {
    // Simulate blockchain transaction delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const transactionHash = `0x${Array.from({length: 64}, () =>
      Math.floor(Math.random() * 16).toString(16)).join('')}`;

    const results = items.map(item => ({
      propertyId: item.property.id,
      success: true,
      transactionHash,
    }));

    const totalGasUsed = items.length * 0.0025 + 0.005;

    logger.info('Demo batch transaction completed', {
      success: true,
      transactionHash,
      totalGasUsed,
      itemsProcessed: items.length
    });

    return {
      success: true,
      transactionHash,
      results,
      totalGasUsed,
    };
  }

  /**
   * Estimate gas for batch transaction
   */
  static estimateGas(items: CartItem[]): number {
    const BASE_GAS = 0.005;
    const GAS_PER_TRANSACTION = 0.0025;
    return BASE_GAS + (items.length * GAS_PER_TRANSACTION);
  }

  private static validatePurchase(item: CartItem): boolean {
    return item.quantity > 0 &&
           item.quantity <= item.property.tokenInfo.available &&
           item.property.status === 'active';
  }

  /**
   * Get transaction status using viem publicClient
   */
  static async getTransactionStatus(transactionHash: string): Promise<{
    status: 'pending' | 'confirmed' | 'failed';
    blockNumber?: number;
    confirmations?: number;
  }> {
    try {
      const receipt = await publicClient.getTransactionReceipt({
        hash: transactionHash as `0x${string}`,
      });

      return {
        status: receipt.status === 'success' ? 'confirmed' : 'failed',
        blockNumber: Number(receipt.blockNumber),
        confirmations: 1,
      };
    } catch {
      return { status: 'pending' };
    }
  }

  /**
   * Wait for transaction confirmation using viem's waitForTransactionReceipt
   */
  static async waitForConfirmation(
    transactionHash: string,
    maxWaitTime: number = 300000
  ): Promise<{
    status: 'confirmed' | 'failed' | 'timeout';
    blockNumber?: number;
    confirmations?: number;
  }> {
    try {
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: transactionHash as `0x${string}`,
        timeout: maxWaitTime,
      });

      return {
        status: receipt.status === 'success' ? 'confirmed' : 'failed',
        blockNumber: Number(receipt.blockNumber),
      };
    } catch {
      return { status: 'timeout' };
    }
  }
}
