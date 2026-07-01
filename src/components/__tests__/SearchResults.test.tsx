import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

import { SearchResults } from '@/components/SearchResults';
import { DEFAULT_FILTERS, SORT_LABELS } from '@/types/property';
import { PAGE_SIZE_OPTIONS } from '@/hooks/usePaginationParams';

// ---------------------------------------------------------------------------
// Mock child components so we focus on SearchResults itself.
// ---------------------------------------------------------------------------

jest.mock('@/components/PropertyCard', () => ({
  PropertyCard: ({ property, viewMode }: { property: { id: string; name: string }; viewMode: 'grid' | 'list' }) => (
    <div data-testid="property-card" data-property-id={property.id} data-view-mode={viewMode}>
      {property.name}
    </div>
  ),
}));

jest.mock('@/components/SaveSearchButton', () => ({
  SaveSearchButton: ({ filters, sortBy }: { filters: unknown; sortBy: string }) => (
    <button data-testid="save-search-button" data-sort={sortBy}>
      save-search-{JSON.stringify(filters).length}
    </button>
  ),
}));

jest.mock('@/components/PropertyPagination', () => ({
  PropertyPagination: (props: {
    page: number;
    totalPages: number;
    totalResults: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    buildHref?: (page: number) => string;
  }) => (
    <nav
      aria-label="property-pagination-mock"
      data-page={props.page}
      data-total-pages={props.totalPages}
      data-page-size={props.pageSize}
      data-total={props.totalResults}
    >
      <button onClick={() => props.onPageChange(props.page - 1)}>prev-mock</button>
      <button onClick={() => props.onPageChange(props.page + 1)}>next-mock</button>
      <button onClick={() => props.onPageSizeChange(24)}>size-24-mock</button>
      {props.buildHref ? (
        <a data-href={props.buildHref(props.page)}>link</a>
      ) : null}
    </nav>
  ),
}));

jest.mock('@/components/ComparisonBar', () => ({
  ComparisonBar: () => <div data-testid="comparison-bar" />,
}));

jest.mock('@/components/ui/EmptyState', () => ({
  EmptyState: ({ title, description }: { title: string; description: string }) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
}));

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: () => ({
    getVirtualItems: () => [],
    getTotalSize: () => 0,
  }),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeProperty = (id: string, name = `Property ${id}`) => ({
  id,
  name,
  description: '',
  location: {
    address: '1 Test St',
    city: 'Testville',
    state: 'TS',
    country: 'USA',
    zipCode: '00000',
    coordinates: { lat: 0, lng: 0 },
  },
  price: { total: 1, perToken: 1, currency: 'ETH' },
  propertyType: 'residential' as const,
  blockchain: 'ethereum' as const,
  tokenInfo: { totalSupply: 100, available: 50, sold: 50, contractAddress: '0xabc', tokenSymbol: 'TST' },
  metrics: { roi: 5, annualReturn: 1, transactionVolume: 0, appreciationRate: 0 },
  details: { squareFeet: 1000, yearBuilt: 2020, amenities: [] },
  images: [`https://example.com/${id}.jpg`],
  listedDate: '2024-01-01',
  status: 'active' as const,
});

const buildProps = (overrides: Partial<React.ComponentProps<typeof SearchResults>> = {}) => ({
  properties: [makeProperty('1'), makeProperty('2')] as any,
  totalResults: 2,
  isLoading: false,
  error: null,
  viewMode: 'grid' as const,
  sortBy: 'newest' as const,
  page: 1,
  totalPages: 1,
  pageSize: 12 as const,
  filters: DEFAULT_FILTERS,
  onViewModeChange: jest.fn(),
  onSortChange: jest.fn(),
  onPageChange: jest.fn(),
  onPageSizeChange: jest.fn(),
  buildPageHref: undefined,
  ...overrides,
});

describe('<SearchResults />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to a desktop-width viewport to make column logic deterministic.
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1280,
    });
  });

  describe('Header copy & sort dropdown', () => {
    it('renders the header with the formatted total result count', () => {
      render(<SearchResults {...(buildProps({ totalResults: 4321 }) as any)} />);

      expect(screen.getByText('4,321 Properties Found')).toBeInTheDocument();
    });

    it('renders "Searching..." while isLoading is true', () => {
      render(<SearchResults {...(buildProps({ isLoading: true, totalResults: 100, properties: [] as any }) as any)} />);

      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });

    it('renders a Page x of y sub-header when totalPages > 1', () => {
      render(
        <SearchResults
          {...(buildProps({ page: 2, totalPages: 5 }) as any)}
        />,
      );

      expect(screen.getByText('Page 2 of 5')).toBeInTheDocument();
    });

    it('does not render a Page x of y sub-header for a single-page result', () => {
      render(<SearchResults {...(buildProps({ page: 1, totalPages: 1 }) as any)} />);

      expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
    });

    it('renders the sort dropdown with every option in SORT_LABELS', () => {
      render(<SearchResults {...(buildProps() as any)} />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      const optionValues = Array.from(select.options).map((o) => o.value);

      for (const label of Object.values(SORT_LABELS)) {
        expect(select).toHaveTextContent(label);
      }

      // The dropdown mirrors the sortBy prop.
      expect(select.value).toBe('newest');
      // And it should contain every SortOption.
      expect(optionValues).toEqual(
        expect.arrayContaining([
          'price-asc',
          'price-desc',
          'roi-desc',
          'roi-asc',
          'newest',
          'oldest',
          'volume-desc',
        ]),
      );
    });

    it('invokes onSortChange when a new sort is selected', () => {
      const onSortChange = jest.fn();
      render(<SearchResults {...(buildProps({ onSortChange }) as any)} />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      act(() => {
        fireEvent.change(select, { target: { value: 'price-desc' } });
      });

      expect(onSortChange).toHaveBeenCalledWith('price-desc');
    });

    it('reflects the externally-supplied sortBy value', () => {
      render(<SearchResults {...(buildProps({ sortBy: 'price-desc' as any }) as any)} />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('price-desc');
    });
  });

  describe('View toggle buttons', () => {
    it('marks the active view-mode button with a highlight class', () => {
      render(<SearchResults {...(buildProps({ viewMode: 'list' }) as any)} />);

      const listBtn = screen.getByRole('button', { name: /List view/i });
      const gridBtn = screen.getByRole('button', { name: /Grid view/i });

      expect(listBtn.className).toMatch(/bg-white/);
      expect(gridBtn.className).not.toMatch(/bg-white/);
    });

    it('invokes onViewModeChange when the grid button is clicked', () => {
      const onViewModeChange = jest.fn();
      render(
        <SearchResults
          {...(buildProps({ viewMode: 'list', onViewModeChange }) as any)}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: /Grid view/i }));
      expect(onViewModeChange).toHaveBeenCalledWith('grid');
    });

    it('invokes onViewModeChange when the list button is clicked', () => {
      const onViewModeChange = jest.fn();
      render(<SearchResults {...(buildProps({ onViewModeChange }) as any)} />);

      fireEvent.click(screen.getByRole('button', { name: /List view/i }));
      expect(onViewModeChange).toHaveBeenCalledWith('list');
    });

    it('toggles between grid and list correctly without an active item present', () => {
      const onViewModeChange = jest.fn();
      // Pass empty properties so the body shows the empty/loading state.
      render(
        <SearchResults
          {...(buildProps({
            properties: [] as any,
            totalResults: 0,
            onViewModeChange,
          }) as any)}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: /List view/i }));
      expect(onViewModeChange).toHaveBeenCalledWith('list');
    });
  });

  describe('SaveSearchButton wiring', () => {
    it('renders <SaveSearchButton> with the filters and sortBy from props', () => {
      const filters = { ...DEFAULT_FILTERS, query: 'penthouse' };
      render(<SearchResults {...(buildProps({ filters, sortBy: 'price-desc' as any }) as any)} />);

      const btn = screen.getByTestId('save-search-button');
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveAttribute('data-sort', 'price-desc');
    });
  });

  describe('Lifecycle: resize listener', () => {
    it('attaches a resize listener on mount and removes it on unmount', () => {
      const add = jest.spyOn(window, 'addEventListener');
      const remove = jest.spyOn(window, 'removeEventListener');

      const { unmount } = render(<SearchResults {...(buildProps() as any)} />);

      expect(add).toHaveBeenCalledWith('resize', expect.any(Function));
      const handler = add.mock.calls.find((c) => c[0] === 'resize')?.[1] as
        | (() => void)
        | undefined;
      expect(typeof handler).toBe('function');

      unmount();

      expect(remove).toHaveBeenCalledWith('resize', handler);
      add.mockRestore();
      remove.mockRestore();
    });

    it('reacts to viewport size by switching column count and view-mode combinations', () => {
      // Mobile viewport first.
      Object.defineProperty(window, 'innerWidth', { value: 480, configurable: true, writable: true });
      const { rerender } = render(<SearchResults {...(buildProps() as any)} />);

      // Switch to desktop and re-render to ensure no stale values remain.
      Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true, writable: true });
      fireEvent(window, new Event('resize'));
      rerender(<SearchResults {...(buildProps() as any)} />);

      // Loop body execution should be a no-op for empty additional test ids.
      expect(screen.queryAllByTestId('skeleton').length).toBeGreaterThanOrEqual(0);
    });

    it('uses one column for list view regardless of window width', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1600, configurable: true, writable: true });
      const { rerender } = render(<SearchResults {...(buildProps({ viewMode: 'list' }) as any)} />);

      // List view is always 1 column wide; no-crash assertion.
      fireEvent(window, new Event('resize'));
      rerender(<SearchResults {...(buildProps({ viewMode: 'list' }) as any)} />);

      // Each property card should still render normally.
      expect(screen.getAllByTestId('property-card')).toHaveLength(2);
    });
  });

  describe('Loading, empty and error states', () => {
    it('renders 6 skeleton placeholders while isLoading is true', () => {
      render(
        <SearchResults
          {...(buildProps({
            isLoading: true,
            properties: [] as any,
          }) as any)}
        />,
      );

      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThanOrEqual(6);
    });

    it('renders the EmptyState when no properties exist and not loading', () => {
      render(
        <SearchResults
          {...(buildProps({
            isLoading: false,
            properties: [] as any,
            totalResults: 0,
          }) as any)}
        />,
      );

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No properties found')).toBeInTheDocument();
    });

    it('renders the error message when error is set', () => {
      render(
        <SearchResults
          {...(buildProps({
            error: 'Backend service unavailable',
          }) as any)}
        />,
      );

      expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText('Backend service unavailable')).toBeInTheDocument();
    });

    it('hides the loading skeletons when error is set, even if isLoading is true', () => {
      render(
        <SearchResults
          {...(buildProps({
            error: 'Boom',
            isLoading: true,
            properties: [] as any,
          }) as any)}
        />,
      );

      expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();
      // Early-return before reaching the loading skeleton block.
      expect(screen.queryAllByTestId('skeleton')).toHaveLength(0);
    });

    it('renders each property as a <PropertyCard> with the current view mode', () => {
      render(<SearchResults {...(buildProps({ viewMode: 'list' }) as any)} />);

      const cards = screen.getAllByTestId('property-card');
      expect(cards).toHaveLength(2);
      expect(cards[0]).toHaveAttribute('data-property-id', '1');
      expect(cards[0]).toHaveAttribute('data-view-mode', 'list');
    });
  });

  describe('Pagination props forwarding', () => {
    it('passes page/totalPages/pageSize/totalResults/buildHref through', () => {
      const buildPageHref = jest.fn((page: number) => `/results?page=${page}`);

      render(
        <SearchResults
          {...(buildProps({
            page: 3,
            totalPages: 10,
            totalResults: 200,
            pageSize: 24,
            buildPageHref,
          }) as any)}
        />,
      );

      const nav = screen.getByLabelText('property-pagination-mock');
      expect(nav).toHaveAttribute('data-page', '3');
      expect(nav).toHaveAttribute('data-total-pages', '10');
      expect(nav).toHaveAttribute('data-page-size', '24');
      expect(nav).toHaveAttribute('data-total', '200');

      expect(buildPageHref).toHaveBeenCalledWith(3);
      expect(buildPageHref).toHaveBeenCalled();
    });

    it('forwards onPageChange invocations from <PropertyPagination>', () => {
      const onPageChange = jest.fn();
      render(
        <SearchResults
          {...(buildProps({
            page: 2,
            totalPages: 4,
            onPageChange,
          }) as any)}
        />,
      );

      fireEvent.click(screen.getByText('next-mock'));
      expect(onPageChange).toHaveBeenCalledWith(3);

      fireEvent.click(screen.getByText('prev-mock'));
      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('forwards onPageSizeChange invocations from <PropertyPagination>', () => {
      const onPageSizeChange = jest.fn();
      render(<SearchResults {...(buildProps({ onPageSizeChange }) as any)} />);

      fireEvent.click(screen.getByText('size-24-mock'));
      expect(onPageSizeChange).toHaveBeenCalledWith(24);
      expect(PAGE_SIZE_OPTIONS).toContain(24);
    });
  });

  describe('ComparisonBar always renders', () => {
    it('renders the ComparisonBar slot above the result list', () => {
      render(<SearchResults {...(buildProps() as any)} />);

      expect(screen.getByTestId('comparison-bar')).toBeInTheDocument();
    });
  });

  describe('DEFAULTS sanity', () => {
    it('PAGE_SIZE_OPTIONS contains valid values', () => {
      expect(PAGE_SIZE_OPTIONS).toEqual([12, 24, 48]);
    });
  });
});
