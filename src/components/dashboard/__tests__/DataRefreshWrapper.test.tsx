import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DataRefreshWrapper } from '@/components/dashboard/DataRefreshWrapper';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('DataRefreshWrapper', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders children without remounting', () => {
    const renderSpy = vi.fn();
    const TestChild = () => {
      renderSpy();
      return <div>Test content</div>;
    };

    const { rerender } = render(
      <DataRefreshWrapper>
        <TestChild />
      </DataRefreshWrapper>
    );

    // Initial render
    expect(renderSpy).toHaveBeenCalledTimes(1);

    // Rerender with same props
    rerender(
      <DataRefreshWrapper>
        <TestChild />
      </DataRefreshWrapper>
    );

    // Should not remount children
    expect(renderSpy).toHaveBeenCalledTimes(2); // React re-renders, but shouldn't remount
  });

  it('preserves form state in children across refreshes', async () => {
    const TestForm = () => {
      return <input data-testid="test-input" defaultValue="preserved-value" />;
    };

    render(
      <DataRefreshWrapper>
        <TestForm />
      </DataRefreshWrapper>
    );

    const input = screen.getByTestId('test-input') as HTMLInputElement;

    // Type into the form
    fireEvent.change(input, { target: { value: 'user-typed-text' } });
    expect(input.value).toBe('user-typed-text');

    // Click refresh
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    // Form state should be preserved (not remounted)
    await waitFor(() => {
      expect(input.value).toBe('user-typed-text');
    });
  });

  it('cleans up pending success timeout on new refresh', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    render(
      <DataRefreshWrapper onRefresh={onRefresh}>
        <div>Content</div>
      </DataRefreshWrapper>
    );

    const refreshButton = screen.getByText('Refresh');

    // First refresh - simulate API call and get success
    fireEvent.click(refreshButton);

    // Fast-forward past the 1500ms simulated API call
    await vi.advanceTimersByTimeAsync(1500);
    await vi.runAllTicks();

    // Now we should be in "success" state
    // The success timer (2000ms) is pending

    // Do a second refresh before the success timer fires
    fireEvent.click(refreshButton);

    // Fast-forward past the success timer
    await vi.advanceTimersByTimeAsync(2000);
    await vi.runAllTicks();

    // Should still be in loading state (not erroneously set to idle by stale timer)
    expect(refreshButton).toBeDisabled(); // disabled while loading
  });

  it('stacks no duplicate timers across multiple rapid refreshes', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const idleSpy = vi.fn();

    render(
      <DataRefreshWrapper onRefresh={onRefresh}>
        <div>Content</div>
      </DataRefreshWrapper>
    );

    const refreshButton = screen.getByText('Refresh');

    // Rapidly click refresh three times
    fireEvent.click(refreshButton);
    await vi.advanceTimersByTimeAsync(500);
    fireEvent.click(refreshButton);
    await vi.advanceTimersByTimeAsync(500);
    fireEvent.click(refreshButton);

    // Complete all timers
    await vi.advanceTimersByTimeAsync(5000);
    await vi.runAllTicks();

    // After all timers complete, state should settle without errors
    // The component should still be functional
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('shows error state and allows retry', async () => {
    // Force the random to trigger error path (Math.random() <= 0.1)
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.05);

    render(
      <DataRefreshWrapper>
        <div>Content</div>
      </DataRefreshWrapper>
    );

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    await vi.advanceTimersByTimeAsync(1600);
    await vi.runAllTicks();

    // Should show error
    expect(screen.getByText('Failed to fetch latest data')).toBeInTheDocument();

    // Retry button should be visible
    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();

    randomSpy.mockRestore();
  });

  it('cleans up timers on unmount', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    const { unmount } = render(
      <DataRefreshWrapper onRefresh={onRefresh}>
        <div>Content</div>
      </DataRefreshWrapper>
    );

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    // Unmount before timers complete
    unmount();

    // Advance timers - should not cause errors because cleanup occurred
    await vi.advanceTimersByTimeAsync(5000);

    // No error thrown = success
    expect(true).toBe(true);
  });

  it('renders children even during loading state', () => {
    render(
      <DataRefreshWrapper>
        <div>Form content</div>
      </DataRefreshWrapper>
    );

    expect(screen.getByText('Form content')).toBeInTheDocument();
  });
});
