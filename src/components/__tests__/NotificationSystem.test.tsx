import React from 'react';
import { render } from '@testing-library/react';
import { NotificationSystem } from '@/components/NotificationSystem';
import { useTransactionStore } from '@/store/transactionStore';
import type { Transaction } from '@/store/transactionStore';

// Mock the transaction store
jest.mock('@/store/transactionStore', () => ({
  useTransactionStore: jest.fn(),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  CheckCircle: () => <svg data-testid="icon-check" />,
  XCircle: () => <svg data-testid="icon-x-circle" />,
  AlertCircle: () => <svg data-testid="icon-alert" />,
  Clock: () => <svg data-testid="icon-clock" />,
}));

const mockUseTransactionStore = useTransactionStore as jest.MockedFunction<typeof useTransactionStore>;

const buildTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  hash: '0xabcdef1234567890',
  type: 'purchase',
  status: 'pending',
  chainId: 1,
  from: '0xabc',
  confirmations: 0,
  requiredConfirmations: 12,
  timestamp: Date.now(),
  ...overrides,
});

describe('NotificationSystem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockUseTransactionStore.mockReturnValue({ transactions: [] } as ReturnType<typeof useTransactionStore>);
  });

  it('renders nothing (null) to the DOM', () => {
    const { container } = render(<NotificationSystem />);
    expect(container.firstChild).toBeNull();
  });

  it('matches snapshot when there are no transactions', () => {
    const { container } = render(<NotificationSystem />);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot with a confirmed transaction', () => {
    const tx = buildTransaction({ id: 'tx-confirmed', status: 'confirmed' });
    mockUseTransactionStore.mockReturnValue({ transactions: [tx] } as ReturnType<typeof useTransactionStore>);
    const { container } = render(<NotificationSystem />);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot with a failed transaction', () => {
    const tx = buildTransaction({ id: 'tx-failed', status: 'failed' });
    mockUseTransactionStore.mockReturnValue({ transactions: [tx] } as ReturnType<typeof useTransactionStore>);
    const { container } = render(<NotificationSystem />);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot with a cancelled transaction', () => {
    const tx = buildTransaction({ id: 'tx-cancelled', status: 'cancelled' });
    mockUseTransactionStore.mockReturnValue({ transactions: [tx] } as ReturnType<typeof useTransactionStore>);
    const { container } = render(<NotificationSystem />);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot with multiple transactions in different states', () => {
    const transactions: Transaction[] = [
      buildTransaction({ id: 'tx-1', status: 'confirmed' }),
      buildTransaction({ id: 'tx-2', status: 'failed' }),
      buildTransaction({ id: 'tx-3', status: 'pending' }),
    ];
    mockUseTransactionStore.mockReturnValue({ transactions } as ReturnType<typeof useTransactionStore>);
    const { container } = render(<NotificationSystem />);
    expect(container).toMatchSnapshot();
  });

  it('fires toast.success for a confirmed transaction not yet notified', () => {
    const { toast } = require('sonner');
    const tx = buildTransaction({ id: 'tx-new-confirmed', status: 'confirmed', description: 'Buy tokens' });
    mockUseTransactionStore.mockReturnValue({ transactions: [tx] } as ReturnType<typeof useTransactionStore>);
    render(<NotificationSystem />);
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it('fires toast.error for a failed transaction not yet notified', () => {
    const { toast } = require('sonner');
    const tx = buildTransaction({ id: 'tx-new-failed', status: 'failed' });
    mockUseTransactionStore.mockReturnValue({ transactions: [tx] } as ReturnType<typeof useTransactionStore>);
    render(<NotificationSystem />);
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it('does not fire toast for an already-notified transaction', () => {
    const { toast } = require('sonner');
    const tx = buildTransaction({ id: 'tx-already', status: 'confirmed' });
    localStorage.setItem('notified_tx-already', 'true');
    mockUseTransactionStore.mockReturnValue({ transactions: [tx] } as ReturnType<typeof useTransactionStore>);
    render(<NotificationSystem />);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('does not fire toast for pending transactions', () => {
    const { toast } = require('sonner');
    const tx = buildTransaction({ id: 'tx-pending', status: 'pending' });
    mockUseTransactionStore.mockReturnValue({ transactions: [tx] } as ReturnType<typeof useTransactionStore>);
    render(<NotificationSystem />);
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.info).not.toHaveBeenCalled();
    expect(toast.warning).not.toHaveBeenCalled();
  });
});
