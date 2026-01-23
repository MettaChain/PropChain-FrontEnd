import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TransactionType = 'purchase' | 'transfer' | 'management' | 'other';

export type TransactionStatus = 'pending' | 'processing' | 'confirmed' | 'failed' | 'cancelled';

export interface Transaction {
  id: string;
  hash: string;
  type: TransactionType;
  status: TransactionStatus;
  chainId: number;
  from: string;
  to?: string;
  value?: string;
  gasUsed?: string;
  gasPrice?: string;
  confirmations: number;
  requiredConfirmations: number;
  timestamp: number;
  error?: string;
  description?: string;
  propertyId?: string;
}

export interface TransactionState {
  transactions: Transaction[];
  pendingTransactions: Transaction[];
  recentTransactions: Transaction[];
  isLoading: boolean;
  error: string | null;
}

export interface TransactionActions {
  addTransaction: (transaction: Omit<Transaction, 'id' | 'status' | 'confirmations' | 'timestamp'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  getTransactionsByStatus: (status: TransactionStatus) => Transaction[];
  getTransactionsByType: (type: TransactionType) => Transaction[];
  getTransactionsByChain: (chainId: number) => Transaction[];
}

export type TransactionStore = TransactionState & TransactionActions;

export const useTransactionStore = create<TransactionStore>()(
  persist(
    (set, get) => ({
      transactions: [],
      pendingTransactions: [],
      recentTransactions: [],
      isLoading: false,
      error: null,

      addTransaction: (transactionData) => {
        const newTransaction: Transaction = {
          ...transactionData,
          id: `${transactionData.hash}-${Date.now()}`,
          status: 'pending',
          confirmations: 0,
          timestamp: Date.now(),
        };

        set((state) => ({
          transactions: [newTransaction, ...state.transactions],
          pendingTransactions: [newTransaction, ...state.pendingTransactions],
        }));
      },

      updateTransaction: (id, updates) => {
        set((state) => {
          const updatedTransactions = state.transactions.map((tx) =>
            tx.id === id ? { ...tx, ...updates } : tx
          );

          const pendingTransactions = updatedTransactions.filter(
            (tx) => tx.status === 'pending' || tx.status === 'processing'
          );

          const recentTransactions = updatedTransactions
            .filter((tx) => tx.status === 'confirmed' || tx.status === 'failed')
            .slice(0, 10);

          return {
            transactions: updatedTransactions,
            pendingTransactions,
            recentTransactions,
          };
        });
      },

      removeTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.id !== id),
          pendingTransactions: state.pendingTransactions.filter((tx) => tx.id !== id),
          recentTransactions: state.recentTransactions.filter((tx) => tx.id !== id),
        }));
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      getTransactionsByStatus: (status) => {
        return get().transactions.filter((tx) => tx.status === status);
      },

      getTransactionsByType: (type) => {
        return get().transactions.filter((tx) => tx.type === type);
      },

      getTransactionsByChain: (chainId) => {
        return get().transactions.filter((tx) => tx.chainId === chainId);
      },
    }),
    {
      name: 'propchain-transactions',
      partialize: (state) => ({
        transactions: state.transactions,
      }),
    }
  )
);