import React from 'react';
import { render, screen } from '@testing-library/react';
import { GlobalErrorBoundary, withGlobalErrorBoundary } from '../GlobalErrorBoundary';
import { ErrorFactory } from '@/utils/errorFactory';
import { errorMonitoring } from '@/utils/errorMonitoringService';
import { ErrorCategory, type AppError } from '@/types/errors';

jest.mock('@/utils/errorFactory', () => ({
  ErrorFactory: {
    fromError: jest.fn(),
  },
}));

jest.mock('@/utils/errorMonitoringService', () => ({
  errorMonitoring: {
    monitorError: jest.fn(),
    attemptRecovery: jest.fn(),
  },
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    errorWithStack: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

const mockAppError: AppError = {
  id: 'test-error-id',
  message: 'Test error',
  userMessage: 'Something went wrong',
  category: ErrorCategory.UI,
  severity: 'medium',
  isRecoverable: true,
  shouldReport: true,
  timestamp: new Date(),
};

const ThrowError: React.FC = () => {
  throw new Error('Test error');
};

describe('GlobalErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ErrorFactory.fromError as jest.Mock).mockReturnValue(mockAppError);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when no error occurs', () => {
    render(
      <GlobalErrorBoundary>
        <div>Child content</div>
      </GlobalErrorBoundary>,
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders default error UI when a child throws', () => {
    render(
      <GlobalErrorBoundary>
        <ThrowError />
      </GlobalErrorBoundary>,
    );
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.getByText(/Try Again/i)).toBeInTheDocument();
    expect(screen.getByText('Reset Application')).toBeInTheDocument();
    expect(screen.getByText('Reload Page')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <GlobalErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowError />
      </GlobalErrorBoundary>,
    );
    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('calls onError callback when error is caught', () => {
    const onError = jest.fn();
    render(
      <GlobalErrorBoundary onError={onError}>
        <ThrowError />
      </GlobalErrorBoundary>,
    );
    expect(onError).toHaveBeenCalledWith(mockAppError);
  });

  it('calls errorMonitoring.monitorError on error', () => {
    render(
      <GlobalErrorBoundary>
        <ThrowError />
      </GlobalErrorBoundary>,
    );
    expect(errorMonitoring.monitorError).toHaveBeenCalledWith(mockAppError);
  });

  it('shows userMessage when available', () => {
    (ErrorFactory.fromError as jest.Mock).mockReturnValue({
      ...mockAppError,
      userMessage: 'Custom user message',
    });

    render(
      <GlobalErrorBoundary>
        <ThrowError />
      </GlobalErrorBoundary>,
    );
    expect(screen.getByText('Custom user message')).toBeInTheDocument();
  });

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', configurable: true });

    render(
      <GlobalErrorBoundary>
        <ThrowError />
      </GlobalErrorBoundary>,
    );

    expect(screen.getByText('Error Details')).toBeInTheDocument();

    Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, configurable: true });
  });
});

describe('withGlobalErrorBoundary HOC', () => {
  it('wraps a component with GlobalErrorBoundary', () => {
    const TestComponent = () => <div>Test component</div>;
    const Wrapped = withGlobalErrorBoundary(TestComponent);

    render(<Wrapped />);
    expect(screen.getByText('Test component')).toBeInTheDocument();
  });

  it('sets correct displayName', () => {
    const TestComponent = () => <div>Test</div>;
    const Wrapped = withGlobalErrorBoundary(TestComponent);
    expect(Wrapped.displayName).toBe('withGlobalErrorBoundary(TestComponent)');
  });
});
