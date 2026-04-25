import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartState, CartActions, CartItem, BatchTransactionResult } from '@/types/cart';
import type { Property } from '@/types/property';

interface CartStore extends CartState, CartActions {}

// Gas estimation constants (in ETH)
const GAS_PER_TRANSACTION = 0.0025; // Approximate gas per token purchase
const BASE_BATCH_GAS = 0.005; // Base gas for batch transaction

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      totalCost: 0,
      totalGasEstimate: 0,
      isOpen: false,

      addItem: (property: Property, quantity = 1) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) => item.property.id === property.id
          );

          let newItems: CartItem[];
          
          if (existingItemIndex >= 0) {
            // Update existing item
            newItems = state.items.map((item, index) =>
              index === existingItemIndex
                ? {
                    ...item,
                    quantity: Math.min(
                      item.quantity + quantity,
                      property.tokenInfo.available
                    ),
                  }
                : item
            );
          } else {
            // Add new item
            const newItem: CartItem = {
              id: `${property.id}-${Date.now()}`,
              property,
              quantity: Math.min(quantity, property.tokenInfo.available),
              addedAt: new Date().toISOString(),
            };
            newItems = [...state.items, newItem];
          }

          const totals = calculateTotals(newItems);
          
          return {
            items: newItems,
            ...totals,
          };
        });
      },

      removeItem: (propertyId: string) => {
        set((state) => {
          const newItems = state.items.filter(
            (item) => item.property.id !== propertyId
          );
          const totals = calculateTotals(newItems);
          
          return {
            items: newItems,
            ...totals,
          };
        });
      },

      updateQuantity: (propertyId: string, quantity: number) => {
        set((state) => {
          const newItems = state.items.map((item) =>
            item.property.id === propertyId
              ? {
                  ...item,
                  quantity: Math.max(0, Math.min(quantity, item.property.tokenInfo.available)),
                }
              : item
          ).filter((item) => item.quantity > 0);

          const totals = calculateTotals(newItems);
          
          return {
            items: newItems,
            ...totals,
          };
        });
      },

      clearCart: () => {
        set({
          items: [],
          totalCost: 0,
          totalGasEstimate: 0,
        });
      },

      toggleCart: () => {
        set((state) => ({
          isOpen: !state.isOpen,
        }));
      },

      calculateTotals: () => {
        const state = get();
        return calculateTotals(state.items);
      },
    }),
    {
      name: 'propchain-cart',
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);

function calculateTotals(items: CartItem[]): { totalCost: number; totalGasEstimate: number } {
  const totalCost = items.reduce(
    (sum, item) => sum + item.property.price.perToken * item.quantity,
    0
  );

  const totalGasEstimate = items.length === 0 
    ? 0 
    : BASE_BATCH_GAS + (items.length * GAS_PER_TRANSACTION);

  return { totalCost, totalGasEstimate };
}
