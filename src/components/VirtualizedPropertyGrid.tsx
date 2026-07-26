import React, { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PropertyCard } from './PropertyCard';
import type { Property } from '@/types/property';

interface VirtualizedPropertyGridProps {
  properties: Property[];
  viewMode: 'grid' | 'list';
}

export const VirtualizedPropertyGrid: React.FC<VirtualizedPropertyGridProps> = ({
  properties,
  viewMode,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = React.useState(1);

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

  const rowCount = Math.ceil(properties.length / columns);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (viewMode === 'grid' ? 450 : 200),
    overscan: 5,
  });

  return (
    <div 
      ref={parentRef} 
      className="w-full h-screen overflow-y-auto"
      style={{
        maxHeight: '1000px', // Fallback max height to enable scrolling if container doesn't restrict
      }}
    >
      <ul
        role="list"
        aria-label={`Property listings, ${properties.length} items`}
        className="list-none p-0 m-0 relative w-full"
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowProperties = properties.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full pb-6'
                    : 'flex flex-col gap-4 h-full pb-4'
                }
              >
                {rowProperties.map((property) => (
                  <li key={property.id} role="article" aria-labelledby={`property-${property.id}-name`} className="h-full">
                    <PropertyCard property={property} viewMode={viewMode} />
                  </li>
                ))}
              </div>
            </div>
          );
        })}
      </ul>
    </div>
  );
};
