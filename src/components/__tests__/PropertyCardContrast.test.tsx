import React from 'react';
import { render, screen } from '@testing-library/react';
import { PropertyCard } from '../PropertyCard';
import type { Property } from '@/types/property';

// Stub next/image so we don't pull next.config image hostnames into the test
// environment; the contrast check only needs the surrounding badge DOM.
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img alt={props.alt} />;
  },
}));

const mockProperty: Property = {
  id: 'prop-contrast',
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
  price: { total: 500, perToken: 50, currency: 'USD' },
  propertyType: 'residential',
  blockchain: 'ethereum',
  tokenInfo: {
    totalSupply: 1000,
    available: 500,
    sold: 500,
    contractAddress: '0x1234',
    tokenSymbol: 'PROP',
  },
  metrics: { roi: 8.5, annualReturn: 42500, transactionVolume: 1000000, appreciationRate: 5.2 },
  details: { bedrooms: 4, bathrooms: 3, squareFeet: 2500, yearBuilt: 2020, amenities: ['pool'] },
  images: ['https://example.com/image1.jpg'],
  listedDate: '2024-01-01',
  status: 'active',
  featured: true,
  verified: true,
};

// Selector-aware mock so PropertyCard's zustand-style calls work in tests.
jest.mock('@/store/cartStore', () => ({ useCartStore: () => ({ addItem: jest.fn() }) }));
jest.mock('@/store/comparisonStore', () => ({
  useComparisonStore: () => ({ isPropertySelected: () => false, toggleProperty: jest.fn() }),
}));
jest.mock('@/store/compareStore', () => {
  const stub = { selectedIds: [] as string[], toggleProperty: jest.fn() };
  const useCompareStore = (selector?: (state: typeof stub) => unknown) =>
    typeof selector === 'function' ? selector(stub) : stub;
  return { useCompareStore };
});
jest.mock('@/store/favoritesStore', () => ({
  useFavoritesStore: () => ({
    addFavorite: jest.fn(),
    removeFavorite: jest.fn(),
    isFavorite: () => false,
  }),
}));

describe('PropertyCard badge palette contrast (#489)', () => {
  it('Featured badge uses a WCAG AA-compliant yellow background with white text', () => {
    render(<PropertyCard property={mockProperty} />);
    const featuredBadge = screen.getByLabelText('Featured property');
    expect(featuredBadge.className).toMatch(/bg-yellow-700/);
    expect(featuredBadge.className).toMatch(/text-white/);
  });

  it('Verified badge uses a WCAG AA-compliant emerald background with white text', () => {
    render(<PropertyCard property={mockProperty} />);
    const verifiedBadge = screen.getByLabelText('Verified property');
    expect(verifiedBadge.className).toMatch(/bg-emerald-700/);
    expect(verifiedBadge.className).toMatch(/text-white/);
  });

  it('ROI badge uses a WCAG AA-compliant blue background with white text', () => {
    render(<PropertyCard property={mockProperty} />);
    const roiBadge = screen.getByLabelText(/Return on investment/i);
    const inner = roiBadge.querySelector('div')!;
    expect(inner.className).toMatch(/bg-blue-700/);
    expect(inner.className).toMatch(/text-white/);
  });
});
