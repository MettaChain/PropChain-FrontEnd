'use client';
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PropertyCard } from './PropertyCard';
import type { Property } from '@/types/property';

interface VirtualizedPropertyGridProps {
  properties: Property[];
  viewMode?: 'grid' | 'list';
  className?: string;
}

export const VirtualizedPropertyGrid: React.FC<VirtualizedPropertyGridProps> = ({
  properties,
  viewMode = 'grid',
  className = ''
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const updateColumns = () => {
      if (viewMode === 'list') {
        setColumns(1);
        return;
      }
      if (window.innerWidth >= 1024) setColumns(3);
      else if (window.innerWidth >= 768) setColumns(2);
      else setColumns(1);
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [viewMode]);

  // Chunk the listings once per (properties, columns) change instead of
  // re-slicing the array for every virtual row on every render.
  const rows = useMemo(() => {
    const chunked: Property[][] = [];
    for (let i = 0; i < properties.length; i += columns) {
      chunked.push(properties.slice(i, i + columns));
    }
    return chunked;
  }, [properties, columns]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (viewMode === 'grid' ? 450 : 200),
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      className={`w-full overflow-y-auto overflow-x-hidden ${className}`}
      style={{ maxHeight: '80vh' }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        <ul
          role="list"
          aria-label={`Property listings, ${properties.length} ${properties.length === 1 ? 'item' : 'items'}`}
          className="list-none p-0 m-0"
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const itemsInRow = rows[virtualRow.index] ?? [];

            return (
              <li
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className={
                  viewMode === 'grid'
                    ? `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6`
                    : `flex flex-col gap-4 mb-4`
                }
              >
                {itemsInRow.map((property) => (
                  <div key={property.id}>
                    <PropertyCard property={property} viewMode={viewMode} />
                  </div>
                ))}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
