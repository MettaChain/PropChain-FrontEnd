import { render, screen } from '@testing-library/react';

import PriceUpdateAnnouncer, {
  DEFAULT_PRICE_THRESHOLD_PERCENT,
  DEFAULT_PRICE_THROTTLE_MS,
  createPriceAnnouncementGate,
  formatPriceAnnouncement,
  isSignificantChange,
  percentChange,
  type PriceUpdate,
} from '../components/PriceUpdateAnnouncer';

const harbour: PriceUpdate = { id: 'p-1', name: 'Harbour Lofts', price: 525_000, previousPrice: 500_000 };

describe('percentChange', () => {
  it('computes signed percentage change', () => {
    expect(percentChange(100, 110)).toBeCloseTo(10);
    expect(percentChange(100, 90)).toBeCloseTo(-10);
    expect(percentChange(undefined, 110)).toBe(0);
    expect(percentChange(0, 110)).toBe(0);
    expect(percentChange(Number.NaN, 110)).toBe(0);
  });
});

describe('isSignificantChange', () => {
  it('defaults to a five percent threshold', () => {
    expect(DEFAULT_PRICE_THRESHOLD_PERCENT).toBe(5);
    expect(isSignificantChange(100, 105)).toBe(true);
    expect(isSignificantChange(100, 104.9)).toBe(false);
    expect(isSignificantChange(100, 95)).toBe(true);
    expect(isSignificantChange(100, 95.1)).toBe(false);
  });

  it('honours a custom threshold', () => {
    expect(isSignificantChange(100, 104, 10)).toBe(false);
    expect(isSignificantChange(100, 110, 10)).toBe(true);
  });

  it('never treats an unknown previous price as a change', () => {
    expect(isSignificantChange(undefined, 1_000_000)).toBe(false);
  });
});

describe('formatPriceAnnouncement', () => {
  it('states direction, magnitude and locale formatted price', () => {
    expect(formatPriceAnnouncement(harbour)).toBe(
      'Harbour Lofts price up 5.0 percent to $525,000.00',
    );
    expect(formatPriceAnnouncement({ ...harbour, price: 450_000 })).toBe(
      'Harbour Lofts price down 10.0 percent to $450,000.00',
    );
  });

  it('supports other locales and currencies', () => {
    const message = formatPriceAnnouncement(harbour, { locale: 'de-DE', currency: 'EUR' });
    expect(message).toContain('price up 5.0 percent');
    // de-DE puts the currency symbol after the amount and uses a comma decimal.
    expect(message).toMatch(/525\.000,00\s*€/);
  });

  it('falls back to the id when no name is available', () => {
    expect(formatPriceAnnouncement({ id: 'p-9', price: 110, previousPrice: 100 })).toContain('p-9 price');
  });
});

describe('createPriceAnnouncementGate', () => {
  const gateOptions = { thresholdPercent: 5, throttleMs: 5_000 };

  it('announces the first significant change', () => {
    const gate = createPriceAnnouncementGate(gateOptions);
    expect(gate.consider(harbour, 1_000)).toContain('Harbour Lofts');
    expect(gate.lastAnnouncedAt).toBe(1_000);
  });

  it('drops changes below the threshold without consuming the throttle', () => {
    const gate = createPriceAnnouncementGate(gateOptions);
    expect(gate.consider({ ...harbour, price: 505_000, previousPrice: 500_000 }, 1_000)).toBeNull();
    expect(gate.lastAnnouncedAt).toBe(Number.NEGATIVE_INFINITY);
    // The throttle window is still open for a real change.
    expect(gate.consider(harbour, 1_100)).not.toBeNull();
  });

  it('throttles to one announcement per window', () => {
    const gate = createPriceAnnouncementGate(gateOptions);
    expect(gate.consider(harbour, 0)).not.toBeNull();
    expect(gate.consider({ ...harbour, price: 600_000 }, 4_999)).toBeNull();
    expect(gate.consider({ ...harbour, price: 600_000 }, 5_000)).not.toBeNull();
  });

  it('exposes the default throttle window', () => {
    const gate = createPriceAnnouncementGate();
    expect(DEFAULT_PRICE_THROTTLE_MS).toBe(5_000);
    expect(gate.consider(harbour, 0)).not.toBeNull();
    expect(gate.consider({ ...harbour, price: 700_000 }, 4_000)).toBeNull();
  });
});

describe('PriceUpdateAnnouncer', () => {
  it('renders a visually hidden polite live region', () => {
    render(<PriceUpdateAnnouncer updates={[]} />);

    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-atomic', 'true');
    expect(region).toHaveClass('sr-only');
  });

  it('announces a significant change', () => {
    render(<PriceUpdateAnnouncer updates={[harbour]} />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Harbour Lofts price up 5.0 percent to $525,000.00',
    );
  });

  it('stays silent below the configurable threshold', () => {
    render(
      <PriceUpdateAnnouncer
        updates={[{ ...harbour, price: 505_000 }]}
        thresholdPercent={10}
      />,
    );
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('throttles rapid status changes to one announcement per window', () => {
    const { rerender } = render(<PriceUpdateAnnouncer updates={[harbour]} />);
    expect(screen.getByRole('status')).toHaveTextContent('up 5.0 percent');

    rerender(<PriceUpdateAnnouncer updates={[{ ...harbour, price: 600_000 }]} />);
    // Second change lands inside the same 5s window and must not replace the message.
    expect(screen.getByRole('status')).toHaveTextContent('up 5.0 percent');
  });

  it('ignores repeated renders of the same update', () => {
    const { rerender } = render(
      <PriceUpdateAnnouncer updates={[harbour]} throttleMs={0} />,
    );
    const region = screen.getByRole('status');
    expect(region).toHaveTextContent('Harbour Lofts');

    // Same data, new array identity: nothing should be announced again.
    rerender(<PriceUpdateAnnouncer updates={[{ ...harbour }]} throttleMs={0} />);
    expect(screen.getByRole('status')).toHaveTextContent('Harbour Lofts');
  });

  it('allows the region to be visually exposed when a caller opts in', () => {
    render(<PriceUpdateAnnouncer updates={[]} className="my-2" />);
    const region = screen.getByRole('status');
    expect(region).toHaveClass('sr-only', 'my-2');
  });
});
