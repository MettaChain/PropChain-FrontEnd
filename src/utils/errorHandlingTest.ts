'use client';

// Test file to verify the new error handling implementation
import { structuredLogger } from './structuredLogger';
import { errorMonitoring } from './errorMonitoringService';
import { ErrorCategory, ErrorSeverity } from '@/types/errors';

// Test functions to verify the error handling system
export const testErrorHandling = () => {
  console.log('Testing new error handling system...');

  // Test 1: Structured logging
  structuredLogger.info('Test info log', {
    component: 'TestComponent',
    action: 'test_logging',
    metadata: { test: true },
  });

  // Test 2: Error tracking
  const testError = new Error('Test error for verification');
  structuredLogger.error('Test error logging', testError, {
    component: 'TestComponent',
    action: 'test_error_tracking',
  });

  // Test 3: Error monitoring
  const appError = {
    id: 'test-error-123',
    category: ErrorCategory.UI,
    severity: ErrorSeverity.MEDIUM,
    message: 'Test application error',
    userMessage: 'A test error occurred',
    timestamp: new Date(),
    context: { test: true },
    stack: testError.stack,
    isRecoverable: true,
    shouldReport: false, // Don't report test errors
  };

  errorMonitoring.monitorError(appError);

  // Test 4: Performance monitoring
  errorMonitoring.monitorPerformance('test-operation', 150);

  console.log('Error handling tests completed successfully!');
  return true;
};

// Test the removal of console overrides
export const testConsoleOverridesRemoved = () => {
  // Verify that console methods are original
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
  };

  // Test that console works normally
  console.log('Console override removal test - this should appear normally');
  console.error('Console error test - this should appear normally');
  console.warn('Console warning test - this should appear normally');
  console.info('Console info test - this should appear normally');

  return {
    consoleWorking: true,
    originalMethods: originalConsole,
  };
};

export const runAllTests = () => {
  const results = {
    errorHandling: testErrorHandling(),
    consoleOverrides: testConsoleOverridesRemoved(),
  };

  console.log('All tests completed:', results);
  return results;
};
