'use client';

import React, { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { ErrorCategory } from '@/types/errors';
import type { AppError } from '@/types/errors';
import { Web3ErrorBoundary } from './Web3ErrorBoundary';
import { NetworkErrorBoundary } from './NetworkErrorBoundary';
import { ARErrorBoundary } from './ARErrorBoundary';
import { UIErrorBoundary } from './UIErrorBoundary';
import { ErrorFactory } from '@/utils/errorFactory';

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
    const appError = ErrorFactory.fromError(error, this.props.category, {
      componentStack: errorInfo.componentStack || undefined,
      context: {
        errorBoundary: 'EnhancedErrorBoundary',
        errorInfo,
        specifiedCategory: this.props.category,
      },
    });

    this.setState({ error: appError });

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(appError);
    }
  }

  private getErrorBoundary = (): ReactNode => {
    const { category, ...commonProps } = this.props;

    // If category is specified, use the specific boundary
    if (category) {
      switch (category) {
        case ErrorCategory.WEB3:
          return (
            <Web3ErrorBoundary
              {...commonProps}
              onError={this.props.onError}
            >
              {this.props.children}
            </Web3ErrorBoundary>
          );
        
        case ErrorCategory.NETWORK:
          return (
            <NetworkErrorBoundary
              {...commonProps}
              onError={this.props.onError}
            >
              {this.props.children}
            </NetworkErrorBoundary>
          );
        
        case ErrorCategory.AR:
          return (
            <ARErrorBoundary
              {...commonProps}
              onError={this.props.onError}
            >
              {this.props.children}
            </ARErrorBoundary>
          );
        
        case ErrorCategory.UI:
        case ErrorCategory.VALIDATION:
        case ErrorCategory.PERMISSION:
        case ErrorCategory.RESOURCE:
          return (
            <UIErrorBoundary
              {...commonProps}
              onError={this.props.onError}
            >
              {this.props.children}
            </UIErrorBoundary>
          );
        
        default:
          return (
            <UIErrorBoundary
              {...commonProps}
              onError={this.props.onError}
            >
              {this.props.children}
            </UIErrorBoundary>
          );
      }
    }

    // Auto-detect category based on error
    if (this.state.hasError && this.state.error) {
      return this.getErrorBoundary();
    }

    // Default to UI boundary for general protection
    return (
      <UIErrorBoundary
        {...commonProps}
        onError={this.props.onError}
      >
        {this.props.children}
      </UIErrorBoundary>
    );
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Return the appropriate error boundary based on error category
      return this.getErrorBoundary();
    }

    // If no category specified, use auto-detection
    if (!this.props.category) {
      return this.getErrorBoundary();
    }

    // Return the specific boundary for the category
    return this.getErrorBoundary();
  }
}

// HOC for easy usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<Props, 'children'> = {}
) => {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary {...options}>
      <Component {...props} />
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
  
  ar: (props: Omit<Props, 'category'>) => (
    <EnhancedErrorBoundary {...props} category={ErrorCategory.AR} />
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
