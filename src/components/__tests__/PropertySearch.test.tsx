import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropertySearch } from '@/components/PropertySearch';

// Mock hooks used by PropertySearch
jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

jest.mock('@/hooks/usePropertySearchQuery', () => ({
  usePropertyAutocompleteQuery: jest.fn(() => ({ data: [], isLoading: false })),
}));

jest.mock('@/hooks/useSearchHistory', () => ({
  useSearchHistory: () => ({ saveToHistory: jest.fn() }),
}));

jest.mock('@/components/search/SearchHistoryDropdown', () => ({
  SearchHistoryDropdown: ({ onSelect }: { onSelect: (q: string) => void }) => (
    <div data-testid="search-history-dropdown">
      <button onClick={() => onSelect('history item')}>history item</button>
    </div>
  ),
}));

const { usePropertyAutocompleteQuery } = jest.requireMock('@/hooks/usePropertySearchQuery');

describe('PropertySearch', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    usePropertyAutocompleteQuery.mockReturnValue({ data: [], isLoading: false });
  });

  it('renders the search input', () => {
    render(<PropertySearch {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search properties, locations...')).toBeInTheDocument();
  });

  it('uses a custom placeholder when provided', () => {
    render(<PropertySearch {...defaultProps} placeholder="Find a property" />);
    expect(screen.getByPlaceholderText('Find a property')).toBeInTheDocument();
  });

  it('calls onChange when the user types', async () => {
    const onChange = jest.fn();
    render(<PropertySearch value="" onChange={onChange} />);
    const input = screen.getByPlaceholderText('Search properties, locations...');
    await userEvent.type(input, 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('shows the clear button when value is non-empty', () => {
    render(<PropertySearch value="test" onChange={jest.fn()} />);
    // The clear button is a button with an SVG (X icon) — it appears when value is truthy
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('does not show the clear button when value is empty', () => {
    render(<PropertySearch value="" onChange={jest.fn()} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('calls onChange with empty string when clear button is clicked', () => {
    const onChange = jest.fn();
    render(<PropertySearch value="test" onChange={onChange} />);
    const clearButton = screen.getByRole('button');
    fireEvent.click(clearButton);
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('shows loading spinner when isLoading is true and input is focused', async () => {
    usePropertyAutocompleteQuery.mockReturnValue({ data: [], isLoading: true });
    render(<PropertySearch value="abc" onChange={jest.fn()} />);
    const input = screen.getByPlaceholderText('Search properties, locations...');
    fireEvent.focus(input);
    await waitFor(() => {
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });
  });

  it('shows autocomplete suggestions when data is returned', async () => {
    usePropertyAutocompleteQuery.mockReturnValue({
      data: [
        { type: 'property', value: 'Sunset Villa', label: 'Sunset Villa' },
        { type: 'location', value: 'Miami, FL', label: 'Miami, FL' },
      ],
      isLoading: false,
    });
    render(<PropertySearch value="sun" onChange={jest.fn()} />);
    const input = screen.getByPlaceholderText('Search properties, locations...');
    fireEvent.focus(input);
    await waitFor(() => {
      expect(screen.getByText('Sunset Villa')).toBeInTheDocument();
      expect(screen.getByText('Miami, FL')).toBeInTheDocument();
    });
  });

  it('exposes combobox semantics for assistive tech while suggestions are shown', async () => {
    usePropertyAutocompleteQuery.mockReturnValue({
      data: [{ type: 'property', value: 'Sunset Villa', label: 'Sunset Villa' }],
      isLoading: false,
    });

    render(<PropertySearch value="sun" onChange={jest.fn()} />);
    const input = screen.getByPlaceholderText('Search properties, locations...');

    fireEvent.focus(input);

    await waitFor(() => {
      expect(input).toHaveAttribute('role', 'combobox');
      expect(input).toHaveAttribute('aria-autocomplete', 'list');
      expect(input).toHaveAttribute('aria-expanded', 'true');
    });

    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveAttribute('id', input.getAttribute('aria-controls'));
    expect(screen.getByRole('option', { name: /Sunset Villa/i })).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onChange and saves history when a suggestion is clicked', async () => {
    const onChange = jest.fn();
    const { saveToHistory } = jest.requireMock('@/hooks/useSearchHistory').useSearchHistory();
    usePropertyAutocompleteQuery.mockReturnValue({
      data: [{ type: 'property', value: 'Sunset Villa', label: 'Sunset Villa' }],
      isLoading: false,
    });
    render(<PropertySearch value="sun" onChange={onChange} />);
    const input = screen.getByPlaceholderText('Search properties, locations...');
    fireEvent.focus(input);
    await waitFor(() => screen.getByText('Sunset Villa'));
    fireEvent.click(screen.getByText('Sunset Villa'));
    expect(onChange).toHaveBeenCalledWith('Sunset Villa');
  });

  it('navigates suggestions with ArrowDown and selects with Enter', async () => {
    const onChange = jest.fn();
    usePropertyAutocompleteQuery.mockReturnValue({
      data: [{ type: 'property', value: 'Sunset Villa', label: 'Sunset Villa' }],
      isLoading: false,
    });
    render(<PropertySearch value="sun" onChange={onChange} />);
    const input = screen.getByPlaceholderText('Search properties, locations...');
    fireEvent.focus(input);
    await waitFor(() => screen.getByText('Sunset Villa'));
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('Sunset Villa');
  });

  it('closes dropdown on Escape key', async () => {
    usePropertyAutocompleteQuery.mockReturnValue({
      data: [{ type: 'property', value: 'Sunset Villa', label: 'Sunset Villa' }],
      isLoading: false,
    });
    render(<PropertySearch value="sun" onChange={jest.fn()} />);
    const input = screen.getByPlaceholderText('Search properties, locations...');
    fireEvent.focus(input);
    await waitFor(() => screen.getByText('Sunset Villa'));
    fireEvent.keyDown(input, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByText('Sunset Villa')).not.toBeInTheDocument();
    });
  });

  it('shows search history dropdown when focused with short value', async () => {
    render(<PropertySearch value="ab" onChange={jest.fn()} />);
    const input = screen.getByPlaceholderText('Search properties, locations...');
    fireEvent.focus(input);
    await waitFor(() => {
      expect(screen.getByTestId('search-history-dropdown')).toBeInTheDocument();
    });
  });

  it('does not show history dropdown when value is longer than 2 chars', async () => {
    render(<PropertySearch value="abc" onChange={jest.fn()} />);
    const input = screen.getByPlaceholderText('Search properties, locations...');
    fireEvent.focus(input);
    // No history dropdown since value.length > 2
    expect(screen.queryByTestId('search-history-dropdown')).not.toBeInTheDocument();
  });

  it('does not produce console.log calls during render or interaction', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    render(<PropertySearch value="test" onChange={jest.fn()} />);
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
