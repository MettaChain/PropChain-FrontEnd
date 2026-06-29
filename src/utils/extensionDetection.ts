'use client';
import { isRecord } from './typeGuards';
import { logger } from './logger';

export interface WalletExtension {
  name: string;
  id: string;
  isInstalled: boolean;
  icon: string;
}

export const detectWalletExtensions = (): WalletExtension[] => {
  const extensions: WalletExtension[] = [
    {
      name: 'MetaMask',
      id: 'metamask',
      isInstalled: typeof window !== 'undefined' && !!window.ethereum?.isMetaMask,
      icon: '🦊',
    },
    {
      name: 'Coinbase Wallet',
      id: 'coinbase',
      isInstalled: typeof window !== 'undefined' && !!window.ethereum?.isCoinbaseWallet,
      icon: '🔵',
    },
    {
      name: 'WalletConnect',
      id: 'walletconnect',
      isInstalled: false, // WalletConnect is not a browser extension
      icon: '🔗',
    },
  ];

  return extensions;
};

export const getPreferredWallet = (): WalletExtension | null => {
  const extensions = detectWalletExtensions();
  return extensions.find((ext) => ext.isInstalled) || null;
};

const stringifyError = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message || value.toString();
  return String(value);
};

const EXTENSION_ERROR_PATTERNS: readonly string[] = [
  'chrome-extension://',
  'evmask.js',
  'evmAsk.js',
  'extension',
  'web3 provider',
];

export const isExtensionError = (error: unknown): boolean => {
  if (!error) return false;

  const errorString = stringifyError(error).toLowerCase();
  return EXTENSION_ERROR_PATTERNS.some((pattern) => errorString.includes(pattern));
};

export const sanitizeExtensionError = (error: unknown): string => {
  if (!isExtensionError(error)) {
    if (isRecord(error) && typeof error.message === 'string') {
      return error.message;
    }
    return 'Unknown error occurred';
  }

  // Provide user-friendly messages for extension errors
  const errorString = stringifyError(error);

  if (errorString.includes('evmAsk.js')) {
    return 'Wallet extension error. Please try refreshing the page or restarting your browser.';
  }

  if (errorString.includes('chrome-extension://')) {
    return 'Browser extension conflict detected. Please disable other Web3 extensions and try again.';
  }

  return 'Wallet extension error. Please check your extension settings and try again.';
};

/**
 * Install global listeners that filter noisy wallet extension errors.
 *
 * We deliberately do NOT monkey-patch the global console API here. Overriding
 * those methods would recurse any logger that ultimately writes through the
 * global console and would silently lose correlation IDs / redaction. Instead
 * we route filtered events through the structured logger so they remain
 * visible to telemetry as low-severity warnings.
 */
export const setupExtensionErrorHandling = (): void => {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    if (isExtensionError(event.error)) {
      event.preventDefault();
      logger.warn('Extension error filtered', sanitizeExtensionError(event.error));
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (isExtensionError(event.reason)) {
      event.preventDefault();
      logger.warn('Extension promise rejection filtered', sanitizeExtensionError(event.reason));
    }
  });
};
