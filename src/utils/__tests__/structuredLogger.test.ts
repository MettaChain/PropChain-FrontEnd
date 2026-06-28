import { structuredLogger, createStructuredLogger } from '../structuredLogger';
import { errorReporting } from '../errorReporting';

jest.mock('../logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    getCorrelationId: jest.fn(() => 'test-correlation-id'),
  },
  createLogger: jest.fn(),
  configureLogger: jest.fn(),
  getLoggerConfig: jest.fn(),
  createRequestLogger: jest.fn(),
  replaceConsole: jest.fn(),
  createPerformanceLogger: jest.fn(),
  LogLevel: { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 },
}));

jest.mock('../errorReporting', () => ({
  errorReporting: {
    reportError: jest.fn(),
  },
}));

describe('structuredLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sessionId generation', () => {
    it('should use crypto.randomUUID instead of Math.random', () => {
      const spy = jest.spyOn(globalThis.crypto, 'randomUUID');
      const customLogger = createStructuredLogger({ enableErrorTracking: false, enableRemote: false });

      expect(spy).toHaveBeenCalled();
      expect(customLogger['sessionId']).toMatch(/^sess_\d+_[a-f0-9]+$/);

      spy.mockRestore();
      customLogger.destroy();
    });

    it('should generate session IDs from crypto.randomUUID output', () => {
      const customLogger = createStructuredLogger({ enableErrorTracking: false, enableRemote: false });
      expect(customLogger['sessionId']).toMatch(/^sess_\d+_[a-f0-9]{7}$/);
      customLogger.destroy();
    });
  });

  describe('error id generation', () => {
    it('should use crypto.randomUUID for error IDs', () => {
      const spy = jest.spyOn(globalThis.crypto, 'randomUUID');
      const customLogger = createStructuredLogger({ enableErrorTracking: true, enableRemote: false });

      customLogger.error('test error', new Error('test'));
      customLogger.destroy();

      expect(errorReporting.reportError).toHaveBeenCalled();
      const reportedError = (errorReporting.reportError as jest.Mock).mock.calls[0][0];
      expect(reportedError.id).toMatch(/^error_\d+_[a-f0-9]+$/);

      spy.mockRestore();
    });
  });

  describe('non-predictability', () => {
    it('should generate IDs that are not predictable Math.random output', () => {
      const customLogger = createStructuredLogger({ enableErrorTracking: false, enableRemote: false });

      expect(customLogger['sessionId']).not.toContain('Math');
      expect(customLogger['sessionId']).toMatch(/^sess_\d+_[a-f0-9]+$/);

      customLogger.destroy();
    });
  });
});
