import type { CartItem, BatchTransactionResult } from "@/types/cart";
import { logger } from "@/utils/logger";
import { decodeRevertReason } from "@/utils/revertDecoder";

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

export interface BatchPurchaseRequest {
  walletAddress: `0x${string}`;
  items: Array<{
    propertyId: string;
    quantity: number;
    expectedAmount: number;
    minimumAmount: number;
  }>;
  slippageTolerance: number;
}

/**
 * Adapter boundary for the deployed batch-purchase contract.
 * The adapter must return only after it has observed the transaction receipt.
 */
export interface BatchPurchaseExecutor {
  execute: (request: BatchPurchaseRequest) => Promise<{
    transactionHash: `0x${string}`;
    receiptStatus: "success" | "reverted";
  }>;
}

const failureResult = (
  items: CartItem[],
  error: string,
): BatchTransactionResult => ({
  success: false,
  results: items.map((item) => ({
    propertyId: item.property.id,
    success: false,
    error,
  })),
  error,
});

const getErrorData = (error: unknown): `0x${string}` | undefined => {
  if (typeof error !== "object" || error === null || !("data" in error)) {
    return undefined;
  }

  const data = error.data;
  return typeof data === "string" && /^0x[\da-fA-F]*$/.test(data)
    ? (data as `0x${string}`)
    : undefined;
};

const getFailureReason = (error: unknown): string => {
  const data = getErrorData(error);
  if (data) return decodeRevertReason(data);

  if (typeof error === "object" && error !== null && "code" in error) {
    if (error.code === 4001) return "Transaction rejected by the user.";
  }

  if (error instanceof Error && error.message) return error.message;
  return "Batch purchase failed.";
};

const validateItems = (items: CartItem[]): string | undefined => {
  if (items.length === 0) return "At least one item is required.";

  for (const item of items) {
    if (item.property.status !== "active") {
      return `Property ${item.property.id} is not available for purchase.`;
    }
    if (
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0 ||
      !Number.isFinite(item.property.tokenInfo.available) ||
      item.quantity > item.property.tokenInfo.available
    ) {
      return `Insufficient tokens available for property ${item.property.id}.`;
    }
    if (
      !Number.isFinite(item.property.price.perToken) ||
      item.property.price.perToken < 0 ||
      !Number.isFinite(item.quantity * item.property.price.perToken)
    ) {
      return `Invalid price for property ${item.property.id}.`;
    }
  }

  return undefined;
};

export const calculateMinimumAmount = (
  expectedAmount: number,
  slippageTolerance: number,
): number => expectedAmount * (1 - slippageTolerance);

export const BatchTransactionService = {
  executeBatchPurchase: async (
    items: CartItem[],
    walletAddress: string,
    slippageTolerance: number,
    executor?: BatchPurchaseExecutor,
  ): Promise<BatchTransactionResult> => {
    const validationError = validateItems(items);
    if (validationError) return failureResult(items, validationError);

    if (!ADDRESS_PATTERN.test(walletAddress)) {
      return failureResult(items, "A connected wallet is required.");
    }

    if (
      !Number.isFinite(slippageTolerance) ||
      slippageTolerance < 0 ||
      slippageTolerance >= 1
    ) {
      return failureResult(
        items,
        "Slippage tolerance must be between 0 and 1.",
      );
    }

    if (!executor) {
      return failureResult(
        items,
        "Batch purchase is not configured for this network.",
      );
    }

    const request: BatchPurchaseRequest = {
      walletAddress: walletAddress as `0x${string}`,
      slippageTolerance,
      items: items.map((item) => {
        const expectedAmount = item.quantity * item.property.price.perToken;
        return {
          propertyId: item.property.id,
          quantity: item.quantity,
          expectedAmount,
          minimumAmount: calculateMinimumAmount(
            expectedAmount,
            slippageTolerance,
          ),
        };
      }),
    };

    logger.info("Executing configured batch purchase", {
      itemCount: items.length,
      walletAddress,
      slippageTolerance,
    });

    try {
      const { transactionHash, receiptStatus } =
        await executor.execute(request);
      if (receiptStatus !== "success") {
        return failureResult(items, "Batch purchase transaction reverted.");
      }

      return {
        success: true,
        transactionHash,
        results: items.map((item) => ({
          propertyId: item.property.id,
          success: true,
          transactionHash,
        })),
      };
    } catch (error: unknown) {
      const reason = getFailureReason(error);
      logger.error("Batch purchase failed", { error: reason });
      return failureResult(items, reason);
    }
  },
};
