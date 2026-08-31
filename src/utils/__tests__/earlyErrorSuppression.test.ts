/**
 * @jest-environment jsdom
 */
import { cleanupEarlyErrorSuppression } from '../earlyErrorSuppression';

describe('earlyErrorSuppression', () => {
  let originalConsoleError: any;
  let originalConsoleWarn: any;
  let originalWindowOnError: any;

  beforeEach(() => {
    // Keep references to Jest's original console/window properties
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;
    originalWindowOnError = window.onerror;
  });

  afterEach(() => {
    // Clean up and restore module registry and globals
    jest.resetModules();
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    window.onerror = originalWindowOnError;
  });

  it('should suppress specified error patterns and delegate to original after cleanup', () => {
    jest.resetModules();
    
    // Set up spies on the original console methods before loading earlyErrorSuppression
    const consoleErrorSpy = jest.fn();
    const consoleWarnSpy = jest.fn();
    console.error = consoleErrorSpy;
    console.warn = consoleWarnSpy;

    // Load/import the module to trigger overrides
    const { cleanupEarlyErrorSuppression } = require('../earlyErrorSuppression');

    // Verify console methods are overridden
    expect(console.error).not.toBe(consoleErrorSpy);
    expect(console.warn).not.toBe(consoleWarnSpy);

    // Call console.error with a suppression pattern
    console.error('some error containing evmAsk.js is here');
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    // Call console.error with a non-suppressed pattern
    console.error('some normal error');
    expect(consoleErrorSpy).toHaveBeenCalledWith('some normal error');

    // Call console.warn with a suppression pattern
    console.warn('warning with selectExtension pattern');
    expect(consoleWarnSpy).not.toHaveBeenCalled();

    // Call console.warn with a non-suppressed pattern
    console.warn('normal warning');
    expect(consoleWarnSpy).toHaveBeenCalledWith('normal warning');

    // Run cleanup
    cleanupEarlyErrorSuppression();

    // Assert that console methods delegate to original after cleanup
    expect(console.error).toBe(consoleErrorSpy);
    expect(console.warn).toBe(consoleWarnSpy);
  });

  it('should remove window event listeners and window.onerror on cleanup', () => {
    jest.resetModules();

    const addSpy = jest.spyOn(window, 'addEventListener');
    const removeSpy = jest.spyOn(window, 'removeEventListener');

    const { cleanupEarlyErrorSuppression } = require('../earlyErrorSuppression');

    // Verify event listeners were registered
    expect(addSpy).toHaveBeenCalledWith('error', expect.any(Function), true);
    expect(addSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));

    cleanupEarlyErrorSuppression();

    // Verify event listeners were removed
    expect(removeSpy).toHaveBeenCalledWith('error', expect.any(Function), true);
    expect(removeSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));

    // Verify window.onerror is restored
    expect(window.onerror).toBe(originalWindowOnError);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
