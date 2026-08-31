import React, { useEffect } from 'react';
import { ErrorFallbackProps } from './errorFallbackTypes';
import { useErrorFallback } from './useErrorFallback';

export function ErrorFallback({ error, resetErrorBoundary, showDetails = false }: ErrorFallbackProps) {
  const { isShowingDetails, toggleDetails, resetState, friendlyMessage } = useErrorFallback(error);

  useEffect(() => {
    // Reset state on mount
    resetState();
  }, [resetState]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-gray-50 rounded-lg border border-gray-200">
      <div className="text-red-500 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-gray-600 mb-6 max-w-md">{friendlyMessage}</p>
      
      <div className="flex space-x-4">
        <button
          onClick={resetErrorBoundary}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Try Again
        </button>
        {showDetails && (
          <button
            onClick={toggleDetails}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            {isShowingDetails ? 'Hide Details' : 'Show Details'}
          </button>
        )}
      </div>

      {isShowingDetails && showDetails && (
        <div className="mt-8 w-full max-w-2xl text-left">
          <div className="bg-gray-900 rounded-md p-4 overflow-auto max-h-64">
            <p className="text-red-400 font-mono text-sm mb-2">{error.name}: {error.message}</p>
            <pre className="text-gray-400 font-mono text-xs whitespace-pre-wrap">{error.stack}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
