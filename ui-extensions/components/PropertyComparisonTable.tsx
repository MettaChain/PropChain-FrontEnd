'use client';

import React, { useMemo, useState } from 'react';

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
}

const COLUMNS: { key: ComparisonSortKey; label: string }[] = [
  { key: 'location', label: 'Location' },
  { key: 'price', label: 'Price' },
  { key: 'roi', label: 'ROI (%)' },
  { key: 'yield', label: 'Yield (%)' },
];

export function PropertyComparisonTable({
  properties,
  loading = false,
  dir = 'ltr',
}: PropertyComparisonTableProps) {
  const [sortKey, setSortKey] = useState<ComparisonSortKey>('price');
  const [asc, setAsc] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

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
    <div dir={dir} className="overflow-x-auto">
      <table className="w-full text-start text-sm">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-start">Property</th>
            {COLUMNS.map((c) => (
              <th
                key={c.key}
                className="cursor-pointer p-2 text-start"
                aria-sort={sortKey === c.key ? (asc ? 'ascending' : 'descending') : 'none'}
                onClick={() => onSort(c.key)}
              >
                {c.label}
                {sortKey === c.key ? (asc ? ' ▲' : ' ▼') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <React.Fragment key={p.id}>
              <tr
                className="cursor-pointer border-b hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                aria-expanded={expanded === p.id}
              >
                <td className="p-2 font-medium">{p.name}</td>
                <td className="p-2">{p.location}</td>
                <td className="p-2">{p.price.toLocaleString()}</td>
                <td className="p-2">{p.roi}</td>
                <td className="p-2">{p.yield}</td>
              </tr>
              {expanded === p.id && (
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <td className="p-2" colSpan={COLUMNS.length + 1}>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PropertyComparisonTable;
