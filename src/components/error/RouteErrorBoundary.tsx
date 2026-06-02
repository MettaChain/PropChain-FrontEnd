'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, RefreshCw, AlertTriangle, Search } from 'lucide-react';
import type { AppError } from '@/types/errors';
import { ErrorCategory } from '@/types/errors';
import { getWalletErrorMessage } from '@/utils/errorHandling';

interface RouteErrorBoundaryProps {
  error: AppError;
  routeName: string;
  resetError: () => void;
}

interface RouteErrorFallbackProps {
  error: AppError;
  routeName: string;
  onRetry: () => void;
  onNavigateHome: () => void;
}

const RouteErrorFallback: React.FC<RouteErrorFallbackProps> = ({
  error,
  routeName,
  onRetry,
  onNavigateHome,
}) => {
  const getErrorIcon = () => {
    switch (error.category) {
      case ErrorCategory.WEB3:
        return (
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
        );
      case ErrorCategory.NETWORK:
        return (
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        );
      default:
        return (
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-gray-600 dark:text-gray-400" />
          </div>
        );
    }
  };

  const getErrorTitle = () => {
    switch (error.category) {
      case ErrorCategory.WEB3:
        return 'Wallet Connection Error';
      case ErrorCategory.NETWORK:
        return 'Network Error';
      case ErrorCategory.VALIDATION:
        return 'Validation Error';
      case ErrorCategory.PERMISSION:
        return 'Permission Error';
      case ErrorCategory.AUTHENTICATION:
        return 'Authentication Error';
      default:
        return 'Something went wrong';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          {getErrorIcon()}

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {getErrorTitle()}
          </h1>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {getWalletErrorMessage(error)}
          </p>

          <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Error in: <span className="font-medium">{routeName}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            
            <button
              onClick={onNavigateHome}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go Home
            </button>

            <Link href="/properties" className="sm:col-span-2">
              <button className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-transparent hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                <Search className="w-4 h-4" />
                Browse All Properties
              </button>
            </Link>
          </div>

          {process.env.NODE_ENV === 'development' && error.context && (
            <details className="mt-6 text-left">
              <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                Error Details
              </summary>
              <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300 overflow-auto">
                {JSON.stringify(error.context, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

export const RouteErrorBoundary: React.FC<RouteErrorBoundaryProps> = ({
  error,
  routeName,
  resetError,
}) => {
  const router = useRouter();

  const handleRetry = () => {
    resetError();
  };

  const handleNavigateHome = () => {
    router.push('/');
    resetError();
  };

  return (
    <RouteErrorFallback
      error={error}
      routeName={routeName}
      onRetry={handleRetry}
      onNavigateHome={handleNavigateHome}
    />
  );
};
