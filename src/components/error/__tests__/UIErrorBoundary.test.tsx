import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UIErrorBoundary } from '../UIErrorBoundary';
import { ErrorFactory } from '@/utils/errorFactory';
import { errorReporting } from '@/utils/errorReporting';
import { logger } from '@/utils/logger';
import { ErrorCategory, type AppError } from '@/types/errors';

jest.mock('@/utils/errorFactory', () => ({
  ErrorFactory: {
    fromError: jest.fn(),
  },
}));

jest.mock('@/utils/errorReporting', () => ({
  errorReporting: {
    reportError: jest.fn(),
    attemptRecovery: jest.fn(),
  },
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: string }) => (
    <div {...props}>{children}</div>
  ),
  AlertDescription: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
}));

const mockAppError: AppError = {
  id: 'ui-error-id',
  message: 'UI error',
  userMessage: 'Something went wrong with the UI',
  category: ErrorCategory.UI,
  severity: 'medium',
  isRecoverable: true,
  shouldReport: true,
  timestamp: new Date(),
};

const ThrowError: React.FC = () => {
  throw new Error('UI test error');
};

describe('UIErrorBoundary', () => {
  let reloadMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (ErrorFactory.fromError as jest.Mock).mockReturnValue(mockAppError);
    (errorReporting.attemptRecovery as jest.Mock).mockResolvedValue(true);

    reloadMock = jest.fn();
    const originalLocation = window.location;
    // @ts-expect-error -- override location.reload
    delete (window as any).location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload: reloadMock, href: '/' },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when no error occurs', () => {
    render(
      <UIErrorBoundary>
        <div>Normal content</div>
      </UIErrorBoundary>,
    );
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('renders error UI when child throws', () => {
    render(
      <UIErrorBoundary>
        <ThrowError />
      </UIErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/UI Error/i)).toBeInTheDocument();
    expect(screen.getByText(/Error ID:/i)).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <UIErrorBoundary fallback={<div>Custom UI fallback</div>}>
        <ThrowError />
      </UIErrorBoundary>,
    );
    expect(screen.getByText('Custom UI fallback')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('calls onError callback when error is caught', () => {
    const onError = jest.fn();
    render(
      <UIErrorBoundary onError={onError}>
        <ThrowError />
      </UIErrorBoundary>,
    );
    expect(onError).toHaveBeenCalledWith(mockAppError);
  });

  it('calls errorReporting.reportError on error', () => {
    render(
      <UIErrorBoundary>
        <ThrowError />
      </UIErrorBoundary>,
    );
    expect(errorReporting.reportError).toHaveBeenCalled();
  });

  it('displays the error user message', () => {
    render(
      <UIErrorBoundary>
        <ThrowError />
      </UIErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong with the UI')).toBeInTheDocument();
  });

  it('shows Go Home button and navigates on click', () => {
    render(
      <UIErrorBoundary>
        <ThrowError />
      </UIErrorBoundary>,
    );
    const homeButton = screen.getByText('Go Home');
    expect(homeButton).toBeInTheDocument();
    fireEvent.click(homeButton);
    expect(window.location.href).toBe('/');
  });

  it('shows retry button when enableRetry is true and error is recoverable', () => {
    render(
      <UIErrorBoundary enableRetry>
        <ThrowError />
      </UIErrorBoundary>,
    );
    expect(screen.getByText(/Retry/)).toBeInTheDocument();
  });

  it('shows Quick Fixes section', () => {
    render(
      <UIErrorBoundary>
        <ThrowError />
      </UIErrorBoundary>,
    );
    expect(screen.getByText('Quick Fixes')).toBeInTheDocument();
    expect(screen.getByText(/Refresh the page and try again/i)).toBeInTheDocument();
  });

  it('shows error history when multiple errors occur', async () => {
    (errorReporting.attemptRecovery as jest.Mock).mockResolvedValue(false);

    let throwCount = 0;
    const ThrowMultiple: React.FC = () => {
      throwCount++;
      if (throwCount <= 2) throw new Error('Multiple error');
      return <div>Recovered</div>;
    };

    const { rerender } = render(
      <UIErrorBoundary enableRetry>
        <ThrowMultiple />
      </UIErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Retry/));
    await waitFor(() => {
      expect(screen.getByText(/Retry/)).toBeInTheDocument();
    });

    rerender(
      <UIErrorBoundary enableRetry>
        <ThrowMultiple />
      </UIErrorBoundary>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Error History/)).toBeInTheDocument();
    });
  });

  it('shows graceful degradation fallback when configured', () => {
    render(
      <UIErrorBoundary
        gracefulDegradation={{
          fallbackComponent: <div>Degraded UI</div>,
        }}
      >
        <ThrowError />
      </UIErrorBoundary>,
    );
    expect(screen.getByText('Degraded UI')).toBeInTheDocument();
  });
});
