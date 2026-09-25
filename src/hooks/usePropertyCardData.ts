import { useMemo } from 'react';

import type { Property } from '@/types/property';
import { MAX_COMPARE, useCompareStore } from '@/store/compareStore';
import { useFavoritesStore } from '@/store/favoritesStore';

import {
  formatPrice,
  formatNumber,
  formatROI,
  getBlockchainColor,
} from '@/utils/searchUtils';

export function usePropertyCardData(property: Property) {
  const isPropertySelected = useCompareStore((state) => state.isPropertySelected);

  const selectedIds = useCompareStore((state) => state.selectedIds);

  const { isFavorite } = useFavoritesStore();

  return useMemo(() => {
    const isCompared = selectedIds.includes(property.id);

    return {
      isSelectedForComparison: isPropertySelected(property.id),

      isCompared,

      compareLimitReached:
        selectedIds.length >= MAX_COMPARE && !isCompared,

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