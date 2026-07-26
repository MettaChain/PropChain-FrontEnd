import { create } from 'zustand';
import { TransactionStatus } from './transactionA11yTypes';

interface TransactionA11yStore {
  status: TransactionStatus;
  setStatus: (status: TransactionStatus) => void;
  reset: () => void;
}

export const useTransactionA11yStore = create<TransactionA11yStore>((set) => ({
  status: 'IDLE',
  setStatus: (status) => set({ status }),
  reset: () => set({ status: 'IDLE' }),
}));
