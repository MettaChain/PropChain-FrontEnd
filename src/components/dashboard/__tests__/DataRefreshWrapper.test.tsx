import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { DataRefreshWrapper } from '@/components/dashboard/DataRefreshWrapper';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('DataRefreshWrapper – #501 (no simulation)', () => {
  it('renders children', () => {
    render(
      <DataRefreshWrapper>
        <div>Content</div>
      </DataRefreshWrapper>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('calls onRefresh and shows success — no timer simulation', async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);

    render(
      <DataRefreshWrapper onRefresh={onRefresh}>
        <div>Content</div>
      </DataRefreshWrapper>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Refresh'));
    });

    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Data refreshed successfully')).toBeInTheDocument();
  });

  it('shows error state when onRefresh rejects', async () => {
    const onRefresh = jest.fn().mockRejectedValue(new Error('Network error'));

    render(
      <DataRefreshWrapper onRefresh={onRefresh}>
        <div>Content</div>
      </DataRefreshWrapper>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Refresh'));
    });

    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('success state clears after 2 seconds', async () => {
    jest.useFakeTimers();
    const onRefresh = jest.fn().mockResolvedValue(undefined);

    render(
      <DataRefreshWrapper onRefresh={onRefresh}>
        <div>Content</div>
      </DataRefreshWrapper>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Refresh'));
    });

    expect(screen.getByText('Data refreshed successfully')).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.queryByText('Data refreshed successfully')).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it('preserves child state across refresh', async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);

    render(
      <DataRefreshWrapper onRefresh={onRefresh}>
        <input data-testid="input" defaultValue="preserved" />
      </DataRefreshWrapper>
    );

    const input = screen.getByTestId('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'typed' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Refresh'));
    });

    expect(input.value).toBe('typed');
  });
});
