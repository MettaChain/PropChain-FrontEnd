/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type {
  AppError,
  ErrorBoundaryState,
} from "@/types/errors";
import {
  ErrorRecoveryAction,
  ErrorCategory,
} from "@/types/errors";
import { ErrorFactory } from "@/utils/errorFactory";
import { errorReporting } from "@/utils/errorReporting";
import { useTranslation } from "react-i18next";
import { logger } from "@/utils/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  showDetails?: boolean;
  gracefulDegradation?: {
    fallbackComponent?: ReactNode;
    hideOnError?: boolean;
  };
}

interface State extends ErrorBoundaryState {
  errorHistory: AppError[];
  lastErrorTime: Date | null;
}

export class UIErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0,
      isRecovering: false,
      errorHistory: [],
      lastErrorTime: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const appError = ErrorFactory.fromError(error, ErrorCategory.UI);
    return {
      hasError: true,
      error: appError,
      errorId: appError.id,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = ErrorFactory.fromError(error, ErrorCategory.UI, {
      componentStack: errorInfo.componentStack || undefined,
      context: {
        errorBoundary: "UIErrorBoundary",
        errorInfo,
        userAgent:
          typeof window !== "undefined" ? window.navigator.userAgent : "Server",
        url: typeof window !== "undefined" ? window.location.href : "Unknown",
        timestamp: new Date().toISOString(),
      },
    });

    // Add to error history
    const errorHistory = [...this.state.errorHistory, appError].slice(-10); // Keep last 10 errors

    // Report error
    errorReporting.reportError(appError);

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(appError);
    }

    this.setState({
      error: appError,
      errorId: appError.id,
      errorHistory,
      lastErrorTime: new Date(),
    });
  }

  private handleRetry = async () => {
    if (!this.state.error || !this.state.error.isRecoverable) {
      return;
    }

    const maxRetries = this.props.maxRetries || 3;
    if (this.state.retryCount >= maxRetries) {
      return;
    }

    this.setState({ isRecovering: true });

    try {
      const recovered = await errorReporting.attemptRecovery(this.state.error);

      if (recovered) {
        // Clear error state on successful recovery
        this.setState({
          hasError: false,
          error: null,
          errorId: null,
          retryCount: 0,
          isRecovering: false,
        });
      } else {
        // Increment retry count
        this.setState((prevState) => ({
          retryCount: prevState.retryCount + 1,
          isRecovering: false,
        }));
      }
    } catch (recoveryError) {
      logger.error("UI recovery failed:", recoveryError);
      this.setState({ isRecovering: false });
    }
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private getErrorSeverity = () => {
    if (!this.state.error) {
      return "default";
    }

    switch (this.state.error.severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  private shouldShowGracefulDegradation = () => {
    return (
      this.props.gracefulDegradation &&
      this.state.error &&
      this.state.error.severity !== "critical" &&
      this.props.gracefulDegradation.fallbackComponent
    );
  };

  private getErrorIcon = () => {
    if (!this.state.error) return <AlertTriangle className="w-6 h-6" />;

    switch (this.state.error.category) {
      case "validation":
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case "resource":
        return <Bug className="w-6 h-6 text-orange-600" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
    }
  };

  private getErrorTitle = () => {
    if (!this.state.error) return "Something went wrong";

    switch (this.state.error.category) {
      case "validation":
        return "Validation Error";
      case "resource":
        return "Resource Error";
      case "permission":
        return "Permission Error";
      default:
        return "UI Error";
    }
  };

  render() {
    // Show graceful degradation if enabled and error is not critical
    if (this.shouldShowGracefulDegradation()) {
      return this.props.gracefulDegradation!.fallbackComponent;
    }

    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              {/* Error Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-900/20 rounded-full flex items-center justify-center">
                  {this.getErrorIcon()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {this.getErrorTitle()}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Error ID: {this.state.errorId} • Severity:{" "}
                    {this.state.error.severity}
                  </p>
                </div>
              </div>

              {/* Error Message */}
              <Alert variant={this.getErrorSeverity() as any} className="mb-6">
                <AlertDescription className="text-sm">
                  {this.state.error.userMessage ||
                    "An unexpected error occurred in the user interface."}
                </AlertDescription>
              </Alert>

              {/* Error History */}
              {this.state.errorHistory.length > 1 && (
                <details className="mb-6">
                  <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                    Error History ({this.state.errorHistory.length} errors)
                  </summary>
                  <div className="mt-2 space-y-2">
                    {this.state.errorHistory.slice(-5).map((error, index) => (
                      <div
                        key={error.id}
                        className="text-xs p-2 bg-gray-50 dark:bg-gray-900 rounded"
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">{error.category}</span>
                          <span>{error.timestamp.toLocaleTimeString()}</span>
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 truncate">
                          {error.userMessage}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Technical Details */}
              {(this.props.showDetails ||
                process.env.NODE_ENV === "development") && (
                <details className="mb-6">
                  <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                    Technical Details
                  </summary>
                  <div className="mt-2 space-y-3">
                    {this.state.error.technicalDetails && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">
                          Error Message:
                        </h4>
                        <pre className="p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto">
                          {this.state.error.technicalDetails}
                        </pre>
                      </div>
                    )}

                    {this.state.error.stack && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">
                          Stack Trace:
                        </h4>
                        <pre className="p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto max-h-32">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}

                    {this.state.error.context && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Context:</h4>
                        <pre className="p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto">
                          {JSON.stringify(this.state.error.context, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Recovery Actions */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                {this.props.enableRetry && this.state.error.isRecoverable && (
                  <Button
                    onClick={this.handleRetry}
                    disabled={
                      this.state.isRecovering ||
                      this.state.retryCount >= (this.props.maxRetries || 3)
                    }
                    className="flex items-center gap-2"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${this.state.isRecovering ? "animate-spin" : ""}`}
                    />
                    {this.state.isRecovering
                      ? "Recovering..."
                      : `Retry (${this.state.retryCount}/${this.props.maxRetries || 3})`}
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
              </div>

              {/* Help Section */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Quick Fixes
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Refresh the page and try again</li>
                  <li>• Clear your browser cache</li>
                  <li>• Check your internet connection</li>
                  <li>• Try using a different browser</li>
                  <li>• Contact support if the issue persists</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
