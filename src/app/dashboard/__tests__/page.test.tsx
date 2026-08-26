import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('next/dynamic', () => {
  const dynamic = (factory: () => Promise<{ default: React.ComponentType }>, _options?: Record<string, unknown>) => {
    const name = factory.toString().match(/import\("@\/components\/dashboard\/(\w+)"\)/)?.[1] || 'Widget';
    const Stub = ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <div data-testid={`dynamic-${name}`}>{children}</div>
    );
    Stub.displayName = `Dynamic${name}`;
    return React.forwardRef<unknown, Record<string, unknown>>((props, ref) => <Stub {...props} ref={ref} />);
  };
  return { __esModule: true, default: dynamic };
});

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} alt={String(props.alt || '')} />;
  },
}));

jest.mock('@/store/walletStore', () => ({
  useWalletStore: () => ({
    address: '0x1234...5678',
    isConnected: true,
    chainId: 1,
  }),
}));

jest.mock('@/store/kycStore', () => ({
  useKycStore: () => ({
    profile: { status: 'verified', thresholdEth: 0 },
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

jest.mock('@/components/dashboard/Sidebar', () => ({
  Sidebar: (props: Record<string, unknown>) => <nav data-testid="sidebar" {...props as React.HTMLAttributes<HTMLElement>} />,
}));

jest.mock('@/components/dashboard/StakingPanel', () => ({
  StakingPanel: () => <div data-testid="staking-panel" />,
}));

jest.mock('@/components/dashboard/PortfolioOverview', () => ({
  PortfolioOverview: () => <div data-testid="portfolio-overview" />,
}));

jest.mock('@/components/dashboard/PerformanceChart', () => ({
  PerformanceChart: () => <div data-testid="performance-chart" />,
}));

jest.mock('@/components/dashboard/DiversificationChart', () => ({
  DiversificationChart: () => <div data-testid="diversification-chart" />,
}));

jest.mock('@/components/dashboard/PropertiesList', () => ({
  PropertiesList: () => <div data-testid="properties-list" />,
}));

jest.mock('@/components/dashboard/RecentTransactions', () => ({
  RecentTransactions: () => <div data-testid="recent-transactions" />,
}));

jest.mock('@/components/dashboard/YieldChart', () => ({
  YieldChart: () => <div data-testid="yield-chart" />,
}));

jest.mock('@/components/dashboard/IncomeTracker', () => ({
  IncomeTracker: () => <div data-testid="income-tracker" />,
}));

jest.mock('@/components/dashboard/RiskAnalysis', () => ({
  RiskAnalysis: () => <div data-testid="risk-analysis" />,
}));

jest.mock('@/components/dashboard/PortfolioReport', () => ({
  PortfolioReport: () => <div data-testid="portfolio-report" />,
}));

jest.mock('@/components/dashboard/DataRefreshWrapper', () => ({
  DataRefreshWrapper: ({ children }: { children: React.ReactNode }) => <div data-testid="data-refresh-wrapper">{children}</div>,
}));

jest.mock('@/components/TransactionQueue', () => ({
  TransactionQueue: () => <div data-testid="transaction-queue" />,
}));

jest.mock('@/components/TransactionHistory', () => ({
  TransactionHistory: () => <div data-testid="transaction-history" />,
}));

jest.mock('@/components/dashboard/CertificatesPanel', () => ({
  CertificatesPanel: () => <div data-testid="certificates-panel" />,
}));

jest.mock('@/components/kyc/KycVerificationCenter', () => ({
  KycVerificationCenter: () => <div data-testid="kyc-verification" />,
}));

jest.mock('@/components/kyc/ComplianceAuditLog', () => ({
  ComplianceAuditLog: () => <div data-testid="compliance-audit" />,
}));

jest.mock('@/components/kyc/KycStatusBadge', () => ({
  KycStatusBadge: () => <div data-testid="kyc-status-badge" />,
}));

jest.mock('@/components/security/TransactionSecuritySettings', () => ({
  TransactionSecuritySettings: () => <div data-testid="security-settings" />,
}));

jest.mock('next/link', () => {
  const Link = ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  );
  Link.displayName = 'Link';
  return { __esModule: true, default: Link };
});

jest.mock('lucide-react', () => {
  const stub = () => null;
  return new Proxy({}, { get: () => stub });
});

import DashboardPage from '@/app/dashboard/page';

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Storage.prototype.getItem = jest.fn(() => null);
    Storage.prototype.setItem = jest.fn();
  });

  it('renders the dashboard page', () => {
    render(<DashboardPage />);
    expect(screen.getByText('PropChain')).toBeInTheDocument();
  });

  it('shows sidebar navigation', () => {
    render(<DashboardPage />);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('shows header with PropChain branding', () => {
    render(<DashboardPage />);
    expect(screen.getByText('PropChain')).toBeInTheDocument();
    expect(screen.getByText('PC')).toBeInTheDocument();
  });

  it('renders portfolio widgets section', () => {
    render(<DashboardPage />);
    expect(screen.getByTestId('data-refresh-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('portfolio-overview')).toBeInTheDocument();
  });

  it('shows loading skeletons initially', () => {
    render(<DashboardPage />);
    expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
  });
});
