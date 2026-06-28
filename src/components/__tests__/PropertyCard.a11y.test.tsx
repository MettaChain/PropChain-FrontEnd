import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PropertyCard } from '../PropertyCard';
import type { Property } from '@/types/property';

expect.extend(toHaveNoViolations);

const mockProperty: Property = {
  id: 'prop-1',
  name: 'Sunset Villa',
  description: 'Beautiful residential property with great views',
  location: {
    address: '123 Main St',
    city: 'Los Angeles',
    state: 'California',
    country: 'USA',
    zipCode: '90001',
    coordinates: { lat: 34.05, lng: -118.25 },
  },
  price: {
    total: 500,
    perToken: 50,
    currency: 'USD',
  },
  propertyType: 'residential',
  blockchain: 'ethereum',
  tokenInfo: {
    totalSupply: 1000,
    available: 500,
    sold: 500,
    contractAddress: '0x1234',
    tokenSymbol: 'PROP',
  },
  metrics: {
    roi: 8.5,
    annualReturn: 42500,
    transactionVolume: 1000000,
    appreciationRate: 5.2,
  },
  details: {
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 2500,
    yearBuilt: 2020,
    amenities: ['pool', 'garden'],
  },
  images: ['https://example.com/image1.jpg'],
  listedDate: '2024-01-01',
  status: 'active',
  featured: true,
  verified: true,
};

// Mock stores
jest.mock('@/store/cartStore', () => ({
  useCartStore: () => ({ addItem: jest.fn() }),
}));

jest.mock('@/store/comparisonStore', () => ({
  useComparisonStore: () => ({
    isPropertySelected: jest.fn().mockReturnValue(false),
    toggleProperty: jest.fn(),
  }),
}));

jest.mock('@/store/compareStore', () => ({
  useCompareStore: () => ({
    selectedIds: [],
    toggleProperty: jest.fn(),
  }),
}));

jest.mock('@/store/favoritesStore', () => ({
  useFavoritesStore: () => ({
    addFavorite: jest.fn(),
    removeFavorite: jest.fn(),
    isFavorite: jest.fn().mockReturnValue(false),
  }),
}));

describe('PropertyCard Accessibility', () => {
  it('should have no accessibility violations in grid view', async () => {
    const { container } = render(<PropertyCard property={mockProperty} viewMode="grid" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in list view', async () => {
    const { container } = render(<PropertyCard property={mockProperty} viewMode="list" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible property links with proper aria-labels', () => {
    render(<PropertyCard property={mockProperty} />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(2);
    const viewLink = screen.getByLabelText('View details for Sunset Villa');
    expect(viewLink).toBeInTheDocument();
  });

  it('should have accessible image with descriptive alt text', () => {
    render(<PropertyCard property={mockProperty} />);
    const image = screen.getByRole('img', { name: /Sunset Villa/ });
    expect(image).toHaveAttribute('alt', expect.stringContaining('Sunset Villa'));
  });

  it('should have accessible featured badge with role status', () => {
    render(<PropertyCard property={mockProperty} />);
    const featuredBadge = screen.getByText('Featured');
    expect(featuredBadge).toHaveAttribute('role', 'status');
    expect(featuredBadge).toHaveAttribute('aria-label', 'Featured property');
  });

  it('should have accessible verified badge with role status', () => {
    render(<PropertyCard property={mockProperty} />);
    const verifiedBadge = screen.getByText('Verified');
    expect(verifiedBadge).toHaveAttribute('role', 'status');
    expect(verifiedBadge).toHaveAttribute('aria-label', 'Verified property');
  });

  it('should have accessible ROI badge with role status', () => {
    render(<PropertyCard property={mockProperty} />);
    const roiBadge = screen.getByText('8.5% ROI');
    expect(roiBadge.closest('[role="status"]')).toBeInTheDocument();
  });

  it('should have accessible comparison toggle button', () => {
    render(<PropertyCard property={mockProperty} />);
    const compareButton = screen.getByLabelText(/Add property to comparison/i);
    expect(compareButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('should have accessible favorite button with aria-pressed', () => {
    render(<PropertyCard property={mockProperty} />);
    const favoriteButton = screen.getByLabelText(/Add.*to favorites/i);
    expect(favoriteButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('should have accessible blockchain badge with role status', () => {
    render(<PropertyCard property={mockProperty} />);
    const blockchainBadge = screen.getByText('Ethereum');
    expect(blockchainBadge.closest('[role="status"]')).toHaveAttribute(
      'aria-label',
      'Blockchain: Ethereum'
    );
  });

  it('should have accessible add to cart button', () => {
    render(<PropertyCard property={mockProperty} />);
    const cartButton = screen.getByLabelText(/Add.*to cart/i);
    expect(cartButton).toBeInTheDocument();
  });

  it('should have accessible view details button', () => {
    render(<PropertyCard property={mockProperty} />);
    const viewButton = screen.getByLabelText(/View details for Sunset Villa/i);
    expect(viewButton).toBeInTheDocument();
  });

  it('should have focusable elements with proper focus indicators', () => {
    render(<PropertyCard property={mockProperty} />);
    const interactiveButtons = screen.getAllByRole('button');
    interactiveButtons.forEach(button => {
      expect(button).toHaveClass('focus:outline-none');
    });
  });

  it('should have accessible location information', () => {
    render(<PropertyCard property={mockProperty} />);
    const locationText = screen.getByText('Los Angeles, California');
    expect(locationText).toHaveAttribute('aria-label', 'Location: Los Angeles, California');
  });
});