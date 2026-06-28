import type { CartItem } from '@/types/cart';
import type { BatchTransactionResult } from '@/types/cart';
import { logger } from '@/utils/logger';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

const IS_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_TX === 'true';

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

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

      if (IS_DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock transaction hash
      const txHashBytes = new Uint8Array(32);
      crypto.getRandomValues(txHashBytes);
      const transactionHash = '0x' + Array.from(txHashBytes, (b) => b.toString(16).padStart(2, '0')).join('');

      // Simulate individual transaction results
      const results = items.map(item => {
        const rand1 = crypto.getRandomValues(new Uint8Array(1))[0] / 256;
        const rand2 = crypto.getRandomValues(new Uint8Array(1))[0] / 256;
        const rand3 = crypto.getRandomValues(new Uint8Array(1))[0] / 256;
        return {
          propertyId: item.property.id,
          success: rand1 > 0.1, // 90% success rate for demo
          transactionHash: rand2 > 0.1 ? transactionHash : undefined,
          error: rand3 > 0.1 ? undefined : 'Transaction failed: Insufficient gas',
        };
      });

        const allSuccessful = results.every(result => result.success);
        const totalGasUsed = items.length * 0.0025 + 0.005;

        return {
          success: allSuccessful,
          transactionHash: allSuccessful ? transactionHash : undefined,
          results,
          totalGasUsed,
          error: allSuccessful ? undefined : 'Some transactions failed'
        };
      }

      const txPromises = items.map(async (item) => {
        try {
          const hash = `0x${Array.from({length: 64}, () =>
            Math.floor(Math.random() * 16).toString(16)).join('')}`;

          const receipt = await publicClient.waitForTransactionReceipt({ hash });

          return {
            propertyId: item.property.id,
            success: receipt.status === 'success',
            transactionHash: hash,
            error: receipt.status !== 'success' ? 'Transaction reverted' : undefined,
          };
        } catch (err) {
          return {
            propertyId: item.property.id,
            success: false,
            error: err instanceof Error ? err.message : 'Transaction failed',
          };
        }
      });

      const results = await Promise.all(txPromises);
      const allSuccessful = results.every(result => result.success);

      return {
        success: allSuccessful,
        results,
        error: allSuccessful ? undefined : 'Some transactions failed',
      };
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

  static async getTransactionStatus(transactionHash: string): Promise<{
    status: 'pending' | 'confirmed' | 'failed';
    blockNumber?: number;
    confirmations?: number;
  }> {
    // Mock transaction status check
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate different statuses
    const random = crypto.getRandomValues(new Uint8Array(1))[0] / 256;
    if (random < 0.7) {
      const blockBytes = crypto.getRandomValues(new Uint8Array(4));
      const blockNumber = ((blockBytes[0] << 24) | (blockBytes[1] << 16) | (blockBytes[2] << 8) | blockBytes[3]) >>> 0;
      const confirmBytes = crypto.getRandomValues(new Uint8Array(1))[0];
      return {
        status: 'confirmed',
        blockNumber: (blockNumber % 1000000) + 18000000,
        confirmations: (confirmBytes % 50) + 1
      };
    } else if (random < 0.9) {
      return {
        status: 'pending'
      };
    } else {
      return {
        status: 'failed'
      };
    }
  }

  static async waitForConfirmation(
    transactionHash: string,
    maxWaitTime: number = 300000
  ): Promise<{
    status: 'confirmed' | 'failed' | 'timeout';
    blockNumber?: number;
    confirmations?: number;
  }> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.getTransactionStatus(transactionHash);

      if (status.status === 'confirmed' || status.status === 'failed') {
        return status;
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    return { status: 'timeout' };
  }
}
