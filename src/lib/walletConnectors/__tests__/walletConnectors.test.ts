/**
 * Tests for src/lib/walletConnectors/
 * Covers MetaMask, Coinbase, and WalletConnect adapter mappings.
 * Issue #937
 */

// Mock window.ethereum for MetaMask and Coinbase tests
const mockEthereum = {
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
  isMetaMask: true,
  isCoinbaseWallet: true,
};

Object.defineProperty(window, 'ethereum', {
  value: mockEthereum,
  writable: true,
});

// ─── MetaMask ────────────────────────────────────────────────────────────────

describe('MetaMask connector', () => {
  beforeEach(() => {
    jest.resetModules();
    mockEthereum.request.mockReset();
    mockEthereum.isMetaMask = true;
  });

  async function loadMetaMask() {
    const mod = await import('../metamask');
    return mod;
  }

  it('connectMetaMaskWallet returns address and chainId on success', async () => {
    mockEthereum.request
      .mockResolvedValueOnce(['0xABC123']) // eth_requestAccounts
      .mockResolvedValueOnce('0x1'); // eth_chainId

    const { connectMetaMaskWallet } = await loadMetaMask();
    const result = await connectMetaMaskWallet();

    expect(result).toEqual({
      address: '0xABC123',
      chainId: 1,
    });
  });

  it('throws when window.ethereum is not present', async () => {
    const original = window.ethereum;
    // @ts-expect-error testing missing ethereum
    window.ethereum = undefined;

    const { connectMetaMaskWallet } = await loadMetaMask();
    await expect(connectMetaMaskWallet()).rejects.toThrow(
      'MetaMask is not installed',
    );

    window.ethereum = original;
  });

  it('throws when MetaMask is not the active provider', async () => {
    mockEthereum.isMetaMask = false;

    const { connectMetaMaskWallet } = await loadMetaMask();
    await expect(connectMetaMaskWallet()).rejects.toThrow(
      'MetaMask extension not detected',
    );
  });

  it('throws when no accounts are returned', async () => {
    mockEthereum.request.mockResolvedValueOnce([]);

    const { connectMetaMaskWallet } = await loadMetaMask();
    await expect(connectMetaMaskWallet()).rejects.toThrow(
      'No accounts returned from MetaMask',
    );
  });

  it('handles user rejection (error code 4001)', async () => {
    mockEthereum.request.mockRejectedValueOnce({ code: 4001 });

    const { connectMetaMaskWallet } = await loadMetaMask();
    await expect(connectMetaMaskWallet()).rejects.toThrow(
      'You rejected the connection request',
    );
  });

  it('handles pending request error (code -32002)', async () => {
    mockEthereum.request.mockRejectedValueOnce({ code: -32002 });

    const { connectMetaMaskWallet } = await loadMetaMask();
    await expect(connectMetaMaskWallet()).rejects.toThrow(
      'MetaMask connection request is already pending',
    );
  });

  it('isMetaMaskAvailable returns false when window.ethereum is missing', async () => {
    const original = window.ethereum;
    // @ts-expect-error testing missing ethereum
    window.ethereum = undefined;

    const { isMetaMaskAvailable } = await loadMetaMask();
    expect(isMetaMaskAvailable()).toBe(false);

    window.ethereum = original;
  });

  it('isMetaMaskAvailable returns true when MetaMask is present', async () => {
    mockEthereum.isMetaMask = true;

    const { isMetaMaskAvailable } = await loadMetaMask();
    expect(isMetaMaskAvailable()).toBe(true);
  });
});

// ─── Coinbase ────────────────────────────────────────────────────────────────

describe('Coinbase connector', () => {
  beforeEach(() => {
    jest.resetModules();
    mockEthereum.request.mockReset();
    mockEthereum.isCoinbaseWallet = true;
    mockEthereum.isMetaMask = false;
  });

  async function loadCoinbase() {
    const mod = await import('../coinbase');
    return mod;
  }

  it('connectCoinbaseWallet returns address and chainId on success', async () => {
    mockEthereum.request
      .mockResolvedValueOnce(['0xDEF456']) // eth_requestAccounts
      .mockResolvedValueOnce('0x89'); // eth_chainId (137 = Polygon)

    const { connectCoinbaseWallet } = await loadCoinbase();
    const result = await connectCoinbaseWallet();

    expect(result).toEqual({
      address: '0xDEF456',
      chainId: 137,
    });
  });

  it('throws when window.ethereum is not present', async () => {
    const original = window.ethereum;
    // @ts-expect-error testing missing ethereum
    window.ethereum = undefined;

    const { connectCoinbaseWallet } = await loadCoinbase();
    await expect(connectCoinbaseWallet()).rejects.toThrow(
      'Coinbase Wallet is not installed',
    );

    window.ethereum = original;
  });

  it('throws when Coinbase Wallet is not the active provider', async () => {
    mockEthereum.isCoinbaseWallet = false;

    const { connectCoinbaseWallet } = await loadCoinbase();
    await expect(connectCoinbaseWallet()).rejects.toThrow(
      'Coinbase Wallet extension not detected',
    );
  });

  it('throws when no accounts are returned', async () => {
    mockEthereum.request.mockResolvedValueOnce([]);

    const { connectCoinbaseWallet } = await loadCoinbase();
    await expect(connectCoinbaseWallet()).rejects.toThrow(
      'No accounts returned from Coinbase Wallet',
    );
  });

  it('handles user rejection (error code 4001)', async () => {
    mockEthereum.request.mockRejectedValueOnce({ code: 4001 });

    const { connectCoinbaseWallet } = await loadCoinbase();
    await expect(connectCoinbaseWallet()).rejects.toThrow(
      'You rejected the connection request',
    );
  });

  it('handles pending request error (code -32002)', async () => {
    mockEthereum.request.mockRejectedValueOnce({ code: -32002 });

    const { connectCoinbaseWallet } = await loadCoinbase();
    await expect(connectCoinbaseWallet()).rejects.toThrow(
      'Coinbase Wallet connection request is already pending',
    );
  });

  it('isCoinbaseAvailable returns false when window.ethereum is missing', async () => {
    const original = window.ethereum;
    // @ts-expect-error testing missing ethereum
    window.ethereum = undefined;

    const { isCoinbaseAvailable } = await loadCoinbase();
    expect(isCoinbaseAvailable()).toBe(false);

    window.ethereum = original;
  });

  it('isCoinbaseAvailable returns true when Coinbase Wallet is present', async () => {
    mockEthereum.isCoinbaseWallet = true;

    const { isCoinbaseAvailable } = await loadCoinbase();
    expect(isCoinbaseAvailable()).toBe(true);
  });
});

// ─── WalletConnect ───────────────────────────────────────────────────────────

// Controllable mock provider for WalletConnect tests
let mockWalletConnectProvider: {
  enable: jest.Mock;
  request: jest.Mock;
};

jest.mock('@walletconnect/web3-provider', () => {
  return jest.fn().mockImplementation(() => mockWalletConnectProvider);
});

describe('WalletConnect connector', () => {
  let walletconnectModule: typeof import('../walletconnect');

  beforeEach(() => {
    mockWalletConnectProvider = {
      enable: jest.fn(),
      request: jest.fn(),
    };
    process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID = 'test-wc-id';

    // Fresh import for each test using isolateModules
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      walletconnectModule = require('../walletconnect');
    });
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;
  });

  it('isWalletConnectConfigured returns true when project ID is set', () => {
    process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID = 'valid-id';
    expect(walletconnectModule.isWalletConnectConfigured()).toBe(true);
  });

  it('isWalletConnectConfigured returns false when project ID is missing', () => {
    delete process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;
    expect(walletconnectModule.isWalletConnectConfigured()).toBe(false);
  });

  it('connectWalletConnectWallet throws when provider returns no accounts', async () => {
    mockWalletConnectProvider.enable.mockResolvedValue([]);

    // The 'No accounts returned' error is thrown inside the try block
    // but the catch block re-throws it as the generic error since the
    // message doesn't match the specific error handling cases.
    await expect(
      walletconnectModule.connectWalletConnectWallet(),
    ).rejects.toThrow('Failed to connect with WalletConnect');
  });

  it('connectWalletConnectWallet returns address and chainId on success', async () => {
    mockWalletConnectProvider.enable.mockResolvedValue(['0xWALLET1']);
    mockWalletConnectProvider.request.mockResolvedValue('0x1');

    const result =
      await walletconnectModule.connectWalletConnectWallet();

    expect(result).toEqual({
      address: '0xWALLET1',
      chainId: 1,
    });
  });

  it('connectWalletConnectWallet handles user rejection', async () => {
    mockWalletConnectProvider.enable.mockRejectedValue(
      new Error('User rejected'),
    );

    await expect(
      walletconnectModule.connectWalletConnectWallet(),
    ).rejects.toThrow('You rejected the WalletConnect request');
  });

  it('connectWalletConnectWallet handles project ID errors', async () => {
    mockWalletConnectProvider.enable.mockRejectedValue(
      new Error('project ID missing'),
    );

    await expect(
      walletconnectModule.connectWalletConnectWallet(),
    ).rejects.toThrow('WalletConnect is not properly configured');
  });

  it('connectWalletConnectWallet handles generic errors', async () => {
    mockWalletConnectProvider.enable.mockRejectedValue(
      new Error('network timeout'),
    );

    await expect(
      walletconnectModule.connectWalletConnectWallet(),
    ).rejects.toThrow('Failed to connect with WalletConnect');
  });
});
