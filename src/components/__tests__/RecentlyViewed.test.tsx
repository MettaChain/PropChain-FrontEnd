import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecentlyViewed, PropertyCard, formatTimeAgo } from '@/components/RecentlyViewed';
import type { RecentlyViewedProperty } from '@/store/recentlyViewedStore';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => {
    const { fill, ...rest } = props;
    return <img {...rest} data-fill={fill ? 'true' : 'false'} />;
  },
}));

// Mock next/link
jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock the recently viewed store
jest.mock('@/store/recentlyViewedStore', () => ({
  useRecentlyViewedStore: jest.fn(),
}));

const mockUseRecentlyViewedStore = jest.requireMock('@/store/recentlyViewedStore').useRecentlyViewedStore;

const createMockProperty = (overrides: Partial<RecentlyViewedProperty> = {}): RecentlyViewedProperty => ({
  id: 'prop-1',
  name: 'Test Property',
  location: 'New York, NY',
  price: 500000,
  image: '/test-image.jpg',
  viewedAt: Date.now() - 3600000, // 1 hour ago by default
  ...overrides,
});

describe('formatTimeAgo', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-01T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns "Just now" for timestamps less than 1 minute ago', () => {
    const now = Date.now();
    expect(formatTimeAgo(now)).toBe('Just now');
    expect(formatTimeAgo(now - 30000)).toBe('Just now'); // 30 seconds
    expect(formatTimeAgo(now - 59000)).toBe('Just now'); // 59 seconds
  });

  it('returns minutes ago for timestamps between 1 and 59 minutes', () => {
    const now = Date.now();
    expect(formatTimeAgo(now - 60000)).toBe('1m ago'); // 1 minute
    expect(formatTimeAgo(now - 300000)).toBe('5m ago'); // 5 minutes
    expect(formatTimeAgo(now - 3540000)).toBe('59m ago'); // 59 minutes
  });

  it('returns hours ago for timestamps between 1 and 23 hours', () => {
    const now = Date.now();
    expect(formatTimeAgo(now - 3600000)).toBe('1h ago'); // 1 hour
    expect(formatTimeAgo(now - 7200000)).toBe('2h ago'); // 2 hours
    expect(formatTimeAgo(now - 82800000)).toBe('23h ago'); // 23 hours
  });

  it('returns days ago for timestamps 24 hours or more', () => {
    const now = Date.now();
    expect(formatTimeAgo(now - 86400000)).toBe('1d ago'); // 1 day
    expect(formatTimeAgo(now - 172800000)).toBe('2d ago'); // 2 days
    expect(formatTimeAgo(now - 864000000)).toBe('10d ago'); // 10 days
  });

  it('handles future timestamps', () => {
    const now = Date.now();
    expect(formatTimeAgo(now + 3600000)).toBe('Just now'); // 1 hour in future
  });
});

describe('PropertyCard', () => {
  const onRemove = jest.fn();

  beforeEach(() => {
    onRemove.mockClear();
  });

  it('renders property information correctly', () => {
    const property = createMockProperty();
    render(<PropertyCard property={property} onRemove={onRemove} />);

    expect(screen.getByText('Test Property')).toBeInTheDocument();
    expect(screen.getByText('New York, NY')).toBeInTheDocument();
    expect(screen.getByText('$500,000')).toBeInTheDocument();
  });

  it('renders the property image', () => {
    const property = createMockProperty();
    render(<PropertyCard property={property} onRemove={onRemove} />);

    const img = screen.getByAltText('Test Property');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/test-image.jpg');
  });

  it('links to the property detail page', () => {
    const property = createMockProperty();
    render(<PropertyCard property={property} onRemove={onRemove} />);

    const link = screen.getByText('Test Property').closest('a');
    expect(link).toHaveAttribute('href', '/properties/prop-1');
  });

  it('calls onRemove when remove button is clicked', () => {
    const property = createMockProperty();
    render(<PropertyCard property={property} onRemove={onRemove} />);

    const removeButton = screen.getByTitle('Remove from history');
    fireEvent.click(removeButton);

    expect(onRemove).toHaveBeenCalledWith('prop-1');
  });

  it('shows relative time for viewedAt', () => {
    const property = createMockProperty({ viewedAt: Date.now() - 7200000 });
    render(<PropertyCard property={property} onRemove={onRemove} />);

    expect(screen.getByText('2h ago')).toBeInTheDocument();
  });
});

describe('RecentlyViewed', () => {
  beforeEach(() => {
    mockUseRecentlyViewedStore.mockReset();
  });

  it('renders nothing when there are no properties', () => {
    mockUseRecentlyViewedStore.mockReturnValue({
      properties: [],
      removeProperty: jest.fn(),
      clearHistory: jest.fn(),
    });

    const { container } = render(<RecentlyViewed />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a list of recently viewed properties', () => {
    const properties = [
      createMockProperty({ id: 'prop-1', name: 'Property 1' }),
      createMockProperty({ id: 'prop-2', name: 'Property 2' }),
    ];

    mockUseRecentlyViewedStore.mockReturnValue({
      properties,
      removeProperty: jest.fn(),
      clearHistory: jest.fn(),
    });

    render(<RecentlyViewed />);

    expect(screen.getByText('Recently Viewed')).toBeInTheDocument();
    expect(screen.getByText('Property 1')).toBeInTheDocument();
    expect(screen.getByText('Property 2')).toBeInTheDocument();
  });

  it('calls clearHistory when Clear All button is clicked', () => {
    const clearHistory = jest.fn();
    const properties = [createMockProperty()];

    mockUseRecentlyViewedStore.mockReturnValue({
      properties,
      removeProperty: jest.fn(),
      clearHistory,
    });

    render(<RecentlyViewed />);

    fireEvent.click(screen.getByText('Clear All'));
    expect(clearHistory).toHaveBeenCalled();
  });

  it('renders property cards with remove functionality', () => {
    const removeProperty = jest.fn();
    const properties = [createMockProperty({ id: 'prop-1' })];

    mockUseRecentlyViewedStore.mockReturnValue({
      properties,
      removeProperty,
      clearHistory: jest.fn(),
    });

    render(<RecentlyViewed />);

    const removeButton = screen.getByTitle('Remove from history');
    fireEvent.click(removeButton);

    expect(removeProperty).toHaveBeenCalledWith('prop-1');
  });
});
