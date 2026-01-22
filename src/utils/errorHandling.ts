import { isExtensionError, sanitizeExtensionError } from './extensionDetection';

export const WALLET_ERRORS = {
  USER_REJECTED: 4001,
  UNAUTHORIZED: 4100,
  UNSUPPORTED_METHOD: 4200,
  DISCONNECTED: 4900,
  CHAIN_DISCONNECTED: 4901,
  CHAIN_NOT_ADDED: 4902,
} as const;

export const getWalletErrorMessage = (error: any): string => {
  if (!error) return 'Unknown error occurred';

  // Check for extension errors first
  if (isExtensionError(error)) {
    return sanitizeExtensionError(error);
  }

  if (error.code) {
    switch (error.code) {
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
        return `Wallet error (${error.code}): ${error.message || 'Unknown error'}`;
    }
  }

  if (error.message) {
    if (error.message.includes('MetaMask is not installed')) {
      return 'MetaMask is not installed. Please install MetaMask to continue.';
    }
    if (error.message.includes('Coinbase Wallet is not installed')) {
      return 'Coinbase Wallet is not installed. Please install Coinbase Wallet to continue.';
    }
    if (error.message.includes('WalletConnect')) {
      return 'WalletConnect integration needs to be implemented with v2 SDK.';
    }
    return error.message;
  }

  return 'An unexpected error occurred';
};

export const isSupportedNetworkError = (error: any): boolean => {
  return error?.message?.includes('Unsupported network') || 
         error?.message?.includes('chain not supported');
};

export const isUserRejectionError = (error: any): boolean => {
  return error?.code === WALLET_ERRORS.USER_REJECTED ||
         error?.message?.includes('User rejected') ||
         error?.message?.includes('User denied');
};

export const isNetworkError = (error: any): boolean => {
  return error?.message?.includes('network') ||
         error?.message?.includes('chain') ||
         error?.code === WALLET_ERRORS.CHAIN_DISCONNECTED ||
         error?.code === WALLET_ERRORS.CHAIN_NOT_ADDED;
};
