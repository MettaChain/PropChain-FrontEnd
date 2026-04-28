export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetTime: number;
  retryAfter?: number;
}

export class RateLimiter {
  private static instances = new Map<string, RateLimiter>();
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Get or create a rate limiter instance for a specific key
   */
  static getInstance(key: string, config: RateLimitConfig): RateLimiter {
    if (!this.instances.has(key)) {
      this.instances.set(key, new RateLimiter(config));
    }
    return this.instances.get(key)!;
  }

  /**
   * Check if an action is allowed based on rate limiting
   */
  check(identifier: string): RateLimitResult {
    const now = Date.now();
    const key = `${identifier}`;
    const current = this.attempts.get(key);

    if (!current || now > current.resetTime) {
      // Reset or create new entry
      this.attempts.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs
      });

      return {
        allowed: true,
        remainingAttempts: this.config.maxAttempts - 1,
        resetTime: now + this.config.windowMs
      };
    }

    // Check if limit exceeded
    if (current.count >= this.config.maxAttempts) {
      const retryAfter = Math.ceil((current.resetTime - now) / 1000);
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: current.resetTime,
        retryAfter
      };
    }

    // Increment counter
    current.count++;
    this.attempts.set(key, current);

    return {
      allowed: true,
      remainingAttempts: this.config.maxAttempts - current.count,
      resetTime: current.resetTime
    };
  }

  /**
   * Reset rate limit for a specific identifier
   */
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Clear all rate limit data
   */
  clear(): void {
    this.attempts.clear();
  }

  /**
   * Get current status for an identifier
   */
  getStatus(identifier: string): {
    count: number;
    remainingAttempts: number;
    resetTime: number;
    isLimited: boolean;
  } | null {
    const current = this.attempts.get(identifier);
    if (!current) return null;

    const now = Date.now();
    const isExpired = now > current.resetTime;
    
    if (isExpired) {
      this.attempts.delete(identifier);
      return null;
    }

    return {
      count: current.count,
      remainingAttempts: Math.max(0, this.config.maxAttempts - current.count),
      resetTime: current.resetTime,
      isLimited: current.count >= this.config.maxAttempts
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.attempts.entries()) {
      if (now > value.resetTime) {
        this.attempts.delete(key);
      }
    }
  }
}

// Pre-configured rate limiters for common operations
export const RateLimiters = {
  WALLET_CONNECTION: {
    maxAttempts: 5,
    windowMs: 5 * 60 * 1000, // 5 minutes
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  } as RateLimitConfig,
  
  TRANSACTION_SIGNING: {
    maxAttempts: 10,
    windowMs: 1 * 60 * 1000, // 1 minute
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  } as RateLimitConfig,
  
  SIGNATURE_REQUESTS: {
    maxAttempts: 3,
    windowMs: 1 * 60 * 1000, // 1 minute
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  } as RateLimitConfig,
  
  ACCOUNT_SWITCHING: {
    maxAttempts: 3,
    windowMs: 2 * 60 * 1000, // 2 minutes
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  } as RateLimitConfig,
  
  NETWORK_SWITCHING: {
    maxAttempts: 5,
    windowMs: 3 * 60 * 1000, // 3 minutes
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  } as RateLimitConfig
};

/**
 * Hook for using rate limiting in React components
 */
export const useRateLimiter = (config: RateLimitConfig) => {
  const limiter = new RateLimiter(config);
  
  const checkLimit = (identifier: string): RateLimitResult => {
    return limiter.check(identifier);
  };

  const resetLimit = (identifier: string): void => {
    limiter.reset(identifier);
  };

  const getLimitStatus = (identifier: string) => {
    return limiter.getStatus(identifier);
  };

  return {
    checkLimit,
    resetLimit,
    getLimitStatus
  };
};
