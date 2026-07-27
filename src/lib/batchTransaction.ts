import type { CartItem } from "@/types/cart";
import type { BatchTransactionResult } from "@/types/cart";
import { logger } from "@/utils/logger";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { publicClient } from "@/lib/viem-client";
import { simulateTransaction } from "@/utils/tenderlySimulation";

const IS_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_TX === "true";

export class BatchTransactionService {
  static async executeBatchPurchase(
    items: CartItem[],
    walletAddress: string,
    skipSimulation = false,
  ): Promise<BatchTransactionResult> {
    try {
      logger.info("Starting batch transaction", {
        items: items.length,
        walletAddress,
      });

      if (!skipSimulation) {
        const simulationPromises = items.map((item) =>
          simulateTransaction({
            from: walletAddress,
            to: item.property.contractAddress,
            value: (
              item.property.tokenInfo.pricePerToken * item.quantity
            ).toString(),
            data: "0x...", // Replace with actual transaction data
          }),
        );
        const simulationResults = await Promise.all(simulationPromises);

        const failedSimulations = simulationResults.filter(
          (res) => res.error || !res.tenderlyResponse.transaction.status,
        );
        if (failedSimulations.length > 0) {
          logger.warn("Some simulations failed", { failedSimulations });
          return {
            success: false,
            results: [],
            error: "Transaction simulation failed for some items.",
          };
        }
      }

      const validationResults = items.map((item) => ({
        propertyId: item.property.id,
        success: this.validatePurchase(item),
        error: this.validatePurchase(item)
          ? undefined
          : "Insufficient tokens available",
      }));

      const hasValidationErrors = validationResults.some(
        (result) => !result.success,
      );
      if (hasValidationErrors) {
        return {
          success: false,
          results: validationResults,
          error: "Validation failed for some items",
        };
      }

      if (IS_DEMO_MODE) {
        return this.executeDemoBatchPurchase(items);
      }

      throw new Error(
        "Production batch execution requires a configured wallet client",
      );
    } catch (error) {
      logger.error("Batch transaction failed:", error);
      return {
        success: false,
        results: items.map((item) => ({
          propertyId: item.property.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })),
        error: error instanceof Error ? error.message : "Transaction failed",
      };
    }
  }

  private static async executeDemoBatchPurchase(
    items: CartItem[],
  ): Promise<BatchTransactionResult> {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const transactionHash = `0x${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join("")}`;

    const results = items.map((item) => ({
      propertyId: item.property.id,
      success: true,
      transactionHash,
    }));

    const totalGasUsed = items.length * 0.0025 + 0.005;

    logger.info("Demo batch transaction completed", {
      success: true,
      transactionHash,
      totalGasUsed,
      itemsProcessed: items.length,
    });

    return {
      success: true,
      transactionHash,
      results,
      totalGasUsed,
    };
  }

  static estimateGas(items: CartItem[]): number {
    const BASE_GAS = 0.005;
    const GAS_PER_TRANSACTION = 0.0025;
    return BASE_GAS + items.length * GAS_PER_TRANSACTION;
  }

  private static validatePurchase(item: CartItem): boolean {
    return (
      item.quantity > 0 &&
      item.quantity <= item.property.tokenInfo.available &&
      item.property.status === "active"
    );
  }

  static async getTransactionStatus(transactionHash: string): Promise<{
    status: "pending" | "confirmed" | "failed";
    blockNumber?: number;
    confirmations?: number;
  }> {
    if (IS_DEMO_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const random = Math.random();
      if (random < 0.7) {
        return {
          status: "confirmed",
          blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
          confirmations: Math.floor(Math.random() * 50) + 1,
        };
      } else if (random < 0.9) {
        return { status: "pending" };
      } else {
        return { status: "failed" };
      }
    }

    try {
      const receipt = await publicClient.getTransactionReceipt({
        hash: transactionHash as `0x${string}`,
      });

      return {
        status: receipt.status === "success" ? "confirmed" : "failed",
        blockNumber: Number(receipt.blockNumber),
        confirmations: 1,
      };
    } catch {
      return { status: "pending" };
    }
  }

  static async waitForConfirmation(
    transactionHash: string,
    maxWaitTime: number = 300000,
  ): Promise<{
    status: "confirmed" | "failed" | "timeout";
    blockNumber?: number;
    confirmations?: number;
  }> {
    try {
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: transactionHash as `0x${string}`,
        timeout: maxWaitTime,
      });

      return {
        status: receipt.status === "success" ? "confirmed" : "failed",
        blockNumber: Number(receipt.blockNumber),
      };
    } catch {
      return { status: "timeout" };
    }
  }
}
