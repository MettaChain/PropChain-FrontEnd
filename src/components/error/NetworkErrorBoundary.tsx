"use client";

import React, {
  Component,
  ReactNode,
} from "react";
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AppError,
  ErrorBoundaryState,
  ErrorRecoveryAction,
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
  retryDelay?: number;
}

interface State extends ErrorBoundaryState {
  isOnline: boolean;
  lastSuccessfulFetch: Date | null;
}

export class NetworkErrorBoundary extends Component<Props, State> {
  private retryTimeout: NodeJS.Timeout | null = null;
  private onlineCheckInterval: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0,
      isRecovering: false,
      isOnline: typeof window !== "undefined" ? navigator.onLine : true,
      lastSuccessfulFetch: null,
    };
  }

  componentDidMount() {
    // Set up online/offline listeners
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);

      // Start periodic online check
      this.onlineCheckInterval = setInterval(this.checkOnlineStatus, 30000);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    if (this.onlineCheckInterval) {
      clearInterval(this.onlineCheckInterval);
    }

    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const appError = ErrorFactory.fromError(error, "network" as any);
    return {
      hasError: true,
      error: appError,
      errorId: appError.id,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const appError = ErrorFactory.fromError(error, "network" as any, {
      componentStack: errorInfo.componentStack || undefined,
      context: {
        errorBoundary: "NetworkErrorBoundary",
        errorInfo,
        isOnline: this.state.isOnline,
        lastSuccessfulFetch: this.state.lastSuccessfulFetch,
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
    });
  }

  private handleOnline = () => {
    this.setState({ isOnline: true });

    // Automatically retry when coming back online
    if (this.state.hasError && this.state.error?.isRecoverable) {
      this.handleRetry();
    }
  };

  private handleOffline = () => {
    this.setState({ isOnline: false });
  };

  private checkOnlineStatus = async () => {
    if (typeof window === "undefined") return;

    try {
      const response = await fetch("/api/health", {
        method: "HEAD",
        cache: "no-cache",
      });

      if (response.ok) {
        this.setState({ isOnline: true, lastSuccessfulFetch: new Date() });
      } else {
        this.setState({ isOnline: false });
      }
    } catch (error) {
      this.setState({ isOnline: false });
    }
  };

  private handleRetry = async () => {
    if (!this.state.error || !this.state.error.isRecoverable) {
      return;
    }

    const maxRetries = this.props.maxRetries || 5;
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
          lastSuccessfulFetch: new Date(),
        });
      } else {
        // Schedule retry with exponential backoff
        const delay =
          this.props.retryDelay ||
          Math.min(1000 * Math.pow(2, this.state.retryCount), 30000);

        this.retryTimeout = setTimeout(() => {
          this.setState((prevState) => ({
            retryCount: prevState.retryCount + 1,
            isRecovering: false,
          }));
        }, delay);
      }
    } catch (recoveryError) {
      console.error("Network recovery failed:", recoveryError);
      this.setState({ isRecovering: false });
    }
  };

  private getConnectionStatus = () => {
    if (!this.state.isOnline) {
      return {
        icon: <WifiOff className="w-5 h-5" />,
        status: "Offline",
        color: "text-red-600",
        bgColor: "bg-red-100 dark:bg-red-900/20",
      };
    }

    if (this.state.isRecovering) {
      return {
        icon: <RefreshCw className="w-5 h-5 animate-spin" />,
        status: "Reconnecting...",
        color: "text-blue-600",
        bgColor: "bg-blue-100 dark:bg-blue-900/20",
      };
    }

    return {
      icon: <Wifi className="w-5 h-5" />,
      status: "Online",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    };
  };

  render() {
    const connectionStatus = this.getConnectionStatus();

    // Show connection status indicator when offline
    if (!this.state.isOnline && !this.state.hasError) {
      return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-2">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">
              You're offline. Some features may not be available.
            </span>
          </div>
        </div>
      );
    }

    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-orange-200 dark:border-orange-800">
            <div className="p-6">
              {/* Connection Status */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-12 h-12 ${connectionStatus.bgColor} rounded-full flex items-center justify-center`}
                >
                  <div className={connectionStatus.color}>
                    {connectionStatus.icon}
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Network Error
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {connectionStatus.status} • Error ID: {this.state.errorId}
                  </p>
                </div>
              </div>

              {/* Error Message */}
              <Alert variant="default" className="mb-6">
                <AlertDescription className="text-sm">
                  {this.state.error.userMessage ||
                    "Network connection issue detected. Please check your internet connection."}
                </AlertDescription>
              </Alert>

              {/* Retry Information */}
              {this.state.retryCount > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Retry attempt {this.state.retryCount} of{" "}
                    {this.props.maxRetries || 5}.
                    {this.state.isRecovering
                      ? " Reconnecting..."
                      : " Will retry automatically..."}
                  </p>
                </div>
              )}

              {/* Recovery Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                {this.props.enableRetry && this.state.error.isRecoverable && (
                  <Button
                    onClick={this.handleRetry}
                    disabled={
                      this.state.isRecovering ||
                      this.state.retryCount >= (this.props.maxRetries || 5)
                    }
                    className="flex items-center gap-2"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${this.state.isRecovering ? "animate-spin" : ""}`}
                    />
                    {this.state.isRecovering
                      ? "Reconnecting..."
                      : "Retry Connection"}
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </Button>
              </div>

              {/* Network Diagnostics */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Connection Diagnostics
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Status:
                    </span>
                    <span className={`font-medium ${connectionStatus.color}`}>
                      {connectionStatus.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Retries:
                    </span>
                    <span className="font-medium">
                      {this.state.retryCount}/{this.props.maxRetries || 5}
                    </span>
                  </div>
                  {this.state.lastSuccessfulFetch && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Last Success:
                      </span>
                      <span className="font-medium">
                        {this.state.lastSuccessfulFetch.toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Help Tips */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Connection Tips
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Check your internet connection</li>
                  <li>• Try switching between WiFi and mobile data</li>
                  <li>• Restart your router if needed</li>
                  <li>• Check if other websites are accessible</li>
                  <li>• Contact your ISP if the issue persists</li>
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
