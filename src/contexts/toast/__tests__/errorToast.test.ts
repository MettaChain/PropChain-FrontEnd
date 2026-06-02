/**
 * Tests for error toast utility
 * Validates error handling integration with ADR-005
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */

import {
  getErrorIcon,
  isRetryableError,
  getErrorSeverity,
  extractSafeErrorDetails,
} from '../utils/errorToast';

// Mock the typeGuards utilities
jest.mock('@/utils/typeGuards', () => ({
  getErrorMessage: jest.fn((error: any, fallback: string) => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return fallback;
  }),
  getErrorCode: jest.fn((error: any) => {
    if (error?.code) {
      return error.code;
    }
    if (error instanceof Error && error.name) {
      return error.name.toUpperCase().replace(/ERROR$/i, '');
    }
    return null;
  }),
}));

describe('Error Toast Utility', () => {
  describe('getErrorIcon', () => {
    it('should return network icon for NETWORK_ERROR', () => {
      // Requirement 6.3: Handle NetworkError type
      expect(getErrorIcon('NETWORK_ERROR')).toBe('🌐');
    });

    it('should return validation icon for VALIDATION_ERROR', () => {
      // Requirement 6.3: Handle ValidationError type
      expect(getErrorIcon('VALIDATION_ERROR')).toBe('⚠️');
    });

    it('should return blockchain icon for BLOCKCHAIN_ERROR', () => {
      // Requirement 6.3: Handle BlockchainError type
      expect(getErrorIcon('BLOCKCHAIN_ERROR')).toBe('⛓️');
    });

    it('should return default error icon for unknown error types', () => {
      expect(getErrorIcon('UNKNOWN_ERROR')).toBe('❌');
      expect(getErrorIcon(null)).toBe('❌');
    });

    it('should have specific icons for common error codes', () => {
      expect(getErrorIcon('USER_REJECTED')).toBe('❌');
      expect(getErrorIcon('INSUFFICIENT_FUNDS')).toBe('💰');
      expect(getErrorIcon('TIMEOUT')).toBe('⏱️');
      expect(getErrorIcon('PERMISSION_DENIED')).toBe('🔒');
      expect(getErrorIcon('NOT_FOUND')).toBe('🔍');
    });
  });

  describe('isRetryableError', () => {
    it('should return true for NETWORK_ERROR', () => {
      // Requirement 6.3: Identify retryable errors
      expect(isRetryableError('NETWORK_ERROR')).toBe(true);
    });

    it('should return true for TIMEOUT', () => {
      expect(isRetryableError('TIMEOUT')).toBe(true);
    });

    it('should return true for INSUFFICIENT_FUNDS', () => {
      // User might retry after transaction completes
      expect(isRetryableError('INSUFFICIENT_FUNDS')).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      expect(isRetryableError('PERMISSION_DENIED')).toBe(false);
      expect(isRetryableError('VALIDATION_ERROR')).toBe(false);
      expect(isRetryableError('USER_REJECTED')).toBe(false);
    });

    it('should return false for null/unknown errors', () => {
      expect(isRetryableError(null)).toBe(false);
      expect(isRetryableError('UNKNOWN_ERROR')).toBe(false);
    });
  });

  describe('getErrorSeverity', () => {
    it('should return error for critical issues', () => {
      // Requirement 6.3: Categorize errors
      expect(getErrorSeverity('NETWORK_ERROR')).toBe('error');
      expect(getErrorSeverity('TIMEOUT')).toBe('error');
      expect(getErrorSeverity('BLOCKCHAIN_ERROR')).toBe('error');
    });

    it('should return warning for non-critical issues', () => {
      expect(getErrorSeverity('INSUFFICIENT_FUNDS')).toBe('warning');
      expect(getErrorSeverity('VALIDATION_ERROR')).toBe('warning');
    });

    it('should return error as default for unknown errors', () => {
      expect(getErrorSeverity(null)).toBe('error');
      expect(getErrorSeverity('UNKNOWN_ERROR')).toBe('error');
    });
  });

  describe('extractSafeErrorDetails', () => {
    it('should extract error code from error object', () => {
      const error = { code: 'NETWORK_ERROR', message: 'Network failed' };
      const details = extractSafeErrorDetails(error);

      expect(details.errorCode).toBe('NETWORK_ERROR');
    });

    it('should extract error name from Error instances', () => {
      const error = new TypeError('Type mismatch');
      const details = extractSafeErrorDetails(error);

      expect(details.errorName).toBe('TypeError');
    });

    it('should handle string errors', () => {
      // Requirement 6.2: Extract message without sensitive details
      const error = 'Simple error message';
      const details = extractSafeErrorDetails(error);

      expect(details.errorName).toBe('Simple error message');
    });

    it('should categorize errors by code', () => {
      const networkError = extractSafeErrorDetails({ code: 'NETWORK_ERROR' });
      expect(networkError.category).toBe('network');

      const validationError = extractSafeErrorDetails({ code: 'VALIDATION_ERROR' });
      expect(validationError.category).toBe('validation');

      const blockchainError = extractSafeErrorDetails({ code: 'BLOCKCHAIN_ERROR' });
      expect(blockchainError.category).toBe('blockchain');
    });

    it('should NOT include sensitive information (stack traces, internals)', () => {
      // Requirement 6.4, 6.5: Don't expose sensitive details
      const error = new Error('Stack trace with secrets');
      (error as any).stack = 'sensitive/path/to/code:123';
      (error as any).apiKey = 'secret_key_12345';

      const details = extractSafeErrorDetails(error);

      // Stack and apiKey should not be in safe details
      expect(JSON.stringify(details)).not.toContain('sensitive');
      expect(JSON.stringify(details)).not.toContain('apiKey');
    });

    it('should set category to unknown for unrecognized errors', () => {
      const error = { code: 'CUSTOM_UNKNOWN_ERROR' };
      const details = extractSafeErrorDetails(error);

      expect(details.category).toBe('unknown');
    });

    it('should handle null error code gracefully', () => {
      const error = { message: 'Error without code' };
      const details = extractSafeErrorDetails(error);

      expect(details.errorCode).toBeNull();
      expect(details.category).toBe('unknown');
    });
  });

  /**
   * Property: Error extraction preserves intent without exposing internals
   * Validates: Requirement 6.2, 6.5
   */
  describe('Property: Error message extraction preserves intent', () => {
    it('should extract user-friendly message from various error types', () => {
      const errors = [
        new Error('Network connection failed'),
        new TypeError('Cannot read properties'),
        { code: 'VALIDATION_ERROR', message: 'Field is required' },
        'Simple string error',
      ];

      errors.forEach((error) => {
        const details = extractSafeErrorDetails(error);

        // Should have either errorCode, errorName, or both
        const hasIdentifier = details.errorCode || details.errorName;
        expect(hasIdentifier).toBeTruthy();

        // Should have a valid category
        expect(['network', 'validation', 'blockchain', 'permission', 'timeout', 'unknown']).toContain(
          details.category
        );
      });
    });

    it('should NOT expose stack traces or system internals', () => {
      const errors = [
        new Error('Access Denied'),
        { code: 'PERMISSION_DENIED', stack: 'sensitive/stack/trace' },
      ];

      errors.forEach((error) => {
        const details = extractSafeErrorDetails(error);
        const safeString = JSON.stringify(details);

        // Should not contain system paths or stack traces
        expect(safeString).not.toMatch(/\//);
        expect(safeString).not.toMatch(/stack/);
      });
    });
  });

  /**
   * Property: Error categorization is consistent
   * Validates: Requirement 6.3
   */
  describe('Property: Error categorization is consistent', () => {
    it('should always return same category for same error code', () => {
      const errorCode = 'NETWORK_ERROR';

      const category1 = extractSafeErrorDetails({ code: errorCode }).category;
      const category2 = extractSafeErrorDetails({ code: errorCode }).category;

      expect(category1).toBe(category2);
    });

    it('should map error codes to consistent severity levels', () => {
      const criticalCodes = ['NETWORK_ERROR', 'TIMEOUT', 'BLOCKCHAIN_ERROR'];
      const warningCodes = ['INSUFFICIENT_FUNDS', 'VALIDATION_ERROR'];

      criticalCodes.forEach((code) => {
        expect(getErrorSeverity(code)).toBe('error');
      });

      warningCodes.forEach((code) => {
        expect(getErrorSeverity(code)).toBe('warning');
      });
    });
  });
});
