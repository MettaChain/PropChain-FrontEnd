import { act, renderHook } from '@testing-library/react';
import { useFavoritesStore } from '../favoritesStore';
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

describe('favoritesStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useFavoritesStore.getState().clearFavorites();
  });

  it('starts with an empty favorites list', () => {
    const { result } = renderHook(() => useFavoritesStore());
    expect(result.current.favorites).toEqual([]);
    expect(result.current.getFavoritesCount()).toBe(0);
  });

  it('adds a favorite property', () => {
    const { result } = renderHook(() => useFavoritesStore());

    act(() => {
      result.current.addFavorite(mockProperty('prop-1'));
    });

    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.favorites[0].id).toBe('prop-1');
    expect(result.current.isFavorite('prop-1')).toBe(true);
    expect(result.current.getFavoritesCount()).toBe(1);
  });

  it('adds multiple favorites without deduplicating (toggle is explicit)', () => {
    const { result } = renderHook(() => useFavoritesStore());

    act(() => {
      result.current.addFavorite(mockProperty('prop-1'));
      result.current.addFavorite(mockProperty('prop-2'));
    });

    expect(result.current.getFavoritesCount()).toBe(2);
  });

  it('removes a favorite property', () => {
    const { result } = renderHook(() => useFavoritesStore());

    act(() => {
      result.current.addFavorite(mockProperty('prop-1'));
      result.current.addFavorite(mockProperty('prop-2'));
      result.current.removeFavorite('prop-1');
    });

    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.favorites[0].id).toBe('prop-2');
    expect(result.current.isFavorite('prop-1')).toBe(false);
  });

  it('isFavorite returns false for unknown ids', () => {
    const { result } = renderHook(() => useFavoritesStore());
    expect(result.current.isFavorite('does-not-exist')).toBe(false);
  });

  it('clearFavorites empties the list', () => {
    const { result } = renderHook(() => useFavoritesStore());

    act(() => {
      result.current.addFavorite(mockProperty('prop-1'));
      result.current.clearFavorites();
    });

    expect(result.current.favorites).toEqual([]);
    expect(result.current.getFavoritesCount()).toBe(0);
  });

  it('persists favorites across store instances', () => {
    const { result } = renderHook(() => useFavoritesStore());

    act(() => {
      result.current.addFavorite(mockProperty('prop-1'));
    });

    // A fresh hook instance hydrates from localStorage.
    const { result: result2 } = renderHook(() => useFavoritesStore());
    expect(result2.current.getFavoritesCount()).toBe(1);
    expect(result2.current.isFavorite('prop-1')).toBe(true);
  });

  it('persists removal across store instances', () => {
    const { result } = renderHook(() => useFavoritesStore());

    act(() => {
      result.current.addFavorite(mockProperty('prop-1'));
      result.current.addFavorite(mockProperty('prop-2'));
      result.current.removeFavorite('prop-1');
    });

    const { result: result2 } = renderHook(() => useFavoritesStore());
    expect(result2.current.getFavoritesCount()).toBe(1);
    expect(result2.current.isFavorite('prop-2')).toBe(true);
    expect(result2.current.isFavorite('prop-1')).toBe(false);
  });
});
