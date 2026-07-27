"use client";

import React, { Component, type ReactNode, type ErrorInfo } from "react";
import { logger } from "@/utils/logger";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    logger.error("ErrorBoundary caught an error:", { error, errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-6 min-h-[200px] bg-muted/30 rounded-lg">
          <div className="w-12 h-12 mb-4 text-destructive">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-2">
            Something went wrong
          </h3>

          <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>

          {this.props.showDetails && this.state.errorInfo && (
            <details className="w-full max-w-lg mb-4">
              <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                Error details
              </summary>
              <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-48">
                {this.state.error?.stack}
                {"\n\n"}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}

          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
