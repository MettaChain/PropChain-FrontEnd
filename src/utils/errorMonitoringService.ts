'use client';

import { structuredLogger } from './structuredLogger';
import { errorReporting } from './errorReporting';
import { logger } from './logger';
import { ErrorCategory, ErrorSeverity, type AppError } from '@/types/errors';

// ============================================================================
// Error Monitoring Service
// ============================================================================

export interface ErrorMonitoringConfig {
  enableConsoleAlerts: boolean;
  enableUserNotifications: boolean;
  enableAutomaticRecovery: boolean;
  maxRetryAttempts: number;
  retryDelay: number;
  enablePerformanceMonitoring: boolean;
  performanceThreshold: number;
  enableUserFeedback: boolean;
  feedbackEndpoint?: string;
}

export interface ErrorAlert {
  id: string;
  error: AppError;
  timestamp: Date;
  severity: ErrorSeverity;
  message: string;
  suggestedActions: string[];
  canRetry: boolean;
  canIgnore: boolean;
}

export interface UserFeedback {
  errorId: string;
  userId?: string;
  feedback: 'helpful' | 'not_helpful' | 'resolved' | 'still_broken';
  comment?: string;
  timestamp: Date;
}

class ErrorMonitoringService {
  private static instance: ErrorMonitoringService;
  private config: ErrorMonitoringConfig;
  private activeAlerts: Map<string, ErrorAlert> = new Map();
  private userFeedback: Map<string, UserFeedback[]> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private performanceMetrics: Map<string, number[]> = new Map();

  private constructor() {
    this.config = {
      enableConsoleAlerts: true,
      enableUserNotifications: true,
      enableAutomaticRecovery: true,
      maxRetryAttempts: 3,
      retryDelay: 1000,
      enablePerformanceMonitoring: true,
      performanceThreshold: 100, // ms
      enableUserFeedback: true,
      feedbackEndpoint: '/api/error-feedback',
    };
  }

  static getInstance(): ErrorMonitoringService {
    if (!ErrorMonitoringService.instance) {
      ErrorMonitoringService.instance = new ErrorMonitoringService();
    }
    return ErrorMonitoringService.instance;
  }

  // Configuration
  updateConfig(config: Partial<ErrorMonitoringConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): ErrorMonitoringConfig {
    return { ...this.config };
  }

  // Error monitoring
  monitorError(error: AppError): void {
    // Log structured error
    structuredLogger.trackError(error, {
      category: error.category,
      severity: error.severity,
      component: error.context?.component,
      action: error.context?.action,
    });

    // Create alert if needed
    if (this.shouldCreateAlert(error)) {
      this.createAlert(error);
    }

    // Attempt automatic recovery
    if (this.config.enableAutomaticRecovery && error.isRecoverable) {
      this.attemptRecovery(error);
    }

    // Report to error tracking
    errorReporting.reportError(error);
  }

  // Public method for external recovery attempts
  public async attemptRecovery(error: AppError): Promise<boolean> {
    const attempts = this.retryAttempts.get(error.id) || 0;
    
    if (attempts >= this.config.maxRetryAttempts) {
      logger.warn(`Max retry attempts reached for error: ${error.id}`);
      return false;
    }

    this.retryAttempts.set(error.id, attempts + 1);

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * Math.pow(2, attempts)));

    try {
      const recovered = await errorReporting.attemptRecovery(error);
      
      if (recovered) {
        // Clear retry attempts on success
        this.retryAttempts.delete(error.id);
        
        // Remove alert if exists
        const alert = Array.from(this.activeAlerts.values()).find(
          a => a.error.id === error.id
        );
        if (alert) {
          this.activeAlerts.delete(alert.id);
        }

        structuredLogger.info(`Error recovery successful for error`, {
          metadata: { errorId: error.id, attempts: attempts + 1 },
        });

        return true;
      }
    } catch (recoveryError) {
      logger.warn('Error recovery attempt failed:', recoveryError);
    }

    return false;
  }

  private shouldCreateAlert(error: AppError): boolean {
    // Don't create alerts for low severity errors
    if (error.severity === ErrorSeverity.LOW) {
      return false;
    }

    // Don't create alerts for expected errors (validation, etc.)
    if (error.category === ErrorCategory.VALIDATION || error.category === ErrorCategory.UI) {
      return false;
    }

    // Check if we already have an active alert for this error type
    const existingAlert = Array.from(this.activeAlerts.values()).find(
      alert => alert.error.message === error.message
    );

    return !existingAlert;
  }

  private createAlert(error: AppError): void {
    const alert: ErrorAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      error,
      timestamp: new Date(),
      severity: error.severity,
      message: this.generateAlertMessage(error),
      suggestedActions: this.generateSuggestedActions(error),
      canRetry: error.isRecoverable && (this.retryAttempts.get(error.id) || 0) < this.config.maxRetryAttempts,
      canIgnore: error.severity !== ErrorSeverity.CRITICAL,
    };

    this.activeAlerts.set(alert.id, alert);

    // Notify user if enabled
    if (this.config.enableUserNotifications) {
      this.notifyUser(alert);
    }

    // Console alert if enabled
    if (this.config.enableConsoleAlerts) {
      this.consoleAlert(alert);
    }
  }

  private generateAlertMessage(error: AppError): string {
    const categoryMessages: Record<ErrorCategory, string> = {
      [ErrorCategory.WEB3]: 'Web3 connection issue detected',
      [ErrorCategory.NETWORK]: 'Network connectivity problem',
      [ErrorCategory.AR]: 'Augmented reality feature unavailable',
      [ErrorCategory.UI]: 'Interface error occurred',
      [ErrorCategory.VALIDATION]: 'Input validation failed',
      [ErrorCategory.PERMISSION]: 'Permission required',
      [ErrorCategory.RESOURCE]: 'Resource not available',
      [ErrorCategory.AUTHENTICATION]: 'Authentication required',
      [ErrorCategory.UNKNOWN]: 'Unknown error occurred',
    };

    const baseMessage = categoryMessages[error.category] || 'An error occurred';
    return `${baseMessage}: ${error.message}`;
  }

  private generateSuggestedActions(error: AppError): string[] {
    const actions: string[] = [];

    switch (error.category) {
      case ErrorCategory.WEB3:
        actions.push('Check wallet connection');
        actions.push('Ensure correct network is selected');
        if (error.isRecoverable) actions.push('Try reconnecting wallet');
        break;
      
      case ErrorCategory.NETWORK:
        actions.push('Check internet connection');
        actions.push('Try refreshing the page');
        if (error.isRecoverable) actions.push('Retry the operation');
        break;
      
      case ErrorCategory.AR:
        actions.push('Ensure device supports AR');
        actions.push('Grant camera permissions if prompted');
        actions.push('Try in a well-lit environment');
        break;
      
      case ErrorCategory.PERMISSION:
        actions.push('Grant requested permissions');
        actions.push('Check browser settings');
        break;
      
      case ErrorCategory.AUTHENTICATION:
        actions.push('Log in again');
        actions.push('Check session status');
        break;
      
      default:
        actions.push('Try refreshing the page');
        if (error.isRecoverable) actions.push('Retry the operation');
        break;
    }

    return actions;
  }

  private notifyUser(alert: ErrorAlert): void {
    // Dispatch custom event for UI components to handle
    const event = new CustomEvent('errorAlert', {
      detail: {
        id: alert.id,
        message: alert.message,
        severity: alert.severity,
        actions: alert.suggestedActions,
        canRetry: alert.canRetry,
        canIgnore: alert.canIgnore,
      },
    });

    window.dispatchEvent(event);
  }

  private consoleAlert(alert: ErrorAlert): void {
    const consoleMethod = alert.severity === ErrorSeverity.CRITICAL ? 'error' : 'warn';
    console[consoleMethod](
      `🚨 Error Alert [${alert.severity.toUpperCase()}]: ${alert.message}`,
      {
        errorId: alert.id,
        error: alert.error,
        suggestedActions: alert.suggestedActions,
        canRetry: alert.canRetry,
        timestamp: alert.timestamp,
      }
    );
  }

  
  // Performance monitoring
  monitorPerformance(operation: string, duration: number): void {
    if (!this.config.enablePerformanceMonitoring) return;

    // Store performance data
    if (!this.performanceMetrics.has(operation)) {
      this.performanceMetrics.set(operation, []);
    }
    
    const metrics = this.performanceMetrics.get(operation)!;
    metrics.push(duration);

    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }

    // Check if performance threshold exceeded
    if (duration > this.config.performanceThreshold) {
      structuredLogger.warn(`Performance threshold exceeded: ${operation}`, {
        metadata: {
          performance: {
            operation,
            duration,
            average: metrics.reduce((sum, d) => sum + d, 0) / metrics.length,
          },
          threshold: this.config.performanceThreshold,
        },
      });
    }
  }

  getPerformanceMetrics(): Record<string, { average: number; min: number; max: number; count: number }> {
    const result: Record<string, { average: number; min: number; max: number; count: number }> = {};

    for (const [operation, metrics] of this.performanceMetrics.entries()) {
      if (metrics.length > 0) {
        result[operation] = {
          average: metrics.reduce((sum, d) => sum + d, 0) / metrics.length,
          min: Math.min(...metrics),
          max: Math.max(...metrics),
          count: metrics.length,
        };
      }
    }

    return result;
  }

  // Alert management
  getActiveAlerts(): ErrorAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  dismissAlert(alertId: string): void {
    this.activeAlerts.delete(alertId);
  }

  retryError(errorId: string): Promise<boolean> {
    const error = errorReporting.getError(errorId);
    if (!error) {
      return Promise.resolve(false);
    }

    return this.attemptRecovery(error);
  }

  // User feedback
  submitFeedback(feedback: Omit<UserFeedback, 'timestamp'>): void {
    const fullFeedback: UserFeedback = {
      ...feedback,
      timestamp: new Date(),
    };

    if (!this.userFeedback.has(feedback.errorId)) {
      this.userFeedback.set(feedback.errorId, []);
    }

    this.userFeedback.get(feedback.errorId)!.push(fullFeedback);

    // Send feedback to server if endpoint configured
    if (this.config.feedbackEndpoint) {
      this.sendFeedbackToServer(fullFeedback);
    }

    structuredLogger.info(`User feedback submitted for error`, {
      metadata: { errorId: feedback.errorId, feedback: feedback.feedback, comment: feedback.comment },
    });
  }

  private async sendFeedbackToServer(feedback: UserFeedback): Promise<void> {
    try {
      await fetch(this.config.feedbackEndpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      });
    } catch (error) {
      logger.warn('Failed to send user feedback to server:', error);
    }
  }

  getFeedback(errorId: string): UserFeedback[] {
    return this.userFeedback.get(errorId) || [];
  }

  // Analytics
  getErrorSummary(): {
    totalErrors: number;
    activeAlerts: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recoveryRate: number;
    averageRetryAttempts: number;
  } {
    const metrics = errorReporting.getMetrics();
    const totalRetryAttempts = Array.from(this.retryAttempts.values()).reduce((sum, attempts) => sum + attempts, 0);
    const errorsWithRetries = this.retryAttempts.size;

    return {
      totalErrors: metrics.totalErrors,
      activeAlerts: this.activeAlerts.size,
      errorsByCategory: metrics.errorsByCategory,
      errorsBySeverity: metrics.errorsBySeverity,
      recoveryRate: metrics.recoverySuccessRate,
      averageRetryAttempts: errorsWithRetries > 0 ? totalRetryAttempts / errorsWithRetries : 0,
    };
  }

  // Cleanup
  cleanup(): void {
    this.activeAlerts.clear();
    this.userFeedback.clear();
    this.retryAttempts.clear();
    this.performanceMetrics.clear();
  }
}

// ============================================================================
// Singleton Instance and Exports
// ============================================================================

export const errorMonitoring = ErrorMonitoringService.getInstance();

// ============================================================================
// Helper Functions
// ============================================================================

export const monitorError = (error: AppError): void => {
  errorMonitoring.monitorError(error);
};

export const monitorPerformance = (operation: string, duration: number): void => {
  errorMonitoring.monitorPerformance(operation, duration);
};

export const createPerformanceMonitor = (operation: string) => {
  const startTime = performance.now();
  
  return {
    end() {
      const duration = performance.now() - startTime;
      monitorPerformance(operation, duration);
      return duration;
    },
  };
};

export const submitErrorFeedback = (
  errorId: string,
  feedback: UserFeedback['feedback'],
  comment?: string
): void => {
  errorMonitoring.submitFeedback({
    errorId,
    feedback,
    comment,
  });
};
