import type { CartItem } from '@/types/cart';

const mockProperty = (overrides = {}) => ({
  id: 'prop-1',
  title: 'Test Property',
  tokenInfo: { available: 100, price: 0.1 },
  status: 'active',
  ...overrides,
});

const validItem: CartItem = {
  id: 'item-1',
  property: mockProperty(),
  quantity: 1,
  addedAt: new Date().toISOString(),
};

describe('BatchTransactionService', () => {
  const walletAddress = '0x1234567890123456789012345678901234567890';

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_DEMO_TX;
    jest.resetModules();
  });

  describe('executeBatchPurchase', () => {
    it('returns validation error when item quantity exceeds available', async () => {
      const { BatchTransactionService } = await import('../batchTransaction');
      const overPurchased: CartItem = {
        ...validItem,
        property: mockProperty({ tokenInfo: { available: 1, price: 0.1 } }),
        quantity: 5,
      };

      const result = await BatchTransactionService.executeBatchPurchase(
        [overPurchased],
        walletAddress
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed');
      expect(result.results[0].error).toContain('Insufficient tokens');
    });

    it('returns validation error when property is inactive', async () => {
      const { BatchTransactionService } = await import('../batchTransaction');
      const inactiveItem: CartItem = {
        ...validItem,
        property: mockProperty({ status: 'inactive' }),
      };

      const result = await BatchTransactionService.executeBatchPurchase(
        [inactiveItem],
        walletAddress
      );

      expect(result.success).toBe(false);
    });

    it('throws when no items provided and catches error', async () => {
      const { BatchTransactionService } = await import('../batchTransaction');
      const result = await BatchTransactionService.executeBatchPurchase([], walletAddress);

      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(0);
    });

    it('uses demo mode when NEXT_PUBLIC_DEMO_TX is true', async () => {
      process.env.NEXT_PUBLIC_DEMO_TX = 'true';
      jest.resetModules();

      const { BatchTransactionService } = await import('../batchTransaction');
      const result = await BatchTransactionService.executeBatchPurchase(
        [validItem],
        walletAddress
      );

      expect(result.success).toBe(true);
      expect(result.transactionHash).toMatch(/^0x[a-f0-9]{64}$/);
      expect(result.totalGasUsed).toBeGreaterThan(0);
    });
  });

  describe('estimateGas', () => {
    it('returns base gas for empty items', async () => {
      const { BatchTransactionService } = await import('../batchTransaction');
      const gas = BatchTransactionService.estimateGas([]);
      expect(gas).toBe(0.005);
    });

    it('calculates gas proportionally to item count', async () => {
      const { BatchTransactionService } = await import('../batchTransaction');
      const gas1 = BatchTransactionService.estimateGas([validItem]);
      const gas3 = BatchTransactionService.estimateGas([validItem, validItem, validItem]);
      expect(gas3).toBeGreaterThan(gas1);
    });
  });

  describe('getTransactionStatus', () => {
    it('returns pending when receipt is not available', async () => {
      const { BatchTransactionService } = await import('../batchTransaction');
      const result = await BatchTransactionService.getTransactionStatus(
        '0x0000000000000000000000000000000000000000000000000000000000000000'
      );

      expect(result.status).toBe('pending');
    });
  });

  describe('waitForConfirmation', () => {
    it('returns timeout when transaction is not found', async () => {
      const { BatchTransactionService } = await import('../batchTransaction');
      const result = await BatchTransactionService.waitForConfirmation(
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        100
      );

      expect(result.status).toBe('timeout');
    });
  });
});
