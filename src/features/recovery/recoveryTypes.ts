export interface RecoveryContextInfo {
  errorId: string;
  timestamp: number;
  reason: string;
}

export interface RecoveryDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  context: RecoveryContextInfo | null;
}
