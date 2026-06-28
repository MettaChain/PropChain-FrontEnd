import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { UIErrorBoundary } from '../UIErrorBoundary';

const ThrowError = () => {
  throw new Error('Test Error');
};

describe('UIErrorBoundary Accessibility', () => {
  // Suppress console.error for expected component stack traces
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('should have a role="alert" container when an error occurs', async () => {
    render(
      <UIErrorBoundary>
        <ThrowError />
      </UIErrorBoundary>
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
  });

  it('should focus the error title when the error boundary catches an error', async () => {
    render(
      <UIErrorBoundary>
        <ThrowError />
      </UIErrorBoundary>
    );

    const title = await screen.findByRole('heading', { level: 2 });
    await waitFor(() => {
      expect(document.activeElement).toBe(title);
    });
  });

  it('should have correct ARIA labels linking title and description', async () => {
    render(
      <UIErrorBoundary>
        <ThrowError />
      </UIErrorBoundary>
    );

    const alert = await screen.findByRole('alert');
    const title = screen.getByRole('heading', { level: 2 });
    const description = screen.getByText(/Test Error/i);

    expect(alert).toHaveAttribute('aria-labelledby', title.id);
    expect(alert).toHaveAttribute('aria-describedby', 'error-boundary-description');
    expect(title.id).toBe('error-boundary-title');
  });
});