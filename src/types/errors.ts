export enum ErrorCategory {
  WEB3 = 'web3',
  NETWORK = 'network',
  AR = 'ar',
  VALIDATION = 'validation',
  UI = 'ui',
  AUTHENTICATION = 'authentication',
  PERMISSION = 'permission',
  RESOURCE = 'resource',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorRecoveryAction {
  RETRY = 'retry',
  REFRESH = 'refresh',
  RECONNECT = 'reconnect',
  RELOAD = 'reload',
  INSTALL_EXTENSION = 'install_extension',
  SWITCH_NETWORK = 'switch_network',
  GRANT_PERMISSION = 'grant_permission',
  CONTACT_SUPPORT = 'contact_support',
  IGNORE = 'ignore'
}

export interface AppError {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  technicalDetails?: string;
  recoveryAction?: ErrorRecoveryAction;
  recoveryOptions?: ErrorRecoveryAction[];
  timestamp: Date;
  context?: Record<string, any>;
  stack?: string;
  componentStack?: string;
  isRecoverable: boolean;
  shouldReport: boolean;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
  errorId: string | null;
  retryCount: number;
  isRecovering: boolean;
}

export interface ErrorReportingData {
  errorId: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  userAgent: string;
  url: string;
  timestamp: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId: string;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  recoverySuccessRate: number;
  topErrors: Array<{
    errorId: string;
    count: number;
    lastOccurred: Date;
  }>;
}
