'use client';

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

export const isExtensionError = (error: any): boolean => {
  if (!error) return false;
  
  const errorString = error.toString().toLowerCase();
  const extensionErrorPatterns = [
    'chrome-extension://',
    'evmask.js',
    'evmAsk.js',
    'extension',
    'web3 provider',
  ];
  
  return extensionErrorPatterns.some(pattern => errorString.includes(pattern));
};

export const sanitizeExtensionError = (error: any): string => {
  if (!isExtensionError(error)) {
    return error?.message || 'Unknown error occurred';
  }
  
  // Provide user-friendly messages for extension errors
  if (error.toString().includes('evmAsk.js')) {
    return 'Wallet extension error. Please try refreshing the page or restarting your browser.';
  }
  
  if (error.toString().includes('chrome-extension://')) {
    return 'Browser extension conflict detected. Please disable other Web3 extensions and try again.';
  }
  
  return 'Wallet extension error. Please check your extension settings and try again.';
};

export const setupExtensionErrorHandling = () => {
  if (typeof window === 'undefined') return;
  
  // Override console.error to filter out extension errors
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const errorString = args.join(' ').toLowerCase();
    
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
