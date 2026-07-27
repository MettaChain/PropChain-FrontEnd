import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { SearchResults } from '../SearchResults';
import type { Property } from '@/types/property';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img alt={props.alt} />;
  },
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

expect.extend(toHaveNoViolations);

const mockProperty: Property = {
  id: 'prop-list-semantics',
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
jest.mock('../SaveSearchButton', () => ({ SaveSearchButton: () => null }));
jest.mock('../PropertyPagination', () => ({ PropertyPagination: () => null }));
jest.mock('../ComparisonBar', () => ({ ComparisonBar: () => null }));
jest.mock('@/components/ui/EmptyState', () => ({ EmptyState: () => null }));
jest.mock('@/components/ui/skeleton', () => ({ Skeleton: () => null }));

describe('SearchResults list/article semantics (#488)', () => {
  const noop = jest.fn();

  it('renders a <ul role="list"> containing one <li role="article"> per property', () => {
    render(
      <SearchResults
        properties={[mockProperty, { ...mockProperty, id: 'prop-2', name: 'Hilltop Loft' }]}
        totalResults={2}
        isLoading={false}
        error={null}
        viewMode="grid"
        sortBy="newest"
        page={1}
        totalPages={1}
        pageSize={12}
        filters={{}}
        onViewModeChange={noop}
        onSortChange={noop}
        onPageChange={noop}
        onPageSizeChange={noop}
      />,
    );

    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    expect(list.tagName).toBe('UL');

    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(2);
    articles.forEach((a) => expect(a.tagName).toBe('LI'));
  });

  it('has no axe violations for the listing surface', async () => {
    const { container } = render(
      <SearchResults
        properties={[mockProperty]}
        totalResults={1}
        isLoading={false}
        error={null}
        viewMode="grid"
        sortBy="newest"
        page={1}
        totalPages={1}
        pageSize={12}
        filters={{}}
        onViewModeChange={noop}
        onSortChange={noop}
        onPageChange={noop}
        onPageSizeChange={noop}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
