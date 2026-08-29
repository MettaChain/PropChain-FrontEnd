import { getPublicClient, getWalletClient } from "@wagmi/core/actions";
import { parseEther } from "viem";
import { config } from "@/config/wagmi";
import { BATCH_PURCHASE_ABI } from "@/config/batchPurchase";
import type {
  BatchPurchaseExecutor,
  BatchPurchaseRequest,
} from "./batchTransaction";

const DEADLINE_SECONDS = 60 * 30; // 30 minutes from now

/**
 * Build the real batch-purchase executor backed by the connected wallet.
 *
 * The executor resolves the wallet client for the connected account (throwing
 * before any submission when the account is not connected), submits the
 * `batchPurchase` call, and only reports success after the receipt has been
 * observed on chain.
 */
export const createWagmiBatchPurchaseExecutor = (
  contractAddress: `0x${string}`,
): BatchPurchaseExecutor => ({
  execute: async (request: BatchPurchaseRequest) => {
    // getWalletClient throws when the requested account is not connected to
    // any connector, so nothing is submitted for a disconnected wallet.
    const walletClient = await getWalletClient(config, {
      account: request.walletAddress,
    });
    const chainId = walletClient.chain?.id ?? (await walletClient.getChainId());
    const publicClient = getPublicClient(config, { chainId });

    const propertyTokens = request.items.map(
      (item) => item.tokenAddress as `0x${string}`,
    );
    const quantities = request.items.map((item) => BigInt(item.quantity));
    const minAmounts = request.items.map((item) =>
      parseEther(item.minimumAmount.toString()),
    );
    const value = request.items.reduce(
      (sum, item) => sum + parseEther(item.expectedAmount.toString()),
      0n,
    );
    const deadline =
      BigInt(Math.floor(Date.now() / 1000)) + BigInt(DEADLINE_SECONDS);

    const transactionHash = await walletClient.writeContract({
      address: contractAddress,
      abi: BATCH_PURCHASE_ABI,
      functionName: "batchPurchase",
      args: [propertyTokens, quantities, minAmounts, deadline],
      account: request.walletAddress,
      chain: walletClient.chain,
      value,
    });

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: transactionHash,
    });

    return {
      transactionHash,
      receiptStatus: receipt.status === "success" ? "success" : "reverted",
    };
  },
});
