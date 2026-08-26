import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PortfolioOverview from '../PortfolioOverview';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

jest.mock('lucide-react', () => ({
  TrendingUp: () => <span data-testid="trending-up" />,
  TrendingDown: () => <span data-testid="trending-down" />,
  DollarSign: () => <span />,
  Building: () => <span />,
  Percent: () => <span />,
  Wallet: () => <span />,
}));

const mockUsePortfolioOverview = jest.fn();
jest.mock('@/hooks/usePortfolioOverview', () => ({
  usePortfolioOverview: () => mockUsePortfolioOverview(),
}));

describe('PortfolioOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows empty state when no data', () => {
    mockUsePortfolioOverview.mockReturnValue({
      data: null,
      isLoading: false,
    });
    render(<PortfolioOverview />);
    expect(screen.getByText(/connect/i)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUsePortfolioOverview.mockReturnValue({
      data: null,
      isLoading: true,
    });
    render(<PortfolioOverview />);
    expect(screen.getByTestId('portfolio-overview-loading') || screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays portfolio value', () => {
    mockUsePortfolioOverview.mockReturnValue({
      data: {
        totalValue: 125000,
        totalProperties: 5,
        annualYield: 8.5,
        monthlyIncome: 875,
        unrealizedGains: 12500,
      },
      isLoading: false,
    });
    render(<PortfolioOverview />);
    expect(screen.getByText(/125,?000/)).toBeInTheDocument();
  });

  it('displays number of properties', () => {
    mockUsePortfolioOverview.mockReturnValue({
      data: {
        totalValue: 125000,
        totalProperties: 5,
        annualYield: 8.5,
        monthlyIncome: 875,
        unrealizedGains: 12500,
      },
      isLoading: false,
    });
    render(<PortfolioOverview />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('displays annual yield percentage', () => {
    mockUsePortfolioOverview.mockReturnValue({
      data: {
        totalValue: 125000,
        totalProperties: 5,
        annualYield: 8.5,
        monthlyIncome: 875,
        unrealizedGains: 12500,
      },
      isLoading: false,
    });
    render(<PortfolioOverview />);
    expect(screen.getByText(/8\.5/)).toBeInTheDocument();
  });

  it('displays monthly income', () => {
    mockUsePortfolioOverview.mockReturnValue({
      data: {
        totalValue: 125000,
        totalProperties: 5,
        annualYield: 8.5,
        monthlyIncome: 875,
        unrealizedGains: 12500,
      },
      isLoading: false,
    });
    render(<PortfolioOverview />);
    expect(screen.getByText(/875/)).toBeInTheDocument();
  });
});
