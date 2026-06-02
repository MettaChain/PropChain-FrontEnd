import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Property } from '@/types/property';

interface ComparisonState {
  selectedProperties: Property[];
  maxProperties: number;
  addProperty: (property: Property) => void;
  removeProperty: (property: Property) => void;
  clearProperties: () => void;
  isPropertySelected: (propertyId: string) => boolean;
  toggleProperty: (property: Property) => void;
}

export const useComparisonStore = create<ComparisonState>()(
  persist(
    (set, get) => ({
      selectedProperties: [],
      maxProperties: 3,

      addProperty: (property: Property) => {
        const { selectedProperties, maxProperties } = get();
        if (selectedProperties.length >= maxProperties) return;

        // Check if property is already selected
        if (selectedProperties.some(p => p.id === property.id)) return;

        set({ selectedProperties: [...selectedProperties, property] });
      },

      removeProperty: (property: Property) => {
        const { selectedProperties } = get();
        set({
          selectedProperties: selectedProperties.filter(p => p.id !== property.id)
        });
      },

      clearProperties: () => {
        set({ selectedProperties: [] });
      },

      isPropertySelected: (propertyId: string) => {
        const { selectedProperties } = get();
        return selectedProperties.some(p => p.id === propertyId);
      },

      toggleProperty: (property: Property) => {
        const { isPropertySelected, addProperty, removeProperty } = get();
        if (isPropertySelected(property.id)) {
          removeProperty(property);
        } else {
          addProperty(property);
        }
      },
    }),
    {
      name: 'property-comparison-storage',
      partialize: (state) => ({ selectedProperties: state.selectedProperties }),
    }
  )
);</content>
<parameter name="filePath">/home/semicolon/Documents/Drip/PropChain-FrontEnd/src/store/comparisonStore.ts