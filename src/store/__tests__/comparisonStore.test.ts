import { act, renderHook } from '@testing-library/react';
import { useComparisonStore } from '../comparisonStore';
import type { Property } from '@/types/property';

const mockProperty = (id: string): Property => ({
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
  price: { total: 100000, perToken: 100, currency: 'USD' },
  propertyType: 'residential',
  blockchain: 'ethereum',
  tokenInfo: {
    totalSupply: 1000,
    available: 900,
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

describe('comparisonStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useComparisonStore.getState().clearProperties();
  });

  it('starts with no selected properties and a max of 3', () => {
    const { result } = renderHook(() => useComparisonStore());
    expect(result.current.selectedProperties).toEqual([]);
    expect(result.current.maxProperties).toBe(3);
  });

  it('adds a property to the selection', () => {
    const { result } = renderHook(() => useComparisonStore());

    act(() => {
      result.current.addProperty(mockProperty('prop-1'));
    });

    expect(result.current.selectedProperties).toHaveLength(1);
    expect(result.current.selectedProperties[0].id).toBe('prop-1');
  });

  it('does not add a property twice', () => {
    const { result } = renderHook(() => useComparisonStore());

    act(() => {
      result.current.addProperty(mockProperty('prop-1'));
      result.current.addProperty(mockProperty('prop-1'));
    });

    expect(result.current.selectedProperties).toHaveLength(1);
  });

  it('stops adding once the max is reached', () => {
    const { result } = renderHook(() => useComparisonStore());

    act(() => {
      result.current.addProperty(mockProperty('prop-1'));
      result.current.addProperty(mockProperty('prop-2'));
      result.current.addProperty(mockProperty('prop-3'));
      result.current.addProperty(mockProperty('prop-4'));
    });

    expect(result.current.selectedProperties).toHaveLength(3);
  });

  it('removes a property from the selection', () => {
    const { result } = renderHook(() => useComparisonStore());

    act(() => {
      result.current.addProperty(mockProperty('prop-1'));
      result.current.addProperty(mockProperty('prop-2'));
      result.current.removeProperty(mockProperty('prop-1'));
    });

    expect(result.current.selectedProperties).toHaveLength(1);
    expect(result.current.selectedProperties[0].id).toBe('prop-2');
  });

  it('reports whether a property is selected', () => {
    const { result } = renderHook(() => useComparisonStore());

    act(() => {
      result.current.addProperty(mockProperty('prop-1'));
    });

    expect(result.current.isPropertySelected('prop-1')).toBe(true);
    expect(result.current.isPropertySelected('prop-2')).toBe(false);
  });

  it('toggles a property in and out of the selection', () => {
    const { result } = renderHook(() => useComparisonStore());

    act(() => {
      result.current.toggleProperty(mockProperty('prop-1'));
    });
    expect(result.current.isPropertySelected('prop-1')).toBe(true);

    act(() => {
      result.current.toggleProperty(mockProperty('prop-1'));
    });
    expect(result.current.isPropertySelected('prop-1')).toBe(false);
  });

  it('does not toggle beyond the max selection size', () => {
    const { result } = renderHook(() => useComparisonStore());

    act(() => {
      result.current.addProperty(mockProperty('prop-1'));
      result.current.addProperty(mockProperty('prop-2'));
      result.current.addProperty(mockProperty('prop-3'));
      result.current.toggleProperty(mockProperty('prop-4'));
    });

    expect(result.current.selectedProperties).toHaveLength(3);
  });

  it('clearProperties empties the selection', () => {
    const { result } = renderHook(() => useComparisonStore());

    act(() => {
      result.current.addProperty(mockProperty('prop-1'));
      result.current.clearProperties();
    });

    expect(result.current.selectedProperties).toEqual([]);
  });

  it('persists the selection across store instances', () => {
    const { result } = renderHook(() => useComparisonStore());

    act(() => {
      result.current.addProperty(mockProperty('prop-1'));
    });

    const { result: result2 } = renderHook(() => useComparisonStore());
    expect(result2.current.selectedProperties).toHaveLength(1);
    expect(result2.current.selectedProperties[0].id).toBe('prop-1');
  });
});
