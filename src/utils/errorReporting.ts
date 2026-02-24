import { type AppError, ErrorCategory, ErrorSeverity, type ErrorReportingData, type ErrorMetrics } from '@/types/errors';
import { logger } from './logger';

class ErrorReportingService {
  private static instance: ErrorReportingService;
  private errors: Map<string, AppError> = new Map();
  private metrics: ErrorMetrics = {
    totalErrors: 0,
    errorsByCategory: {} as Record<ErrorCategory, number>,
    errorsBySeverity: {} as Record<ErrorSeverity, number>,
    recoverySuccessRate: 0,
    topErrors: []
  };
  private sessionId: string;
  private retryAttempts: Map<string, number> = new Map();

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeMetrics();
  }

  static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeMetrics(): void {
    Object.values(ErrorCategory).forEach(category => {
      this.metrics.errorsByCategory[category] = 0;
    });
    Object.values(ErrorSeverity).forEach(severity => {
      this.metrics.errorsBySeverity[severity] = 0;
    });
  }

  reportError(error: AppError): void {
    // Store error
    this.errors.set(error.id, error);
    
    // Update metrics
    this.updateMetrics(error);
    
    // Prepare reporting data
    const reportingData: ErrorReportingData = {
      errorId: error.id,
      category: error.category,
      severity: error.severity,
      message: error.message,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      timestamp: error.timestamp.toISOString(),
      context: error.context,
      sessionId: this.sessionId
    };

    // Send to analytics service (in production)
    if (process.env.NODE_ENV === 'production' && error.shouldReport) {
      this.sendToAnalytics(reportingData);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`[${error.category.toUpperCase()}] ERROR [${error.severity.toUpperCase()}]:`, error);
    }
  }

  private updateMetrics(error: AppError): void {
    this.metrics.totalErrors++;
    this.metrics.errorsByCategory[error.category]++;
    this.metrics.errorsBySeverity[error.severity]++;

    // Update top errors
    const existingTopError = this.metrics.topErrors.find(e => e.errorId === error.id);
    if (existingTopError) {
      existingTopError.count++;
      existingTopError.lastOccurred = error.timestamp;
    } else {
      this.metrics.topErrors.push({
        errorId: error.id,
        count: 1,
        lastOccurred: error.timestamp
      });
    }

    // Keep only top 10 errors
    this.metrics.topErrors.sort((a, b) => b.count - a.count);
    this.metrics.topErrors = this.metrics.topErrors.slice(0, 10);
  }

  private async sendToAnalytics(data: ErrorReportingData): Promise<void> {
    try {
      // Integration with analytics service (e.g., Sentry, LogRocket, custom endpoint)
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }).catch(err => {
        logger.warn('Failed to report error to analytics:', err);
      });
    } catch (error) {
      logger.warn('Error reporting service unavailable:', error);
    }
  }

  recordRecoveryAttempt(errorId: string): void {
    const currentAttempts = this.retryAttempts.get(errorId) || 0;
    this.retryAttempts.set(errorId, currentAttempts + 1);
  }

  recordRecoverySuccess(errorId: string): void {
    const attempts = this.retryAttempts.get(errorId) || 0;
    this.retryAttempts.delete(errorId);
    
    // Update recovery success rate
    const totalRecoveryAttempts = Array.from(this.retryAttempts.values()).reduce((sum, count) => sum + count, 0) + attempts;
    const successfulRecoveries = this.metrics.totalErrors - this.retryAttempts.size;
    this.metrics.recoverySuccessRate = totalRecoveryAttempts > 0 ? successfulRecoveries / totalRecoveryAttempts : 0;
  }

  getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  getError(errorId: string): AppError | undefined {
    return this.errors.get(errorId);
  }

  clearErrors(): void {
    this.errors.clear();
    this.retryAttempts.clear();
    this.initializeMetrics();
  }

  // Error recovery strategies
  async attemptRecovery(error: AppError): Promise<boolean> {
    if (!error.isRecoverable || !error.recoveryAction) {
      return false;
    }

    this.recordRecoveryAttempt(error.id);

    try {
      let recovered = false;

      switch (error.recoveryAction) {
        case 'retry':
          recovered = await this.retryOperation(error);
          break;
        case 'refresh':
          recovered = await this.refreshData(error);
          break;
        case 'reconnect':
          recovered = await this.reconnectService(error);
          break;
        case 'reload':
          recovered = await this.reloadPage(error);
          break;
        case 'switch_network':
          recovered = await this.switchNetwork(error);
          break;
        case 'grant_permission':
          recovered = await this.requestPermission(error);
          break;
        default:
          recovered = false;
      }

      if (recovered) {
        this.recordRecoverySuccess(error.id);
      }

      return recovered;
    } catch (recoveryError) {
      logger.warn('Recovery attempt failed:', recoveryError);
      return false;
    }
  }

  private async retryOperation(error: AppError): Promise<boolean> {
    // Implement retry logic based on error context
    if (error.context?.retryFunction && typeof error.context.retryFunction === 'function') {
      try {
        await error.context.retryFunction();
        return true;
      } catch (retryError) {
        return false;
      }
    }
    return false;
  }

  private async refreshData(error: AppError): Promise<boolean> {
    // Implement data refresh logic
    if (error.context?.refreshFunction && typeof error.context.refreshFunction === 'function') {
      try {
        await error.context.refreshFunction();
        return true;
      } catch (refreshError) {
        return false;
      }
    }
    return false;
  }

  private async reconnectService(error: AppError): Promise<boolean> {
    // Implement reconnection logic for Web3/services
    if (error.category === ErrorCategory.WEB3 || error.category === ErrorCategory.NETWORK) {
      // Trigger wallet reconnection
      window.location.reload();
      return true;
    }
    return false;
  }

  private async reloadPage(error: AppError): Promise<boolean> {
    window.location.reload();
    return true;
  }

  private async switchNetwork(error: AppError): Promise<boolean> {
    // Implement network switching logic
    if (error.context?.targetChainId && window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: error.context.targetChainId }],
        });
        return true;
      } catch (switchError) {
        return false;
      }
    }
    return false;
  }

  private async requestPermission(error: AppError): Promise<boolean> {
    // Implement permission request logic
    if (error.context?.permission && navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: error.context.permission });
        if (result.state === 'prompt') {
          // Trigger permission request
          return true;
        }
      } catch (permissionError) {
        return false;
      }
    }
    return false;
  }
}

export const errorReporting = ErrorReportingService.getInstance();
