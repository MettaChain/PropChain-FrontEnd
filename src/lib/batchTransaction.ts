import { CartItem } from "@/types/cart";
import { logger } from "@/utils/logger";
import { decodeRevertReason } from "@/utils/revertDecoder";

export interface BatchTransactionResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export const BatchTransactionService = {
  executeBatchPurchase: async (
    items: CartItem[],
    walletAddress: string,
    slippageTolerance: number,
  ): Promise<BatchTransactionResult> => {
    logger.info("Executing batch purchase", {
      itemCount: items.length,
      walletAddress,
      slippageTolerance,
    });

    // TODO: Fetch 24h price volatility to set a dynamic default slippage.

    // Calculate the minimum amount of tokens to be received for each item.
    const itemsWithSlippage = items.map((item) => {
      const pricePerToken = item.property.price.perToken;
      const expectedAmount = item.quantity * pricePerToken;
      const minAmount = expectedAmount * (1 - slippageTolerance);
      return {
        ...item,
        minAmount,
      };
    });

    logger.info("Items with slippage", { itemsWithSlippage });

    // TODO: Include slippage intent in EIP-712 typed data.

    // For now, we'll simulate a successful transaction.
    try {
      return new Promise((resolve) => {
        setTimeout(() => {
          // Simulate a revert for demonstration purposes
          if (Math.random() < 0.2) {
            // This is a sample error byte string. In a real scenario,
            // this would come from the 'e.data' field of a viem revert.
            const sampleErrorBytes =
              "0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001a496e73756666696369656e742062616c616e636520666f72207472616e736665720000000000000000000000";
            const reason = decodeRevertReason(
              sampleErrorBytes as `0x${string}`,
            );
            resolve({ success: false, error: reason });
          } else {
            resolve({
              success: true,
              transactionHash: `0x${[...Array(64)]
                .map(() => Math.floor(Math.random() * 16).toString(16))
                .join("")}`,
            });
          }
        }, 2000);
      });
    } catch (e: any) {
      const reason = e.data
        ? decodeRevertReason(e.data)
        : "An unknown error occurred.";
      logger.error("Batch purchase failed", { error: reason });
      return { success: false, error: reason };
    }
  },
};
