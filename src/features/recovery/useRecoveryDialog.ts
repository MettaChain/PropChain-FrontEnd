import { useCallback } from 'react';
import { useRecoveryStore } from './recoveryStore';

export function useRecoveryDialog() {
  const { isDialogOpen, context, requestRecovery, closeDialog } = useRecoveryStore();

  const initiateRecovery = useCallback((reason: string) => {
    requestRecovery({
      errorId: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      reason
    });
  }, [requestRecovery]);

  const confirmRecovery = useCallback(() => {
    // Perform actual reload safely
    closeDialog();
    window.location.reload();
  }, [closeDialog]);

  return {
    isDialogOpen,
    context,
    initiateRecovery,
    confirmRecovery,
    cancelRecovery: closeDialog
  };
}
