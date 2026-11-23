'use client';

import { useEffect, useMemo, useState } from 'react';

/**
 * Screen reader announcements for transaction status changes (#1361).
 *
 * A transaction is not urgent while it is pending or after it confirms, so
 * those go to a polite region. A failure is urgent and goes to an assertive
 * region. The two regions are separate elements because `aria-live` must be
 * present before content changes for the change to be announced, so switching
 * politeness on a single element silently drops announcements.
 */

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

/** Defaults are templates; `{hash}` and `{error}` are substituted. */
export const DEFAULT_TRANSACTION_MESSAGES: Record<TransactionStatus, string> = {
  pending: 'Transaction pending. Hash {hash}.',
  confirmed: 'Transaction confirmed. Hash {hash}.',
  failed: 'Transaction failed. Hash {hash}. {error}',
};

export const DEFAULT_TRANSACTION_DEBOUNCE_MS = 300;

export interface TransactionAnnouncementOptions {
  hash: string;
  error?: string;
  /** Partial overrides merged over the defaults. */
  messages?: Partial<Record<TransactionStatus, string>>;
}

/** Failures must interrupt; everything else waits its turn. */
export function isUrgentStatus(status: TransactionStatus): boolean {
  return status === 'failed';
}

/**
 * Shortens a transaction hash for speech: `0x1234…abcd`. Hashes are not
 * addresses, so `formatAddress` (which validates a 20-byte address) is not
 * applicable here.
 */
export function shortHash(hash: string, prefix = 6, suffix = 4): string {
  if (hash.length <= prefix + suffix + 1) return hash;
  return `${hash.slice(0, prefix)}…${hash.slice(-suffix)}`;
}

/** Builds the announcement sentence for `status`. */
export function formatTransactionAnnouncement(
  status: TransactionStatus,
  { hash, error, messages }: TransactionAnnouncementOptions,
): string {
  const template = messages?.[status] ?? DEFAULT_TRANSACTION_MESSAGES[status];
  const message = template
    .replaceAll('{hash}', shortHash(hash))
    .replaceAll('{error}', error?.trim() ? error.trim() : '');

  // Tidy the double space left behind when no error text was supplied.
  return message.replace(/\s{2,}/g, ' ').trim();
}

export interface TransactionLiveRegionProps extends TransactionAnnouncementOptions {
  status: TransactionStatus;
  /** Quiet period before announcing. Rapid changes collapse to the last one. */
  debounceMs?: number;
  className?: string;
}

/**
 * Visually hidden pair of live regions. After `debounceMs` without a change,
 * the latest status is announced once in the region matching its urgency.
 */
export function TransactionLiveRegion({
  status,
  hash,
  error,
  messages,
  debounceMs = DEFAULT_TRANSACTION_DEBOUNCE_MS,
  className = '',
}: TransactionLiveRegionProps) {
  const text = useMemo(
    () => formatTransactionAnnouncement(status, { hash, error, messages }),
    [status, hash, error, messages],
  );
  const [announcement, setAnnouncement] = useState<{
    status: TransactionStatus;
    text: string;
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setAnnouncement({ status, text }), debounceMs);
    return () => clearTimeout(timer);
    // `text` already encodes status/hash/error, so a new `messages` object with
    // the same content does not restart the timer.
  }, [text, status, debounceMs]);

  const urgent = announcement?.status === 'failed';

  return (
    <div className={['sr-only', className].filter(Boolean).join(' ')}>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="transaction-live-region-polite"
      >
        {announcement && !urgent ? announcement.text : ''}
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        data-testid="transaction-live-region-assertive"
      >
        {announcement && urgent ? announcement.text : ''}
      </div>
    </div>
  );
}

export default TransactionLiveRegion;
