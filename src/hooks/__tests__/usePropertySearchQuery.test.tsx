/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { propertyService } from '@/lib/propertyService';
import { usePropertySearchQuery, propertySearchQueryKeys } from '@/hooks/usePropertySearchQuery';
import type { SearchFilters } from '@/types/property';

const makeWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
};

describe('usePropertySearchQuery', () => {
  beforeEach(() => jest.restoreAllMocks());

  it('builds a query key that changes when filters change', () => {
    const a: SearchFilters = { city: 'Lagos' } as any;
    const b: SearchFilters = { city: 'Abuja' } as any;
    expect(propertySearchQueryKeys.searches(a, 'newest', 1, 12)).not.toEqual(
      propertySearchQueryKeys.searches(b, 'newest', 1, 12)
    );
  });

  it('calls propertyService.searchProperties once with the given args', async () => {
    const spy = jest
      .spyOn(propertyService, 'searchProperties')
      .mockResolvedValue({ properties: [], total: 0 } as any);

    const { result } = renderHook(() => usePropertySearchQuery({} as SearchFilters, 'newest', 1, 12), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({}, 'newest', 1, 12);
  });

  it('surfaces a fetch error via query.error', async () => {
    jest.spyOn(propertyService, 'searchProperties').mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => usePropertySearchQuery({} as SearchFilters, 'newest', 1, 12), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('boom');
  });
});
