import { create } from 'zustand';
import { RecoveryContextInfo } from './recoveryTypes';

interface RecoveryState {
  isDialogOpen: boolean;
  context: RecoveryContextInfo | null;
  requestRecovery: (context: RecoveryContextInfo) => void;
  closeDialog: () => void;
}

export const useRecoveryStore = create<RecoveryState>((set) => ({
  isDialogOpen: false,
  context: null,
  requestRecovery: (context) => set({ isDialogOpen: true, context }),
  closeDialog: () => set({ isDialogOpen: false, context: null }),
}));
