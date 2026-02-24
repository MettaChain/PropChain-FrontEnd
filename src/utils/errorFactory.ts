import { type AppError, ErrorCategory, ErrorSeverity, ErrorRecoveryAction } from '@/types/errors';

export class ErrorFactory {
  static createError(
    category: ErrorCategory,
    severity: ErrorSeverity,
    message: string,
    userMessage: string,
    options: Partial<AppError> = {}
  ): AppError {
    const errorId = this.generateErrorId(category, message);
    
    return {
      id: errorId,
      category,
      severity,
      message,
      userMessage,
      timestamp: new Date(),
      isRecoverable: options.isRecoverable ?? true,
      shouldReport: options.shouldReport ?? true,
      recoveryAction: options.recoveryAction,
      recoveryOptions: options.recoveryOptions,
      context: options.context,
      stack: options.stack || new Error().stack,
      technicalDetails: options.technicalDetails,
    };
  }

  static createWeb3Error(
    message: string,
    userMessage: string,
    options: Partial<AppError> = {}
  ): AppError {
    return this.createError(
      ErrorCategory.WEB3,
      ErrorSeverity.HIGH,
      message,
      userMessage,
      {
        ...options,
        recoveryAction: options.recoveryAction || ErrorRecoveryAction.RECONNECT,
        recoveryOptions: options.recoveryOptions || [ErrorRecoveryAction.RECONNECT, ErrorRecoveryAction.RELOAD],
      }
    );
  }

  static createNetworkError(
    message: string,
    userMessage: string,
    options: Partial<AppError> = {}
  ): AppError {
    return this.createError(
      ErrorCategory.NETWORK,
      ErrorSeverity.MEDIUM,
      message,
      userMessage,
      {
        ...options,
        recoveryAction: options.recoveryAction || ErrorRecoveryAction.RETRY,
        recoveryOptions: options.recoveryOptions || [ErrorRecoveryAction.RETRY, ErrorRecoveryAction.REFRESH],
      }
    );
  }

  static createARError(
    message: string,
    userMessage: string,
    options: Partial<AppError> = {}
  ): AppError {
    return this.createError(
      ErrorCategory.AR,
      ErrorSeverity.MEDIUM,
      message,
      userMessage,
      {
        ...options,
        isRecoverable: options.isRecoverable ?? false,
        recoveryAction: options.recoveryAction || ErrorRecoveryAction.IGNORE,
        recoveryOptions: options.recoveryOptions || [ErrorRecoveryAction.IGNORE],
      }
    );
  }

  static createValidationError(
    message: string,
    userMessage: string,
    options: Partial<AppError> = {}
  ): AppError {
    return this.createError(
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      message,
      userMessage,
      {
        ...options,
        isRecoverable: options.isRecoverable ?? true,
        recoveryAction: options.recoveryAction || ErrorRecoveryAction.RETRY,
        recoveryOptions: options.recoveryOptions || [ErrorRecoveryAction.RETRY],
      }
    );
  }

  static createUIError(
    message: string,
    userMessage: string,
    options: Partial<AppError> = {}
  ): AppError {
    return this.createError(
      ErrorCategory.UI,
      ErrorSeverity.LOW,
      message,
      userMessage,
      {
        ...options,
        isRecoverable: options.isRecoverable ?? true,
        recoveryAction: options.recoveryAction || ErrorRecoveryAction.REFRESH,
        recoveryOptions: options.recoveryOptions || [ErrorRecoveryAction.REFRESH, ErrorRecoveryAction.RELOAD],
      }
    );
  }

  static createAuthenticationError(
    message: string,
    userMessage: string,
    options: Partial<AppError> = {}
  ): AppError {
    return this.createError(
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.HIGH,
      message,
      userMessage,
      {
        ...options,
        recoveryAction: options.recoveryAction || ErrorRecoveryAction.RECONNECT,
        recoveryOptions: options.recoveryOptions || [ErrorRecoveryAction.RECONNECT, ErrorRecoveryAction.RELOAD],
      }
    );
  }

  static createPermissionError(
    message: string,
    userMessage: string,
    options: Partial<AppError> = {}
  ): AppError {
    return this.createError(
      ErrorCategory.PERMISSION,
      ErrorSeverity.MEDIUM,
      message,
      userMessage,
      {
        ...options,
        recoveryAction: options.recoveryAction || ErrorRecoveryAction.GRANT_PERMISSION,
        recoveryOptions: options.recoveryOptions || [ErrorRecoveryAction.GRANT_PERMISSION, ErrorRecoveryAction.IGNORE],
      }
    );
  }

  static createResourceError(
    message: string,
    userMessage: string,
    options: Partial<AppError> = {}
  ): AppError {
    return this.createError(
      ErrorCategory.RESOURCE,
      ErrorSeverity.MEDIUM,
      message,
      userMessage,
      {
        ...options,
        recoveryAction: options.recoveryAction || ErrorRecoveryAction.REFRESH,
        recoveryOptions: options.recoveryOptions || [ErrorRecoveryAction.REFRESH, ErrorRecoveryAction.RETRY],
      }
    );
  }

  static fromError(
    error: Error | { message?: string; stack?: string; technicalDetails?: string; toString(): string },
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    options: Partial<AppError> = {}
  ): AppError {
    const message = error?.message || 'Unknown error occurred';
    const userMessage = this.generateUserFriendlyMessage(error, category);
    
    return this.createError(
      category,
      ErrorSeverity.MEDIUM,
      message,
      userMessage,
      {
        ...options,
        stack: error?.stack,
        technicalDetails: (error as any)?.technicalDetails || error?.toString(),
      }
    );
  }

  private static generateErrorId(category: ErrorCategory, message: string): string {
    const hash = this.simpleHash(message + Date.now());
    return `${category}_${hash}`;
  }

  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private static generateUserFriendlyMessage(error: Error | { message?: string }, category: ErrorCategory): string {
    // Common error patterns and user-friendly messages
    if (error?.message) {
      const message = error.message.toLowerCase();
      
      // Network-related errors
      if (message.includes('network') || message.includes('connection')) {
        return 'Network connection issue. Please check your internet connection and try again.';
      }
      
      // Wallet-related errors
      if (message.includes('wallet') || message.includes('metamask')) {
        return 'Wallet connection issue. Please ensure your wallet is properly connected.';
      }
      
      // Permission errors
      if (message.includes('permission') || message.includes('denied')) {
        return 'Permission required. Please grant the necessary permissions to continue.';
      }
      
      // Validation errors
      if (message.includes('validation') || message.includes('invalid')) {
        return 'Invalid input. Please check your information and try again.';
      }
      
      // AR/VR errors
      if (message.includes('ar') || message.includes('webxr') || message.includes('vr')) {
        return 'AR feature unavailable. Your device may not support augmented reality.';
      }
    }

    // Category-specific default messages
    switch (category) {
      case ErrorCategory.WEB3:
        return 'Blockchain operation failed. Please check your wallet connection and try again.';
      case ErrorCategory.NETWORK:
        return 'Network error occurred. Please check your internet connection.';
      case ErrorCategory.AR:
        return 'AR feature encountered an error. Please ensure your device supports AR.';
      case ErrorCategory.VALIDATION:
        return 'Invalid information provided. Please check your input and try again.';
      case ErrorCategory.AUTHENTICATION:
        return 'Authentication failed. Please log in again.';
      case ErrorCategory.PERMISSION:
        return 'Permission denied. Please grant the required permissions.';
      case ErrorCategory.RESOURCE:
        return 'Resource not available. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}
