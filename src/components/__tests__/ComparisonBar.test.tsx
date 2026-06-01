import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComparisonBar } from '@/components/ComparisonBar';

// Mock the compare store
jest.mock('@/store/compareStore', () => ({
  useCompareStore: jest.fn(),
}));

const mockUseCompareStore = jest.requireMock('@/store/compareStore').useCompareStore;

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'comparison.title': `Compare selected properties (${String(params?.count ?? 0)}/${String(params?.max ?? 3)})`,
        'comparison.copyComparisonLink': 'Copy Comparison Link',
        'comparison.linkCopied': 'Link Copied',
        'comparison.compareNow': 'Compare Now',
        'comparison.clear': 'Clear',
        'comparison.removeFromComparison': 'Remove from comparison',
        'comparison.shareComparison': 'Share this comparison with others',
      };
      return translations[key] ?? key;
    },
    i18n: { language: 'en', changeLanguage: jest.fn() },
  }),
}));

// Mock next/link
jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('ComparisonBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing when no properties are selected', () => {
    mockUseCompareStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) => {
      const state = { selectedIds: [], removeProperty: jest.fn(), clearCompare: jest.fn() };
      return selector(state);
    });

    const { container } = render(<ComparisonBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders comparison bar with selected property IDs', () => {
    mockUseCompareStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) => {
      const state = {
        selectedIds: ['prop1', 'prop2'],
        removeProperty: jest.fn(),
        clearCompare: jest.fn(),
      };
      return selector(state);
    });

    render(<ComparisonBar />);

    expect(screen.getByText(/Compare selected properties \(2\/3\)/)).toBeInTheDocument();
    expect(screen.getByText('#prop1')).toBeInTheDocument();
    expect(screen.getByText('#prop2')).toBeInTheDocument();
    expect(screen.getByText('Copy Comparison Link')).toBeInTheDocument();
    expect(screen.getByText('Compare Now')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('calls removeProperty when clicking a property chip', () => {
    const removeProperty = jest.fn();
    mockUseCompareStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) => {
      const state = { selectedIds: ['prop1'], removeProperty, clearCompare: jest.fn() };
      return selector(state);
    });

    render(<ComparisonBar />);

    const chipButton = screen.getByText('#prop1').closest('button');
    expect(chipButton).not.toBeNull();
    fireEvent.click(chipButton!);

    expect(removeProperty).toHaveBeenCalledWith('prop1');
  });

  it('calls clearCompare when clicking clear button', () => {
    const clearCompare = jest.fn();
    mockUseCompareStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) => {
      const state = { selectedIds: ['prop1', 'prop2'], removeProperty: jest.fn(), clearCompare };
      return selector(state);
    });

    render(<ComparisonBar />);

    fireEvent.click(screen.getByText('Clear'));

    expect(clearCompare).toHaveBeenCalled();
  });

  it('copies share URL when clicking copy button', async () => {
    const writeTextMock = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    mockUseCompareStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) => {
      const state = { selectedIds: ['prop1', 'prop2'], removeProperty: jest.fn(), clearCompare: jest.fn() };
      return selector(state);
    });

    render(<ComparisonBar />);

    fireEvent.click(screen.getByText('Copy Comparison Link'));

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
    });
  });

  it('shows copied feedback after copying link', async () => {
    const writeTextMock = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    mockUseCompareStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) => {
      const state = { selectedIds: ['prop1'], removeProperty: jest.fn(), clearCompare: jest.fn() };
      return selector(state);
    });

    render(<ComparisonBar />);

    // Click copy button
    fireEvent.click(screen.getByText('Copy Comparison Link'));

    await waitFor(() => {
      expect(screen.getByText('Link Copied')).toBeInTheDocument();
    });

    // After timeout, should revert
    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByText('Copy Comparison Link')).toBeInTheDocument();
    });
  });

  it('has correct link in Compare Now link', () => {
    mockUseCompareStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) => {
      const state = { selectedIds: ['prop1', 'prop2'], removeProperty: jest.fn(), clearCompare: jest.fn() };
      return selector(state);
    });

    render(<ComparisonBar />);

    const compareLink = screen.getByText('Compare Now').closest('a');
    expect(compareLink).toHaveAttribute('href', '/compare?ids=prop1,prop2');
  });

  it('has correct shareUrl format', () => {
    mockUseCompareStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) => {
      const state = { selectedIds: ['prop1', 'prop2'], removeProperty: jest.fn(), clearCompare: jest.fn() };
      return selector(state);
    });

    render(<ComparisonBar />);

    const compareLink = screen.getByText('Compare Now').closest('a');
    expect(compareLink).toHaveAttribute('href', expect.stringContaining('ids=prop1,prop2'));
  });

  it('shows correct count with single property', () => {
    mockUseCompareStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) => {
      const state = { selectedIds: ['prop1'], removeProperty: jest.fn(), clearCompare: jest.fn() };
      return selector(state);
    });

    render(<ComparisonBar />);

    expect(screen.getByText(/Compare selected properties \(1\/3\)/)).toBeInTheDocument();
  });

  it('shows correct count with three properties', () => {
    mockUseCompareStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) => {
      const state = { selectedIds: ['prop1', 'prop2', 'prop3'], removeProperty: jest.fn(), clearCompare: jest.fn() };
      return selector(state);
    });

    render(<ComparisonBar />);

    expect(screen.getByText(/Compare selected properties \(3\/3\)/)).toBeInTheDocument();
  });
});
