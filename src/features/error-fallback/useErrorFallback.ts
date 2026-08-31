import { useMemo } from 'react';
import { useErrorFallbackStore } from './errorFallbackStore';

export function useErrorFallback(error: Error) {
  const { isShowingDetails, toggleDetails, reset } = useErrorFallbackStore();

  const friendlyMessage = useMemo(() => {
    // Map cryptic React/JS errors to human-readable ones
    if (error.message.includes('Minified React error')) {
      return 'The application encountered an unexpected state while rendering.';
    }
    if (error.message.includes('Network Error') || error.message.includes('fetch')) {
      return 'We are having trouble connecting to the network. Please check your connection.';
    }
    if (error.message.includes('Cannot read properties of undefined')) {
      return 'Oops! Something went wrong while loading this data.';
    }
    return 'An unexpected error has occurred. Our team has been notified.';
  }, [error.message]);

  return {
    isShowingDetails,
    toggleDetails,
    resetState: reset,
    friendlyMessage
  };
}
