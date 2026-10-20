import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  QUERY_DEBOUNCE_MS,
  SearchFilterForm,
} from '@/components/forms/SearchFilterForm';
import { DEFAULT_FILTERS, type SearchFilters } from '@/types/property';

/**
 * Unit tests for FiltersPanel (`SearchFilterForm`) — issues #1223 and #1226.
 *
 * The component is rendered in isolation with spy callbacks; the stateful
 * round-trip through a parent lives in SearchFilterForm.integration.test.tsx.
 */

function renderPanel(filters: SearchFilters = DEFAULT_FILTERS) {
  const onApplyFilters = jest.fn();
  const onClearFilters = jest.fn();
  const utils = render(
    <SearchFilterForm
      filters={filters}
      onApplyFilters={onApplyFilters}
      onClearFilters={onClearFilters}
    />,
  );
  return { ...utils, onApplyFilters, onClearFilters };
}

const lastEmitted = (spy: jest.Mock) =>
  spy.mock.calls.at(-1)?.[0] as SearchFilters;

describe('SearchFilterForm rendering', () => {
  it('exposes the panel as a labelled search landmark', () => {
    renderPanel();
    expect(
      screen.getByRole('search', { name: 'Property filters' }),
    ).toBeInTheDocument();
  });

  it.each([
    ['Property type', ['Residential', 'Commercial', 'Industrial', 'Mixed Use']],
    ['Blockchain', ['Ethereum', 'Polygon', 'Binance Smart Chain']],
    ['Bedrooms', ['1+', '2+', '3+', '4+', '5+']],
    ['Bathrooms', ['1+', '2+', '3+', '4+']],
    ['Status', ['active', 'sold', 'pending']],
  ])('renders the %s group with its options', (group, options) => {
    renderPanel();
    const region = screen.getByRole('group', { name: group });
    const names = within(region)
      .getAllByRole('checkbox')
      .map((box) => box.closest('label')?.textContent);
    expect(names).toEqual(options);
  });

  it('reflects the incoming filters in the controls', () => {
    renderPanel({
      ...DEFAULT_FILTERS,
      query: 'loft',
      blockchains: ['polygon'],
    });

    expect(screen.getByLabelText('Search query')).toHaveValue('loft');
    expect(screen.getByRole('checkbox', { name: 'Polygon' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Ethereum' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'active' })).toBeChecked();
  });
});

describe('SearchFilterForm emitting', () => {
  it('emits the default filters once on mount', async () => {
    const { onApplyFilters } = renderPanel();
    await waitFor(() => expect(onApplyFilters).toHaveBeenCalled());
    expect(onApplyFilters).toHaveBeenCalledTimes(1);
    expect(lastEmitted(onApplyFilters)).toEqual(DEFAULT_FILTERS);
  });

  it('emits immediately when a checkbox is toggled', async () => {
    const user = userEvent.setup();
    const { onApplyFilters } = renderPanel();

    await user.click(screen.getByRole('checkbox', { name: 'Commercial' }));

    expect(lastEmitted(onApplyFilters).propertyTypes).toEqual(['commercial']);

    await user.click(screen.getByRole('checkbox', { name: 'Commercial' }));

    expect(lastEmitted(onApplyFilters).propertyTypes).toEqual([]);
  });

  it('shows range validation errors and does not emit invalid filters', async () => {
    const user = userEvent.setup();
    const { onApplyFilters } = renderPanel();
    await waitFor(() => expect(onApplyFilters).toHaveBeenCalledTimes(1));

    const maxPrice = screen.getByLabelText('Max price');
    await user.clear(maxPrice);
    await user.type(maxPrice, '100');
    await waitFor(() => expect(lastEmitted(onApplyFilters).priceRange[1]).toBe(100));
    onApplyFilters.mockClear();

    const minPrice = screen.getByLabelText('Min price');
    await user.clear(minPrice);
    await user.type(minPrice, '200');

    expect(
      await screen.findByText('Maximum price must be greater than or equal to minimum price.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Max price')).toHaveAttribute('aria-invalid', 'true');
    expect(onApplyFilters).not.toHaveBeenCalled();
  });

  it('shows field validation errors for invalid numeric values', async () => {
    const user = userEvent.setup();
    renderPanel();

    const minRoi = screen.getByLabelText('Min ROI');
    await user.clear(minRoi);
    await user.type(minRoi, '101');

    expect(await screen.findByText('Minimum ROI cannot exceed 100%.')).toBeInTheDocument();
    expect(minRoi).toHaveAttribute('aria-invalid', 'true');
  });

  it('debounces the search query', async () => {
    jest.useFakeTimers();
    try {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const { onApplyFilters } = renderPanel();
      onApplyFilters.mockClear();

      await user.type(screen.getByLabelText('Search query'), 'villa');
      expect(onApplyFilters).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(QUERY_DEBOUNCE_MS);
      });

      expect(onApplyFilters).toHaveBeenCalledTimes(1);
      expect(lastEmitted(onApplyFilters).query).toBe('villa');
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not re-emit when the parent re-renders with the same filters', async () => {
    const { onApplyFilters, rerender, onClearFilters } = renderPanel();
    await waitFor(() => expect(onApplyFilters).toHaveBeenCalledTimes(1));

    rerender(
      <SearchFilterForm
        filters={{ ...DEFAULT_FILTERS }}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
      />,
    );

    expect(onApplyFilters).toHaveBeenCalledTimes(1);
  });

  it('resets the form and notifies the parent on Clear filters', async () => {
    const user = userEvent.setup();
    const { onClearFilters, onApplyFilters } = renderPanel({
      ...DEFAULT_FILTERS,
      bedrooms: [2],
    });

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(onClearFilters).toHaveBeenCalledTimes(1);
    expect(
      within(screen.getByRole('group', { name: 'Bedrooms' })).getByRole('checkbox', { name: '2+' }),
    ).not.toBeChecked();
    expect(lastEmitted(onApplyFilters)).toEqual(DEFAULT_FILTERS);
  });
});

describe('SearchFilterForm keyboard navigation', () => {
  const boxes = (group: string) =>
    within(screen.getByRole('group', { name: group })).getAllByRole('checkbox');

  it('makes each checkbox group a single tab stop', () => {
    renderPanel();
    for (const group of ['Property type', 'Blockchain', 'Bedrooms', 'Bathrooms', 'Status']) {
      const tabbable = boxes(group).filter((box) => box.tabIndex === 0);
      expect(tabbable).toHaveLength(1);
    }
  });

  it('tabs from the last checkbox group to the next control, not the next option', async () => {
    const user = userEvent.setup();
    renderPanel();

    boxes('Bathrooms')[0].focus();
    await user.tab();

    expect(screen.getByLabelText('Min square feet')).toHaveFocus();
  });

  it('moves focus with arrow keys and wraps around', async () => {
    const user = userEvent.setup();
    renderPanel();
    const [residential, commercial, industrial, mixedUse] = boxes('Property type');

    residential.focus();
    await user.keyboard('{ArrowDown}');
    expect(commercial).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(industrial).toHaveFocus();

    await user.keyboard('{ArrowLeft}{ArrowUp}');
    expect(residential).toHaveFocus();

    await user.keyboard('{ArrowUp}');
    expect(mixedUse).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(residential).toHaveFocus();
  });

  it('jumps to the ends with Home and End', async () => {
    const user = userEvent.setup();
    renderPanel();
    const options = boxes('Bedrooms');

    options[0].focus();
    await user.keyboard('{End}');
    expect(options.at(-1)).toHaveFocus();

    await user.keyboard('{Home}');
    expect(options[0]).toHaveFocus();
  });

  it('remembers the last focused option as the group tab stop', async () => {
    const user = userEvent.setup();
    renderPanel();
    const [, polygon] = boxes('Blockchain');

    boxes('Blockchain')[0].focus();
    await user.keyboard('{ArrowDown}');

    expect(polygon).toHaveAttribute('tabindex', '0');
    expect(boxes('Blockchain').filter((box) => box.tabIndex === 0)).toEqual([polygon]);
  });

  it('toggles the focused option with Space', async () => {
    const user = userEvent.setup();
    const { onApplyFilters } = renderPanel();
    const [, sold] = boxes('Status');

    boxes('Status')[0].focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard(' ');

    expect(sold).toBeChecked();
    expect(lastEmitted(onApplyFilters).status).toEqual(['active', 'sold']);
  });

  it('clears the search query with Escape', async () => {
    const user = userEvent.setup();
    renderPanel({ ...DEFAULT_FILTERS, query: 'penthouse' });
    const input = screen.getByLabelText('Search query');

    input.focus();
    await user.keyboard('{Escape}');

    expect(input).toHaveValue('');
  });
});
