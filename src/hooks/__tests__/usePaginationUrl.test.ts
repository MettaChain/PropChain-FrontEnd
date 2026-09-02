import { act, renderHook } from '@testing-library/react';
import { usePaginationUrl } from '../usePaginationUrl';

const mockSetSearchParams = jest.fn();
let mockSearchParams: URLSearchParams = new URLSearchParams();

jest.mock(
  'react-router-dom',
  () => ({
    useSearchParams: () => [
      mockSearchParams,
      (...args: unknown[]) => mockSetSearchParams(...args),
    ],
  }),
  { virtual: true },
);

describe('usePaginationUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it('defaults to page 1 when no page param is present', () => {
    const { result } = renderHook(() => usePaginationUrl());
    expect(result.current.page).toBe(1);
  });

  it('parses the page param from the URL', () => {
    mockSearchParams = new URLSearchParams('page=3');
    const { result } = renderHook(() => usePaginationUrl());
    expect(result.current.page).toBe(3);
  });

  it('falls back to page 1 for a non-numeric page param', () => {
    mockSearchParams = new URLSearchParams('page=abc');
    const { result } = renderHook(() => usePaginationUrl());
    expect(result.current.page).toBe(1);
  });

  it('setPage updates the param and persists the URL', () => {
    mockSearchParams = new URLSearchParams('page=1&sort=price');
    const { result } = renderHook(() => usePaginationUrl());

    act(() => {
      result.current.setPage(4);
    });

    expect(mockSearchParams.get('page')).toBe('4');
    expect(mockSearchParams.get('sort')).toBe('price'); // other params preserved
    expect(mockSetSearchParams).toHaveBeenCalledWith(mockSearchParams);
  });
});
