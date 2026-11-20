'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  COMMON_AMENITY_THRESHOLD_PERCENT,
  type PropertyAmenity,
} from '../types/amenity';
import { AMENITY_ICON_MAP } from './amenityIconMap';

export interface PropertyAmenityBadgesProps {
  amenities: PropertyAmenity[];
  maxDisplayCount?: number;
  className?: string;
}

export function PropertyAmenityBadges({
  amenities,
  maxDisplayCount = 6,
  className,
}: PropertyAmenityBadgesProps) {
  const [showUncommon, setShowUncommon] = useState(false);

  if (!Number.isInteger(maxDisplayCount) || maxDisplayCount < 0) {
    throw new RangeError('maxDisplayCount must be a non-negative integer');
  }

  const hasUncommonAmenities = amenities.some(
    (amenity) => amenity.prevalencePercent < COMMON_AMENITY_THRESHOLD_PERCENT,
  );
  const filteredAmenities = amenities.filter(
    (amenity) =>
      showUncommon ||
      amenity.prevalencePercent >= COMMON_AMENITY_THRESHOLD_PERCENT,
  );
  const displayedAmenities = filteredAmenities.slice(0, maxDisplayCount);
  const moreCount = filteredAmenities.length - displayedAmenities.length;

  return (
    <section
      aria-label="Property amenities"
      className={className}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-medium">Amenities</h2>
        {hasUncommonAmenities && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showUncommon}
              onChange={(event) => setShowUncommon(event.target.checked)}
            />
            Show uncommon amenities
          </label>
        )}
      </div>

      {amenities.length === 0 ? (
        <p className="text-sm text-muted-foreground">No amenities listed.</p>
      ) : (
        <TooltipProvider delayDuration={0}>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {displayedAmenities.map((amenity) => {
              const Icon = AMENITY_ICON_MAP[amenity.type];

              return (
                <li key={amenity.type}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={amenity.type}
                        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <Badge
                          variant="outline"
                          size="sm"
                          icon={<Icon aria-hidden="true" size={14} />}
                        >
                          {amenity.type}
                        </Badge>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{amenity.type}</TooltipContent>
                  </Tooltip>
                </li>
              );
            })}
            {moreCount > 0 && (
              <li>
                <Badge
                  variant="secondary"
                  size="sm"
                  aria-label={`${moreCount} more amenities`}
                >
                  +{moreCount} more
                </Badge>
              </li>
            )}
          </ul>
        </TooltipProvider>
      )}
    </section>
  );
}

export default PropertyAmenityBadges;
