import { isExtensionError, sanitizeExtensionError } from './extensionDetection';
import { getErrorCode, getErrorMessage, isRecord } from './typeGuards';

export const WALLET_ERRORS = {
  USER_REJECTED: 4001,
  UNAUTHORIZED: 4100,
  UNSUPPORTED_METHOD: 4200,
  DISCONNECTED: 4900,
  CHAIN_DISCONNECTED: 4901,
  CHAIN_NOT_ADDED: 4902,
} as const;

export const getWalletErrorMessage = (error: unknown): string => {
  if (!error) return 'Unknown error occurred';

  // Check for extension errors first
  if (isExtensionError(error)) {
    return sanitizeExtensionError(error);
  }

  const code = getErrorCode(error);
  if (code !== undefined) {
    switch (code) {
      case WALLET_ERRORS.USER_REJECTED:
        return 'User rejected the request';
      case WALLET_ERRORS.UNAUTHORIZED:
        return 'Unauthorized to access this account';
      case WALLET_ERRORS.UNSUPPORTED_METHOD:
        return 'The wallet does not support this method';
      case WALLET_ERRORS.DISCONNECTED:
        return 'Wallet is disconnected';
      case WALLET_ERRORS.CHAIN_DISCONNECTED:
        return 'Chain is disconnected';
      case WALLET_ERRORS.CHAIN_NOT_ADDED:
        return 'Chain has not been added to wallet';
      default:
        return `Wallet error (${code}): ${getErrorMessage(error)}`;
    }
  }

  const message = getErrorMessage(error);
  if (message) {
    if (message.includes('MetaMask is not installed')) {
      return 'MetaMask is not installed. Please install MetaMask to continue.';
    }
    if (message.includes('Coinbase Wallet is not installed')) {
      return 'Coinbase Wallet is not installed. Please install Coinbase Wallet to continue.';
    }
    if (message.includes('WalletConnect')) {
      return 'WalletConnect integration needs to be implemented with v2 SDK.';
    }
    return message;
  }

  return 'An unexpected error occurred';
};

const getMessage = (error: unknown): string => {
  if (isRecord(error) && typeof error.message === 'string') return error.message;
  return getErrorMessage(error, '');
};

export const isSupportedNetworkError = (error: unknown): boolean => {
  const message = getMessage(error);
  return message.includes('Unsupported network') || message.includes('chain not supported');
};

export const isUserRejectionError = (error: unknown): boolean => {
  const message = getMessage(error);
  return (
    getErrorCode(error) === WALLET_ERRORS.USER_REJECTED ||
    message.includes('User rejected') ||
    message.includes('User denied')
  );
};

export const isNetworkError = (error: unknown): boolean => {
  const message = getMessage(error).toLowerCase();
  const code = getErrorCode(error);

  return (
    message.includes('network') ||
    message.includes('chain') ||
    code === WALLET_ERRORS.CHAIN_DISCONNECTED ||
    code === WALLET_ERRORS.CHAIN_NOT_ADDED
  );
};
