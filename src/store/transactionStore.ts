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
  lastUpdated: number | null;
}

export interface TransactionActions {
  addTransaction: (transaction: Omit<Transaction, 'id' | 'status' | 'confirmations' | 'timestamp'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setLastUpdated: (timestamp: number) => void;
  reset: () => void;
  getTransactionsByStatus: (status: TransactionStatus) => Transaction[];
  getTransactionsByType: (type: TransactionType) => Transaction[];
  getTransactionsByChain: (chainId: number) => Transaction[];
}

export type TransactionStore = TransactionState & TransactionActions;

export const useTransactionStore = create<TransactionStore>()(
  persist(
    (set: (partial: TransactionStore | Partial<TransactionStore> | ((state: TransactionStore) => Partial<TransactionStore>)) => void, get: () => TransactionStore) => ({
      transactions: [],
      pendingTransactions: [],
      recentTransactions: [],
      isLoading: false,
      error: null,
      lastUpdated: null,

      addTransaction: (transactionData: Omit<Transaction, 'id' | 'status' | 'confirmations' | 'timestamp'>) => {
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
          lastUpdated: Date.now(),
        }));
      },

      updateTransaction: (id: string, updates: Partial<Transaction>) => {
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
            lastUpdated: Date.now(),
          };
        });
      },

      removeTransaction: (id: string) => {
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.id !== id),
          pendingTransactions: state.pendingTransactions.filter((tx) => tx.id !== id),
          recentTransactions: state.recentTransactions.filter((tx) => tx.id !== id),
          lastUpdated: Date.now(),
        }));
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),
      setLastUpdated: (timestamp: number) => set({ lastUpdated: timestamp }),
      reset: () => set({
        transactions: [],
        pendingTransactions: [],
        recentTransactions: [],
        isLoading: false,
        error: null,
        lastUpdated: Date.now(),
      }),

      getTransactionsByStatus: (status: TransactionStatus) => {
        return get().transactions.filter((tx) => tx.status === status);
      },

      getTransactionsByType: (type: TransactionType) => {
        return get().transactions.filter((tx) => tx.type === type);
      },

      getTransactionsByChain: (chainId: number) => {
        return get().transactions.filter((tx) => tx.chainId === chainId);
      },
    }),
    {
      name: 'propchain-transactions',
      partialize: (state: TransactionStore) => ({
        transactions: state.transactions,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);