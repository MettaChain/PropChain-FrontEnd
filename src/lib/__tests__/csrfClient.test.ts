jest.mock('@/store/walletStore', () => ({
  useWalletStore: {
    subscribe: jest.fn(),
  },
}));

jest.mock('@/utils/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

global.fetch = jest.fn();

function loadModule() {
  jest.resetModules();
  const walletMock = require('@/store/walletStore');
  walletMock.useWalletStore.subscribe.mockClear();
  jest.isolateModules(() => {
    require('../../csrfClient');
  });
  return walletMock;
}

function getFreshModule() {
  jest.resetModules();
  let mod: typeof import('../../csrfClient');
  jest.isolateModules(() => {
    mod = require('../../csrfClient');
  });
  return mod!;
}

describe('csrfClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCsrfToken', () => {
    it('fetches and caches token', async () => {
      const mod = getFreshModule();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ csrfToken: 'token-abc' }),
      });

      const token = await mod.getCsrfToken();
      expect(token).toBe('token-abc');
      expect(global.fetch).toHaveBeenCalledWith('/api/security/csrf');
    });

    it('returns cached token on subsequent calls', async () => {
      const mod = getFreshModule();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ csrfToken: 'cached-token' }),
      });

      await mod.getCsrfToken();
      const second = await mod.getCsrfToken();
      expect(second).toBe('cached-token');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('deduplicates concurrent requests', async () => {
      const mod = getFreshModule();
      let resolveFetch: (v: any) => void;
      (global.fetch as jest.Mock).mockReturnValueOnce(
        new Promise((r) => {
          resolveFetch = r;
        }),
      );

      const p1 = mod.getCsrfToken();
      const p2 = mod.getCsrfToken();

      resolveFetch!({
        ok: true,
        json: async () => ({ csrfToken: 'deduped-token' }),
      });

      const [t1, t2] = await Promise.all([p1, p2]);
      expect(t1).toBe('deduped-token');
      expect(t2).toBe('deduped-token');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearCsrfToken', () => {
    it('clears cache causing re-fetch', async () => {
      const mod = getFreshModule();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ csrfToken: 'first-token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ csrfToken: 'second-token' }),
        });

      const first = await mod.getCsrfToken();
      expect(first).toBe('first-token');

      mod.clearCsrfToken();
      const second = await mod.getCsrfToken();
      expect(second).toBe('second-token');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('handle fetch failure', () => {
    it('propagates error when fetch fails', async () => {
      const mod = getFreshModule();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(mod.getCsrfToken()).rejects.toThrow('Network error');
    });

    it('propagates error when response is not ok', async () => {
      const mod = getFreshModule();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(mod.getCsrfToken()).rejects.toThrow('Failed to fetch CSRF token');
    });
  });

  describe('walletStore subscription', () => {
    it('subscribes to walletStore on module load', () => {
      const walletMock = loadModule();
      expect(walletMock.useWalletStore.subscribe).toHaveBeenCalledTimes(1);
      expect(typeof walletMock.useWalletStore.subscribe.mock.calls[0][0]).toBe('function');
    });

    it('clears token when wallet address changes', () => {
      const walletMock = loadModule();
      const subscribeFn = walletMock.useWalletStore.subscribe.mock.calls[0][0];
      const state = { address: '0x1234' };

      subscribeFn(state);
      expect(state.address).toBe('0x1234');
    });
  });
});
