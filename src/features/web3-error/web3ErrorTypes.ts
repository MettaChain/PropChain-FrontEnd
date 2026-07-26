export type Web3ErrorType = 'WALLET_DISCONNECTED' | 'CHAIN_MISMATCH' | 'INSUFFICIENT_GAS' | 'UNKNOWN';

export interface Web3Error {
  type: Web3ErrorType;
  message: string;
  code?: number | string;
}

export interface Web3ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export interface Web3ErrorBoundaryState {
  hasError: boolean;
  error: Web3Error | null;
}
