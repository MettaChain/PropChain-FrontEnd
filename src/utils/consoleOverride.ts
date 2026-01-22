'use client';

export const setupConsoleOverride = () => {
  if (typeof window === 'undefined') return;

  // Store original console methods
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;

  // Patterns to filter out
  const extensionErrorPatterns = [
    'chrome-extension://bfnaelmomeimhlpmgjnjophhpkkoljpa',
    'evmAsk.js',
    'evmask.js',
    'selectExtension',
    'Unexpected error',
    'chrome-extension://',
  ];

  const shouldFilterMessage = (...args: any[]): boolean => {
    const message = args.join(' ').toLowerCase();
    return extensionErrorPatterns.some(pattern => 
      message.includes(pattern.toLowerCase())
    );
  };

  // Override console.error
  console.error = (...args: any[]) => {
    if (shouldFilterMessage(...args)) {
      // Silently filter out extension errors
      return;
    }
    originalConsoleError.apply(console, args);
  };

  // Override console.warn
  console.warn = (...args: any[]) => {
    if (shouldFilterMessage(...args)) {
      // Silently filter out extension warnings
      return;
    }
    originalConsoleWarn.apply(console, args);
  };

  // Override console.log for extension-related logs
  console.log = (...args: any[]) => {
    if (shouldFilterMessage(...args)) {
      // Silently filter out extension logs
      return;
    }
    originalConsoleLog.apply(console, args);
  };

  // Add global error handlers
  const handleGlobalError = (event: ErrorEvent) => {
    if (shouldFilterMessage(event.error, event.filename, event.message)) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    if (shouldFilterMessage(event.reason)) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  };

  // Remove existing listeners to avoid duplicates
  window.removeEventListener('error', handleGlobalError);
  window.removeEventListener('unhandledrejection', handleUnhandledRejection);

  // Add new listeners
  window.addEventListener('error', handleGlobalError, true);
  window.addEventListener('unhandledrejection', handleUnhandledRejection, true);

  // Override window.onerror
  const originalOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (shouldFilterMessage(message, source, error)) {
      return true; // Prevent default error handling
    }
    if (originalOnError) {
      return originalOnError.call(window, message, source, lineno, colno, error);
    }
    return false;
  };

  // Override window.onunhandledrejection
  const originalOnUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = (event) => {
    if (shouldFilterMessage(event.reason)) {
      event.preventDefault();
      return true;
    }
    if (originalOnUnhandledRejection) {
      return originalOnUnhandledRejection.call(window, event);
    }
    return false;
  };

  return () => {
    // Cleanup function to restore original console
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
    window.removeEventListener('error', handleGlobalError);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    window.onerror = originalOnError;
    window.onunhandledrejection = originalOnUnhandledRejection;
  };
};

// Additional aggressive error suppression for specific extensions
export const suppressExtensionErrors = () => {
  if (typeof window === 'undefined') return;

  // Suppress errors from specific extension IDs
  const suppressExtensionId = 'bfnaelmomeimhlpmgjnjophhpkkoljpa';
  
  // Override fetch to suppress extension-related network errors
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      return await originalFetch.apply(window, args);
    } catch (error: any) {
      if (error?.toString().includes(suppressExtensionId)) {
        return new Response('{}', { status: 200, statusText: 'OK' });
      }
      throw error;
    }
  };

  // Suppress WebSocket errors from extensions
  const originalWebSocket = window.WebSocket;
  window.WebSocket = function(url: string, protocols?: string | string[]) {
    if (url.includes(suppressExtensionId)) {
      // Return a dummy WebSocket that does nothing
      return {
        close: () => {},
        send: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        readyState: 3, // CLOSED
      } as any;
    }
    return new originalWebSocket(url, protocols);
  } as any;

  // Copy static properties
  Object.setPrototypeOf(window.WebSocket, originalWebSocket);
  Object.defineProperty(window.WebSocket, 'CONNECTING', { value: 0 });
  Object.defineProperty(window.WebSocket, 'OPEN', { value: 1 });
  Object.defineProperty(window.WebSocket, 'CLOSING', { value: 2 });
  Object.defineProperty(window.WebSocket, 'CLOSED', { value: 3 });
};
