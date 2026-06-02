'use client';
import { logger } from '@/utils/logger';

import React from 'react';
import { EnhancedErrorBoundary } from './EnhancedErrorBoundary';
import { ErrorCategory } from '@/types/errors';

interface WithRouteErrorBoundaryProps {
  children: React.ReactNode;
  routeName: string;
  category?: ErrorCategory;
  fallback?: React.ReactNode;
  onError?: (error: any) => void;
}

export const WithRouteErrorBoundary: React.FC<WithRouteErrorBoundaryProps> = ({
  children,
  routeName,
  category = ErrorCategory.UI,
  fallback,
  onError,
}) => {
  const handleError = (error: any) => {
    logger.error(`Error in route ${routeName}:`, error);
    
    // Report to monitoring service
    if (typeof window !== 'undefined') {
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errorId: `route-${routeName}-${Date.now()}`,
          category: category,
          severity: 'medium',
          message: error.message || 'Unknown error in route',
          userAgent: window.navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          context: {
            route: routeName,
            stack: error.stack,
          },
        }),
      }).catch(err => {
        logger.error('Failed to report route error:', err);
      });
    }

    if (onError) {
      onError(error);
    }
  };

  return (
    <EnhancedErrorBoundary
      category={category}
      onError={handleError}
      enableRetry={true}
      maxRetries={3}
      fallback={fallback}
    >
      {children}
    </EnhancedErrorBoundary>
  );
};

// HOC for wrapping components
export const withRouteErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    routeName: string;
    category?: ErrorCategory;
    fallback?: React.ReactNode;
  }
) => {
  const WrappedComponent = (props: P) => (
    <WithRouteErrorBoundary
      routeName={options.routeName}
      category={options.category}
      fallback={options.fallback}
    >
      <Component {...props} />
    </WithRouteErrorBoundary>
  );

  WrappedComponent.displayName = `withRouteErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};
