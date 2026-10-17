import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchFilterForm } from '@/components/forms/SearchFilterForm';
import { DEFAULT_FILTERS } from '@/types/property';

/**
 * Issue #1225 — FiltersPanel re-render budget.
 *
 * The checkbox primitive is swapped for a plain input that counts its own
 * renders, keyed by option value. That gives a cheap, deterministic signal of
 * which parts of the panel re-render for a given interaction.
 */
const renderCounts = new Map<string, number>();

jest.mock('@/components/ui/checkbox', () => {
  const ReactActual = jest.requireActual<typeof import('react')>('react');
  return {
    Checkbox: ReactActual.forwardRef<
      HTMLInputElement,
      {
        value: string;
        checked: boolean;
        onCheckedChange: (checked: boolean) => void;
        tabIndex?: number;
      }
    >(function CountingCheckbox({ value, checked, onCheckedChange, tabIndex }, ref) {
      renderCounts.set(value, (renderCounts.get(value) ?? 0) + 1);
      return (
        <input
          ref={ref}
          type="checkbox"
          value={value}
          checked={checked}
          tabIndex={tabIndex}
          onChange={(event) => onCheckedChange(event.target.checked)}
        />
      );
    }),
  };
});

const BLOCKCHAIN_VALUES = ['ethereum', 'polygon', 'bsc'];
const PROPERTY_TYPE_VALUES = ['residential', 'commercial', 'industrial', 'mixed-use'];
const STATUS_VALUES = ['active', 'sold', 'pending'];

const sumRenders = (values: string[]) =>
  values.reduce((total, value) => total + (renderCounts.get(value) ?? 0), 0);

function renderPanel() {
  const props = {
    filters: DEFAULT_FILTERS,
    onApplyFilters: jest.fn(),
    onClearFilters: jest.fn(),
  };
  const utils = render(<SearchFilterForm {...props} />);
  return { ...utils, props };
}

beforeEach(() => {
  renderCounts.clear();
});

describe('SearchFilterForm re-renders', () => {
  it('does not re-render any checkbox while typing in a text field', async () => {
    const user = userEvent.setup();
    renderPanel();
    renderCounts.clear();

    await user.type(screen.getByLabelText('Location'), 'Austin');
    await user.type(screen.getByLabelText('Search query'), 'loft');

    expect(renderCounts.size).toBe(0);
  });

  it('re-renders only the toggled group', async () => {
    const user = userEvent.setup();
    const { container } = renderPanel();
    renderCounts.clear();

    await user.click(
      container.querySelector('input[value="commercial"]') as HTMLInputElement,
    );

    expect(sumRenders(PROPERTY_TYPE_VALUES)).toBeGreaterThan(0);
    expect(sumRenders(BLOCKCHAIN_VALUES)).toBe(0);
    expect(sumRenders(STATUS_VALUES)).toBe(0);
  });

  it('skips re-rendering when the parent re-renders with identical props', () => {
    const { rerender, props } = renderPanel();
    renderCounts.clear();

    rerender(<SearchFilterForm {...props} />);

    expect(renderCounts.size).toBe(0);
  });
});
