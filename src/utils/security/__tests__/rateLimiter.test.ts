import { RateLimiter, RateLimiters } from '../rateLimiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;
  const config = {
    maxAttempts: 3,
    windowMs: 60000,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  };

  beforeEach(() => {
    limiter = new RateLimiter(config);
  });

  describe('getInstance', () => {
    it('returns same instance for same name', () => {
      const a = RateLimiter.getInstance('same-key', config);
      const b = RateLimiter.getInstance('same-key', config);
      expect(a).toBe(b);
    });
  });

  describe('check', () => {
    it('allows when under limit', () => {
      const result = limiter.check('user1');
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(2);
    });

    it('denies when over limit', () => {
      limiter.check('user1');
      limiter.check('user1');
      limiter.check('user1');

      const result = limiter.check('user1');
      expect(result.allowed).toBe(false);
    });

    it('remainingAttempts decreases correctly', () => {
      const r1 = limiter.check('u');
      expect(r1.remainingAttempts).toBe(2);

      const r2 = limiter.check('u');
      expect(r2.remainingAttempts).toBe(1);

      const r3 = limiter.check('u');
      expect(r3.remainingAttempts).toBe(0);
    });

    it('retryAfter is set when denied', () => {
      limiter.check('u');
      limiter.check('u');
      limiter.check('u');

      const result = limiter.check('u');
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
    });
  });

  describe('cleanup', () => {
    it('removes expired entries', () => {
      limiter.check('user1');

      const originalNow = Date.now;
      const futureTime = Date.now() + config.windowMs + 1000;
      global.Date.now = jest.fn(() => futureTime);

      limiter.cleanup();

      const status = limiter.getStatus('user1');
      expect(status).toBeNull();

      global.Date.now = originalNow;
    });
  });

  describe('different configs', () => {
    it('different configs have different limits', () => {
      const shortLimiter = new RateLimiter({ maxAttempts: 1, windowMs: 60000 });
      const longLimiter = new RateLimiter({ maxAttempts: 10, windowMs: 60000 });

      shortLimiter.check('u');
      expect(shortLimiter.check('u').allowed).toBe(false);

      for (let i = 0; i < 9; i++) longLimiter.check('u');
      expect(longLimiter.check('u').allowed).toBe(true);
    });
  });
});
