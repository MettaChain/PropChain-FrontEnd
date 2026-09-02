import { act, renderHook } from '@testing-library/react';
import { useCartStore } from '../cartStore';
import type { Property } from '@/types/property';

const mockProperty = (id: string, perToken: number, available = 10): Property => ({
  id,
  name: `Property ${id}`,
  description: 'A test property',
  location: {
    address: '1 Test St',
    city: 'Testville',
    state: 'TS',
    country: 'Testland',
    zipCode: '00000',
    coordinates: { lat: 0, lng: 0 },
  },
  price: { total: perToken * 100, perToken, currency: 'USD' },
  propertyType: 'residential',
  blockchain: 'ethereum',
  tokenInfo: {
    totalSupply: 1000,
    available,
    sold: 100,
    contractAddress: '0x1234...5678',
    tokenSymbol: 'TST',
  },
  metrics: {
    roi: 8,
    annualReturn: 8000,
    transactionVolume: 50000,
    appreciationRate: 5,
  },
  details: { squareFeet: 1000, yearBuilt: 2020, amenities: [] },
  images: [],
  listedDate: '2024-01-01',
  status: 'active',
});

describe('cartStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useCartStore.getState().clearCart();
    useCartStore.setState({ isOpen: false, slippageTolerance: 0.005 });
  });

  it('starts with an empty cart and zero totals', () => {
    const { result } = renderHook(() => useCartStore());
    expect(result.current.items).toEqual([]);
    expect(result.current.totalCost).toBe(0);
    expect(result.current.totalGasEstimate).toBe(0);
    expect(result.current.isOpen).toBe(false);
    expect(result.current.slippageTolerance).toBe(0.005);
  });

  it('adds an item and computes the total cost', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem(mockProperty('prop-1', 100), 2);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.totalCost).toBe(200);
    // 1 item: 0.005 base + 1 * 0.0025
    expect(result.current.totalGasEstimate).toBeCloseTo(0.0075);
  });

  it('caps the quantity at the available supply', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem(mockProperty('prop-1', 100, 5), 50);
    });

    expect(result.current.items[0].quantity).toBe(5);
    expect(result.current.totalCost).toBe(500);
  });

  it('increments quantity for duplicate adds, capped at availability', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem(mockProperty('prop-1', 100, 10), 4);
      result.current.addItem(mockProperty('prop-1', 100, 10), 4);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(8);
    expect(result.current.totalCost).toBe(800);

    // A third add pushes past availability → capped at 10.
    act(() => {
      result.current.addItem(mockProperty('prop-1', 100, 10), 4);
    });

    expect(result.current.items[0].quantity).toBe(10);
    expect(result.current.totalCost).toBe(1000);
  });

  it('removes an item and recomputes totals', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem(mockProperty('prop-1', 100), 2);
      result.current.addItem(mockProperty('prop-2', 50), 1);
      result.current.removeItem('prop-1');
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].property.id).toBe('prop-2');
    expect(result.current.totalCost).toBe(50);
  });

  it('updates the quantity of an item', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem(mockProperty('prop-1', 100), 2);
      result.current.updateQuantity('prop-1', 5);
    });

    expect(result.current.items[0].quantity).toBe(5);
    expect(result.current.totalCost).toBe(500);
  });

  it('clamps quantity updates to the available supply', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem(mockProperty('prop-1', 100, 6), 2);
      result.current.updateQuantity('prop-1', 99);
    });

    expect(result.current.items[0].quantity).toBe(6);
  });

  it('removes an item when its quantity is set to zero', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem(mockProperty('prop-1', 100), 2);
      result.current.updateQuantity('prop-1', 0);
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.totalCost).toBe(0);
    expect(result.current.totalGasEstimate).toBe(0);
  });

  it('clearCart resets items and totals', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem(mockProperty('prop-1', 100), 2);
      result.current.clearCart();
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.totalCost).toBe(0);
    expect(result.current.totalGasEstimate).toBe(0);
  });

  it('toggles the cart open state', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => result.current.toggleCart());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.toggleCart());
    expect(result.current.isOpen).toBe(false);
  });

  it('calculateTotals reflects the current items', () => {
    const { result } = renderHook(() => useCartStore());

    expect(result.current.calculateTotals()).toEqual({ totalCost: 0, totalGasEstimate: 0 });

    act(() => {
      result.current.addItem(mockProperty('prop-1', 100), 1);
      result.current.addItem(mockProperty('prop-2', 50), 2);
    });

    expect(result.current.calculateTotals().totalCost).toBe(200);
    // 2 items: 0.005 base + 2 * 0.0025
    expect(result.current.calculateTotals().totalGasEstimate).toBeCloseTo(0.01);
  });

  it('persists items across store instances', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem(mockProperty('prop-1', 100), 2);
    });

    const { result: result2 } = renderHook(() => useCartStore());
    expect(result2.current.items).toHaveLength(1);
    expect(result2.current.items[0].quantity).toBe(2);
  });
});
