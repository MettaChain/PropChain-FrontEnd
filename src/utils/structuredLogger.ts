'use client';

/**
 * structuredLogger — thin domain-specific layer on top of logger.
 *
 * All core logging (levels, JSON output, redaction, correlation IDs) lives in
 * logger.ts.  This module adds domain helpers (performance, network, web3,
 * component) and re-exports everything so callers can import from either file.
 */

// Re-export everything from the canonical logger so existing imports of
// structuredLogger still work without changes.
export {
  logger,
  createLogger,
  configureLogger,
  getLoggerConfig,
  createRequestLogger,
  replaceConsole,
  createPerformanceLogger,
  LogLevel,
  type LogEntry,
  type LoggerConfig,
  type LoggerConfiguration,
} from './logger';

import { logger, createLogger, LogLevel } from './logger';
import { errorReporting } from './errorReporting';
import { ErrorCategory, ErrorSeverity } from '@/types/errors';
import type { AppError } from '@/types/errors';

// ============================================================================
// Extended entry shape (superset of LogEntry)
// ============================================================================

export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
  error?: { name: string; message: string; stack?: string; code?: string };
  performance?: { duration?: number; operation?: string; memoryUsage?: number };
  network?: { url?: string; method?: string; status?: number; responseTime?: number };
  web3?: { chainId?: number; account?: string; gasUsed?: string; transactionHash?: string };
}

export interface StructuredLoggerConfig {
  enablePerformanceMonitoring: boolean;
  enableNetworkLogging: boolean;
  enableWeb3Logging: boolean;
  enableErrorTracking: boolean;
  maxLogEntries: number;
  flushInterval: number;
  remoteUrl?: string;
  enableRemote?: boolean;
}

// ============================================================================
// StructuredLogger
// ============================================================================

class StructuredLogger {
  private cfg: StructuredLoggerConfig;
  private buffer: StructuredLogEntry[] = [];
  private flushTimer?: NodeJS.Timeout;
  private sessionId: string;
  private userId?: string;

  constructor(config?: Partial<StructuredLoggerConfig>) {
    this.cfg = {
      enablePerformanceMonitoring: true,
      enableNetworkLogging: true,
      enableWeb3Logging: true,
      enableErrorTracking: true,
      maxLogEntries: 1000,
      flushInterval: 5000,
      ...config,
    };
    this.sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.startFlushTimer();
  }

  private startFlushTimer(): void {
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flushTimer = setInterval(() => this.flushLogs(), this.cfg.flushInterval);
  }

  private push(entry: StructuredLogEntry): void {
    this.buffer.push(entry);
    if (this.buffer.length > this.cfg.maxLogEntries) {
      this.buffer = this.buffer.slice(-this.cfg.maxLogEntries);
    }
  }

  private flushLogs(): void {
    if (!this.buffer.length) return;
    const batch = this.buffer.splice(0);

    if (this.cfg.enableRemote && this.cfg.remoteUrl) {
      this.sendBatch(batch);
    }

    if (this.cfg.enableErrorTracking) {
      batch.forEach(e => { if (e.level >= LogLevel.ERROR) this.reportError(e); });
    }
  }

  private async sendBatch(logs: StructuredLogEntry[]): Promise<void> {
    try {
      await fetch(this.cfg.remoteUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-ID': this.sessionId },
        body: JSON.stringify({
          logs,
          metadata: {
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
            url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
            timestamp: new Date().toISOString(),
          },
        }),
        keepalive: true,
      });
    } catch (err) {
      logger.warn('Failed to send logs to remote service', err);
    }
  }

  private reportError(entry: StructuredLogEntry): void {
    if (!entry.error) return;
    const appError: AppError = {
      id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      message: entry.error.message,
      category: entry.category ?? ErrorCategory.UI,
      severity: entry.severity ?? ErrorSeverity.MEDIUM,
      timestamp: new Date(entry.timestamp),
      isRecoverable: false,
      shouldReport: true,
      context: {
        component: entry.component,
        action: entry.action,
        correlationId: entry.correlationId,
        sessionId: entry.sessionId,
        userId: entry.userId,
        ...entry.metadata,
      },
      userMessage: entry.error.message,
      stack: entry.error.stack,
    };
    errorReporting.reportError(appError);
  }

  // ── Public API ──────────────────────────────────────────────────────────

  debug(message: string, metadata?: Partial<StructuredLogEntry>): void {
    this.push({ timestamp: new Date().toISOString(), level: LogLevel.DEBUG, message, sessionId: this.sessionId, userId: this.userId, correlationId: logger.getCorrelationId(), ...metadata });
    logger.debug(message, metadata);
  }

  info(message: string, metadata?: Partial<StructuredLogEntry>): void {
    this.push({ timestamp: new Date().toISOString(), level: LogLevel.INFO, message, sessionId: this.sessionId, userId: this.userId, correlationId: logger.getCorrelationId(), ...metadata });
    logger.info(message, metadata);
  }

  warn(message: string, metadata?: Partial<StructuredLogEntry>): void {
    this.push({ timestamp: new Date().toISOString(), level: LogLevel.WARN, message, sessionId: this.sessionId, userId: this.userId, correlationId: logger.getCorrelationId(), ...metadata });
    logger.warn(message, metadata);
  }

  error(message: string, error?: Error | AppError, metadata?: Partial<StructuredLogEntry>): void {
    const errorData = error ? {
      name: error instanceof Error ? error.name : 'AppError',
      message: error.message,
      stack: error.stack,
      code: (error as AppError).code as string | undefined,
    } : undefined;
    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      sessionId: this.sessionId,
      userId: this.userId,
      correlationId: logger.getCorrelationId(),
      error: errorData,
      category: (error as AppError)?.category,
      severity: (error as AppError)?.severity,
      ...metadata,
    };
    this.push(entry);
    logger.error(message, entry);
  }

  performance(operation: string, duration: number, metadata?: Partial<StructuredLogEntry>): void {
    if (!this.cfg.enablePerformanceMonitoring) return;
    this.info(`Performance: ${operation}`, {
      ...metadata,
      metadata: {
        performance: {
          duration,
          operation,
          memoryUsage: typeof performance !== 'undefined' && 'memory' in performance
            ? (performance as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize
            : undefined,
        },
        ...metadata?.metadata,
      },
    });
  }

  network(url: string, method: string, status: number, responseTime: number, metadata?: Partial<StructuredLogEntry>): void {
    if (!this.cfg.enableNetworkLogging) return;
    const message = `Network: ${method} ${url} - ${status}`;
    const networkData = { url, method, status, responseTime };
    if (status >= 400) {
      this.error(message, undefined, { network: networkData, ...metadata });
    } else {
      this.info(message, { network: networkData, ...metadata });
    }
  }

  web3(action: string, chainId?: number, account?: string, metadata?: Partial<StructuredLogEntry>): void {
    if (!this.cfg.enableWeb3Logging) return;
    this.info(`Web3: ${action}`, {
      web3: {
        chainId,
        account: account ? `${account.slice(0, 6)}...${account.slice(-4)}` : undefined,
        ...metadata?.web3,
      },
      ...metadata,
    });
  }

  transaction(hash: string, chainId: number, gasUsed?: string, metadata?: Partial<StructuredLogEntry>): void {
    if (!this.cfg.enableWeb3Logging) return;
    this.info(`Transaction: ${hash}`, { web3: { chainId, transactionHash: hash, gasUsed }, ...metadata });
  }

  component(name: string, action: string, metadata?: Partial<StructuredLogEntry>): void {
    this.info(`Component: ${name} - ${action}`, { component: name, action, ...metadata });
  }

  setUserId(userId: string): void { this.userId = userId; }

  trackError(error: Error | AppError, context?: Partial<StructuredLogEntry>): void {
    this.error(error.message, error, context);
  }

  updateConfig(config: Partial<StructuredLoggerConfig>): void {
    this.cfg = { ...this.cfg, ...config };
    if (config.flushInterval) this.startFlushTimer();
  }

  flush(): Promise<void> {
    return new Promise(resolve => { this.flushLogs(); resolve(); });
  }

  getBuffer(): StructuredLogEntry[] { return [...this.buffer]; }
  clearBuffer(): void { this.buffer = []; }

  destroy(): void {
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flushLogs();
  }
}

// ============================================================================
// Singleton & helpers
// ============================================================================

export const structuredLogger = new StructuredLogger();

export const createStructuredLogger = (config?: Partial<StructuredLoggerConfig>) =>
  new StructuredLogger(config);

export const createPerformanceTracker = (operation: string, metadata?: Partial<StructuredLogEntry>) => {
  const start = performance.now();
  return {
    end(extra?: Partial<StructuredLogEntry>) {
      const duration = performance.now() - start;
      structuredLogger.performance(operation, duration, { ...metadata, ...extra });
      return duration;
    },
  };
};

export const logNetworkRequest = (
  url: string, method: string, status: number, responseTime: number,
  metadata?: Partial<StructuredLogEntry>
) => structuredLogger.network(url, method, status, responseTime, metadata);

export const logWeb3Activity = (
  action: string, chainId?: number, account?: string,
  metadata?: Partial<StructuredLogEntry>
) => structuredLogger.web3(action, chainId, account, metadata);

export const logTransaction = (
  hash: string, chainId: number, gasUsed?: string,
  metadata?: Partial<StructuredLogEntry>
) => structuredLogger.transaction(hash, chainId, gasUsed, metadata);
