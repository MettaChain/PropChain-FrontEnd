'use client';

import { logger, LogLevel, type LoggerConfig } from './logger';
import { errorReporting } from './errorReporting';
import type { AppError, ErrorCategory, ErrorSeverity } from '@/types/errors';

// ============================================================================
// Structured Logging Service
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
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  performance?: {
    duration?: number;
    operation?: string;
    memoryUsage?: number;
  };
  network?: {
    url?: string;
    method?: string;
    status?: number;
    responseTime?: number;
  };
  web3?: {
    chainId?: number;
    account?: string;
    gasUsed?: string;
    transactionHash?: string;
  };
}

export interface StructuredLoggerConfig extends LoggerConfig {
  enablePerformanceMonitoring: boolean;
  enableNetworkLogging: boolean;
  enableWeb3Logging: boolean;
  enableErrorTracking: boolean;
  maxLogEntries: number;
  flushInterval: number;
}

class StructuredLogger {
  private config: StructuredLoggerConfig;
  private logBuffer: StructuredLogEntry[] = [];
  private flushTimer?: NodeJS.Timeout;
  private sessionId: string;
  private userId?: string;

  constructor(config?: Partial<StructuredLoggerConfig>) {
    this.config = {
      // Base logger config
      level: LogLevel.INFO,
      enableConsole: true,
      enableRemote: false,
      minify: false,
      includeTimestamp: true,
      includeCorrelationId: true,
      includeStackTrace: false,
      environment: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
      
      // Structured logger specific config
      enablePerformanceMonitoring: true,
      enableNetworkLogging: true,
      enableWeb3Logging: true,
      enableErrorTracking: true,
      maxLogEntries: 1000,
      flushInterval: 5000,
      
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.startFlushTimer();
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flushLogs();
    }, this.config.flushInterval);
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    metadata?: Partial<StructuredLogEntry>
  ): StructuredLogEntry {
    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: logger.getCorrelationId(),
      sessionId: this.sessionId,
      userId: this.userId,
      ...metadata,
    };

    // Add to buffer
    this.logBuffer.push(entry);

    // Maintain buffer size
    if (this.logBuffer.length > this.config.maxLogEntries) {
      this.logBuffer = this.logBuffer.slice(-this.config.maxLogEntries);
    }

    return entry;
  }

  private flushLogs(): void {
    if (this.logBuffer.length === 0) {
      return;
    }

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    // Send to remote logging service if enabled
    if (this.config.enableRemote && this.config.remoteUrl) {
      this.sendLogsToRemote(logsToFlush);
    }

    // Send to error reporting for error-level logs
    logsToFlush.forEach(log => {
      if (log.level >= LogLevel.ERROR && this.config.enableErrorTracking) {
        this.reportError(log);
      }
    });
  }

  private async sendLogsToRemote(logs: StructuredLogEntry[]): Promise<void> {
    try {
      await fetch(this.config.remoteUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId,
        },
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
    } catch (error) {
      logger.warn('Failed to send logs to remote service:', error);
    }
  }

  private reportError(log: StructuredLogEntry): void {
    if (!log.error) return;

    // Create AppError from structured log
    const appError: AppError = {
      id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: log.error.name || 'Error',
      message: log.error.message,
      category: log.category || ErrorCategory.UI,
      severity: log.severity || ErrorSeverity.MEDIUM,
      timestamp: new Date(log.timestamp),
      isRecoverable: false,
      shouldReport: true,
      context: {
        component: log.component,
        action: log.action,
        correlationId: log.correlationId,
        sessionId: log.sessionId,
        userId: log.userId,
        ...log.metadata,
      },
      stack: log.error.stack,
      code: log.error.code,
    };

    errorReporting.reportError(appError);
  }

  // Public API methods
  debug(message: string, metadata?: Partial<StructuredLogEntry>): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, metadata);
    
    if (this.config.enableConsole) {
      logger.debug(message, entry);
    }
  }

  info(message: string, metadata?: Partial<StructuredLogEntry>): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, metadata);
    
    if (this.config.enableConsole) {
      logger.info(message, entry);
    }
  }

  warn(message: string, metadata?: Partial<StructuredLogEntry>): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, metadata);
    
    if (this.config.enableConsole) {
      logger.warn(message, entry);
    }
  }

  error(message: string, error?: Error | AppError, metadata?: Partial<StructuredLogEntry>): void {
    const errorData = error ? {
      name: error instanceof Error ? error.name : 'AppError',
      message: error.message,
      stack: error instanceof Error ? error.stack : error.stack,
      code: (error as any).code,
    } : undefined;

    const entry = this.createLogEntry(LogLevel.ERROR, message, {
      ...metadata,
      error: errorData,
      category: (error as AppError)?.category,
      severity: (error as AppError)?.severity,
    });
    
    if (this.config.enableConsole) {
      logger.error(message, entry);
    }
  }

  // Specialized logging methods
  performance(operation: string, duration: number, metadata?: Partial<StructuredLogEntry>): void {
    if (!this.config.enablePerformanceMonitoring) return;

    this.info(`Performance: ${operation}`, {
      metadata: {
        performance: {
          duration,
          operation,
          memoryUsage: typeof performance !== 'undefined' && performance.memory 
            ? performance.memory.usedJSHeapSize 
            : undefined,
        },
        ...metadata?.metadata,
      },
      ...metadata,
    });
  }

  network(url: string, method: string, status: number, responseTime: number, metadata?: Partial<StructuredLogEntry>): void {
    if (!this.config.enableNetworkLogging) return;

    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    const message = `Network: ${method} ${url} - ${status}`;

    this.createLogEntry(level, message, {
      network: {
        url,
        method,
        status,
        responseTime,
      },
      ...metadata,
    });

    if (this.config.enableConsole) {
      if (status >= 400) {
        logger.error(message, { url, method, status, responseTime });
      } else {
        logger.info(message, { url, method, status, responseTime });
      }
    }
  }

  web3(action: string, chainId?: number, account?: string, metadata?: Partial<StructuredLogEntry>): void {
    if (!this.config.enableWeb3Logging) return;

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
    if (!this.config.enableWeb3Logging) return;

    this.info(`Transaction: ${hash}`, {
      web3: {
        chainId,
        transactionHash: hash,
        gasUsed,
      },
      ...metadata,
    });
  }

  // User tracking
  setUserId(userId: string): void {
    this.userId = userId;
  }

  // Component-specific logging
  component(componentName: string, action: string, metadata?: Partial<StructuredLogEntry>): void {
    this.info(`Component: ${componentName} - ${action}`, {
      component: componentName,
      action,
      ...metadata,
    });
  }

  // Error tracking
  trackError(error: Error | AppError, context?: Partial<StructuredLogEntry>): void {
    this.error(error.message, error, context);
  }

  // Configuration
  updateConfig(config: Partial<StructuredLoggerConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update base logger config
    logger.setConfig({
      level: this.config.level,
      enableConsole: this.config.enableConsole,
      enableRemote: this.config.enableRemote,
      remoteUrl: this.config.remoteUrl,
      minify: this.config.minify,
      includeTimestamp: this.config.includeTimestamp,
      includeCorrelationId: this.config.includeCorrelationId,
      includeStackTrace: this.config.includeStackTrace,
    });

    // Restart flush timer if interval changed
    if (config.flushInterval) {
      this.startFlushTimer();
    }
  }

  // Manual flush
  flush(): Promise<void> {
    return new Promise((resolve) => {
      this.flushLogs();
      resolve();
    });
  }

  // Get buffer contents
  getBuffer(): StructuredLogEntry[] {
    return [...this.logBuffer];
  }

  // Clear buffer
  clearBuffer(): void {
    this.logBuffer = [];
  }

  // Cleanup
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushLogs();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const structuredLogger = new StructuredLogger();

// ============================================================================
// Performance Monitoring Helper
// ============================================================================

export const createPerformanceTracker = (operation: string, metadata?: Partial<StructuredLogEntry>) => {
  const startTime = performance.now();
  
  return {
    end(additionalMetadata?: Partial<StructuredLogEntry>) {
      const duration = performance.now() - startTime;
      structuredLogger.performance(operation, duration, { ...metadata, ...additionalMetadata });
      return duration;
    },
  };
};

// ============================================================================
// Network Request Logger
// ============================================================================

export const logNetworkRequest = (
  url: string,
  method: string,
  status: number,
  responseTime: number,
  metadata?: Partial<StructuredLogEntry>
) => {
  structuredLogger.network(url, method, status, responseTime, metadata);
};

// ============================================================================
// Web3 Activity Logger
// ============================================================================

export const logWeb3Activity = (
  action: string,
  chainId?: number,
  account?: string,
  metadata?: Partial<StructuredLogEntry>
) => {
  structuredLogger.web3(action, chainId, account, metadata);
};

export const logTransaction = (
  hash: string,
  chainId: number,
  gasUsed?: string,
  metadata?: Partial<StructuredLogEntry>
) => {
  structuredLogger.transaction(hash, chainId, gasUsed, metadata);
};

// ============================================================================
// Export types and factory
// ============================================================================

export type { StructuredLoggerConfig };

export const createStructuredLogger = (config?: Partial<StructuredLoggerConfig>) => {
  return new StructuredLogger(config);
};
