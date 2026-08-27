import type { CartItem } from "@/types/cart";
import {
  calculateMinimumAmount,
  type BatchPurchaseExecutor,
  type BatchPurchaseRequest,
} from "../batchTransaction";

jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@/utils/revertDecoder", () => ({
  decodeRevertReason: jest.fn(() => "Insufficient balance"),
}));

jest.mock("@/config/wagmi", () => ({
  config: { mocked: true },
}));

jest.mock("@wagmi/core/actions", () => ({
  getWalletClient: jest.fn(),
  getPublicClient: jest.fn(),
}));

import { getPublicClient, getWalletClient } from "@wagmi/core/actions";

const mockGetWalletClient = getWalletClient as jest.Mock;
const mockGetPublicClient = getPublicClient as jest.Mock;

const walletAddress = "0x1234567890123456789012345678901234567890";
const contractAddress = "0x1111111111111111111111111111111111111111";
const transactionHash =
  "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd" as const;

const validItem: CartItem = {
  id: "item-1",
  property: {
    id: "prop-1",
    name: "Test Property",
    description: "A test property",
    location: {
      address: "1 Test Street",
      city: "Test City",
      state: "TS",
      country: "Test Country",
      zipCode: "12345",
      coordinates: { lat: 0, lng: 0 },
    },
    price: { total: 10, perToken: 0.1, currency: "ETH" },
    propertyType: "residential",
    blockchain: "ethereum",
    tokenInfo: {
      totalSupply: 100,
      available: 100,
      sold: 0,
      contractAddress: walletAddress,
      tokenSymbol: "PROP",
    },
    metrics: {
      roi: 5,
      annualReturn: 1,
      transactionVolume: 0,
      appreciationRate: 2,
    },
    details: {
      squareFeet: 1000,
      yearBuilt: 2020,
      amenities: [],
    },
    images: ["/property.jpg"],
    listedDate: "2026-01-01",
    status: "active",
  },
  quantity: 2,
  addedAt: "2026-01-01T00:00:00.000Z",
};

const createExecutor = (
  response: Awaited<ReturnType<BatchPurchaseExecutor["execute"]>>,
): BatchPurchaseExecutor => ({
  execute: jest.fn(async () => response),
});

const createViemClients = (
  receiptStatus: "success" | "reverted" = "success",
) => {
  const walletClient = {
    chain: { id: 1 },
    getChainId: jest.fn(async () => 1),
    writeContract: jest.fn(async () => transactionHash),
  };
  const publicClient = {
    waitForTransactionReceipt: jest.fn(async () => ({ status: receiptStatus })),
  };
  mockGetWalletClient.mockResolvedValue(walletClient);
  mockGetPublicClient.mockReturnValue(publicClient);
  return { walletClient, publicClient };
};

describe("BatchTransactionService", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_BATCH_PURCHASE_ADDRESS;
    jest.clearAllMocks();
  });

  it("rejects an empty cart without invoking an executor", async () => {
    const { BatchTransactionService } = await import("../batchTransaction");
    const executor = createExecutor({
      transactionHash,
      receiptStatus: "success",
    });

    const result = await BatchTransactionService.executeBatchPurchase(
      [],
      walletAddress,
      0.005,
      executor,
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("At least one item is required.");
    expect(executor.execute).not.toHaveBeenCalled();
  });

  it("rejects a disconnected wallet before submission", async () => {
    const { BatchTransactionService } = await import("../batchTransaction");
    const executor = createExecutor({
      transactionHash,
      receiptStatus: "success",
    });

    const result = await BatchTransactionService.executeBatchPurchase(
      [validItem],
      "",
      0.005,
      executor,
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("A connected wallet is required.");
    expect(executor.execute).not.toHaveBeenCalled();
  });

  it("rejects quantities above the available balance before submission", async () => {
    const { BatchTransactionService } = await import("../batchTransaction");
    const executor = createExecutor({
      transactionHash,
      receiptStatus: "success",
    });
    const item = {
      ...validItem,
      quantity: validItem.property.tokenInfo.available + 1,
    };

    const result = await BatchTransactionService.executeBatchPurchase(
      [item],
      walletAddress,
      0.005,
      executor,
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Insufficient tokens available");
    expect(executor.execute).not.toHaveBeenCalled();
  });

  it("fails honestly when no deployed contract executor is configured", async () => {
    const { BatchTransactionService } = await import("../batchTransaction");

    const result = await BatchTransactionService.executeBatchPurchase(
      [validItem],
      walletAddress,
      0.005,
    );

    expect(result).toEqual({
      success: false,
      results: [
        {
          propertyId: "prop-1",
          success: false,
          error: "Batch purchase is not configured for this network.",
        },
      ],
      error: "Batch purchase is not configured for this network.",
    });
    expect(result.transactionHash).toBeUndefined();
    expect(mockGetWalletClient).not.toHaveBeenCalled();
  });

  it("returns the executor hash only after a successful receipt", async () => {
    const { BatchTransactionService } = await import("../batchTransaction");
    const executor = createExecutor({
      transactionHash,
      receiptStatus: "success",
    });

    const result = await BatchTransactionService.executeBatchPurchase(
      [validItem],
      walletAddress,
      0.005,
      executor,
    );

    expect(result.success).toBe(true);
    expect(result.transactionHash).toBe(transactionHash);
    expect(result.results).toEqual([
      {
        propertyId: "prop-1",
        success: true,
        transactionHash,
      },
    ]);
    expect(executor.execute).toHaveBeenCalledWith({
      walletAddress,
      slippageTolerance: 0.005,
      items: [
        {
          propertyId: "prop-1",
          tokenAddress: walletAddress,
          quantity: 2,
          expectedAmount: 0.2,
          minimumAmount: 0.199,
        },
      ],
    } satisfies BatchPurchaseRequest);
  });

  it("does not report success when the receipt is reverted", async () => {
    const { BatchTransactionService } = await import("../batchTransaction");
    const executor = createExecutor({
      transactionHash,
      receiptStatus: "reverted",
    });

    const result = await BatchTransactionService.executeBatchPurchase(
      [validItem],
      walletAddress,
      0.005,
      executor,
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("Batch purchase transaction reverted.");
    expect(result.transactionHash).toBeUndefined();
  });

  it("returns a decoded reason for a provider revert", async () => {
    const { BatchTransactionService } = await import("../batchTransaction");
    const executor: BatchPurchaseExecutor = {
      execute: jest.fn(async () => {
        throw Object.assign(new Error("execution reverted"), {
          data: "0x08c379a0",
        });
      }),
    };

    const result = await BatchTransactionService.executeBatchPurchase(
      [validItem],
      walletAddress,
      0.005,
      executor,
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("Insufficient balance");
  });

  it("returns a user rejection without fabricating a hash", async () => {
    const { BatchTransactionService } = await import("../batchTransaction");
    const executor: BatchPurchaseExecutor = {
      execute: jest.fn(async () => {
        throw Object.assign(new Error("User denied transaction"), {
          code: 4001,
        });
      }),
    };

    const result = await BatchTransactionService.executeBatchPurchase(
      [validItem],
      walletAddress,
      0.005,
      executor,
    );

    expect(result).toEqual({
      success: false,
      results: [
        {
          propertyId: "prop-1",
          success: false,
          error: "Transaction rejected by the user.",
        },
      ],
      error: "Transaction rejected by the user.",
    });
  });

  it("computes minimum amounts from the requested slippage", () => {
    expect(calculateMinimumAmount(0.2, 0.1)).toBeCloseTo(0.18);
  });

  describe("with the configured wagmi/viem executor", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_BATCH_PURCHASE_ADDRESS = contractAddress;
      mockGetWalletClient.mockReset();
      mockGetPublicClient.mockReset();
    });

    it("submits a real transaction and returns the real hash after the receipt", async () => {
      const { walletClient, publicClient } = createViemClients("success");
      const { BatchTransactionService } = await import("../batchTransaction");

      const result = await BatchTransactionService.executeBatchPurchase(
        [validItem],
        walletAddress,
        0.005,
      );

      expect(mockGetWalletClient).toHaveBeenCalledWith(
        { mocked: true },
        { account: walletAddress },
      );
      expect(walletClient.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: contractAddress,
          functionName: "batchPurchase",
          account: walletAddress,
          args: [
            [walletAddress],
            [2n],
            [expect.any(BigInt)],
            expect.any(BigInt),
          ],
          value: expect.any(BigInt),
        }),
      );
      expect(publicClient.waitForTransactionReceipt).toHaveBeenCalledWith({
        hash: transactionHash,
      });
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe(transactionHash);
    });

    it("does not report success when the on-chain receipt reverted", async () => {
      createViemClients("reverted");
      const { BatchTransactionService } = await import("../batchTransaction");

      const result = await BatchTransactionService.executeBatchPurchase(
        [validItem],
        walletAddress,
        0.005,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Batch purchase transaction reverted.");
      expect(result.transactionHash).toBeUndefined();
    });

    it("rejects a wallet that is not connected before any submission", async () => {
      mockGetWalletClient.mockRejectedValue(new Error("Connector not found"));
      const { BatchTransactionService } = await import("../batchTransaction");

      const result = await BatchTransactionService.executeBatchPurchase(
        [validItem],
        walletAddress,
        0.005,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Connector not found");
      expect(result.transactionHash).toBeUndefined();
    });

    it("returns a user rejection with a decoded reason", async () => {
      const walletClient = {
        chain: { id: 1 },
        getChainId: jest.fn(async () => 1),
        writeContract: jest.fn(async () => {
          throw Object.assign(new Error("User denied transaction"), {
            code: 4001,
          });
        }),
      };
      mockGetWalletClient.mockResolvedValue(walletClient);
      mockGetPublicClient.mockReturnValue({
        waitForTransactionReceipt: jest.fn(),
      });
      const { BatchTransactionService } = await import("../batchTransaction");

      const result = await BatchTransactionService.executeBatchPurchase(
        [validItem],
        walletAddress,
        0.005,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Transaction rejected by the user.");
      expect(result.transactionHash).toBeUndefined();
    });
  });
});
