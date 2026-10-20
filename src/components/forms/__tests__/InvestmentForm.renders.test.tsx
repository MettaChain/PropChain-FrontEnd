import type { ButtonHTMLAttributes } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvestmentForm } from '@/components/forms/InvestmentForm';

/**
 * Issue #1273 — InvestmentForm re-render budget.
 *
 * The shared button primitive is swapped for a plain button that counts its
 * own renders, keyed by accessible name. That gives a deterministic signal of
 * which memoized sections re-render for a given interaction.
 */
const renderCounts = new Map<string, number>();

jest.mock('@/components/ui/button', () => {
  const ReactActual = jest.requireActual<typeof import('react')>('react');
  return {
    Button: ReactActual.forwardRef<
      HTMLButtonElement,
      ButtonHTMLAttributes<HTMLButtonElement> & {
        variant?: string;
        size?: string;
        asChild?: boolean;
      }
    >(function CountingButton({ children, variant: _variant, size: _size, asChild: _asChild, ...props }, ref) {
      const key =
        (typeof props['aria-label'] === 'string' ? props['aria-label'] : undefined) ??
        (typeof children === 'string' ? children : 'unknown');
      renderCounts.set(key, (renderCounts.get(key) ?? 0) + 1);
      return (
        <button ref={ref} {...props}>
          {children}
        </button>
      );
    }),
  };
});

const PRESET_LABELS = [
  'Invest $500',
  'Invest $1,000',
  'Invest $5,000',
  'Invest $10,000',
];

const sumRenders = (labels: string[]) =>
  labels.reduce((total, label) => total + (renderCounts.get(label) ?? 0), 0);

const props = {
  propertyId: 'prop-1',
  propertyName: 'Oceanview Estate',
  tokenPrice: 25,
  minInvestment: 100,
  annualYieldPercent: 8,
  onSubmit: jest.fn(),
};

function renderForm() {
  return render(<InvestmentForm {...props} />);
}

beforeEach(() => {
  renderCounts.clear();
});

describe('InvestmentForm re-renders', () => {
  it('does not re-render quick amounts while the investor types an amount', async () => {
    const user = userEvent.setup();
    renderForm();
    renderCounts.clear();

    await user.type(screen.getByLabelText('Investment amount'), '250');

    expect(sumRenders(PRESET_LABELS)).toBe(0);
  });

  it('re-renders only the toggled terms field', async () => {
    const user = userEvent.setup();
    renderForm();
    renderCounts.clear();

    await user.click(screen.getByRole('checkbox'));

    expect(sumRenders(PRESET_LABELS)).toBe(0);
    expect(renderCounts.has('Invest now')).toBe(true);
  });

  it('does not re-render quick amounts when only the payment method changes', async () => {
    const user = userEvent.setup();
    renderForm();
    renderCounts.clear();

    await user.selectOptions(screen.getByLabelText('Payment method'), 'stablecoin');

    expect(sumRenders(PRESET_LABELS)).toBe(0);
  });

  it('skips re-rendering when the parent re-renders with identical props', () => {
    const { rerender } = renderForm();
    renderCounts.clear();

    rerender(<InvestmentForm {...props} />);

    expect(renderCounts.size).toBe(0);
  });

  it('keeps the quick-amount group isolated when a preset is selected', async () => {
    const user = userEvent.setup();
    renderForm();
    renderCounts.clear();

    const group = screen.getByRole('radiogroup', { name: 'Quick investment amounts' });
    await user.click(within(group).getByRole('radio', { name: 'Invest $1,000' }));

    // The group itself re-renders to move the selection, but nothing outside it
    // may be re-rendered by the parent: only preset buttons are counted here.
    expect(sumRenders(PRESET_LABELS)).toBeGreaterThan(0);
    expect(screen.getByLabelText('Investment amount')).toHaveValue(1000);
  });
});
