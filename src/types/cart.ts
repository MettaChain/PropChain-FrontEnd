import type { Property } from './property';

export interface CartItem {
  id: string;
  property: Property;
  quantity: number;
  addedAt: string;
}

export interface CartState {
  items: CartItem[];
  totalCost: number;
  totalGasEstimate: number;
  isOpen: boolean;
}

export interface CartActions {
  addItem: (property: Property, quantity?: number) => void;
  removeItem: (propertyId: string) => void;
  updateQuantity: (propertyId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  calculateTotals: () => { totalCost: number; totalGasEstimate: number };
}

export interface BatchTransactionResult {
  success: boolean;
  transactionHash?: string;
  results: Array<{
    propertyId: string;
    success: boolean;
    transactionHash?: string;
    error?: string;
  }>;
  totalGasUsed?: number;
  error?: string;
}
