'use client';

import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { ErrorCategory, ErrorSeverity, type AppError } from '@/types/errors';
import { ErrorFactory } from '@/utils/errorFactory';
import { structuredLogger } from '@/utils/structuredLogger';
import { errorMonitoring } from '@/utils/errorMonitoringService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError) => void;
}

interface State {
  hasError: boolean;
  error: AppError | null;
  errorId: string | null;
  retryCount: number;
  isRecovering: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0,
      isRecovering: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const appError = ErrorFactory.fromError(error);
    return {
      hasError: true,
      error: appError,
      errorId: appError.id,
      retryCount: 0,
      isRecovering: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = ErrorFactory.fromError(error, ErrorCategory.UI, {
      componentStack: errorInfo.componentStack ?? undefined,
      context: {
        errorBoundary: 'GlobalErrorBoundary',
        errorInfo,
      },
    });

    this.setState({ error: appError });

    // Log structured error
    structuredLogger.error('Error caught by global boundary', appError, {
      component: 'GlobalErrorBoundary',
      action: 'error_boundary_catch',
      metadata: {
        errorId: appError.id,
        componentStack: errorInfo.componentStack,
      },
    });

    // Monitor error
    errorMonitoring.monitorError(appError);

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(appError);
    }
  }

  handleRetry = async (): Promise<void> => {
    if (this.state.retryCount >= this.maxRetries) {
      structuredLogger.warn('Max retry attempts reached', {
        component: 'GlobalErrorBoundary',
        action: 'retry_limit_reached',
        metadata: {
          errorId: this.state.errorId,
          retryCount: this.state.retryCount,
          maxRetries: this.maxRetries,
        },
      });
      return;
    }

    this.setState({ isRecovering: true });

    // Exponential backoff
    const delay = this.retryDelay * Math.pow(2, this.state.retryCount);
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      // Attempt recovery if error is recoverable
      if (this.state.error?.isRecoverable) {
        const recovered = await errorMonitoring.attemptRecovery(this.state.error);
        
        if (recovered) {
          structuredLogger.info('Error recovery successful', {
            component: 'GlobalErrorBoundary',
            action: 'recovery_success',
            metadata: {
              errorId: this.state.errorId,
              retryCount: this.state.retryCount + 1,
            },
          });
        }
      }

      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorId: null,
        retryCount: prevState.retryCount + 1,
        isRecovering: false,
      }));
    } catch (recoveryError) {
      structuredLogger.error('Error recovery failed', recoveryError as Error, {
        component: 'GlobalErrorBoundary',
        action: 'recovery_failed',
        metadata: {
          errorId: this.state.errorId,
          retryCount: this.state.retryCount + 1,
        },
      });

      this.setState({
        isRecovering: false,
        retryCount: this.state.retryCount + 1,
      });
    }
  };

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0,
      isRecovering: false,
    });

    structuredLogger.info('Error boundary reset', {
      component: 'GlobalErrorBoundary',
      action: 'boundary_reset',
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h1>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {this.state.error.userMessage || 'An unexpected error occurred. Please try again.'}
            </p>

            {process.env.NODE_ENV === 'development' && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                  Error Details
                </summary>
                <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-800 dark:text-gray-200">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  <div className="mb-2">
                    <strong>Category:</strong> {this.state.error.category}
                  </div>
                  <div className="mb-2">
                    <strong>Severity:</strong> {this.state.error.severity}
                  </div>
                  {this.state.error.context?.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1">
                        {this.state.error.context.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="space-y-3">
              {this.state.error.isRecoverable && this.state.retryCount < this.maxRetries && (
                <button
                  onClick={this.handleRetry}
                  disabled={this.state.isRecovering}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                >
                  {this.state.isRecovering ? 'Recovering...' : `Try Again (${this.maxRetries - this.state.retryCount} attempts left)`}
                </button>
              )}

              <button
                onClick={this.handleReset}
                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Reset Application
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Reload Page
              </button>
            </div>

            {this.state.retryCount >= this.maxRetries && (
              <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900 rounded text-sm text-yellow-800 dark:text-yellow-200">
                Maximum retry attempts reached. Please reload the page or contact support if the problem persists.
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for easy usage
export const withGlobalErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<Props, 'children'> = {}
) => {
  const WrappedComponent = (props: P) => (
    <GlobalErrorBoundary {...options}>
      <Component {...props} />
    </GlobalErrorBoundary>
  );

  WrappedComponent.displayName = `withGlobalErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};
