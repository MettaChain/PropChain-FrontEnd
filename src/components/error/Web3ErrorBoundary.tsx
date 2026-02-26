"use client";

import React, {
  Component,
} from "react";
import type {
  ReactNode,
  ErrorInfo,
} from "react";
import {
  AlertTriangle,
  RefreshCw,
  Link as LinkIcon,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { logger } from "@/utils/logger";
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

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError) => void;
  enableRetry?: boolean;
  maxRetries?: number;
}

interface State extends ErrorBoundaryState {
  recoveryAction?: ErrorRecoveryAction | null;
}

export class Web3ErrorBoundary extends Component<Props, State> {
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0,
      isRecovering: false,
      recoveryAction: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const appError = ErrorFactory.fromError(error, ErrorCategory.WEB3);
    return {
      hasError: true,
      error: appError,
      errorId: appError.id,
      recoveryAction: appError.recoveryAction || null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = ErrorFactory.fromError(error, ErrorCategory.WEB3, {
      componentStack: errorInfo.componentStack || undefined,
      context: {
        errorBoundary: "Web3ErrorBoundary",
        errorInfo,
      },
    });

    // Report error
    errorReporting.reportError(appError);

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(appError);
    }

    this.setState({
      error: appError,
      errorId: appError.id,
      recoveryAction: appError.recoveryAction,
    });
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach((timeout) => clearTimeout(timeout));
  }

  private handleRetry = async (): Promise<boolean> => {
    if (!this.state.error || !this.state.error.isRecoverable) {
      return false;
    }

    const maxRetries = this.props.maxRetries || 3;
    if (this.state.retryCount >= maxRetries) {
      return false;
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
          recoveryAction: null,
        });
        return true;
      } else {
        // Increment retry count and show error again
        this.setState((prevState) => ({
          retryCount: prevState.retryCount + 1,
          isRecovering: false,
        }));
        return false;
      }
    } catch (recoveryError) {
      logger.error("Recovery failed:", recoveryError);
      this.setState({ isRecovering: false });
      return false;
    }
  };

  private handleReconnect = () => {
    // Clear local storage and reload
    if (typeof window !== "undefined") {
      localStorage.removeItem("walletconnected");
      localStorage.removeItem("wagmi.connected");
    }
    window.location.reload();
  };

  private handleSwitchNetwork = () => {
    // Trigger network switch dialog
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
    }
  };

  private getRecoveryButton = () => {
    if (!this.state.error?.recoveryAction || !this.props.enableRetry) {
      return null;
    }

    const { t } = useTranslation("common");

    switch (this.state.error.recoveryAction) {
      case ErrorRecoveryAction.RETRY:
        return (
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
        );

      case ErrorRecoveryAction.RECONNECT:
        return (
          <Button
            onClick={this.handleReconnect}
            className="flex items-center gap-2"
          >
            <LinkIcon className="w-4 h-4" />
            Reconnect Wallet
          </Button>
        );

      case ErrorRecoveryAction.SWITCH_NETWORK:
        return (
          <Button
            onClick={this.handleSwitchNetwork}
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Switch Network
          </Button>
        );

      default:
        return null;
    }
  };

  private getErrorMessage = () => {
    if (!this.state.error) {
      return "An unknown error occurred";
    }

    const { t } = useTranslation("common");

    // Use user-friendly message if available
    if (this.state.error.userMessage) {
      return this.state.error.userMessage;
    }

    // Fallback to technical message
    return this.state.error.message;
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
        return "default";
      default:
        return "default";
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-100 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-red-200 dark:border-red-800">
            <div className="p-6">
              {/* Error Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Blockchain Error
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Error ID: {this.state.errorId}
                  </p>
                </div>
              </div>

              {/* Error Message */}
              <Alert variant={this.getErrorSeverity()} className="mb-6">
                <AlertDescription className="text-sm">
                  {this.getErrorMessage()}
                </AlertDescription>
              </Alert>

              {/* Technical Details (Development) */}
              {process.env.NODE_ENV === "development" &&
                this.state.error.technicalDetails && (
                  <details className="mb-6">
                    <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                      Technical Details
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto">
                      {this.state.error.technicalDetails}
                    </pre>
                  </details>
                )}

              {/* Recovery Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                {this.getRecoveryButton()}

                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </Button>
              </div>

              {/* Additional Help */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Need Help?
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Ensure your wallet is unlocked and connected</li>
                  <li>• Check if you're on the correct network</li>
                  <li>• Verify you have sufficient gas fees</li>
                  <li>• Try refreshing the page and reconnecting</li>
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
