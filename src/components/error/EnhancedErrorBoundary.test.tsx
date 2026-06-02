import React from 'react';
import { render, screen } from '@testing-library/react';
import { EnhancedErrorBoundary, withErrorBoundary, ErrorBoundaryPresets } from '../EnhancedErrorBoundary';
import { ErrorCategory } from '@/types/errors';
import type { AppError } from '@/types/errors';

// Mock child error boundaries
jest.mock('../Web3ErrorBoundary', () => ({
  Web3ErrorBoundary: jest.fn(({ children }) => (
    <div data-testid="Web3ErrorBoundary">{children}</div>
  )),
}));
jest.mock('../NetworkErrorBoundary', () => ({
  NetworkErrorBoundary: jest.fn(({ children }) => (
    <div data-testid="NetworkErrorBoundary">{children}</div>
  )),
}));
jest.mock('../ARErrorBoundary', () => ({
  ARErrorBoundary: jest.fn(({ children }) => (
    <div data-testid="ARErrorBoundary">{children}</div>
  )),
}));
jest.mock('../UIErrorBoundary', () => ({
  UIErrorBoundary: jest.fn(({ children }) => (
    <div data-testid="UIErrorBoundary">{children}</div>
  )),
}));

// Mock ErrorFactory
const mockAppError: AppError = {
  id: 'mock-error-id',
  message: 'Mock Error Message',
  userMessage: 'A user-friendly mock error.',
  category: ErrorCategory.UI,
  severity: 'critical',
  isRecoverable: false,
  technicalDetails: 'Mock technical details',
  stack: 'Mock stack trace',
  context: {},
  timestamp: new Date(),
};
const mockErrorFactory = {
  fromError: jest.fn(() => mockAppError),
};
jest.mock('@/utils/errorFactory', () => ({
  ErrorFactory: mockErrorFactory,
}));

// Mock errorReporting
const mockErrorReporting = {
  reportError: jest.fn(),
  attemptRecovery: jest.fn(),
};
jest.mock('@/utils/errorReporting', () => ({
  errorReporting: mockErrorReporting,
}));

const ThrowError = () => {
  throw new Error('Test Error');
};

describe('EnhancedErrorBoundary', () => {
  const originalConsoleError = console.error;

  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockErrorFactory.fromError.mockReturnValue({ ...mockAppError, category: ErrorCategory.UI });
  });

  it('should render children when no error occurs', () => {
    render(
      <EnhancedErrorBoundary>
        <div data-testid="child-component">Hello</div>
      </EnhancedErrorBoundary>
    );
    expect(screen.getByTestId('child-component')).toBeInTheDocument();
    expect(screen.queryByTestId('UIErrorBoundary')).not.toBeInTheDocument();
  });

  it('should catch errors thrown by children', () => {
    render(
      <EnhancedErrorBoundary>
        <ThrowError />
      </EnhancedErrorBoundary>
    );
    expect(screen.getByTestId('UIErrorBoundary')).toBeInTheDocument();
    expect(mockErrorFactory.fromError).toHaveBeenCalledTimes(2);
  });

  it('should call errorReporting.reportError when an error is caught', () => {
    render(
      <EnhancedErrorBoundary>
        <ThrowError />
      </EnhancedErrorBoundary>
    );
    expect(mockErrorReporting.reportError).toHaveBeenCalledTimes(1);
    expect(mockErrorReporting.reportError).toHaveBeenCalledWith(mockAppError);
  });

  it('should call props.onError if provided when an error is caught', () => {
    const mockOnError = jest.fn();
    render(
      <EnhancedErrorBoundary onError={mockOnError}>
        <ThrowError />
      </EnhancedErrorBoundary>
    );
    expect(mockOnError).toHaveBeenCalledTimes(1);
    expect(mockOnError).toHaveBeenCalledWith(mockAppError);
  });

  it('should delegate to Web3ErrorBoundary when category is WEB3', () => {
    render(
      <EnhancedErrorBoundary category={ErrorCategory.WEB3}>
        <ThrowError />
      </EnhancedErrorBoundary>
    );
    expect(screen.getByTestId('Web3ErrorBoundary')).toBeInTheDocument();
    expect(screen.queryByTestId('UIErrorBoundary')).not.toBeInTheDocument();
  });

  it('should delegate to NetworkErrorBoundary when category is NETWORK', () => {
    render(
      <EnhancedErrorBoundary category={ErrorCategory.NETWORK}>
        <ThrowError />
      </EnhancedErrorBoundary>
    );
    expect(screen.getByTestId('NetworkErrorBoundary')).toBeInTheDocument();
    expect(screen.queryByTestId('UIErrorBoundary')).not.toBeInTheDocument();
  });

  it('should delegate to ARErrorBoundary when category is AR', () => {
    render(
      <EnhancedErrorBoundary category={ErrorCategory.AR}>
        <ThrowError />
      </EnhancedErrorBoundary>
    );
    expect(screen.getByTestId('ARErrorBoundary')).toBeInTheDocument();
    expect(screen.queryByTestId('UIErrorBoundary')).not.toBeInTheDocument();
  });

  it('should delegate to UIErrorBoundary for various UI-related categories', () => {
    const uiCategories = [
      ErrorCategory.UI,
      ErrorCategory.VALIDATION,
      ErrorCategory.PERMISSION,
      ErrorCategory.RESOURCE,
    ];

    uiCategories.forEach((cat) => {
      jest.clearAllMocks();
      render(
        <EnhancedErrorBoundary category={cat}>
          <ThrowError />
        </EnhancedErrorBoundary>
      );
      expect(screen.getByTestId('UIErrorBoundary')).toBeInTheDocument();
    });
  });

  it('should default to UIErrorBoundary if no category prop is provided and category is unknown', () => {
    mockErrorFactory.fromError.mockReturnValue({ ...mockAppError, category: ErrorCategory.UNKNOWN });
    render(
      <EnhancedErrorBoundary>
        <ThrowError />
      </EnhancedErrorBoundary>
    );
    expect(screen.getByTestId('UIErrorBoundary')).toBeInTheDocument();
  });

  it('should render the fallback prop when an error occurs if provided', () => {
    const FallbackComponent = () => <div data-testid="custom-fallback">Custom Fallback</div>;
    render(
      <EnhancedErrorBoundary fallback={<FallbackComponent />}>
        <ThrowError />
      </EnhancedErrorBoundary>
    );
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.queryByTestId('UIErrorBoundary')).not.toBeInTheDocument();
  });

  describe('withErrorBoundary HOC', () => {
    it('should wrap a component and render EnhancedErrorBoundary', () => {
      const MyComponent = () => <div data-testid="my-component">Wrapped Content</div>;
      const Wrapped = withErrorBoundary(MyComponent, { category: ErrorCategory.NETWORK });

      render(
        <Wrapped>
          <ThrowError />
        </Wrapped>
      );
      expect(screen.getByTestId('NetworkErrorBoundary')).toBeInTheDocument();
      expect(screen.queryByTestId('my-component')).not.toBeInTheDocument();
    });
  });

  describe('ErrorBoundaryPresets', () => {
    it('web3 preset should render Web3ErrorBoundary', () => {
      const Web3ErrorTest = () => <ThrowError />;
      render(<ErrorBoundaryPresets.web3><Web3ErrorTest /></ErrorBoundaryPresets.web3>);
      expect(screen.getByTestId('Web3ErrorBoundary')).toBeInTheDocument();
    });

    it('network preset should render NetworkErrorBoundary', () => {
      const NetworkErrorTest = () => <ThrowError />;
      render(<ErrorBoundaryPresets.network><NetworkErrorTest /></ErrorBoundaryPresets.network>);
      expect(screen.getByTestId('NetworkErrorBoundary')).toBeInTheDocument();
    });

    it('ui preset should render UIErrorBoundary', () => {
      const UIErrorTest = () => <ThrowError />;
      render(<ErrorBoundaryPresets.ui><UIErrorTest /></ErrorBoundaryPresets.ui>);
      expect(screen.getByTestId('UIErrorBoundary')).toBeInTheDocument();
    });
  });
});