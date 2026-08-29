const request = jest.fn();

beforeEach(() => {
  request.mockReset();
  (window as Window & { ethereum?: unknown }).ethereum = {
    request, isMetaMask: true, isCoinbaseWallet: true,
  };
  delete (window as Window & { __MOCK_WALLETCONNECT__?: unknown }).__MOCK_WALLETCONNECT__;
});

describe('wallet connectors', () => {
  it('maps MetaMask account and hexadecimal chain id', async () => {
    request.mockResolvedValueOnce(['0xmeta']).mockResolvedValueOnce('0x89');
    const { connectMetaMaskWallet } = await import('../walletConnectors/metamask');
    await expect(connectMetaMaskWallet()).resolves.toEqual({ address: '0xmeta', chainId: 137 });
  });

  it('maps Coinbase account and chain id', async () => {
    request.mockResolvedValueOnce(['0xcoinbase']).mockResolvedValueOnce('0x1');
    const { connectCoinbaseWallet } = await import('../walletConnectors/coinbase');
    await expect(connectCoinbaseWallet()).resolves.toEqual({ address: '0xcoinbase', chainId: 1 });
  });

  it('uses the WalletConnect E2E mock hook', async () => {
    (window as Window & { __MOCK_WALLETCONNECT__?: unknown }).__MOCK_WALLETCONNECT__ = {
      address: '0xmock', chainId: 10,
    };
    jest.mock('@/utils/logger', () => ({ logger: { debug: jest.fn(), error: jest.fn() } }));
    const { connectWalletConnectWallet } = await import('../walletConnectors/walletconnect');
    await expect(connectWalletConnectWallet()).resolves.toEqual({ address: '0xmock', chainId: 10 });
  });

  it('normalizes provider rejection errors', async () => {
    request.mockRejectedValueOnce({ code: 4001 });
    const { connectMetaMaskWallet } = await import('../walletConnectors/metamask');
    await expect(connectMetaMaskWallet()).rejects.toThrow('You rejected the connection request');
  });
});
