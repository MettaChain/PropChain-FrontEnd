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
      // Internal JSON-RPC error (node/provider side)
      case -32603:
        return 'Internal node error: the transaction failed on the node. It may have been reverted.';
      // Provider returned a string code for network issues
      case 'NETWORK_ERROR':
        return 'Network error: failed to reach the RPC provider. Check your network or RPC settings.';
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
    // Map common provider/ethers error messages to friendlier text
    if (message.includes('INSUFFICIENT_FUNDS') || message.toLowerCase().includes('insufficient funds')) {
      return 'Insufficient funds: you do not have enough ETH to pay for transaction value and gas.';
    }
    if (message.includes('UNPREDICTABLE_GAS_LIMIT') || message.includes('cannot estimate gas')) {
      return 'Transaction likely to revert: the contract rejected the call or gas estimation failed.';
    }
    if (message.includes('Network Error') || message.includes('NETWORK_ERROR') || message.toLowerCase().includes('failed to fetch')) {
      return 'Network error: failed to reach the RPC provider. Check your connection and RPC settings.';
    }
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

export const WEB3_ERROR_CODES = {
  USER_REJECTED: 4001,
  JSON_RPC_INTERNAL: -32603,
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  UNPREDICTABLE_GAS_LIMIT: 'UNPREDICTABLE_GAS_LIMIT',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

export type Web3ErrorCode = (typeof WEB3_ERROR_CODES)[keyof typeof WEB3_ERROR_CODES];

const extractWeb3ErrorCode = (error: unknown): number | string | undefined => {
  const topLevelCode = getErrorCode(error);
  if (topLevelCode !== undefined) return topLevelCode;

  if (!isRecord(error)) return undefined;

  const nestedError = error.error;
  if (isRecord(nestedError)) {
    const nestedCode = getErrorCode(nestedError);
    if (nestedCode !== undefined) return nestedCode;
    const nestedDataCode = isRecord(nestedError.data) ? getErrorCode(nestedError.data) : undefined;
    if (nestedDataCode !== undefined) return nestedDataCode;
  }

  const nestedData = error.data;
  if (isRecord(nestedData)) {
    const nestedDataCode = getErrorCode(nestedData);
    if (nestedDataCode !== undefined) return nestedDataCode;
  }

  return undefined;
};

export const getFriendlyWeb3ErrorMessage = (error: unknown): string => {
  const code = extractWeb3ErrorCode(error);
  const message = getErrorMessage(error).toLowerCase();

  if (
    code === WEB3_ERROR_CODES.USER_REJECTED ||
    message.includes('user rejected') ||
    message.includes('user denied')
  ) {
    return 'Transaction rejected by the user.';
  }

  if (code === WEB3_ERROR_CODES.JSON_RPC_INTERNAL || message.includes('internal json-rpc error')) {
    return 'Internal blockchain error. Please try again later.';
  }

  if (
    code === WEB3_ERROR_CODES.INSUFFICIENT_FUNDS ||
    message.includes('insufficient funds') ||
    message.includes('insufficient balance')
  ) {
    return 'Not enough ETH available to cover gas fees.';
  }

  if (
    code === WEB3_ERROR_CODES.UNPREDICTABLE_GAS_LIMIT ||
    message.includes('unpredictable gas limit') ||
    message.includes('gas estimation')
  ) {
    return 'Gas estimation failed. This transaction may fail if submitted.';
  }

  if (
    code === WEB3_ERROR_CODES.NETWORK_ERROR ||
    message.includes('network error') ||
    message.includes('rpc connection failed')
  ) {
    return 'Network connection failed. Please check your RPC provider and internet connection.';
  }

  if (message.includes('transaction failed')) {
    return 'Transaction failed. Please check your wallet and try again.';
  }

  return 'Something went wrong while processing the transaction. Please try again.';
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
    message.includes('network error') ||
    message.includes('failed to fetch') ||
    message.includes('chain') ||
    code === WALLET_ERRORS.CHAIN_DISCONNECTED ||
    code === WALLET_ERRORS.CHAIN_NOT_ADDED
  );
};
