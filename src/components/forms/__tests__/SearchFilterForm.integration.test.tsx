import React, { useCallback } from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  QUERY_DEBOUNCE_MS,
  SearchFilterForm,
} from '@/components/forms/SearchFilterForm';
import { useSearchStore } from '@/store/searchStore';
import { DEFAULT_FILTERS } from '@/types/property';

/**
 * Issue #1224 — FiltersPanel integration tests.
 *
 * The panel is wired to the real search store the same way /properties wires
 * it, so these cover the full loop: control → onApplyFilters → store →
 * `filters` prop → form.
 */
function StoreBackedPanel() {
  const filters = useSearchStore((state) => state.filters);
  const setFilters = useSearchStore((state) => state.setFilters);
  const clearFilters = useSearchStore((state) => state.clearFilters);
  const handleApply = useCallback(
    (next: typeof filters) => setFilters(next),
    [setFilters],
  );

  return (
    <SearchFilterForm
      filters={filters}
      onApplyFilters={handleApply}
      onClearFilters={clearFilters}
    />
  );
}

const storeFilters = () => useSearchStore.getState().filters;

beforeEach(() => {
  act(() => {
    useSearchStore.getState().reset();
  });
});

describe('SearchFilterForm with the search store', () => {
  it('pushes checkbox and number changes into the store', async () => {
    const user = userEvent.setup();
    render(<StoreBackedPanel />);

    await user.click(screen.getByRole('checkbox', { name: 'Ethereum' }));
    await user.click(
      within(screen.getByRole('group', { name: 'Bedrooms' })).getByRole('checkbox', { name: '3+' }),
    );
    await user.clear(screen.getByLabelText('Min ROI'));
    await user.type(screen.getByLabelText('Min ROI'), '8');

    expect(storeFilters()).toMatchObject({
      blockchains: ['ethereum'],
      bedrooms: [3],
      roiMin: 8,
    });
  });

  it('pushes the query into the store after the debounce', async () => {
    jest.useFakeTimers();
    try {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<StoreBackedPanel />);

      await user.type(screen.getByLabelText('Search query'), 'dock');
      expect(storeFilters().query).toBe('');

      act(() => {
        jest.advanceTimersByTime(QUERY_DEBOUNCE_MS);
      });

      expect(storeFilters().query).toBe('dock');
    } finally {
      jest.useRealTimers();
    }
  });

  it('keeps an in-progress query when another filter round-trips through the store', async () => {
    jest.useFakeTimers();
    try {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<StoreBackedPanel />);
      const input = screen.getByLabelText('Search query');

      await user.type(input, 'mar');
      await user.click(screen.getByRole('checkbox', { name: 'Polygon' }));

      expect(input).toHaveValue('mar');
      expect(storeFilters().blockchains).toEqual(['polygon']);

      act(() => {
        jest.advanceTimersByTime(QUERY_DEBOUNCE_MS);
      });

      expect(storeFilters().query).toBe('mar');
      expect(input).toHaveValue('mar');
    } finally {
      jest.useRealTimers();
    }
  });

  it('reflects filters set elsewhere (e.g. URL sync) in the controls', () => {
    render(<StoreBackedPanel />);

    act(() => {
      useSearchStore.getState().setFilters({
        location: 'Lisbon',
        propertyTypes: ['industrial'],
      });
    });

    expect(screen.getByLabelText('Location')).toHaveValue('Lisbon');
    expect(screen.getByRole('checkbox', { name: 'Industrial' })).toBeChecked();
  });

  it('clears both the form and the store', async () => {
    const user = userEvent.setup();
    render(<StoreBackedPanel />);

    await user.click(screen.getByRole('checkbox', { name: 'Commercial' }));
    await user.type(screen.getByLabelText('Location'), 'Oslo');
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(storeFilters()).toEqual(DEFAULT_FILTERS);
    expect(screen.getByLabelText('Location')).toHaveValue('');
    expect(screen.getByRole('checkbox', { name: 'Commercial' })).not.toBeChecked();
  });

  it('drives a full keyboard-only filter session', async () => {
    const user = userEvent.setup();
    render(<StoreBackedPanel />);

    screen.getByRole('checkbox', { name: 'Ethereum' }).focus();
    await user.keyboard('{End}');
    await user.keyboard(' ');

    await user.tab();
    expect(
      within(screen.getByRole('group', { name: 'Bedrooms' })).getByRole('checkbox', { name: '1+' }),
    ).toHaveFocus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    await user.keyboard(' ');

    expect(storeFilters().blockchains).toEqual(['bsc']);
    expect(storeFilters().bedrooms).toEqual([3]);
  });
});
