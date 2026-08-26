import { renderHook, act } from '@testing-library/react';
import { getCsrfToken, clearCsrfToken } from '@/lib/csrfClient';
import { useApiMutation } from '../useApiMutation';

jest.mock('@/lib/csrfClient', () => ({
  getCsrfToken: jest.fn(),
  clearCsrfToken: jest.fn(),
}));

const mockGetCsrfToken = getCsrfToken as jest.MockedFunction<typeof getCsrfToken>;
const mockClearCsrfToken = clearCsrfToken as jest.MockedFunction<typeof clearCsrfToken>;

function mockFetch(response: {
  ok?: boolean;
  status?: number;
  json?: () => Promise<any>;
}) {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: response.ok ?? true,
    status: response.status ?? 200,
    json: response.json ?? jest.fn().mockResolvedValue({}),
  });
  global.fetch = fetchMock;
  return fetchMock;
}

describe('useApiMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCsrfToken.mockResolvedValue('csrf-token-123');
  });

  it('returns initial state (loading false, error null)', () => {
    mockFetch({});
    const { result } = renderHook(() => useApiMutation());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('mutate sends request with CSRF token header', async () => {
    const fetchMock = mockFetch({ ok: true, json: () => Promise.resolve({ success: true }) });
    const { result } = renderHook(() => useApiMutation());

    await act(async () => {
      await result.current.mutate('/api/test');
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.anything(),
      })
    );
    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers.get('X-CSRF-Token')).toBe('csrf-token-123');
  });

  it('mutate sends request without token when getCsrfToken fails', async () => {
    mockGetCsrfToken.mockRejectedValue(new Error('no token'));
    const fetchMock = mockFetch({ ok: true, json: () => Promise.resolve({ data: 1 }) });
    const { result } = renderHook(() => useApiMutation());

    await act(async () => {
      await result.current.mutate('/api/test');
    });

    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers.get('X-CSRF-Token')).toBeNull();
  });

  it('mutate retries on 403 after clearing and re-fetching CSRF token', async () => {
    const fetchMock = jest.fn()
      .mockResolvedValueOnce({ ok: false, status: 403 })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ retried: true }) });
    global.fetch = fetchMock;

    mockGetCsrfToken
      .mockResolvedValueOnce('old-token')
      .mockResolvedValueOnce('new-token');

    const { result } = renderHook(() => useApiMutation());

    await act(async () => {
      await result.current.mutate('/api/test');
    });

    expect(mockClearCsrfToken).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const retryHeaders = fetchMock.mock.calls[1][1].headers;
    expect(retryHeaders.get('X-CSRF-Token')).toBe('new-token');
  });

  it('mutate throws on non-ok response', async () => {
    mockFetch({ ok: false, status: 500 });
    const { result } = renderHook(() => useApiMutation());

    await act(async () => {
      try {
        await result.current.mutate('/api/test');
      } catch (err: any) {
        expect(err.message).toBe('Request failed with status 500');
      }
    });

    expect(result.current.error?.message).toBe('Request failed with status 500');
  });

  it('mutate sets loading true during request and false after', async () => {
    let resolveFetch: (v: any) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = jest.fn().mockReturnValue(fetchPromise);
    global.fetch = fetchMock;

    const { result } = renderHook(() => useApiMutation());

    act(() => {
      result.current.mutate('/api/test');
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveFetch!({ ok: true, status: 200, json: () => Promise.resolve({}) });
    });

    expect(result.current.loading).toBe(false);
  });

  it('mutate sets error state on failure', async () => {
    mockFetch({ ok: false, status: 422 });
    const { result } = renderHook(() => useApiMutation());

    await act(async () => {
      try {
        await result.current.mutate('/api/test');
      } catch {}
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error!.message).toBe('Request failed with status 422');
  });

  it('mutate returns parsed JSON data on success', async () => {
    const responseData = { id: 1, name: 'test' };
    mockFetch({ ok: true, json: () => Promise.resolve(responseData) });
    const { result } = renderHook(() => useApiMutation());

    let returnVal: any;
    await act(async () => {
      returnVal = await result.current.mutate('/api/test');
    });

    expect(returnVal).toEqual(responseData);
  });
});
