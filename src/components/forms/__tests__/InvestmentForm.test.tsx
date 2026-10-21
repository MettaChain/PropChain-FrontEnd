import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  INVESTMENT_ANALYTICS_EVENTS,
  InvestmentForm,
  type InvestmentFormProps,
} from '@/components/forms/InvestmentForm';

expect.extend(toHaveNoViolations);

/**
 * Issues #1272–#1275 — InvestmentForm integration tests.
 *
 * Covers the full form loop (amount → projection → submit), keyboard
 * navigation of the quick-amount group, and the analytics events added by
 * #1275. Form-level callbacks are asserted with real user events rather than
 * by calling handlers directly.
 */
const baseProps: InvestmentFormProps = {
  propertyId: 'prop-1',
  propertyName: 'Oceanview Estate',
  tokenPrice: 25,
  minInvestment: 100,
  maxInvestment: 50000,
  annualYieldPercent: 8,
  onSubmit: jest.fn(),
};

interface CapturedEvent {
  name: unknown;
  payload: Record<string, unknown>;
}

const capturedEvents = (): CapturedEvent[] =>
  (window.dataLayer ?? [])
    .filter((entry): entry is [string, string, Record<string, unknown>] => Array.isArray(entry))
    .map((entry) => ({ name: entry[1], payload: entry[2] }));

const eventsNamed = (name: string) => capturedEvents().filter((event) => event.name === name);

function renderForm(overrides: Partial<InvestmentFormProps> = {}) {
  const props = { ...baseProps, onSubmit: jest.fn(), ...overrides };
  const utils = render(<InvestmentForm {...props} />);
  return { ...utils, props };
}

beforeEach(() => {
  window.dataLayer = [];
});

describe('InvestmentForm', () => {
  it('projects tokens and annual income as the amount changes', async () => {
    const user = userEvent.setup();
    renderForm();

    const amount = screen.getByLabelText('Investment amount');
    await user.type(amount, '2500');

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('$200.00')).toBeInTheDocument();
    expect(screen.getByText('Investing $2,500.00')).toBeInTheDocument();
  });

  it('submits the computed investment values', async () => {
    const user = userEvent.setup();
    const { props } = renderForm();

    await user.type(screen.getByLabelText('Investment amount'), '2500');
    await user.selectOptions(screen.getByLabelText('Payment method'), 'stablecoin');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Invest now' }));

    await waitFor(() => {
      expect(props.onSubmit).toHaveBeenCalledWith({
        propertyId: 'prop-1',
        amount: 2500,
        tokenAmount: 100,
        paymentMethod: 'stablecoin',
        estimatedAnnualIncome: 200,
      });
    });
  });

  it('blocks submission and reports the minimum when the amount is too low', async () => {
    const user = userEvent.setup();
    const { props } = renderForm();

    const amount = screen.getByLabelText('Investment amount');
    await user.type(amount, '50');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Invest now' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The minimum investment is $100.00.',
    );
    expect(amount).toHaveAttribute('aria-invalid', 'true');
    expect(amount).toHaveFocus();
    expect(props.onSubmit).not.toHaveBeenCalled();
  });

  it('requires the risk acknowledgement before submitting', async () => {
    const user = userEvent.setup();
    const { props } = renderForm();

    await user.type(screen.getByLabelText('Investment amount'), '500');
    await user.click(screen.getByRole('button', { name: 'Invest now' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Confirm that you have read the investment terms.',
    );
    expect(props.onSubmit).not.toHaveBeenCalled();
  });

  it('clears the amount error as soon as the amount is corrected', async () => {
    const user = userEvent.setup();
    renderForm();

    const amount = screen.getByLabelText('Investment amount');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Invest now' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter an investment amount.');

    await user.type(amount, '500');
    expect(screen.queryByText('Enter an investment amount.')).not.toBeInTheDocument();
  });

  it('navigates the quick-amount group with arrows, Home and End', async () => {
    const user = userEvent.setup();
    renderForm();

    const group = screen.getByRole('radiogroup', { name: 'Quick investment amounts' });
    const first = within(group).getByRole('radio', { name: 'Invest $500' });
    const second = within(group).getByRole('radio', { name: 'Invest $1,000' });
    const last = within(group).getByRole('radio', { name: 'Invest $10,000' });
    const amount = screen.getByLabelText('Investment amount');

    first.focus();
    await user.keyboard('{ArrowRight}');
    expect(second).toHaveFocus();
    expect(second).toHaveAttribute('aria-checked', 'true');
    expect(amount).toHaveValue(1000);

    await user.keyboard('{End}');
    expect(last).toHaveFocus();
    expect(last).toHaveAttribute('aria-checked', 'true');
    expect(amount).toHaveValue(10000);

    await user.keyboard('{ArrowRight}');
    expect(first).toHaveFocus();
    expect(amount).toHaveValue(500);

    await user.keyboard('{ArrowLeft}');
    expect(last).toHaveFocus();
    expect(amount).toHaveValue(10000);

    await user.keyboard('{Home}');
    expect(first).toHaveFocus();
    expect(amount).toHaveValue(500);
  });

  it('keeps one tab stop in the quick-amount group', async () => {
    const user = userEvent.setup();
    renderForm();

    const group = screen.getByRole('radiogroup', { name: 'Quick investment amounts' });
    const radios = within(group).getAllByRole('radio');

    expect(radios.filter((radio) => radio.tabIndex === 0)).toHaveLength(1);

    await user.click(within(group).getByRole('radio', { name: 'Invest $5,000' }));

    const afterSelection = within(group).getAllByRole('radio');
    expect(afterSelection.filter((radio) => radio.tabIndex === 0)).toHaveLength(1);
    expect(
      within(group).getByRole('radio', { name: 'Invest $5,000' }),
    ).toHaveAttribute('aria-checked', 'true');
  });

  it('submits with Ctrl+Enter from anywhere in the form', async () => {
    const user = userEvent.setup();
    const { props } = renderForm();

    await user.type(screen.getByLabelText('Investment amount'), '750');
    await user.click(screen.getByRole('checkbox'));
    screen.getByLabelText('Investment amount').focus();
    await user.keyboard('{Control>}{Enter}{/Control}');

    await waitFor(() => expect(props.onSubmit).toHaveBeenCalledTimes(1));
    expect(props.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 750, tokenAmount: 30 }),
    );
  });

  it('reports submission failures without losing the entered values', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockRejectedValue(new Error('offline'));
    renderForm({ onSubmit });

    await user.type(screen.getByLabelText('Investment amount'), '500');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Invest now' }));

    expect(
      await screen.findByText('We could not submit your investment. Check your connection and try again.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Investment amount')).toHaveValue(500);
  });

  describe('analytics (#1275)', () => {
    it('tracks a view event with non-identifying property metadata', () => {
      renderForm();

      const [view] = eventsNamed(INVESTMENT_ANALYTICS_EVENTS.view);
      expect(view).toBeDefined();
      expect(view.payload).toEqual({
        property_id: 'prop-1',
        token_price: 25,
        annual_yield_percent: 8,
        payment_method_count: 3,
      });
    });

    it('tracks preset and typed amounts as bands, never raw amounts', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByRole('radio', { name: 'Invest $5,000' }));
      const amount = screen.getByLabelText('Investment amount');
      await user.clear(amount);
      await user.type(amount, '1234');
      await user.tab();

      const changes = eventsNamed(INVESTMENT_ANALYTICS_EVENTS.amountChanged);
      expect(changes).toHaveLength(2);
      expect(changes[0].payload).toMatchObject({ amount_bucket: '5k_25k', source: 'preset' });
      expect(changes[1].payload).toMatchObject({ amount_bucket: '1k_5k', source: 'input' });
      for (const change of changes) {
        expect(change.payload).not.toHaveProperty('amount');
        expect(change.payload).not.toHaveProperty('property_name');
      }
    });

    it('tracks successful and failed submissions', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByRole('button', { name: 'Invest now' }));
      expect(
        eventsNamed(INVESTMENT_ANALYTICS_EVENTS.validationFailed)[0].payload,
      ).toMatchObject({ property_id: 'prop-1', fields: 'amount,terms' });

      await user.type(screen.getByLabelText('Investment amount'), '1000');
      await user.click(screen.getByRole('checkbox'));
      await user.click(screen.getByRole('button', { name: 'Invest now' }));

      await waitFor(() => {
        expect(eventsNamed(INVESTMENT_ANALYTICS_EVENTS.submitted)).toHaveLength(1);
      });
      expect(eventsNamed(INVESTMENT_ANALYTICS_EVENTS.submitted)[0].payload).toEqual({
        property_id: 'prop-1',
        amount_bucket: '1k_5k',
        payment_method: 'wallet',
      });
    });
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = renderForm();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
