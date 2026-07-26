export interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  showDetails?: boolean;
}

export interface FriendlyErrorState {
  isShowingDetails: boolean;
  friendlyMessage: string;
}
