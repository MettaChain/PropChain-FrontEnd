import { render, screen } from '@testing-library/react';
import type { Transaction } from '@/store/transactionStore';

jest.mock('jspdf', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('jspdf-autotable', () => ({ __esModule: true, default: jest.fn() }));

jest.mock('@/hooks/useTransactionQuery', () => ({
  useTransactionHistory: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: jest.fn() },
  }),
}));

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn(({ count, estimateSize }: { count: number; estimateSize: () => number }) => ({
    getVirtualItems: () =>
      Array.from({ length: Math.min(count, 10) }, (_, i) => ({
        index: i,
        start: i * estimateSize(),
        end: (i + 1) * estimateSize(),
        size: estimateSize(),
        key: i,
        lane: 0,
      })),
    getTotalSize: () => count * estimateSize(),
  })),
}));

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

import { useTransactionHistory } from '@/hooks/useTransactionQuery';
import { TransactionHistory } from '@/components/TransactionHistory';

function makeTx(i: number): Transaction {
  return {
    id: `tx-${i}`,
    hash: `0x${'a'.repeat(60)}${String(i).padStart(4, '0')}`,
    type: 'purchase',
    status: 'confirmed',
    from: `0x${'b'.repeat(64)}`,
    to: `0x${'c'.repeat(64)}`,
    value: String(i * 0.1),
    gasUsed: '21000',
    gasPrice: '20',
    timestamp: Date.now() - i * 1000,
    chainId: 1,
    confirmations: 12,
    blockNumber: 1000 + i,
  };
}

const mockTransactions = Array.from({ length: 50 }, (_, i) => makeTx(i));

describe('TransactionHistory – virtualization (#502)', () => {
  beforeEach(() => {
    (useTransactionHistory as jest.Mock).mockReturnValue({
      transactions: mockTransactions,
      getTransactionsByType: (type: string) => mockTransactions.filter((t) => t.type === type),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it('renders the transaction list container', () => {
    render(<TransactionHistory />);
    expect(screen.getByTestId('transaction-list')).toBeInTheDocument();
  });

  it('renders only virtualised rows — not all 50 at once', () => {
    render(<TransactionHistory />);
    const rows = screen.getAllByTestId('transaction-item');
    // Virtual window renders ≤ 10 (our mock), not all 50
    expect(rows.length).toBeLessThan(50);
    expect(rows.length).toBeGreaterThan(0);
  });
});
