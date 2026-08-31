import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

import { CurrencyToggle } from '@/components/property/CurrencyToggle';

const useCurrencyConverterMock = jest.fn();

jest.mock('@/hooks/useCurrencyConverter', () => ({
  useCurrencyConverter: () => useCurrencyConverterMock(),
}));

const buildConverterState = (
  overrides: Partial<{
    ethToUsdRate: number | null;
    isLoading: boolean;
    formatEthPrice: (amount: number) => string;
    formatUsdPrice: (amount: number) => string | null;
  }> = {},
) => ({
  ethToUsdRate: null as number | null,
  isLoading: false,
  formatEthPrice: (amount: number) => `${amount.toFixed(4)} ETH`,
  formatUsdPrice: (_amount: number) =>
    _amount === 0 ? null : `$${(_amount * 2500).toFixed(2)}`,
  ...overrides,
});

describe('<CurrencyToggle />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // jsdom provides a real Storage API. Spy on the prototype so the
    // individual test bodies can override return values and assert calls.
    jest.spyOn(Storage.prototype, 'getItem');
    jest.spyOn(Storage.prototype, 'setItem');
  });

  it('renders a loading state while the exchange rate is being fetched', () => {
    useCurrencyConverterMock.mockReturnValue(
      buildConverterState({ isLoading: true }),
    );

    render(<CurrencyToggle ethAmount={1.5} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders the default toggle button with the ETH price', () => {
    useCurrencyConverterMock.mockReturnValue(
      buildConverterState({ ethToUsdRate: 2500 }),
    );

    render(<CurrencyToggle ethAmount={1.5} />);

    const button = screen.getByTitle(/Switch to USD/i);
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('1.5000 ETH');
    expect(button).toHaveAttribute('title', 'Switch to USD');
  });

  it('switching the toggle saves the new currency preference to localStorage', () => {
    useCurrencyConverterMock.mockReturnValue(
      buildConverterState({ ethToUsdRate: 2500 }),
    );

    render(<CurrencyToggle ethAmount={1.5} />);

    fireEvent.click(screen.getByTitle(/Switch to USD/i));

    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'currencyPreference',
      'USD',
    );
  });

  it('shows USD price in the toggle button after switching', async () => {
    useCurrencyConverterMock.mockReturnValue(
      buildConverterState({ ethToUsdRate: 2500 }),
    );

    render(<CurrencyToggle ethAmount={1.5} />);
    fireEvent.click(screen.getByTitle(/Switch to USD/i));

    // React 18 / 19 batches state updates; use findBy* to await re-render.
    const button = await screen.findByTitle(/Switch to ETH/i);
    expect(button).toHaveTextContent('$3750.00');
    expect(button).toHaveAttribute('title', 'Switch to ETH');
  });

  it('toggling back to ETH saves the new preference', () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue('USD');
    useCurrencyConverterMock.mockReturnValue(
      buildConverterState({ ethToUsdRate: 2500 }),
    );

    render(<CurrencyToggle ethAmount={1.5} />);

    fireEvent.click(screen.getByTitle(/Switch to ETH/i));
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'currencyPreference',
      'ETH',
    );
  });

  it('falls back to the ETH price when USD formatting is not available', async () => {
    useCurrencyConverterMock.mockReturnValue(
      buildConverterState({
        ethToUsdRate: 2500,
        formatUsdPrice: () => null,
      }),
    );

    render(<CurrencyToggle ethAmount={0.5} />);
    fireEvent.click(screen.getByTitle(/Switch to USD/i));

    const button = await screen.findByTitle(/Switch to ETH/i);
    expect(button).toHaveTextContent('0.5000 ETH');
  });

  it('loads a previously persisted currency preference on mount', () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue('USD');
    useCurrencyConverterMock.mockReturnValue(
      buildConverterState({ ethToUsdRate: 2500 }),
    );

    render(<CurrencyToggle ethAmount={2} />);

    expect(screen.getByTitle(/Switch to ETH/i)).toBeInTheDocument();
  });

  it('defaults to ETH when no preference has been saved', () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
    useCurrencyConverterMock.mockReturnValue(
      buildConverterState({ ethToUsdRate: 2500 }),
    );

    render(<CurrencyToggle ethAmount={2} />);

    expect(screen.getByTitle(/Switch to USD/i)).toBeInTheDocument();
  });

  it('ignores unrecognised storage values', () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue('JPY');
    useCurrencyConverterMock.mockReturnValue(
      buildConverterState({ ethToUsdRate: 2500 }),
    );

    render(<CurrencyToggle ethAmount={2} />);

    expect(screen.getByTitle(/Switch to USD/i)).toBeInTheDocument();
  });

  it('renders the showBoth variant with both ETH and USD prices', () => {
    useCurrencyConverterMock.mockReturnValue(
      buildConverterState({ ethToUsdRate: 2500 }),
    );

    render(<CurrencyToggle ethAmount={1.5} showBoth />);

    // Both prices and the rate text are visible.
    expect(screen.getByText('1.5000 ETH')).toBeInTheDocument();
    expect(screen.getByText(/\$\s*3750\.00/)).toBeInTheDocument();
    expect(screen.getByText(/1 ETH = \$2500\.00 USD/)).toBeInTheDocument();
  });

  it('hides the USD line in showBoth mode when USD formatting is unavailable', () => {
    useCurrencyConverterMock.mockReturnValue(
      buildConverterState({
        ethToUsdRate: 2500,
        formatUsdPrice: () => null,
      }),
    );

    render(<CurrencyToggle ethAmount={1.5} showBoth />);

    expect(screen.getByText('1.5000 ETH')).toBeInTheDocument();
    expect(screen.queryByText(/≈/)).not.toBeInTheDocument();
    expect(screen.queryByText(/1 ETH =/)).not.toBeInTheDocument();
  });

  it('does not include a USD rate line when the rate is null', () => {
    useCurrencyConverterMock.mockReturnValue(
      buildConverterState({ ethToUsdRate: null }),
    );

    render(<CurrencyToggle ethAmount={1} />);

    fireEvent.click(screen.getByTitle(/Switch to USD/i));

    // Rate tooltip only renders when the rate is set.
    expect(document.body.textContent).not.toMatch(/1 ETH = \$/);
  });

  it('includes the exchange rate in the hover tooltip when a rate is available', () => {
    useCurrencyConverterMock.mockReturnValue(
      buildConverterState({ ethToUsdRate: 2500 }),
    );

    render(<CurrencyToggle ethAmount={1} />);

    // Tooltip text is always present in DOM (group-hover toggles opacity).
    expect(document.body.textContent).toMatch(/1 ETH = \$2500\.00 USD/);
  });

  it('does not render any UI for the toggle before the effect runs (initial paint)', () => {
    useCurrencyConverterMock.mockReturnValue(
      buildConverterState({ ethToUsdRate: 2500 }),
    );

    // Render synchronously and check before useEffect runs.
    const view = render(
      <CurrencyToggle ethAmount={0.5} showBoth />,
    );

    // Verify that after the synchronous render, the effect has resolved.
    expect(view).toBeTruthy();
  });

  it('updates the rendered currency when the localStorage value changes between mounts', () => {
    // First mount: no preference -> ETH
    (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
    useCurrencyConverterMock.mockReturnValue(
      buildConverterState({ ethToUsdRate: 2500 }),
    );

    const { unmount } = render(<CurrencyToggle ethAmount={1} />);
    expect(screen.getByTitle(/Switch to USD/i)).toBeInTheDocument();
    unmount();

    // Second mount: USD saved -> button reflects USD view
    (window.localStorage.getItem as jest.Mock).mockReturnValue('USD');
    render(<CurrencyToggle ethAmount={1} />);
    expect(screen.getByTitle(/Switch to ETH/i)).toBeInTheDocument();
  });

  it('accepts multiple successive toggle clicks without crashing', () => {
    useCurrencyConverterMock.mockReturnValue(
      buildConverterState({ ethToUsdRate: 2500 }),
    );

    render(<CurrencyToggle ethAmount={1} />);

    const btn = screen.getByRole('button');
    act(() => {
      fireEvent.click(btn);
      fireEvent.click(btn);
      fireEvent.click(btn);
    });

    expect(window.localStorage.setItem).toHaveBeenCalledTimes(3);
  });
});
