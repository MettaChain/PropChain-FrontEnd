const stringifyArgs = (args: readonly unknown[]): string =>
  args.map((arg) => (typeof arg === 'string' ? arg : String(arg))).join(' ');

// This file should be imported as early as possible in the application
// It immediately starts suppressing extension errors

if (typeof window !== 'undefined') {
  // Immediate error suppression before React loads
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  const suppressPatterns = [
    'bfnaelmomeimhlpmgjnjophhpkkoljpa',
    'evmAsk.js',
    'selectExtension',
    'chrome-extension://bfnaelmomeimhlpmgjnjophhpkkoljpa',
  ];
  
  const shouldSuppress = (...args: unknown[]): boolean => {
    const message = stringifyArgs(args).toLowerCase();
    return suppressPatterns.some(pattern => message.includes(pattern.toLowerCase()));
  };
  
  // Override console methods immediately
  console.error = (...args: unknown[]) => {
    if (shouldSuppress(...args)) return;
    originalConsoleError.apply(console, args);
  };
  
  console.warn = (...args: unknown[]) => {
    if (shouldSuppress(...args)) return;
    originalConsoleWarn.apply(console, args);
  };
  
  // Suppress global errors
  window.addEventListener('error', (event) => {
    if (shouldSuppress(event.error, event.filename, event.message)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
  
  // Suppress unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (shouldSuppress(event.reason)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
  
  // Override window.onerror
  const originalOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (shouldSuppress(message, source, error)) {
      return true; // Suppress the error
    }
    if (originalOnError) {
      return originalOnError.call(window, message, source, lineno, colno, error);
    }
    return false;
  };
}

export const initializeEarlyErrorSuppression = () => {
  // This function can be called to ensure suppression is active
  // Note: Early error suppression is already active from module load
};
