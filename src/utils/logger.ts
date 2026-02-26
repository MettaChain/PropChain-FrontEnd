'use client';

import { getErrorMessage } from './typeGuards';

// ============================================================================
// Log Levels
// ============================================================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

// ============================================================================
// Environment Configuration
// ============================================================================

type Environment = 'development' | 'production' | 'test';

const getEnvironment = (): Environment => {
  if (typeof window === 'undefined') {
    // Server-side: check NODE_ENV
    return (process.env.NODE_ENV as Environment) || 'development';
  }
  // Client-side: check Next.js environment
  return (process.env.NODE_ENV as Environment) || 'development';
};

// ============================================================================
// Sensitive Data Patterns
// ============================================================================

const SENSITIVE_PATTERNS = [
  // Private keys and secrets
  /private[_-]?key/gi,
  /secret[_-]?key/gi,
  /api[_-]?key/gi,
  /access[_-]?token/gi,
  /refresh[_-]?token/gi,
  /bearer/gi,
  /authorization/gi,
  /auth[_-]?token/gi,
  // Passwords
  /password/gi,
  /passwd/gi,
  /pwd/gi,
  // Wallet/Blockchain
  /0x[a-fA-F0-9]{64}/g, // Private keys
  /mnemonic/gi,
  /seed[_-]?phrase/gi,
  // Personal data
  /ssn/gi,
  /social[_-]?security/gi,
  /credit[_-]?card/gi,
  /cvv/gi,
  // Session data
  /session[_-]?id/gi,
  /cookie/gi,
  // Generic sensitive patterns
  /"password"\s*:/gi,
  /'password'\s*:/gi,
  /"token"\s*:/gi,
  /'token'\s*:/gi,
  /"secret"\s*:/gi,
  /'secret'\s*:/gi,
];

const SENSITIVE_KEYS = new Set([
  'password',
  'passwd',
  'pwd',
  'secret',
  'apiKey',
  'api_key',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'privateKey',
  'private_key',
  'mnemonic',
  'seedPhrase',
  'seed_phrase',
  'token',
  'authorization',
  'auth',
  'sessionId',
  'session_id',
  'cookie',
  'ssn',
  'creditCard',
  'credit_card',
]);

// ============================================================================
// Configuration
// ============================================================================

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteUrl?: string;
  minify: boolean;
  includeTimestamp: boolean;
  includeCorrelationId: boolean;
  includeStackTrace: boolean;
  environment: Environment;
}

const getDefaultConfig = (): LoggerConfig => {
  const env = getEnvironment();
  const isDev = env === 'development';

  return {
    level: isDev ? LogLevel.DEBUG : LogLevel.INFO,
    enableConsole: true,
    enableRemote: false, // Can be enabled for log aggregation services
    remoteUrl: undefined,
    minify: !isDev,
    includeTimestamp: true,
    includeCorrelationId: true,
    includeStackTrace: !isDev,
    environment: env,
  };
};

let globalConfig = getDefaultConfig();

// ============================================================================
// Correlation ID Management
// ============================================================================

const generateCorrelationId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `corr-${timestamp}-${randomPart}`;
};

class CorrelationIdManager {
  private static instance: CorrelationIdManager;
  private correlationId: string = generateCorrelationId();
  private correlationStack: string[] = [];

  private constructor() {}

  static getInstance(): CorrelationIdManager {
    if (!CorrelationIdManager.instance) {
      CorrelationIdManager.instance = new CorrelationIdManager();
    }
    return CorrelationIdManager.instance;
  }

  getId(): string {
    return this.correlationId;
  }

  setId(id: string): void {
    this.correlationStack.push(this.correlationId);
    this.correlationId = id;
  }

  reset(): void {
    this.correlationId = generateCorrelationId();
  }

  createChild(): string {
    const parentId = this.correlationId;
    const childId = `${parentId}-${Math.random().toString(36).substring(2, 8)}`;
    return childId;
  }

  // For async operations - returns a new correlation ID
  fork(): string {
    return generateCorrelationId();
  }
}

// ============================================================================
// Sensitive Data Filtering
// ============================================================================

const redactValue = (value: unknown): unknown => {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    let redacted = value;
    for (const pattern of SENSITIVE_PATTERNS) {
      redacted = redacted.replace(pattern, '[REDACTED]');
    }
    // Check for hex strings that look like private keys
    redacted = redacted.replace(/0x[a-fA-F0-9]{64}/g, '0x[REDACTED_PRIVATE_KEY]');
    return redacted;
  }

  if (Array.isArray(value)) {
    return value.map(redactValue);
  }

  if (typeof value === 'object') {
    const redacted: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactValue(val);
      }
    }
    return redacted;
  }

  return value;
};

const filterSensitiveData = (args: unknown[]): unknown[] => {
  return args.map(arg => redactValue(arg));
};

// ============================================================================
// Log Entry Structure
// ============================================================================

export interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  correlationId?: string;
  data?: unknown;
  stack?: string;
  source?: string;
}

// ============================================================================
// Logger Class
// ============================================================================

class Logger {
  private config: LoggerConfig;
  private correlationManager: CorrelationIdManager;
  private localLevel: LogLevel | null = null;

  constructor(source?: string) {
    this.config = { ...globalConfig };
    this.correlationManager = CorrelationIdManager.getInstance();
    this.source = source;
  }

  private source?: string;

  private shouldLog(level: LogLevel): boolean {
    const effectiveLevel = this.localLevel ?? this.config.level;
    return level >= effectiveLevel;
  }

  private formatMessage(level: string, message: string, data?: unknown): string {
    const parts: string[] = [];
    
    if (this.config.includeTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }
    
    parts.push(`[${level.toUpperCase()}]`);
    
    if (this.config.includeCorrelationId) {
      parts.push(`[${this.correlationManager.getId()}]`);
    }
    
    if (this.source) {
      parts.push(`[${this.source}]`);
    }
    
    parts.push(message);
    
    return parts.join(' ');
  }

  private formatData(data: unknown): unknown {
    // Always filter sensitive data
    const filtered = filterSensitiveData([data])[0];
    
    // In production, minify the output
    if (this.config.minify && typeof filtered === 'object') {
      return filtered;
    }
    
    return filtered;
  }

  private getStackTrace(): string | undefined {
    if (!this.config.includeStackTrace) {
      return undefined;
    }
    
    try {
      throw new Error('Stack trace');
    } catch (e) {
      const stack = (e as Error).stack;
      if (stack) {
        // Remove the first few lines (our error throw and this function)
        const lines = stack.split('\n').slice(3).join('\n');
        return lines;
      }
      return undefined;
    }
  }

  private createLogEntry(level: string, message: string, data?: unknown): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
    };

    if (this.config.includeCorrelationId) {
      entry.correlationId = this.correlationManager.getId();
    }

    if (data !== undefined) {
      entry.data = this.formatData(data);
    }

    const stack = this.getStackTrace();
    if (stack) {
      entry.stack = stack;
    }

    if (this.source) {
      entry.source = this.source;
    }

    return entry;
  }

  private log(level: LogLevel, levelName: string, message: string, ...args: unknown[]): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const data = args.length > 0 ? args : undefined;
    const entry = this.createLogEntry(levelName, message, data);

    if (this.config.enableConsole) {
      const formattedMessage = this.formatMessage(levelName, message, data);
      
      switch (level) {
        case LogLevel.DEBUG:
          if (globalConfig.environment === 'development') {
            console.debug(formattedMessage, entry.data ?? '');
          }
          break;
        case LogLevel.INFO:
          console.info(formattedMessage, entry.data ?? '');
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage, entry.data ?? '');
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage, entry.data ?? '');
          break;
      }
    }

    if (this.config.enableRemote && this.config.remoteUrl) {
      this.sendToRemote(entry);
    }
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    try {
      await fetch(this.config.remoteUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
        keepalive: true,
      });
    } catch {
      // Silently fail for remote logging
    }
  }

  // Public API
  debug(message: string, ...args: unknown[]): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, 'INFO', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log(LogLevel.WARN, 'WARN', message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.log(LogLevel.ERROR, 'ERROR', message, ...args);
  }

  // Log error with stack trace
  errorWithStack(message: string, error: unknown, context?: unknown): void {
    const errorMessage = getErrorMessage(error, 'Unknown error');
    const stack = error instanceof Error ? error.stack : this.getStackTrace();
    
    this.log(
      LogLevel.ERROR,
      'ERROR',
      message,
      { error: errorMessage, stack, context }
    );
  }

  // Child logger with source
  child(source: string): Logger {
    const childLogger = new Logger(source);
    childLogger.setConfig(this.config);
    return childLogger;
  }

  // Set local level override
  setLevel(level: LogLevel): void {
    this.localLevel = level;
  }

  // Set local configuration
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Get correlation ID
  getCorrelationId(): string {
    return this.correlationManager.getId();
  }

  // Create a child correlation ID
  forkCorrelationId(): string {
    return this.correlationManager.fork();
  }

  // Set a specific correlation ID
  setCorrelationId(id: string): void {
    this.correlationManager.setId(id);
  }

  // Reset to new correlation ID
  resetCorrelationId(): void {
    this.correlationManager.reset();
  }
}

// ============================================================================
// Logger Factory
// ============================================================================

const loggers = new Map<string, Logger>();

export const createLogger = (source?: string): Logger => {
  const key = source || 'default';
  
  if (!loggers.has(key)) {
    loggers.set(key, new Logger(source));
  }
  
  return loggers.get(key)!;
};

// Default logger instance
export const logger = createLogger();

// ============================================================================
// Global Configuration
// ============================================================================

export const configureLogger = (config: Partial<LoggerConfig>): void => {
  globalConfig = { ...globalConfig, ...config };
};

export const getLoggerConfig = (): LoggerConfig => {
  return { ...globalConfig };
};

// ============================================================================
// Request Tracking Helper
// ============================================================================

export const createRequestLogger = (source: string): Logger => {
  const requestLogger = createLogger(source);
  
  // Fork correlation ID for this request
  const correlationId = requestLogger.forkCorrelationId();
  
  return requestLogger.child(`${source}-${correlationId}`);
};

// ============================================================================
// Console Replacement
// ============================================================================

export const replaceConsole = (): (() => void) => {
  const originalConsole = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
    log: console.log,
  };

  const replacement = (level: LogLevel, ...args: unknown[]) => {
    const message = args
      .map(arg => {
        if (typeof arg === 'string') return arg;
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      })
      .join(' ');

    switch (level) {
      case LogLevel.DEBUG:
        logger.debug(message);
        break;
      case LogLevel.INFO:
        logger.info(message);
        break;
      case LogLevel.WARN:
        logger.warn(message);
        break;
      case LogLevel.ERROR:
        logger.error(message);
        break;
    }
  };

  console.debug = (...args: unknown[]) => replacement(LogLevel.DEBUG, ...args);
  console.info = (...args: unknown[]) => replacement(LogLevel.INFO, ...args);
  console.warn = (...args: unknown[]) => replacement(LogLevel.WARN, ...args);
  console.error = (...args: unknown[]) => replacement(LogLevel.ERROR, ...args);
  console.log = (...args: unknown[]) => replacement(LogLevel.INFO, ...args);

  return () => {
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.log = originalConsole.log;
  };
};

// ============================================================================
// Performance Monitoring
// ============================================================================

export const createPerformanceLogger = () => {
  const startTimes = new Map<string, number>();

  return {
    startTimer(label: string): void {
      startTimes.set(label, performance.now());
    },

    endTimer(label: string, thresholdMs: number = 16): void {
      const startTime = startTimes.get(label);
      if (startTime === undefined) {
        logger.warn(`Timer '${label}' was not started`);
        return;
      }

      const duration = performance.now() - startTime;
      startTimes.delete(label);

      if (duration > thresholdMs) {
        logger.warn(`Slow operation detected: ${label} took ${duration.toFixed(2)}ms`);
      } else {
        logger.debug(`Operation ${label} completed in ${duration.toFixed(2)}ms`);
      }
    },
  };
};

// ============================================================================
// Export types
// ============================================================================

export type { LoggerConfig as LoggerConfiguration };
