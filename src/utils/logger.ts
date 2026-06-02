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
// Environment
// ============================================================================

type Environment = 'development' | 'production' | 'test';

const getEnvironment = (): Environment =>
  (process.env.NODE_ENV as Environment) || 'development';

// ============================================================================
// Sensitive Data Redaction
// ============================================================================

const SENSITIVE_KEYS = new Set([
  'password', 'passwd', 'pwd', 'secret', 'apiKey', 'api_key',
  'accessToken', 'access_token', 'refreshToken', 'refresh_token',
  'privateKey', 'private_key', 'mnemonic', 'seedPhrase', 'seed_phrase',
  'token', 'authorization', 'auth', 'sessionId', 'session_id',
  'cookie', 'ssn', 'creditCard', 'credit_card', 'cvv',
]);

const SENSITIVE_PATTERNS: RegExp[] = [
  /0x[a-fA-F0-9]{64}/g, // ETH private keys
  /"(?:password|token|secret|authorization)"\s*:\s*"[^"]+"/gi,
];

const redactValue = (value: unknown): unknown => {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    let v = value.replace(/0x[a-fA-F0-9]{64}/g, '0x[REDACTED_PRIVATE_KEY]');
    for (const p of SENSITIVE_PATTERNS) v = v.replace(p, '[REDACTED]');
    return v;
  }

  if (Array.isArray(value)) return value.map(redactValue);

  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEYS.has(k.toLowerCase()) ? '[REDACTED]' : redactValue(v);
    }
    return out;
  }

  return value;
};

// ============================================================================
// Configuration
// ============================================================================

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteUrl?: string;
  /** Emit JSON lines in production instead of human-readable strings */
  jsonOutput: boolean;
  includeTimestamp: boolean;
  includeCorrelationId: boolean;
  includeStackTrace: boolean;
  environment: Environment;
  /** @deprecated use jsonOutput */
  minify?: boolean;
}

const getDefaultConfig = (): LoggerConfig => {
  const env = getEnvironment();
  const isProd = env === 'production';
  return {
    level: env === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
    enableConsole: true,
    enableRemote: false,
    jsonOutput: isProd,
    includeTimestamp: true,
    includeCorrelationId: true,
    includeStackTrace: isProd,
    environment: env,
  };
};

let globalConfig = getDefaultConfig();

// ============================================================================
// Correlation ID
// ============================================================================

const generateCorrelationId = (): string =>
  `corr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 15)}`;

class CorrelationIdManager {
  private static instance: CorrelationIdManager;
  private id: string = generateCorrelationId();

  static getInstance(): CorrelationIdManager {
    if (!CorrelationIdManager.instance) {
      CorrelationIdManager.instance = new CorrelationIdManager();
    }
    return CorrelationIdManager.instance;
  }

  getId(): string { return this.id; }
  setId(id: string): void { this.id = id; }
  reset(): void { this.id = generateCorrelationId(); }
  fork(): string { return generateCorrelationId(); }
  createChild(): string { return `${this.id}-${Math.random().toString(36).substring(2, 8)}`; }
}

// ============================================================================
// Log Entry
// ============================================================================

export interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  correlationId?: string;
  source?: string;
  data?: unknown;
  stack?: string;
}

// ============================================================================
// Logger
// ============================================================================

class Logger {
  private config: LoggerConfig;
  private readonly correlationManager: CorrelationIdManager;
  private localLevel: LogLevel | null = null;
  private source?: string;

  constructor(source?: string) {
    this.config = { ...globalConfig };
    this.correlationManager = CorrelationIdManager.getInstance();
    this.source = source;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= (this.localLevel ?? this.config.level);
  }

  private getStackTrace(): string | undefined {
    if (!this.config.includeStackTrace) return undefined;
    try {
      throw new Error();
    } catch (e) {
      return (e as Error).stack?.split('\n').slice(3).join('\n');
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
    if (this.source) entry.source = this.source;
    if (data !== undefined) entry.data = redactValue(data);
    const stack = this.getStackTrace();
    if (stack) entry.stack = stack;
    return entry;
  }

  private emit(level: LogLevel, levelName: string, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(levelName, message, data);

    if (this.config.enableConsole) {
      if (this.config.jsonOutput) {
        // Structured JSON line — single console.log so log aggregators get one line
        const line = JSON.stringify(entry);
        switch (level) {
          case LogLevel.DEBUG: console.debug(line); break;
          case LogLevel.INFO:  console.info(line);  break;
          case LogLevel.WARN:  console.warn(line);  break;
          case LogLevel.ERROR: console.error(line); break;
        }
      } else {
        // Human-readable for development
        const parts: string[] = [];
        if (this.config.includeTimestamp) parts.push(`[${entry.timestamp}]`);
        parts.push(`[${levelName}]`);
        if (this.config.includeCorrelationId && entry.correlationId) {
          parts.push(`[${entry.correlationId}]`);
        }
        if (this.source) parts.push(`[${this.source}]`);
        parts.push(message);
        const formatted = parts.join(' ');

        switch (level) {
          case LogLevel.DEBUG:
            if (this.config.environment === 'development') console.debug(formatted, entry.data ?? '');
            break;
          case LogLevel.INFO:  console.info(formatted, entry.data ?? '');  break;
          case LogLevel.WARN:  console.warn(formatted, entry.data ?? '');  break;
          case LogLevel.ERROR: console.error(formatted, entry.data ?? ''); break;
        }
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
        keepalive: true,
      });
    } catch {
      // Silently fail — remote logging must not break the app
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────

  debug(message: string, ...args: unknown[]): void {
    this.emit(LogLevel.DEBUG, 'DEBUG', message, args.length ? args : undefined);
  }

  info(message: string, ...args: unknown[]): void {
    this.emit(LogLevel.INFO, 'INFO', message, args.length ? args : undefined);
  }

  warn(message: string, ...args: unknown[]): void {
    this.emit(LogLevel.WARN, 'WARN', message, args.length ? args : undefined);
  }

  error(message: string, ...args: unknown[]): void {
    this.emit(LogLevel.ERROR, 'ERROR', message, args.length ? args : undefined);
  }

  errorWithStack(message: string, error: unknown, context?: unknown): void {
    const errorMessage = getErrorMessage(error, 'Unknown error');
    const stack = error instanceof Error ? error.stack : this.getStackTrace();
    this.emit(LogLevel.ERROR, 'ERROR', message, { error: errorMessage, stack, context });
  }

  child(source: string): Logger {
    const child = new Logger(source);
    child.setConfig(this.config);
    return child;
  }

  setLevel(level: LogLevel): void { this.localLevel = level; }

  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getCorrelationId(): string { return this.correlationManager.getId(); }
  forkCorrelationId(): string { return this.correlationManager.fork(); }
  setCorrelationId(id: string): void { this.correlationManager.setId(id); }
  resetCorrelationId(): void { this.correlationManager.reset(); }
}

// ============================================================================
// Factory & Singleton
// ============================================================================

const loggers = new Map<string, Logger>();

export const createLogger = (source?: string): Logger => {
  const key = source ?? 'default';
  if (!loggers.has(key)) loggers.set(key, new Logger(source));
  return loggers.get(key)!;
};

export const logger = createLogger();

// ============================================================================
// Global Configuration
// ============================================================================

export const configureLogger = (config: Partial<LoggerConfig>): void => {
  globalConfig = { ...globalConfig, ...config };
};

export const getLoggerConfig = (): LoggerConfig => ({ ...globalConfig });

// ============================================================================
// Helpers
// ============================================================================

export const createRequestLogger = (source: string): Logger => {
  const req = createLogger(source);
  const correlationId = req.forkCorrelationId();
  return req.child(`${source}-${correlationId}`);
};

export const replaceConsole = (): (() => void) => {
  const orig = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
    log: console.log,
  };

  const toMessage = (...args: unknown[]) =>
    args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');

  console.debug = (...args: unknown[]) => logger.debug(toMessage(...args));
  console.info  = (...args: unknown[]) => logger.info(toMessage(...args));
  console.warn  = (...args: unknown[]) => logger.warn(toMessage(...args));
  console.error = (...args: unknown[]) => logger.error(toMessage(...args));
  console.log   = (...args: unknown[]) => logger.info(toMessage(...args));

  return () => Object.assign(console, orig);
};

export const createPerformanceLogger = () => {
  const startTimes = new Map<string, number>();
  return {
    startTimer(label: string): void {
      startTimes.set(label, performance.now());
    },
    endTimer(label: string, thresholdMs = 16): void {
      const start = startTimes.get(label);
      if (start === undefined) { logger.warn(`Timer '${label}' was not started`); return; }
      const duration = performance.now() - start;
      startTimes.delete(label);
      if (duration > thresholdMs) {
        logger.warn(`Slow operation: ${label} took ${duration.toFixed(2)}ms`);
      } else {
        logger.debug(`${label} completed in ${duration.toFixed(2)}ms`);
      }
    },
  };
};

// ============================================================================
// Type exports
// ============================================================================

export type { LoggerConfig as LoggerConfiguration };
