'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { formatPrice, type Currency } from '../utils/formatters';

/**
 * Live-region announcer for real-time property prices (#1369).
 *
 * Prices tick far too often to announce every frame, so updates are filtered by
 * a percentage threshold and then throttled. Announcements are polite: a price
 * change is not urgent enough to interrupt whatever the user is reading.
 */

export interface PriceUpdate {
  /** Stable property identifier. */
  id: string;
  /** Human readable name used in the announcement. */
  name?: string;
  price: number;
  /** Previous price, if known. Without it no change percentage can be derived. */
  previousPrice?: number;
}

export interface PriceAnnouncementOptions {
  /** Minimum absolute percentage change that is worth announcing. Default 5. */
  thresholdPercent?: number;
  /** Minimum time between announcements in ms. Default 5000 (one per 5s). */
  throttleMs?: number;
  locale?: string;
  currency?: Currency;
}

export const DEFAULT_PRICE_THRESHOLD_PERCENT = 5;
export const DEFAULT_PRICE_THROTTLE_MS = 5_000;

/** Signed percentage change from `previous` to `next`; `0` when it is not computable. */
export function percentChange(previous: number | undefined, next: number): number {
  if (previous === undefined || previous === 0 || !Number.isFinite(previous)) return 0;
  return ((next - previous) / previous) * 100;
}

/** True when the change crosses the configured threshold in either direction. */
export function isSignificantChange(
  previousPrice: number | undefined,
  price: number,
  thresholdPercent = DEFAULT_PRICE_THRESHOLD_PERCENT,
): boolean {
  const change = percentChange(previousPrice, price);
  return Math.abs(change) >= Math.abs(thresholdPercent);
}

/** Builds the screen-reader sentence for a single update. */
export function formatPriceAnnouncement(
  update: PriceUpdate,
  options: PriceAnnouncementOptions = {},
): string {
  const { locale = 'en-US', currency = 'USD' } = options;
  const change = percentChange(update.previousPrice, update.price);
  const direction = change >= 0 ? 'up' : 'down';
  const magnitude = Math.abs(change).toFixed(1);
  const subject = update.name ?? update.id;
  return `${subject} price ${direction} ${magnitude} percent to ${formatPrice(
    update.price,
    currency,
    locale,
  )}`;
}

/**
 * Pure throttle + threshold gate. Separated from the component so the timing
 * behaviour can be unit tested with an injected clock.
 */
export function createPriceAnnouncementGate(options: PriceAnnouncementOptions = {}) {
  const thresholdPercent = options.thresholdPercent ?? DEFAULT_PRICE_THRESHOLD_PERCENT;
  const throttleMs = options.throttleMs ?? DEFAULT_PRICE_THROTTLE_MS;
  let lastAnnouncedAt = Number.NEGATIVE_INFINITY;

  return {
    /**
     * Returns the announcement message for `update`, or `null` when it was
     * filtered out by the threshold or the throttle window.
     */
    consider(update: PriceUpdate, now: number = Date.now()): string | null {
      if (!isSignificantChange(update.previousPrice, update.price, thresholdPercent)) {
        return null;
      }
      if (now - lastAnnouncedAt < throttleMs) return null;
      lastAnnouncedAt = now;
      return formatPriceAnnouncement(update, options);
    },
    /** Last announcement timestamp, exposed for diagnostics and tests. */
    get lastAnnouncedAt() {
      return lastAnnouncedAt;
    },
  };
}

export interface PriceUpdateAnnouncerProps extends PriceAnnouncementOptions {
  /** Ordering is significant: the last qualifying entry wins. */
  updates: PriceUpdate[];
  /** Extra classes for the region. It stays `sr-only` unless you override that. */
  className?: string;
}

/**
 * Visually hidden polite live region. Screen readers hear at most one price
 * announcement per `throttleMs`, and only for changes at or above the threshold.
 */
export function PriceUpdateAnnouncer({
  updates,
  thresholdPercent = DEFAULT_PRICE_THRESHOLD_PERCENT,
  throttleMs = DEFAULT_PRICE_THROTTLE_MS,
  locale = 'en-US',
  currency = 'USD',
  className = '',
}: PriceUpdateAnnouncerProps) {
  const gate = useMemo(
    () => createPriceAnnouncementGate({ thresholdPercent, throttleMs, locale, currency }),
    [thresholdPercent, throttleMs, locale, currency],
  );
  const [message, setMessage] = useState('');
  const previous = useRef<PriceUpdate[]>([]);

  useEffect(() => {
    // Only updates that are new since the previous render are considered, so a
    // re-render with unchanged data cannot produce a duplicate announcement.
    const seen = new Set(previous.current.map((update) => `${update.id}:${update.price}`));
    const fresh = updates.filter((update) => !seen.has(`${update.id}:${update.price}`));
    previous.current = updates;
    for (const update of fresh) {
      const next = gate.consider(update);
      if (next) setMessage(next);
    }
  }, [updates, gate]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-testid="price-update-announcer"
      className={['sr-only', className].filter(Boolean).join(' ')}
    >
      {message}
    </div>
  );
}

export default PriceUpdateAnnouncer;
