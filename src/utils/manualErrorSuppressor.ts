'use client';

export const ManualErrorSuppressor = () => {
  if (typeof window === 'undefined') return;

  // Function to manually clear console and suppress errors
  const clearConsoleAndSuppress = () => {
    // Clear console
    console.clear();
    
    // Re-initialize suppression
    const patterns = [
      'bfnaelmomeimhlpmgjnjophhpkkoljpa',
      'evmAsk.js',
      'selectExtension',
      'chrome-extension://',
      'Unexpected error'
    ];
    
    const shouldSuppress = (...args: any[]): boolean => {
      const message = args.join(' ').toLowerCase();
      return patterns.some(pattern => message.includes(pattern.toLowerCase()));
    };
    
    // Override all console methods
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleLog = console.log;
    
    console.error = (...args: any[]) => {
      if (shouldSuppress(...args)) return;
      originalConsoleError.apply(console, args);
    };
    
    console.warn = (...args: any[]) => {
      if (shouldSuppress(...args)) return;
      originalConsoleWarn.apply(console, args);
    };
    
    console.log = (...args: any[]) => {
      if (shouldSuppress(...args)) return;
      originalConsoleLog.apply(console, args);
    };
    
    console.log('🔧 Extension error suppression activated');
  };

  // Add to window for manual access
  (window as any).suppressExtensionErrors = clearConsoleAndSuppress;
  
  // Auto-activate on load
  setTimeout(clearConsoleAndSuppress, 1000);
  
  // Also activate on visibility change (when user switches tabs)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      setTimeout(clearConsoleAndSuppress, 500);
    }
  });
  
  return clearConsoleAndSuppress;
};

// Create a global error suppressor that can be called from anywhere
export const globalErrorSuppressor = () => {
  if (typeof window === 'undefined') return;
  
  // Suppress all errors from the specific extension
  const suppressExtensionErrors = () => {
    const errorHandler = (event: ErrorEvent) => {
      if (event.filename && event.filename.includes('bfnaelmomeimhlpmgjnjophhpkkoljpa')) {
        event.preventDefault();
        event.stopPropagation();
        return true;
      }
      return false;
    };
    
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      if (event.reason && event.reason.toString && event.reason.toString().includes('bfnaelmomeimhlpmgjnjophhpkkoljpa')) {
        event.preventDefault();
        return true;
      }
      return false;
    };
    
    // Add multiple layers of error handling
    window.addEventListener('error', errorHandler, true);
    window.addEventListener('error', errorHandler, false);
    window.addEventListener('unhandledrejection', rejectionHandler, true);
    window.addEventListener('unhandledrejection', rejectionHandler, false);
    
    return () => {
      window.removeEventListener('error', errorHandler, true);
      window.removeEventListener('error', errorHandler, false);
      window.removeEventListener('unhandledrejection', rejectionHandler, true);
      window.removeEventListener('unhandledrejection', rejectionHandler, false);
    };
  };
  
  return suppressExtensionErrors();
};
