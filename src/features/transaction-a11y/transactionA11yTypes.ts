export type TransactionStatus = 'IDLE' | 'PENDING' | 'SUCCESS' | 'ERROR';

export interface TransactionButtonProps {
  onClick: () => Promise<void>;
  label: string;
  loadingLabel?: string;
  successLabel?: string;
  errorLabel?: string;
  className?: string;
}
