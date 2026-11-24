import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  PropertyComparisonTable,
  nextCellPosition,
  type ComparisonProperty,
} from '../components/PropertyComparisonTable';

const properties: ComparisonProperty[] = [
  { id: 'p-1', name: 'Sunset Villa', location: 'Los Angeles', price: 750_000, roi: 8.4, yield: 5.1 },
  { id: 'p-2', name: 'Harbour Lofts', location: 'Seattle', price: 620_000, roi: 7.2, yield: 4.6 },
];

const cell = (row: number, column: number) =>
  document.querySelector<HTMLElement>(`[data-cell="${row}-${column}"]`);

/** Rows are not named by their contents, so resolve via the row header. */
const rowFor = (name: string) =>
  screen.getByRole('rowheader', { name }).closest('tr') as HTMLElement;

/** `.focus()` fires a React onFocus state update, so it must run inside act. */
const focusCell = (row: number, column: number) => {
  act(() => {
    cell(row, column)?.focus();
  });
};

describe('nextCellPosition', () => {
  const bounds = { rows: 3, columns: 5 };

  it('moves horizontally and vertically', () => {
    expect(nextCellPosition({ row: 1, column: 1 }, 'ArrowRight', bounds)).toEqual({ row: 1, column: 2 });
    expect(nextCellPosition({ row: 1, column: 1 }, 'ArrowLeft', bounds)).toEqual({ row: 1, column: 0 });
    expect(nextCellPosition({ row: 1, column: 1 }, 'ArrowDown', bounds)).toEqual({ row: 2, column: 1 });
    expect(nextCellPosition({ row: 1, column: 1 }, 'ArrowUp', bounds)).toEqual({ row: 0, column: 1 });
  });

  it('clamps at the edges instead of wrapping', () => {
    expect(nextCellPosition({ row: 0, column: 0 }, 'ArrowUp', bounds)).toEqual({ row: 0, column: 0 });
    expect(nextCellPosition({ row: 0, column: 0 }, 'ArrowLeft', bounds)).toEqual({ row: 0, column: 0 });
    expect(nextCellPosition({ row: 2, column: 4 }, 'ArrowDown', bounds)).toEqual({ row: 2, column: 4 });
    expect(nextCellPosition({ row: 2, column: 4 }, 'ArrowRight', bounds)).toEqual({ row: 2, column: 4 });
  });

  it('supports Home, End and page jumps', () => {
    expect(nextCellPosition({ row: 1, column: 3 }, 'Home', bounds)).toEqual({ row: 1, column: 0 });
    expect(nextCellPosition({ row: 1, column: 0 }, 'End', bounds)).toEqual({ row: 1, column: 4 });
    expect(nextCellPosition({ row: 0, column: 0 }, 'PageDown', bounds)).toEqual({ row: 2, column: 0 });
    expect(nextCellPosition({ row: 2, column: 0 }, 'PageUp', bounds)).toEqual({ row: 0, column: 0 });
  });

  it('mirrors horizontal movement in right-to-left layouts', () => {
    expect(nextCellPosition({ row: 0, column: 1 }, 'ArrowRight', bounds, true)).toEqual({ row: 0, column: 0 });
    expect(nextCellPosition({ row: 0, column: 1 }, 'ArrowLeft', bounds, true)).toEqual({ row: 0, column: 2 });
  });

  it('ignores keys it does not handle', () => {
    expect(nextCellPosition({ row: 0, column: 0 }, 'Enter', bounds)).toBeNull();
    expect(nextCellPosition({ row: 0, column: 0 }, 'a', bounds)).toBeNull();
  });
});

describe('PropertyComparisonTable keyboard navigation', () => {
  it('exposes the table as a named ARIA grid with row and column headers', () => {
    render(<PropertyComparisonTable properties={properties} />);

    const grid = screen.getByRole('grid', { name: 'Property comparison' });
    expect(grid).toHaveAttribute('aria-colcount', '5');
    expect(grid).toHaveAttribute('aria-rowcount', '3');

    const columnHeaders = within(grid).getAllByRole('columnheader');
    expect(columnHeaders.map((header) => header.textContent?.replace(/[▲▼]/g, '').trim())).toEqual([
      'Property',
      'Location',
      'Price',
      'ROI (%)',
      'Yield (%)',
    ]);

    // Default sort is price ascending, so Harbour Lofts (620k) is row 0.
    const rowHeaders = within(grid).getAllByRole('rowheader');
    expect(rowHeaders.map((header) => header.textContent)).toEqual(['Harbour Lofts', 'Sunset Villa']);

    // Each data cell names its row and column so a screen reader can announce
    // position even when entering the grid mid-table.
    expect(cell(0, 1)).toHaveAttribute('aria-label', 'Harbour Lofts, Location: Seattle');
    expect(cell(1, 2)).toHaveAttribute('aria-label', 'Sunset Villa, Price: 750,000');
  });

  it('renders a skip link above the grid that moves focus into it', async () => {
    const user = userEvent.setup();
    render(<PropertyComparisonTable properties={properties} />);

    const skip = screen.getByRole('link', { name: 'Skip to comparison table' });
    const grid = screen.getByRole('grid');
    // The link is the first focusable element in the component.
    expect(skip.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await user.click(skip);
    expect(cell(0, 0)).toHaveFocus();
  });

  it('moves between interactive elements with Tab', async () => {
    const user = userEvent.setup();
    render(<PropertyComparisonTable properties={properties} />);

    await user.tab();
    expect(screen.getByRole('link', { name: 'Skip to comparison table' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Location' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Price' })).toHaveFocus();
  });

  it('uses a roving tabindex so the grid is a single tab stop', () => {
    render(<PropertyComparisonTable properties={properties} />);

    expect(cell(0, 0)).toHaveAttribute('tabindex', '0');
    expect(cell(0, 1)).toHaveAttribute('tabindex', '-1');

    focusCell(0, 1);
    expect(cell(0, 1)).toHaveAttribute('tabindex', '0');
    expect(cell(0, 0)).toHaveAttribute('tabindex', '-1');
  });

  it('navigates cells with the arrow keys', () => {
    render(<PropertyComparisonTable properties={properties} />);

    focusCell(0, 0);

    fireEvent.keyDown(cell(0, 0)!, { key: 'ArrowRight' });
    expect(cell(0, 1)).toHaveFocus();

    fireEvent.keyDown(cell(0, 1)!, { key: 'ArrowDown' });
    expect(cell(1, 1)).toHaveFocus();

    fireEvent.keyDown(cell(1, 1)!, { key: 'ArrowLeft' });
    expect(cell(1, 0)).toHaveFocus();

    fireEvent.keyDown(cell(1, 0)!, { key: 'ArrowUp' });
    expect(cell(0, 0)).toHaveFocus();
  });

  it('activates sorting with Enter on a column header', async () => {
    const user = userEvent.setup();
    render(<PropertyComparisonTable properties={properties} />);

    const priceHeader = screen.getByRole('columnheader', { name: 'Price' });
    expect(priceHeader).toHaveAttribute('aria-sort', 'ascending');

    const locationButton = screen.getByRole('button', { name: 'Location' });
    locationButton.focus();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('columnheader', { name: 'Location' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    expect(priceHeader).toHaveAttribute('aria-sort', 'none');

    await user.keyboard('{Enter}');
    expect(screen.getByRole('columnheader', { name: 'Location' })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
  });

  it('expands a row with Enter and collapses it with Escape', () => {
    render(
      <PropertyComparisonTable
        properties={properties.map((property) => ({ ...property, details: { 'Year built': 1998 } }))}
      />,
    );

    // Price ascending puts Sunset Villa (750k) in row 1.
    focusCell(1, 1);
    fireEvent.keyDown(cell(1, 1)!, { key: 'Enter' });
    expect(rowFor('Sunset Villa')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Year built')).toBeInTheDocument();

    // Focus stays on the cell, so Escape is handled by the same cell.
    fireEvent.keyDown(cell(1, 1)!, { key: 'Escape' });
    expect(rowFor('Sunset Villa')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Year built')).not.toBeInTheDocument();
    // Escape returns focus to the row header.
    expect(cell(1, 0)).toHaveFocus();
  });

  it('activates expand with Space as well as Enter', () => {
    render(<PropertyComparisonTable properties={properties} />);

    focusCell(1, 3);
    fireEvent.keyDown(cell(1, 3)!, { key: ' ' });
    expect(rowFor('Sunset Villa')).toHaveAttribute('aria-expanded', 'true');
  });

  it('leaves Escape alone when no row is expanded', () => {
    render(<PropertyComparisonTable properties={properties} />);

    focusCell(0, 1);
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    cell(0, 1)!.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('gives every cell a visible focus indicator', () => {
    render(<PropertyComparisonTable properties={properties} />);

    for (const element of [cell(0, 0), cell(0, 1), cell(1, 4)]) {
      expect(element?.className).toContain('focus-visible:outline');
    }
  });

  it('mirrors arrow navigation for right-to-left layouts', () => {
    render(<PropertyComparisonTable properties={properties} dir="rtl" />);

    focusCell(0, 1);
    fireEvent.keyDown(cell(0, 1)!, { key: 'ArrowRight' });
    expect(cell(0, 0)).toHaveFocus();
  });

  it('can hide the skip link and still trap navigation inside the grid', () => {
    render(<PropertyComparisonTable properties={properties} showSkipLink={false} />);

    expect(
      screen.queryByRole('link', { name: 'Skip to comparison table' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('renders an accessible empty state', () => {
    render(<PropertyComparisonTable properties={[]} />);

    expect(screen.getByText('No properties to compare.')).toBeInTheDocument();
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '1');
  });
});
