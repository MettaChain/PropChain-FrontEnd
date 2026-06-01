import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FloatingComparisonBar } from '@/components/FloatingComparisonBar';
import { useComparisonStore } from '@/store/comparisonStore';

jest.mock('@/store/comparisonStore', () => ({
  useComparisonStore: jest.fn(),
}));

jest.mock('@/utils/searchUtils', () => ({
  formatPrice: (price: number) => `$${price.toLocaleString()}`,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockUseComparisonStore = useComparisonStore as jest.MockedFunction<typeof useComparisonStore>;

const makeProperty = (id: string, name: string, price: number) => ({
  id,
  name,
  price: { total: price },
});

const mockStore = (overrides = {}) => {
  const defaults = {
    selectedProperties: [],
    removeProperty: jest.fn(),
    clearProperties: jest.fn(),
  };
  mockUseComparisonStore.mockReturnValue({ ...defaults, ...overrides } as ReturnType<typeof useComparisonStore>);
};

describe('FloatingComparisonBar', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders nothing when no properties are selected', () => {
    mockStore();
    const { container } = render(<FloatingComparisonBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders property chips for each selected property', () => {
    mockStore({
      selectedProperties: [
        makeProperty('1', 'Sunset Villa', 500000),
        makeProperty('2', 'Harbor Loft', 300000),
      ],
    });
    render(<FloatingComparisonBar />);
    expect(screen.getByText('Sunset Villa')).toBeInTheDocument();
    expect(screen.getByText('Harbor Loft')).toBeInTheDocument();
  });

  it('shows the correct property count', () => {
    mockStore({ selectedProperties: [makeProperty('1', 'Villa', 100)] });
    render(<FloatingComparisonBar />);
    expect(screen.getByText(/1\/3/)).toBeInTheDocument();
  });

  it('calls removeProperty when a chip remove button is clicked', () => {
    const removeProperty = jest.fn();
    const property = makeProperty('1', 'Sunset Villa', 500000);
    mockStore({ selectedProperties: [property], removeProperty });
    render(<FloatingComparisonBar />);
    fireEvent.click(screen.getByTitle('Remove from comparison'));
    expect(removeProperty).toHaveBeenCalledWith(property);
  });

  it('calls clearProperties when the clear button is clicked', () => {
    const clearProperties = jest.fn();
    mockStore({ selectedProperties: [makeProperty('1', 'Villa', 100)], clearProperties });
    render(<FloatingComparisonBar />);
    fireEvent.click(screen.getByTitle('Clear all'));
    expect(clearProperties).toHaveBeenCalled();
  });

  it('renders a Compare Now link with correct href', () => {
    mockStore({
      selectedProperties: [makeProperty('1', 'Villa A', 100), makeProperty('2', 'Villa B', 200)],
    });
    render(<FloatingComparisonBar />);
    const link = screen.getByRole('link', { name: /compare now/i });
    expect(link).toHaveAttribute('href', '/compare?ids=1,2');
  });

  it('displays formatted price for each property', () => {
    mockStore({ selectedProperties: [makeProperty('1', 'Villa', 500000)] });
    render(<FloatingComparisonBar />);
    expect(screen.getByText('$500,000')).toBeInTheDocument();
  });
});
