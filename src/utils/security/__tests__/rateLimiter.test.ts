import { RateLimiter, RateLimiters } from '../rateLimiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;
  const config = {
    maxAttempts: 3,
    windowMs: 60000, // 1 minute
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  };

  beforeEach(() => {
    limiter = new RateLimiter(config);
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(limiter).toBeInstanceOf(RateLimiter);
    });
  });

  describe('getInstance', () => {
    it('should return the same instance for the same key', () => {
      const instance1 = RateLimiter.getInstance('test', config);
      const instance2 = RateLimiter.getInstance('test', config);
      expect(instance1).toBe(instance2);
    });

    it('should return different instances for different keys', () => {
      const instance1 = RateLimiter.getInstance('test1', config);
      const instance2 = RateLimiter.getInstance('test2', config);
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('check', () => {
    it('should allow requests within limit', () => {
      const result1 = limiter.check('user1');
      const result2 = limiter.check('user1');
      const result3 = limiter.check('user1');

      expect(result1.allowed).toBe(true);
      expect(result1.remainingAttempts).toBe(2);
      expect(result2.allowed).toBe(true);
      expect(result2.remainingAttempts).toBe(1);
      expect(result3.allowed).toBe(true);
      expect(result3.remainingAttempts).toBe(0);
    });

    it('should block requests over limit', () => {
      // Use up all attempts
      limiter.check('user1');
      limiter.check('user1');
      limiter.check('user1');

      const result = limiter.check('user1');
      expect(result.allowed).toBe(false);
      expect(result.remainingAttempts).toBe(0);
      expect(result.retryAfter).toBeDefined();
    });

    it('should reset after window expires', () => {
      // Use up attempts
      limiter.check('user1');
      limiter.check('user1');
      limiter.check('user1');

      // Verify blocked
      expect(limiter.check('user1').allowed).toBe(false);

      // Simulate time passing (mock Date.now)
      const originalNow = Date.now;
      const futureTime = Date.now() + config.windowMs + 1000;
      global.Date.now = jest.fn(() => futureTime);

      // Should allow again
      const result = limiter.check('user1');
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(2);

      // Restore Date.now
      global.Date.now = originalNow;
    });

    it('should handle different identifiers separately', () => {
      limiter.check('user1');
      limiter.check('user1');
      limiter.check('user1');

      const result1 = limiter.check('user1');
      const result2 = limiter.check('user2');

      expect(result1.allowed).toBe(false);
      expect(result2.allowed).toBe(true);
    });

    it('should calculate reset time correctly', () => {
      const beforeTime = Date.now();
      const result = limiter.check('user1');
      const afterTime = Date.now();

      expect(result.resetTime).toBeGreaterThanOrEqual(beforeTime + config.windowMs);
      expect(result.resetTime).toBeLessThanOrEqual(afterTime + config.windowMs);
    });
  });

  describe('reset', () => {
    it('should reset rate limit for specific identifier', () => {
      limiter.check('user1');
      limiter.check('user1');
      limiter.check('user1');

      expect(limiter.check('user1').allowed).toBe(false);

      limiter.reset('user1');

      const result = limiter.check('user1');
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(2);
    });

    it('should not affect other identifiers', () => {
      limiter.check('user1');
      limiter.check('user1');
      limiter.check('user1');
      limiter.check('user2');

      limiter.reset('user1');

      expect(limiter.check('user1').allowed).toBe(true);
      expect(limiter.check('user2').allowed).toBe(true);
      expect(limiter.check('user2').remainingAttempts).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all rate limit data', () => {
      limiter.check('user1');
      limiter.check('user2');

      limiter.clear();

      const result1 = limiter.check('user1');
      const result2 = limiter.check('user2');

      expect(result1.allowed).toBe(true);
      expect(result1.remainingAttempts).toBe(2);
      expect(result2.allowed).toBe(true);
      expect(result2.remainingAttempts).toBe(2);
    });
  });

  describe('getStatus', () => {
    it('should return null for non-existent identifier', () => {
      const status = limiter.getStatus('nonexistent');
      expect(status).toBeNull();
    });

    it('should return correct status for active limit', () => {
      limiter.check('user1');
      limiter.check('user1');

      const status = limiter.getStatus('user1');
      expect(status).not.toBeNull();
      expect(status!.count).toBe(2);
      expect(status!.remainingAttempts).toBe(1);
      expect(status!.isLimited).toBe(false);
    });

    it('should return correct status when limit exceeded', () => {
      limiter.check('user1');
      limiter.check('user1');
      limiter.check('user1');

      const status = limiter.getStatus('user1');
      expect(status).not.toBeNull();
      expect(status!.count).toBe(3);
      expect(status!.remainingAttempts).toBe(0);
      expect(status!.isLimited).toBe(true);
    });

    it('should return null for expired entries', () => {
      limiter.check('user1');

      // Mock time to be after expiry
      const originalNow = Date.now;
      const futureTime = Date.now() + config.windowMs + 1000;
      global.Date.now = jest.fn(() => futureTime);

      const status = limiter.getStatus('user1');
      expect(status).toBeNull();

      global.Date.now = originalNow;
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', () => {
      limiter.check('user1');

      // Mock time to be after expiry
      const originalNow = Date.now;
      const futureTime = Date.now() + config.windowMs + 1000;
      global.Date.now = jest.fn(() => futureTime);

      limiter.cleanup();

      const status = limiter.getStatus('user1');
      expect(status).toBeNull();

      global.Date.now = originalNow;
    });

    it('should keep active entries', () => {
      limiter.check('user1');
      limiter.check('user2');

      limiter.cleanup();

      expect(limiter.getStatus('user1')).not.toBeNull();
      expect(limiter.getStatus('user2')).not.toBeNull();
    });
  });

  describe('pre-configured rate limiters', () => {
    it('should have correct WALLET_CONNECTION config', () => {
      expect(RateLimiters.WALLET_CONNECTION.maxAttempts).toBe(5);
      expect(RateLimiters.WALLET_CONNECTION.windowMs).toBe(5 * 60 * 1000);
    });

    it('should have correct TRANSACTION_SIGNING config', () => {
      expect(RateLimiters.TRANSACTION_SIGNING.maxAttempts).toBe(10);
      expect(RateLimiters.TRANSACTION_SIGNING.windowMs).toBe(1 * 60 * 1000);
    });

    it('should have correct SIGNATURE_REQUESTS config', () => {
      expect(RateLimiters.SIGNATURE_REQUESTS.maxAttempts).toBe(3);
      expect(RateLimiters.SIGNATURE_REQUESTS.windowMs).toBe(1 * 60 * 1000);
    });

    it('should have correct ACCOUNT_SWITCHING config', () => {
      expect(RateLimiters.ACCOUNT_SWITCHING.maxAttempts).toBe(3);
      expect(RateLimiters.ACCOUNT_SWITCHING.windowMs).toBe(2 * 60 * 1000);
    });

    it('should have correct NETWORK_SWITCHING config', () => {
      expect(RateLimiters.NETWORK_SWITCHING.maxAttempts).toBe(5);
      expect(RateLimiters.NETWORK_SWITCHING.windowMs).toBe(3 * 60 * 1000);
    });
  });

  describe('useRateLimiter hook', () => {
    it('should provide rate limiting functions', () => {
      const { useRateLimiter } = require('../rateLimiter');
      const { checkLimit, resetLimit, getLimitStatus } = useRateLimiter(config);

      expect(typeof checkLimit).toBe('function');
      expect(typeof resetLimit).toBe('function');
      expect(typeof getLimitStatus).toBe('function');
    });

    it('should work with the hook functions', () => {
      const { useRateLimiter } = require('../rateLimiter');
      const { checkLimit, resetLimit, getLimitStatus } = useRateLimiter(config);

      const result = checkLimit('test');
      expect(result.allowed).toBe(true);

      resetLimit('test');
      const status = getLimitStatus('test');
      expect(status).toBeNull(); // Should be null after reset
    });
  });

  describe('edge cases', () => {
    it('should handle zero maxAttempts', () => {
      const zeroLimiter = new RateLimiter({ ...config, maxAttempts: 0 });
      const result = zeroLimiter.check('user1');
      expect(result.allowed).toBe(false);
      expect(result.remainingAttempts).toBe(0);
    });

    it('should handle very short window', () => {
      const shortLimiter = new RateLimiter({ ...config, windowMs: 1 });
      const result1 = shortLimiter.check('user1');
      expect(result1.allowed).toBe(true);

      // Mock minimal time passage
      const originalNow = Date.now;
      global.Date.now = jest.fn(() => Date.now() + 2);

      const result2 = shortLimiter.check('user1');
      expect(result2.allowed).toBe(true); // Should reset due to time passage

      global.Date.now = originalNow;
    });

    it('should handle concurrent requests correctly', () => {
      // Simulate concurrent requests
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(limiter.check('user1'));
      }

      const allowedCount = results.filter(r => r.allowed).length;
      const blockedCount = results.filter(r => !r.allowed).length;

      expect(allowedCount).toBe(3);
      expect(blockedCount).toBe(2);
    });
  });
});