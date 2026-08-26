import React from 'react';
import { render, screen } from '@testing-library/react';

const mockUsePortfolioOverview = jest.fn();

jest.mock('@/hooks/usePortfolioQuery', () => ({
  usePortfolioOverview: (...args: unknown[]) => mockUsePortfolioOverview(...args),
}));

jest.mock('@/store/walletStore', () => ({
  useWalletStore: () => ({
    address: '0x1234...5678',
    isConnected: true,
    chainId: 1,
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        'dashboard.portfolioValue': 'Portfolio Value',
        'dashboard.totalProperties': 'Total Properties',
        'dashboard.annualYield': 'Annual Yield',
        'dashboard.monthlyIncome': 'Monthly Income',
        'dashboard.noInvestmentsTitle': 'No investments yet',
        'dashboard.noInvestmentsDesc': 'Connect your wallet and start investing in real estate tokens to see your portfolio overview here.',
        'dashboard.exploreProperties': 'Explore Properties',
      };
      return translations[key] || fallback || key;
    },
  }),
}));

jest.mock('@/utils/i18nFormatting', () => ({
  useI18nFormatting: () => ({
    formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
    formatPercentage: (value: number) => `${value.toFixed(1)}%`,
    formatNumber: (value: number) => value.toString(),
    formatDate: (date: unknown) => String(date),
    locale: 'en',
    currency: 'USD',
  }),
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => <div {...props}>{children}</div>,
  },
}));

jest.mock('@/components/ui/EmptyState', () => ({
  EmptyState: ({ title, description }: { title: string; description?: string }) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  ),
}));

import { PortfolioOverview } from '@/components/dashboard/PortfolioOverview';

describe('PortfolioOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows empty state when no wallet connected', () => {
    mockUsePortfolioOverview.mockReturnValue({
      portfolio: null,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<PortfolioOverview />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('No investments yet')).toBeInTheDocument();
  });

  it('shows portfolio metrics when data loaded', () => {
    mockUsePortfolioOverview.mockReturnValue({
      portfolio: {
        totalValueUSD: 50000,
        chains: [
          {
            holdings: [
              { apy: 8.5 },
              { apy: 6.2 },
            ],
          },
        ],
      },
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<PortfolioOverview />);
    expect(screen.getByText('Portfolio Value')).toBeInTheDocument();
    expect(screen.getByText('Total Properties')).toBeInTheDocument();
    expect(screen.getByText('Annual Yield')).toBeInTheDocument();
    expect(screen.getByText('Monthly Income')).toBeInTheDocument();
    expect(screen.getByText('Unrealized Gains')).toBeInTheDocument();
  });

  it('displays total portfolio value', () => {
    mockUsePortfolioOverview.mockReturnValue({
      portfolio: {
        totalValueUSD: 125000,
        chains: [
          { holdings: [{ apy: 10 }] },
        ],
      },
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<PortfolioOverview />);
    expect(screen.getByText('$125000.00')).toBeInTheDocument();
  });

  it('displays number of properties', () => {
    mockUsePortfolioOverview.mockReturnValue({
      portfolio: {
        totalValueUSD: 100000,
        chains: [
          { holdings: [{ apy: 5 }, { apy: 7 }, { apy: 4 }] },
        ],
      },
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<PortfolioOverview />);
    expect(screen.getByText('Total Properties')).toBeInTheDocument();
  });

  it('displays annual yield percentage', () => {
    mockUsePortfolioOverview.mockReturnValue({
      portfolio: {
        totalValueUSD: 80000,
        chains: [
          { holdings: [{ apy: 8 }, { apy: 12 }] },
        ],
      },
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<PortfolioOverview />);
    expect(screen.getByText('10.0%')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUsePortfolioOverview.mockReturnValue({
      portfolio: null,
      isLoading: true,
      error: null,
      refresh: jest.fn(),
    });

    const { container } = render(<PortfolioOverview />);
    expect(container.innerHTML).toContain('empty-state');
  });

  it('shows the error state when the portfolio load reports an error', () => {
    mockUsePortfolioOverview.mockReturnValue({
      portfolio: {
        totalValueUSD: 50000,
        chains: [{ holdings: [{ apy: 6 }] }],
        error: 'Failed to fetch portfolio',
      },
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<PortfolioOverview />);
    expect(screen.getByText('Portfolio Value')).toBeInTheDocument();
    expect(screen.getByText('Error loading')).toBeInTheDocument();
  });

  it('shows the empty state when the portfolio has no holdings', () => {
    mockUsePortfolioOverview.mockReturnValue({
      portfolio: {
        totalValueUSD: 0,
        chains: [],
      },
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<PortfolioOverview />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('No investments yet')).toBeInTheDocument();
  });
});
