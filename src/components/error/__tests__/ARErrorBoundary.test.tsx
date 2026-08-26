import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ARErrorBoundary } from '../ARErrorBoundary';
import { ErrorFactory } from '@/utils/errorFactory';
import { errorReporting } from '@/utils/errorReporting';
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

jest.mock('lucide-react', () => {
  const React = require('react');
  return {
    Camera: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-camera" {...props} />,
    Smartphone: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-smartphone" {...props} />,
    AlertTriangle: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-alert" {...props} />,
    RefreshCw: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-refresh" {...props} />,
  };
});

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
  id: 'ar-error-id',
  message: 'AR error',
  userMessage: 'AR feature error message',
  category: ErrorCategory.UI,
  severity: 'medium',
  isRecoverable: true,
  shouldReport: true,
  timestamp: new Date(),
};

const ThrowError: React.FC = () => {
  throw new Error('AR test error');
};

describe('ARErrorBoundary', () => {
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
      value: { ...originalLocation, reload: reloadMock },
    });

    Object.defineProperty(window.navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: jest.fn().mockRejectedValue(new Error('Not supported')),
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows AR not supported warning when device lacks AR capabilities', () => {
    render(
      <ARErrorBoundary>
        <div>AR content</div>
      </ARErrorBoundary>,
    );
    expect(screen.getByText('AR Not Supported')).toBeInTheDocument();
    expect(screen.getByText(/Your device doesn't support augmented reality/)).toBeInTheDocument();
  });

  it('shows device requirements in AR warning', () => {
    render(
      <ARErrorBoundary>
        <div>AR content</div>
      </ARErrorBoundary>,
    );
    expect(screen.getByText('Device Requirements:')).toBeInTheDocument();
    expect(screen.getByText('Camera Access')).toBeInTheDocument();
    expect(screen.getByText('Gyroscope')).toBeInTheDocument();
    expect(screen.getByText('Accelerometer')).toBeInTheDocument();
  });

  it('shows refresh page button in AR warning', () => {
    render(
      <ARErrorBoundary>
        <div>AR content</div>
      </ARErrorBoundary>,
    );
    expect(screen.getByText('Refresh Page')).toBeInTheDocument();
  });

  it('renders AR error UI when child throws', () => {
    render(
      <ARErrorBoundary>
        <ThrowError />
      </ARErrorBoundary>,
    );
    expect(screen.getByText('AR Feature Error')).toBeInTheDocument();
    expect(screen.getByText(/Error ID:/i)).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ARErrorBoundary fallback={<div>AR custom fallback</div>}>
        <ThrowError />
      </ARErrorBoundary>,
    );
    expect(screen.getByText('AR custom fallback')).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn();
    render(
      <ARErrorBoundary onError={onError}>
        <ThrowError />
      </ARErrorBoundary>,
    );
    expect(onError).toHaveBeenCalledWith(mockAppError);
  });

  it('calls errorReporting.reportError on error', () => {
    render(
      <ARErrorBoundary>
        <ThrowError />
      </ARErrorBoundary>,
    );
    expect(errorReporting.reportError).toHaveBeenCalled();
  });

  it('shows user message in the error alert', () => {
    render(
      <ARErrorBoundary>
        <ThrowError />
      </ARErrorBoundary>,
    );
    expect(screen.getByText('AR feature error message')).toBeInTheDocument();
  });

  it('shows AR troubleshooting tips', () => {
    render(
      <ARErrorBoundary>
        <ThrowError />
      </ARErrorBoundary>,
    );
    expect(screen.getByText('AR Troubleshooting')).toBeInTheDocument();
    expect(screen.getByText(/Ensure camera permissions are granted/)).toBeInTheDocument();
  });

  it('shows device information section in error state', () => {
    render(
      <ARErrorBoundary>
        <ThrowError />
      </ARErrorBoundary>,
    );
    expect(screen.getByText('Device Information')).toBeInTheDocument();
    expect(screen.getByText('AR Support:')).toBeInTheDocument();
  });

  it('shows reload page button in error state', () => {
    render(
      <ARErrorBoundary>
        <ThrowError />
      </ARErrorBoundary>,
    );
    expect(screen.getByText('Reload Page')).toBeInTheDocument();
  });
});
