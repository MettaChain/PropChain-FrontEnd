'use client';

import React, { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { ErrorCategory } from '@/types/errors';
import type { AppError } from '@/types/errors';
import { Web3ErrorBoundary } from './Web3ErrorBoundary';
import { NetworkErrorBoundary } from './NetworkErrorBoundary';
import { UIErrorBoundary } from './UIErrorBoundary';
import { ErrorFactory } from '@/utils/errorFactory';
import { errorReporting } from '@/utils/errorReporting';

interface Props {
  children: ReactNode;
  category?: ErrorCategory;
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

interface State {
  hasError: boolean;
  error: AppError | null;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const appError = ErrorFactory.fromError(error);
    return {
      hasError: true,
      error: appError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = this.state.error || ErrorFactory.fromError(error);

    // Report the error to the monitoring service
    errorReporting.reportError(appError);

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(appError);
    }
  }

  private getErrorBoundary = (): ReactNode => {
    const { category, children, onError, ...commonProps } = this.props;

    // Prop category takes precedence, then error-detected category, then UI default
    const activeCategory = category || this.state.error?.category || ErrorCategory.UI;

    // In the error state, do not re-render the (potentially throwing) children
    const content = this.state.hasError ? null : children;

    switch (activeCategory) {
      case ErrorCategory.WEB3:
        return (
          <Web3ErrorBoundary {...commonProps} onError={onError}>
            {content}
          </Web3ErrorBoundary>
        );
      case ErrorCategory.NETWORK:
        return (
          <NetworkErrorBoundary {...commonProps} onError={onError}>
            {content}
          </NetworkErrorBoundary>
        );
      default:
        return (
          <UIErrorBoundary {...commonProps} onError={onError}>
            {content}
          </UIErrorBoundary>
        );
    }
  };

  render() {
    // If no error and no category given, render children directly
    if (!this.state.hasError && !this.props.category) {
      return this.props.children;
    }

    // If an error occurred and a fallback is provided, render the fallback
    if (this.state.hasError && this.props.fallback) {
      return this.props.fallback;
    }

    return this.getErrorBoundary();
  }
}

// HOC for easy usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<Props, 'children'> = {}
) => {
  const WrappedComponent = ({ children, ...props }: P & { children?: React.ReactNode }) => (
    <EnhancedErrorBoundary {...options}>
      <Component {...(props as P)} />
      {children}
    </EnhancedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Presets for common use cases
export const ErrorBoundaryPresets = {
  web3: (props: Omit<Props, 'category'>) => (
    <EnhancedErrorBoundary {...props} category={ErrorCategory.WEB3} />
  ),
  
  network: (props: Omit<Props, 'category'>) => (
    <EnhancedErrorBoundary {...props} category={ErrorCategory.NETWORK} />
  ),
  
  ui: (props: Omit<Props, 'category'>) => (
    <EnhancedErrorBoundary {...props} category={ErrorCategory.UI} />
  ),
  
  validation: (props: Omit<Props, 'category'>) => (
    <EnhancedErrorBoundary {...props} category={ErrorCategory.VALIDATION} />
  ),
  
  authentication: (props: Omit<Props, 'category'>) => (
    <EnhancedErrorBoundary {...props} category={ErrorCategory.AUTHENTICATION} />
  ),
};
