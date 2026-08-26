import React from 'react';
import { render, screen } from '@testing-library/react';
import { WithRouteErrorBoundary, withRouteErrorBoundary } from '../withRouteErrorBoundary';
import { ErrorCategory } from '@/types/errors';

jest.mock('@/utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

jest.mock('../EnhancedErrorBoundary', () => ({
  EnhancedErrorBoundary: jest.fn(({ children, category, onError, enableRetry, maxRetries, fallback }) => (
    <div data-testid="enhanced-error-boundary" data-category={category}>
      {children}
    </div>
  )),
}));

describe('WithRouteErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children inside EnhancedErrorBoundary', () => {
    render(
      <WithRouteErrorBoundary routeName="TestRoute">
        <div>Route content</div>
      </WithRouteErrorBoundary>,
    );
    expect(screen.getByText('Route content')).toBeInTheDocument();
    expect(screen.getByTestId('enhanced-error-boundary')).toBeInTheDocument();
  });

  it('passes default UI category to EnhancedErrorBoundary', () => {
    render(
      <WithRouteErrorBoundary routeName="TestRoute">
        <div>Content</div>
      </WithRouteErrorBoundary>,
    );
    expect(screen.getByTestId('enhanced-error-boundary')).toHaveAttribute(
      'data-category',
      ErrorCategory.UI,
    );
  });

  it('passes custom category to EnhancedErrorBoundary', () => {
    render(
      <WithRouteErrorBoundary routeName="TestRoute" category={ErrorCategory.NETWORK}>
        <div>Content</div>
      </WithRouteErrorBoundary>,
    );
    expect(screen.getByTestId('enhanced-error-boundary')).toHaveAttribute(
      'data-category',
      ErrorCategory.NETWORK,
    );
  });
});

describe('withRouteErrorBoundary HOC', () => {
  it('wraps a component with WithRouteErrorBoundary', () => {
    const TestComponent = () => <div>HOC wrapped content</div>;
    const Wrapped = withRouteErrorBoundary(TestComponent, { routeName: 'Dashboard' });

    render(<Wrapped />);
    expect(screen.getByText('HOC wrapped content')).toBeInTheDocument();
    expect(screen.getByTestId('enhanced-error-boundary')).toBeInTheDocument();
  });

  it('sets correct displayName', () => {
    const TestComponent = () => <div>Test</div>;
    const Wrapped = withRouteErrorBoundary(TestComponent, { routeName: 'Settings' });
    expect(Wrapped.displayName).toBe('withRouteErrorBoundary(TestComponent)');
  });

  it('preserves existing displayName', () => {
    const TestComponent = () => <div>Test</div>;
    TestComponent.displayName = 'MyCustomComponent';
    const Wrapped = withRouteErrorBoundary(TestComponent, { routeName: 'Profile' });
    expect(Wrapped.displayName).toBe('withRouteErrorBoundary(MyCustomComponent)');
  });
});
