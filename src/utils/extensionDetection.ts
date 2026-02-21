'use client';
import { isRecord } from './typeGuards';

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
  return extensions.find(ext => ext.isInstalled) || null;
};

const stringifyError = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message || value.toString();
  return String(value);
};

export const isExtensionError = (error: unknown): boolean => {
  if (!error) return false;
  
  const errorString = stringifyError(error).toLowerCase();
  const extensionErrorPatterns = [
    'chrome-extension://',
    'evmask.js',
    'evmAsk.js',
    'extension',
    'web3 provider',
  ];
  
  return extensionErrorPatterns.some(pattern => errorString.includes(pattern));
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

export const setupExtensionErrorHandling = () => {
  if (typeof window === 'undefined') return;
  
  // Override console.error to filter out extension errors
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    const errorString = args.map(stringifyError).join(' ').toLowerCase();
    
    // Filter out known extension errors that don't affect functionality
    if (errorString.includes('chrome-extension://') || 
        errorString.includes('evmask.js') || 
        errorString.includes('evmask.js')) {
      return; // Silently ignore these errors
    }
    
    originalConsoleError.apply(console, args);
  };
  
  // Add global error handler for unhandled extension errors
  window.addEventListener('error', (event) => {
    if (isExtensionError(event.error)) {
      event.preventDefault();
      console.warn('Extension error filtered:', sanitizeExtensionError(event.error));
    }
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    if (isExtensionError(event.reason)) {
      event.preventDefault();
      console.warn('Extension promise rejection filtered:', sanitizeExtensionError(event.reason));
    }
  });
};
