import { act, renderHook } from '@testing-library/react';
import { useTransactionStore } from '../transactionStore';

describe('transactionStore', () => {
  const mockTransactionData = {
    hash: '0x1234567890abcdef',
    type: 'purchase' as const,
    status: 'pending' as const,
    chainId: 1,
    from: '0x123...',
    to: '0x456...',
    value: '1000000000000000000',
    gasUsed: '21000',
    gasPrice: '20000000000',
    confirmations: 0,
    requiredConfirmations: 12,
    timestamp: Date.now(),
    description: 'Test transaction',
    propertyId: 'prop-123',
  };

  beforeEach(() => {
    // Reset the store before each test
    useTransactionStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useTransactionStore());
      
      expect(result.current.transactions).toEqual([]);
      expect(result.current.pendingTransactions).toEqual([]);
      expect(result.current.recentTransactions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastUpdated).toBeNull();
    });
  });

  describe('addTransaction', () => {
    it('should add a new transaction with default values', () => {
      const { result } = renderHook(() => useTransactionStore());
      
      const transactionToAdd = {
        hash: '0x1234567890abcdef',
        type: 'purchase' as const,
        chainId: 1,
        from: '0x123...',
        to: '0x456...',
        value: '1000000000000000000',
        requiredConfirmations: 12,
        description: 'Test transaction',
      };
      
      act(() => {
        result.current.addTransaction(transactionToAdd);
      });
      
      expect(result.current.transactions).toHaveLength(1);
      expect(result.current.pendingTransactions).toHaveLength(1);
      
      const addedTransaction = result.current.transactions[0];
      expect(addedTransaction.hash).toBe(transactionToAdd.hash);
      expect(addedTransaction.type).toBe(transactionToAdd.type);
      expect(addedTransaction.status).toBe('pending');
      expect(addedTransaction.confirmations).toBe(0);
      expect(addedTransaction.id).toBe(`${transactionToAdd.hash}-${addedTransaction.timestamp}`);
      expect(addedTransaction.timestamp).toBeGreaterThan(0);
      expect(result.current.lastUpdated).toBeGreaterThan(0);
    });

    it('should add multiple transactions in order', () => {
      const { result } = renderHook(() => useTransactionStore());
      
      act(() => {
        result.current.addTransaction({ ...mockTransactionData, hash: '0x111' });
        result.current.addTransaction({ ...mockTransactionData, hash: '0x222' });
      });
      
      expect(result.current.transactions).toHaveLength(2);
      expect(result.current.transactions[0].hash).toBe('0x222'); // Most recent first
      expect(result.current.transactions[1].hash).toBe('0x111');
    });
  });

  describe('updateTransaction', () => {
    it('should update an existing transaction', () => {
      const { result } = renderHook(() => useTransactionStore());
      
      // Add a transaction first
      act(() => {
        result.current.addTransaction(mockTransactionData);
      });
      
      const transactionId = result.current.transactions[0].id;
      
      // Update the transaction
      act(() => {
        result.current.updateTransaction(transactionId, {
          status: 'confirmed',
          confirmations: 12,
          gasUsed: '21000',
        });
      });
      
      const updatedTransaction = result.current.transactions[0];
      expect(updatedTransaction.status).toBe('confirmed');
      expect(updatedTransaction.confirmations).toBe(12);
      expect(updatedTransaction.gasUsed).toBe('21000');
      expect(result.current.lastUpdated).toBeGreaterThan(0);
    });

    it('should move transaction to pendingTransactions when status is processing', () => {
      const { result } = renderHook(() => useTransactionStore());
      
      act(() => {
        result.current.addTransaction(mockTransactionData);
      });
      
      const transactionId = result.current.transactions[0].id;
      
      act(() => {
        result.current.updateTransaction(transactionId, { status: 'processing' });
      });
      
      expect(result.current.pendingTransactions).toHaveLength(1);
      expect(result.current.pendingTransactions[0].status).toBe('processing');
    });

    it('should move transaction to recentTransactions when status is confirmed', () => {
      const { result } = renderHook(() => useTransactionStore());
      
      act(() => {
        result.current.addTransaction(mockTransactionData);
      });
      
      const transactionId = result.current.transactions[0].id;
      
      act(() => {
        result.current.updateTransaction(transactionId, { status: 'confirmed' });
      });
      
      expect(result.current.pendingTransactions).toHaveLength(0);
      expect(result.current.recentTransactions).toHaveLength(1);
      expect(result.current.recentTransactions[0].status).toBe('confirmed');
    });

    it('should move transaction to recentTransactions when status is failed', () => {
      const { result } = renderHook(() => useTransactionStore());
      
      act(() => {
        result.current.addTransaction(mockTransactionData);
      });
      
      const transactionId = result.current.transactions[0].id;
      
      act(() => {
        result.current.updateTransaction(transactionId, { 
          status: 'failed',
          error: 'Transaction failed'
        });
      });
      
      expect(result.current.pendingTransactions).toHaveLength(0);
      expect(result.current.recentTransactions).toHaveLength(1);
      expect(result.current.recentTransactions[0].status).toBe('failed');
      expect(result.current.recentTransactions[0].error).toBe('Transaction failed');
    });

    it('should limit recentTransactions to 10 items', () => {
      const { result } = renderHook(() => useTransactionStore());
      
      // Add 11 confirmed transactions
      act(() => {
        for (let i = 0; i < 11; i++) {
          result.current.addTransaction({ ...mockTransactionData, hash: `0x${i}` });
          const transactionId = result.current.transactions[0].id;
          result.current.updateTransaction(transactionId, { status: 'confirmed' });
        }
      });
      
      expect(result.current.recentTransactions).toHaveLength(10);
      expect(result.current.recentTransactions[0].hash).toBe('0x10'); // Most recent
    });

    it('should handle updating non-existent transaction', () => {
      const { result } = renderHook(() => useTransactionStore());
      
      act(() => {
        result.current.addTransaction(mockTransactionData);
      });
      
      const originalLength = result.current.transactions.length;
      
      act(() => {
        result.current.updateTransaction('non-existent-id', { status: 'confirmed' });
      });
      
      expect(result.current.transactions).toHaveLength(originalLength);
      expect(result.current.transactions[0].status).toBe('pending'); // Unchanged
    });
  });

  describe('removeTransaction', () => {
    it('should remove a transaction from all arrays', () => {
      const { result } = renderHook(() => useTransactionStore());
      
      act(() => {
        result.current.addTransaction(mockTransactionData);
      });
      
      const transactionId = result.current.transactions[0].id;
      
      act(() => {
        result.current.removeTransaction(transactionId);
      });
      
      expect(result.current.transactions).toHaveLength(0);
      expect(result.current.pendingTransactions).toHaveLength(0);
      expect(result.current.recentTransactions).toHaveLength(0);
      expect(result.current.lastUpdated).toBeGreaterThan(0);
    });

    it('should handle removing non-existent transaction', () => {
      const { result } = renderHook(() => useTransactionStore());
      
      act(() => {
        result.current.addTransaction(mockTransactionData);
      });
      
      const originalLength = result.current.transactions.length;
      
      act(() => {
        result.current.removeTransaction('non-existent-id');
      });
      
      expect(result.current.transactions).toHaveLength(originalLength);
    });
  });

  describe('setLoading', () => {
    it('should update loading state', () => {
      const { result } = renderHook(() => useTransactionStore());
      
      act(() => {
        result.current.setLoading(true);
      });
      
      expect(result.current.isLoading).toBe(true);
      
      act(() => {
        result.current.setLoading(false);
      });
      
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error', () => {
      const { result } = renderHook(() => useTransactionStore());
      
      act(() => {
        result.current.setError('Transaction failed');
      });
      
      expect(result.current.error).toBe('Transaction failed');
    });

    it('should clear error when set to null', () => {
      const { result } = renderHook(() => useTransactionStore());
      
      act(() => {
        result.current.setError('Some error');
        result.current.setError(null);
      });
      
      expect(result.current.error).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useTransactionStore());
      
      act(() => {
        result.current.setError('Some error');
        result.current.clearError();
      });
      
      expect(result.current.error).toBeNull();
    });
  });

  describe('setLastUpdated', () => {
    it('should update last updated timestamp', () => {
      const { result } = renderHook(() => useTransactionStore());
      
      const timestamp = Date.now();
      
      act(() => {
        result.current.setLastUpdated(timestamp);
      });
      
      expect(result.current.lastUpdated).toBe(timestamp);
    });
  });

  describe('reset', () => {
    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useTransactionStore());
      
      // Set some state
      act(() => {
        result.current.addTransaction(mockTransactionData);
        result.current.setLoading(true);
        result.current.setError('Some error');
      });
      
      // Reset
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.transactions).toEqual([]);
      expect(result.current.pendingTransactions).toEqual([]);
      expect(result.current.recentTransactions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastUpdated).toBeNull();
    });
  });

  describe('getTransactionsByStatus', () => {
    it('should filter transactions by status', () => {
      const { result } = renderHook(() => useTransactionStore());
      
      act(() => {
        result.current.addTransaction({ ...mockTransactionData, hash: '0x111' });
        result.current.addTransaction({ ...mockTransactionData, hash: '0x222' });
        result.current.addTransaction({ ...mockTransactionData, hash: '0x333' });
        
        const tx1 = result.current.transactions[0].id;
        const tx2 = result.current.transactions[1].id;
        
        result.current.updateTransaction(tx1, { status: 'confirmed' });
        result.current.updateTransaction(tx2, { status: 'failed' });
      });
      
      const pendingTxs = result.current.getTransactionsByStatus('pending');
      const confirmedTxs = result.current.getTransactionsByStatus('confirmed');
      const failedTxs = result.current.getTransactionsByStatus('failed');
      
      expect(pendingTxs).toHaveLength(1);
      expect(confirmedTxs).toHaveLength(1);
      expect(failedTxs).toHaveLength(1);
    });
  });

  describe('getTransactionsByType', () => {
    it('should filter transactions by type', () => {
      const { result } = renderHook(() => useTransactionStore());
      
      act(() => {
        result.current.addTransaction({ ...mockTransactionData, hash: '0x111', type: 'purchase' });
        result.current.addTransaction({ ...mockTransactionData, hash: '0x222', type: 'transfer' });
        result.current.addTransaction({ ...mockTransactionData, hash: '0x333', type: 'purchase' });
      });
      
      const purchaseTxs = result.current.getTransactionsByType('purchase');
      const transferTxs = result.current.getTransactionsByType('transfer');
      
      expect(purchaseTxs).toHaveLength(2);
      expect(transferTxs).toHaveLength(1);
    });
  });

  describe('getTransactionsByChain', () => {
    it('should filter transactions by chain ID', () => {
      const { result } = renderHook(() => useTransactionStore());
      
      act(() => {
        result.current.addTransaction({ ...mockTransactionData, hash: '0x111', chainId: 1 });
        result.current.addTransaction({ ...mockTransactionData, hash: '0x222', chainId: 137 });
        result.current.addTransaction({ ...mockTransactionData, hash: '0x333', chainId: 1 });
      });
      
      const ethTxs = result.current.getTransactionsByChain(1);
      const polygonTxs = result.current.getTransactionsByChain(137);
      
      expect(ethTxs).toHaveLength(2);
      expect(polygonTxs).toHaveLength(1);
    });
  });

  describe('persistence', () => {
    it('should persist transactions', () => {
      const { result } = renderHook(() => useTransactionStore());
      
      act(() => {
        result.current.addTransaction(mockTransactionData);
      });
      
      // Create a new hook instance to test persistence
      const { result: result2 } = renderHook(() => useTransactionStore());
      
      expect(result2.current.transactions).toHaveLength(1);
      expect(result2.current.transactions[0].hash).toBe(mockTransactionData.hash);
    });

    it('should not persist transient data', () => {
      const { result } = renderHook(() => useTransactionStore());
      
      act(() => {
        result.current.addTransaction(mockTransactionData);
        result.current.setLoading(true);
        result.current.setError('Some error');
      });
      
      // Create a new hook instance
      const { result: result2 } = renderHook(() => useTransactionStore());
      
      expect(result2.current.isLoading).toBe(false);
      expect(result2.current.error).toBeNull();
      // Note: pendingTransactions and recentTransactions are derived from transactions
      // so they will be recalculated on hydration
    });
  });
});
