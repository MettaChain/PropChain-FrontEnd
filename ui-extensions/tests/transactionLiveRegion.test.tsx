import { act, render, screen } from '@testing-library/react';

import TransactionLiveRegion, {
  DEFAULT_TRANSACTION_DEBOUNCE_MS,
  DEFAULT_TRANSACTION_MESSAGES,
  formatTransactionAnnouncement,
  isUrgentStatus,
  shortHash,
} from '../components/TransactionLiveRegion';

const HASH = '0x9f8e7d6c5b4a39281706f5e4d3c2b1a09f8e7d6c5b4a39281706f5e4d3c2b1a0';

const advance = (ms: number) =>
  act(() => {
    jest.advanceTimersByTime(ms);
  });

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('shortHash', () => {
  it('keeps both ends of the hash', () => {
    expect(shortHash(HASH)).toBe('0x9f8e…b1a0');
    expect(shortHash(HASH, 4, 2)).toBe('0x9f…a0');
  });

  it('leaves short values untouched', () => {
    expect(shortHash('0xabc')).toBe('0xabc');
  });
});

describe('isUrgentStatus', () => {
  it('only treats failures as urgent', () => {
    expect(isUrgentStatus('failed')).toBe(true);
    expect(isUrgentStatus('pending')).toBe(false);
    expect(isUrgentStatus('confirmed')).toBe(false);
  });
});

describe('formatTransactionAnnouncement', () => {
  it('has a default message per status', () => {
    expect(Object.keys(DEFAULT_TRANSACTION_MESSAGES)).toEqual(['pending', 'confirmed', 'failed']);
  });

  it('substitutes the shortened hash', () => {
    expect(formatTransactionAnnouncement('pending', { hash: HASH })).toBe(
      'Transaction pending. Hash 0x9f8e…b1a0.',
    );
    expect(formatTransactionAnnouncement('confirmed', { hash: HASH })).toBe(
      'Transaction confirmed. Hash 0x9f8e…b1a0.',
    );
  });

  it('includes the failure reason without leaving a double space', () => {
    expect(formatTransactionAnnouncement('failed', { hash: HASH, error: 'Insufficient gas' })).toBe(
      'Transaction failed. Hash 0x9f8e…b1a0. Insufficient gas',
    );
    expect(formatTransactionAnnouncement('failed', { hash: HASH })?.toString()).toBe(
      'Transaction failed. Hash 0x9f8e…b1a0.',
    );
    expect(formatTransactionAnnouncement('failed', { hash: HASH })).not.toMatch(/\s{2,}/);
  });

  it('accepts per-status message overrides', () => {
    expect(
      formatTransactionAnnouncement('confirmed', {
        hash: HASH,
        messages: { confirmed: 'Escrow funded. Reference {hash}.' },
      }),
    ).toBe('Escrow funded. Reference 0x9f8e…b1a0.');
    // Unchanged statuses keep their defaults.
    expect(
      formatTransactionAnnouncement('pending', {
        hash: HASH,
        messages: { confirmed: 'Escrow funded. Reference {hash}.' },
      }),
    ).toBe(DEFAULT_TRANSACTION_MESSAGES.pending.replace('{hash}', '0x9f8e…b1a0'));
  });
});

describe('TransactionLiveRegion', () => {
  it('renders two visually hidden live regions with the right politeness', () => {
    render(<TransactionLiveRegion status="pending" hash={HASH} />);

    const polite = screen.getByRole('status');
    const assertive = screen.getByRole('alert');
    expect(polite).toHaveAttribute('aria-live', 'polite');
    expect(polite).toHaveAttribute('aria-atomic', 'true');
    expect(assertive).toHaveAttribute('aria-live', 'assertive');
    expect(assertive).toHaveAttribute('aria-atomic', 'true');
    expect(polite.parentElement).toHaveClass('sr-only');
  });

  it('announces pending and confirmed politely', () => {
    const { rerender } = render(<TransactionLiveRegion status="pending" hash={HASH} />);
    advance(DEFAULT_TRANSACTION_DEBOUNCE_MS);
    expect(screen.getByRole('status')).toHaveTextContent('Transaction pending');
    expect(screen.getByRole('status')).toHaveTextContent('0x9f8e…b1a0');

    rerender(<TransactionLiveRegion status="confirmed" hash={HASH} />);
    advance(DEFAULT_TRANSACTION_DEBOUNCE_MS);
    expect(screen.getByRole('status')).toHaveTextContent('Transaction confirmed');
    expect(screen.getByRole('alert')).toHaveTextContent('');
  });

  it('announces failures assertively and not politely', () => {
    render(<TransactionLiveRegion status="failed" hash={HASH} error="Reverted by contract" />);
    advance(DEFAULT_TRANSACTION_DEBOUNCE_MS);

    expect(screen.getByRole('alert')).toHaveTextContent('Transaction failed');
    expect(screen.getByRole('alert')).toHaveTextContent('Reverted by contract');
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('debounces rapid status changes down to the final one', () => {
    const { rerender } = render(<TransactionLiveRegion status="pending" hash={HASH} />);
    advance(100);
    // Nothing has been announced yet: the quiet window has not elapsed.
    expect(screen.getByRole('status')).toHaveTextContent('');

    rerender(<TransactionLiveRegion status="confirmed" hash={HASH} />);
    advance(100);
    rerender(<TransactionLiveRegion status="failed" hash={HASH} error="Out of gas" />);
    advance(DEFAULT_TRANSACTION_DEBOUNCE_MS);

    expect(screen.getByRole('status')).toHaveTextContent('');
    expect(screen.getByRole('alert')).toHaveTextContent('Transaction failed');
    expect(screen.getByRole('alert')).toHaveTextContent('Out of gas');
  });

  it('honours a custom debounce window', () => {
    render(<TransactionLiveRegion status="confirmed" hash={HASH} debounceMs={1_000} />);

    advance(999);
    expect(screen.getByRole('status')).toHaveTextContent('');
    advance(1);
    expect(screen.getByRole('status')).toHaveTextContent('Transaction confirmed');
  });

  it('uses configurable announcement messages', () => {
    render(
      <TransactionLiveRegion
        status="confirmed"
        hash={HASH}
        messages={{ confirmed: 'Payment settled in {hash}' }}
      />,
    );
    advance(DEFAULT_TRANSACTION_DEBOUNCE_MS);

    expect(screen.getByRole('status')).toHaveTextContent('Payment settled in 0x9f8e…b1a0');
  });

  it('cancels a pending announcement when unmounted', () => {
    const { unmount } = render(<TransactionLiveRegion status="pending" hash={HASH} />);
    unmount();

    expect(() => advance(DEFAULT_TRANSACTION_DEBOUNCE_MS)).not.toThrow();
    expect(jest.getTimerCount()).toBe(0);
  });
});
