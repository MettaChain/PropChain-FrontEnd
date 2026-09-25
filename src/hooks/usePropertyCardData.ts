import { useMemo } from 'react';

import type { Property } from '@/types/property';
import { useComparisonStore } from '@/store/comparisonStore';
import { useCompareStore } from '@/store/compareStore';
import { useFavoritesStore } from '@/store/favoritesStore';

import {
  formatPrice,
  formatNumber,
  formatROI,
  getBlockchainColor,
} from '@/utils/searchUtils';

/**
 * Derives the display-ready fields a property card renders from a `Property`.
 */
export function usePropertyCardData(property: Property) {
  const { isPropertySelected } = useComparisonStore();

  const selectedIds = useCompareStore((state) => state.selectedIds);

  const { isFavorite } = useFavoritesStore();

  return useMemo(() => {
    const isCompared = selectedIds.includes(property.id);

    return {
      isSelectedForComparison: isPropertySelected(property.id),

      isCompared,

      compareLimitReached:
        selectedIds.length >= 3 && !isCompared,

      isFavorite: isFavorite(property.id),

      formattedROI: formatROI(property.metrics.roi),

      formattedSquareFeet: formatNumber(
        property.details.squareFeet,
      ),

      formattedAvailableTokens: formatNumber(
        property.tokenInfo.available,
      ),

      formattedTotalSupply: formatNumber(
        property.tokenInfo.totalSupply,
      ),

      formattedTokenPrice: formatPrice(
        property.price.perToken,
      ),

      blockchainColor: getBlockchainColor(
        property.blockchain,
      ),
    };
  }, [
    property,
    selectedIds,
    isPropertySelected,
    isFavorite,
  ]);
}