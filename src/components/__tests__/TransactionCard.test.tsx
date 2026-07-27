import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionCard } from '@/components/TransactionCard';
import type { Transaction } from '@/store/transactionStore';

// Mock dependencies
jest.mock('@/store/transactionStore');
jest.mock('date-fns', () => ({ formatDistanceToNow: () => '2 minutes ago' }));
jest.mock('@/providers/ChainAwareProvider', () => ({
  useChain: () => ({
    getChainName: () => 'Ethereum',
    chainConfig: { blockExplorer: 'https://etherscan.io', color: '#627EEA' },
  }),
}));
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => <div className={className}>{children}</div>,
  CardContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
}));
jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: { value: number }) => <div data-testid="progress" data-value={value} />,
}));
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }: React.PropsWithChildren<{ onClick?: () => void; disabled?: boolean }>) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));
jest.mock('lucide-react', () => ({
  CheckCircle: () => <svg />,
  Clock: () => <svg />,
  XCircle: () => <svg />,
  AlertCircle: () => <svg />,
  ExternalLink: () => <svg />,
  RotateCcw: () => <svg />,
  X: () => <svg />,
}));

// Ethereum tx hash: 0x + 64 hex chars = 66 chars total
const VALID_TX_HASH = '0x' + 'abcdef1234567890'.repeat(4);

const buildTx = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  hash: VALID_TX_HASH,
  type: 'purchase',
  status: 'confirmed',
  chainId: 1,
  from: '0xabc',
  confirmations: 12,
  requiredConfirmations: 12,
  timestamp: Date.now(),
  ...overrides,
});

describe('TransactionCard security', () => {
  let windowOpenSpy: jest.SpyInstance;

  beforeEach(() => {
    windowOpenSpy = jest.fn();
    Object.defineProperty(window, 'open', { value: windowOpenSpy, writable: true, configurable: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('opens explorer URL with noopener,noreferrer for a valid hash', () => {
    render(<TransactionCard transaction={buildTx()} />);
    fireEvent.click(screen.getByText('View'));
    expect(windowOpenSpy).toHaveBeenCalledWith(
      `https://etherscan.io/tx/${VALID_TX_HASH}`,
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('does not open a URL when the transaction hash is malformed', () => {
    render(<TransactionCard transaction={buildTx({ hash: 'not-a-hash' })} />);
    fireEvent.click(screen.getByText('View'));
    expect(windowOpenSpy).not.toHaveBeenCalled();
  });

  it('does not open a URL when the hash contains path-traversal characters', () => {
    render(<TransactionCard transaction={buildTx({ hash: '0x../../etc/passwd' })} />);
    fireEvent.click(screen.getByText('View'));
    expect(windowOpenSpy).not.toHaveBeenCalled();
  });

  it('renders retry button for failed transactions', () => {
    const onRetry = jest.fn();
    render(<TransactionCard transaction={buildTx({ status: 'failed' })} onRetry={onRetry} />);
    fireEvent.click(screen.getByText('Retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders cancel button for pending transactions', () => {
    const onCancel = jest.fn();
    render(
      <TransactionCard
        transaction={buildTx({ status: 'pending', confirmations: 0 })}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('displays a truncated hash to avoid UI overflow', () => {
    const tx = buildTx();
    render(<TransactionCard transaction={tx} />);
    // Component shows first 10 chars + last 8 chars of VALID_TX_HASH
    // VALID_TX_HASH = 0xabcdef1234567890... last 8 = 34567890
    expect(screen.getByText(/0xabcdef12\.\.\.34567890/)).toBeInTheDocument();
  });

  it('displays error message when transaction has an error', () => {
    render(<TransactionCard transaction={buildTx({ status: 'failed', error: 'Insufficient funds' })} />);
    expect(screen.getByText('Insufficient funds')).toBeInTheDocument();
  });
});
