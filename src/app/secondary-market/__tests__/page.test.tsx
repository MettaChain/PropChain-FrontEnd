import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

const mockGetListings = jest.fn();
const mockBuyTokens = jest.fn();

jest.mock('@/lib/secondaryMarketService', () => ({
  secondaryMarketService: {
    getListings: (...args: unknown[]) => mockGetListings(...args),
    buyTokens: (...args: unknown[]) => mockBuyTokens(...args),
  },
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} alt={String(props.alt || '')} />;
  },
}));

jest.mock('next/link', () => {
  const Link = ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  );
  Link.displayName = 'Link';
  return { __esModule: true, default: Link };
});

jest.mock('@/store/walletStore', () => ({
  useWalletStore: () => ({
    address: '0x1234...5678',
    isConnected: true,
    chainId: 1,
  }),
}));

jest.mock('sonner', () => ({
  toast: {
    info: jest.fn(),
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock('@/components/WalletConnector', () => ({
  WalletConnector: () => <div data-testid="wallet-connector" />,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, className, asChild, ...props }: Record<string, unknown>) => {
    if (asChild) return <>{children}</>;
    return <button onClick={onClick as React.MouseEventHandler<HTMLButtonElement>} className={className as string}>{children}</button>;
  },
}));

jest.mock('@/components/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner" />,
}));

jest.mock('@/components/error/withRouteErrorBoundary', () => ({
  withRouteErrorBoundary: (Component: React.ComponentType) => Component,
}));

import SecondaryMarketPage from '@/app/secondary-market/page';

const mockListings = [
  {
    id: 'sec-1',
    propertyId: 'prop-1',
    propertyName: 'Downtown Luxury Apartment',
    sellerAddress: '0x1234...5678',
    tokenCount: 50,
    pricePerToken: 110.5,
    currency: 'USDT',
    listedDate: '2025-01-01T00:00:00.000Z',
    blockchain: 'ethereum',
    propertyImage: 'https://example.com/img1.jpg',
  },
  {
    id: 'sec-2',
    propertyId: 'prop-2',
    propertyName: 'Beachfront Villa',
    sellerAddress: '0x8765...4321',
    tokenCount: 25,
    pricePerToken: 250.0,
    currency: 'USDC',
    listedDate: '2025-01-02T00:00:00.000Z',
    blockchain: 'polygon',
    propertyImage: 'https://example.com/img2.jpg',
  },
];

describe('SecondaryMarketPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders page title "Secondary Market"', async () => {
    mockGetListings.mockResolvedValue(mockListings);
    render(<SecondaryMarketPage />);
    expect(screen.getByText('Secondary Market')).toBeInTheDocument();
  });

  it('loads and displays listings from secondaryMarketService', async () => {
    mockGetListings.mockResolvedValue(mockListings);
    render(<SecondaryMarketPage />);
    await waitFor(() => {
      expect(screen.getByText('Downtown Luxury Apartment')).toBeInTheDocument();
    });
    expect(mockGetListings).toHaveBeenCalledTimes(1);
  });

  it('shows property name for each listing', async () => {
    mockGetListings.mockResolvedValue(mockListings);
    render(<SecondaryMarketPage />);
    await waitFor(() => {
      expect(screen.getByText('Downtown Luxury Apartment')).toBeInTheDocument();
      expect(screen.getByText('Beachfront Villa')).toBeInTheDocument();
    });
  });

  it('shows seller address for each listing', async () => {
    mockGetListings.mockResolvedValue(mockListings);
    render(<SecondaryMarketPage />);
    await waitFor(() => {
      expect(screen.getByText('0x1234...5678')).toBeInTheDocument();
      expect(screen.getByText('0x8765...4321')).toBeInTheDocument();
    });
  });

  it('shows token count and price per token', async () => {
    mockGetListings.mockResolvedValue(mockListings);
    render(<SecondaryMarketPage />);
    await waitFor(() => {
      expect(screen.getByText('50 Tokens')).toBeInTheDocument();
      expect(screen.getByText('25 Tokens')).toBeInTheDocument();
      expect(screen.getByText('$110.5')).toBeInTheDocument();
      expect(screen.getByText('$250')).toBeInTheDocument();
    });
  });

  it('shows blockchain badge', async () => {
    mockGetListings.mockResolvedValue(mockListings);
    render(<SecondaryMarketPage />);
    await waitFor(() => {
      expect(screen.getByText('ETHEREUM')).toBeInTheDocument();
      expect(screen.getByText('POLYGON')).toBeInTheDocument();
    });
  });

  it('shows View Details link', async () => {
    mockGetListings.mockResolvedValue(mockListings);
    render(<SecondaryMarketPage />);
    await waitFor(() => {
      const viewDetailsLinks = screen.getAllByText('View Details');
      expect(viewDetailsLinks.length).toBe(2);
      expect(viewDetailsLinks[0].getAttribute('href')).toBe('/properties/prop-1');
      expect(viewDetailsLinks[1].getAttribute('href')).toBe('/properties/prop-2');
    });
  });

  it('shows Buy Now button', async () => {
    mockGetListings.mockResolvedValue(mockListings);
    render(<SecondaryMarketPage />);
    await waitFor(() => {
      const buyButtons = screen.getAllByText('Buy Now');
      expect(buyButtons.length).toBe(2);
    });
  });

  it('handles empty listings gracefully', async () => {
    mockGetListings.mockResolvedValue([]);
    render(<SecondaryMarketPage />);
    await waitFor(() => {
      expect(screen.getByText('No active listings in the secondary market yet.')).toBeInTheDocument();
    });
  });
});
