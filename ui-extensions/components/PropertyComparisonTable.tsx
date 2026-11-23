'use client';

import React, { useCallback, useId, useMemo, useRef, useState } from 'react';

export interface ComparisonProperty {
  id: string;
  name: string;
  location: string;
  price: number;
  roi: number;
  yield: number;
  details?: Record<string, string | number>;
}

export type ComparisonSortKey = 'price' | 'roi' | 'location' | 'yield';

export interface PropertyComparisonTableProps {
  properties: ComparisonProperty[];
  loading?: boolean;
  dir?: 'ltr' | 'rtl';
  /** Render the skip-to-table link above the table. Defaults to `true`. */
  showSkipLink?: boolean;
  /** Accessible name for the grid. */
  'aria-label'?: string;
}

const COLUMNS: { key: ComparisonSortKey; label: string }[] = [
  { key: 'location', label: 'Location' },
  { key: 'price', label: 'Price' },
  { key: 'roi', label: 'ROI (%)' },
  { key: 'yield', label: 'Yield (%)' },
];

/** Total grid columns, including the property-name row header. */
const GRID_COLUMNS = COLUMNS.length + 1;

export interface GridPosition {
  row: number;
  column: number;
}

export interface GridBounds {
  rows: number;
  columns: number;
}

const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), Math.max(max, 0));

/**
 * Next roving-tabindex position for an arrow/Home/End key (#1363).
 *
 * Returns `null` for keys the grid does not handle, so callers can fall through
 * to the browser. Horizontal movement is mirrored for right-to-left layouts.
 * Movement is clamped at the edges rather than wrapping, which matches how
 * native tables behave for assistive technology.
 */
export function nextCellPosition(
  current: GridPosition,
  key: string,
  bounds: GridBounds,
  rtl = false,
): GridPosition | null {
  const lastRow = bounds.rows - 1;
  const lastColumn = bounds.columns - 1;
  const forward = rtl ? -1 : 1;

  switch (key) {
    case 'ArrowRight':
      return { row: current.row, column: clamp(current.column + forward, lastColumn) };
    case 'ArrowLeft':
      return { row: current.row, column: clamp(current.column - forward, lastColumn) };
    case 'ArrowDown':
      return { row: clamp(current.row + 1, lastRow), column: current.column };
    case 'ArrowUp':
      return { row: clamp(current.row - 1, lastRow), column: current.column };
    case 'Home':
      return { row: current.row, column: 0 };
    case 'End':
      return { row: current.row, column: lastColumn };
    case 'PageDown':
      return { row: clamp(current.row + 5, lastRow), column: current.column };
    case 'PageUp':
      return { row: clamp(current.row - 5, lastRow), column: current.column };
    default:
      return null;
  }
}

/**
 * Property comparison table with full keyboard navigation (#1363).
 *
 * Implements the ARIA grid pattern: `<th scope="col">` headers remain sortable
 * buttons, the property name is a `<th scope="row">`, and the body uses a
 * roving tabindex so the whole grid is a single tab stop. Arrows move between
 * cells, Enter/Space toggles the expanded row, Escape collapses it and returns
 * focus to the row header. A skip link to the grid is rendered first.
 */
export function PropertyComparisonTable({
  properties,
  loading = false,
  dir = 'ltr',
  showSkipLink = true,
  'aria-label': ariaLabel = 'Property comparison',
}: PropertyComparisonTableProps) {
  const [sortKey, setSortKey] = useState<ComparisonSortKey>('price');
  const [asc, setAsc] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeCell, setActiveCell] = useState<GridPosition>({ row: 0, column: 0 });

  const tableRef = useRef<HTMLTableElement | null>(null);
  const gridId = useId();
  const isRtl = dir === 'rtl';

  const rows = useMemo(() => {
    const sorted = [...properties].sort((a, b) =>
      sortKey === 'location'
        ? a.location.localeCompare(b.location)
        : a[sortKey] - b[sortKey],
    );
    return asc ? sorted : sorted.reverse();
  }, [properties, sortKey, asc]);

  const onSort = (key: ComparisonSortKey) => {
    if (key === sortKey) setAsc(!asc);
    else {
      setSortKey(key);
      setAsc(true);
    }
  };

  /** Moves DOM focus to a grid cell, clamped to the current row/column count. */
  const focusCell = useCallback(
    (position: GridPosition) => {
      const table = tableRef.current;
      if (!table || rows.length === 0) return;
      const row = clamp(position.row, rows.length - 1);
      const column = clamp(position.column, GRID_COLUMNS - 1);
      const target = table.querySelector<HTMLElement>(`[data-cell="${row}-${column}"]`);
      if (!target) return;
      setActiveCell({ row, column });
      target.focus();
    },
    [rows.length],
  );

  const toggleRow = (id: string) =>
    setExpanded((current) => (current === id ? null : id));

  const onCellKeyDown = (event: React.KeyboardEvent<HTMLElement>, row: number, column: number) => {
    if (event.key === 'Escape') {
      const property = rows[row];
      if (!property || expanded !== property.id) return;
      event.preventDefault();
      setExpanded(null);
      // Return focus to the row header so the keyboard position is not lost.
      focusCell({ row, column: 0 });
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      const property = rows[row];
      if (!property) return;
      event.preventDefault();
      toggleRow(property.id);
      return;
    }

    const next = nextCellPosition({ row, column }, event.key, {
      rows: rows.length,
      columns: GRID_COLUMNS,
    }, isRtl);
    if (!next) return;
    event.preventDefault();
    focusCell(next);
  };

  const cellFocusClass =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:focus-visible:outline-blue-400';

  if (loading) {
    return (
      <div dir={dir} className="space-y-2" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
    );
  }

  return (
    <div dir={dir} className="space-y-2">
      {showSkipLink ? (
        <a
          href={`#${gridId}`}
          className={`sr-only focus:not-sr-only focus:inline-block focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-blue-700 focus:underline dark:focus:bg-gray-900 dark:focus:text-blue-300 ${cellFocusClass}`}
          onClick={(event) => {
            event.preventDefault();
            focusCell(activeCell);
          }}
        >
          Skip to comparison table
        </a>
      ) : null}

      <div className="overflow-x-auto">
        <table
          id={gridId}
          ref={tableRef}
          role="grid"
          aria-label={ariaLabel}
          aria-rowcount={rows.length + 1}
          aria-colcount={GRID_COLUMNS}
          className="w-full text-start text-sm"
        >
          <thead>
            <tr role="row" className="border-b">
              <th scope="col" role="columnheader" className="p-2 text-start">
                Property
              </th>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  role="columnheader"
                  className="p-2 text-start"
                  aria-sort={
                    sortKey === c.key ? (asc ? 'ascending' : 'descending') : 'none'
                  }
                >
                  <button
                    type="button"
                    onClick={() => onSort(c.key)}
                    title={`Sort by ${c.label}`}
                    className={`inline-flex items-center gap-1 rounded font-medium ${cellFocusClass}`}
                  >
                    {c.label}
                    <span aria-hidden="true">
                      {sortKey === c.key ? (asc ? '▲' : '▼') : ''}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr role="row">
                <td role="gridcell" colSpan={GRID_COLUMNS} className="p-2 text-start">
                  No properties to compare.
                </td>
              </tr>
            ) : (
              rows.map((p, row) => {
                const isExpanded = expanded === p.id;
                return (
                  <React.Fragment key={p.id}>
                    <tr
                      role="row"
                      aria-rowindex={row + 2}
                      className="cursor-pointer border-b hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => toggleRow(p.id)}
                      aria-expanded={isExpanded}
                    >
                      <th
                        scope="row"
                        role="rowheader"
                        data-cell={`${row}-0`}
                        tabIndex={activeCell.row === row && activeCell.column === 0 ? 0 : -1}
                        onFocus={() => setActiveCell({ row, column: 0 })}
                        onKeyDown={(event) => onCellKeyDown(event, row, 0)}
                        className={`p-2 text-start font-medium ${cellFocusClass}`}
                      >
                        {p.name}
                      </th>
                      {COLUMNS.map((c, index) => {
                        const column = index + 1;
                        const value =
                          c.key === 'location'
                            ? p.location
                            : c.key === 'price'
                              ? p.price.toLocaleString()
                              : String(p[c.key]);
                        const selected =
                          activeCell.row === row && activeCell.column === column;
                        return (
                          <td
                            key={c.key}
                            role="gridcell"
                            data-cell={`${row}-${column}`}
                            tabIndex={selected ? 0 : -1}
                            onFocus={() => setActiveCell({ row, column })}
                            onKeyDown={(event) => onCellKeyDown(event, row, column)}
                            className={`p-2 ${cellFocusClass}`}
                            aria-label={`${p.name}, ${c.label}: ${value}`}
                          >
                            {value}
                          </td>
                        );
                      })}
                    </tr>
                    {isExpanded && (
                      <tr role="row" className="bg-gray-50 dark:bg-gray-800">
                        <td
                          role="gridcell"
                          colSpan={GRID_COLUMNS}
                          className="p-2"
                          aria-label={`${p.name} details`}
                        >
                          <dl className="grid grid-cols-2 gap-1">
                            {Object.entries(p.details ?? {}).map(([k, v]) => (
                              <React.Fragment key={k}>
                                <dt className="font-medium">{k}</dt>
                                <dd>{v}</dd>
                              </React.Fragment>
                            ))}
                          </dl>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PropertyComparisonTable;
