/**
 * Tests for the dev-only mock wallet guard in @/config/wagmi.
 *
 * The mock connector must never activate in production builds. The guard is a
 * pure function of the environment so it can be asserted directly.
 */

// Mock the module graph that wagmi.ts pulls in: viem's defineChain is missing
// from the shared __mocks__/viem.js, and ./env pulls the logger chain, so both
// are stubbed here. Module isolation lets each test re-evaluate the env-driven
// connector selection at import time.
jest.mock('viem', () => ({
  defineChain: jest.fn((chain: { id: number }) => ({ ...chain })),
}));

jest.mock('wagmi/chains', () => ({
  mainnet: { id: 1, name: 'Mainnet', nativeCurrency: { symbol: 'ETH' } },
  polygon: { id: 137, name: 'Polygon', nativeCurrency: { symbol: 'POL' } },
  bsc: { id: 56, name: 'BNB Smart Chain', nativeCurrency: { symbol: 'BNB' } },
}));

// wagmi/connectors maps to __mocks__/wagmi/connectors.js which does not exist,
// so the factory mock must be virtual.
jest.mock('wagmi', () => ({
  http: jest.fn(() => ({})),
  createConfig: jest.fn(({ connectors }: { connectors: unknown[] }) => ({
    connectors,
  })),
}));

jest.mock('wagmi/connectors', () => ({
  injected: jest.fn(() => ({ id: 'injected' })),
}));

// mockConnector pulls in viem/accounts and viem/chains which have no jest mock
// files; its internals are covered by mockConnector.test.ts, so stub it here.
jest.mock('../mockConnector', () => ({
  mockConnector: { id: 'mock', name: 'Mock Wallet' },
}));

jest.mock('@/config/env', () => ({
  getRpcUrl: jest.fn(),
  getLocalRpcUrl: jest.fn(() => undefined),
}));

describe('isMockWalletEnabled', () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('is false when the flag is unset, even in development', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.NEXT_PUBLIC_MOCK_WALLET;
    const { isMockWalletEnabled } = require('../wagmi');
    expect(isMockWalletEnabled()).toBe(false);
  });

  it('is true in development when the flag is set to "true"', () => {
    process.env.NODE_ENV = 'development';
    process.env.NEXT_PUBLIC_MOCK_WALLET = 'true';
    const { isMockWalletEnabled } = require('../wagmi');
    expect(isMockWalletEnabled()).toBe(true);
  });

  it('is false in production even when the flag is set to "true"', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_MOCK_WALLET = 'true';
    const { isMockWalletEnabled } = require('../wagmi');
    expect(isMockWalletEnabled()).toBe(false);
  });

  it('is false when the flag is not literally "true"', () => {
    process.env.NODE_ENV = 'development';
    process.env.NEXT_PUBLIC_MOCK_WALLET = '1';
    const { isMockWalletEnabled } = require('../wagmi');
    expect(isMockWalletEnabled()).toBe(false);
  });
});

describe('wagmi config connector selection', () => {
  const ORIGINAL_ENV = { ...process.env };
  let createConfigMock: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    createConfigMock = jest.requireMock('wagmi').createConfig as jest.Mock;
    createConfigMock.mockClear();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  /** Re-evaluates wagmi.ts with the current process.env and returns its config. */
  const loadConfig = () => {
    require('../wagmi');
    return createConfigMock.mock.calls[0][0];
  };

  it('uses only injected (no mock) when the flag is unset', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.NEXT_PUBLIC_MOCK_WALLET;

    const config = loadConfig();
    const ids = (config.connectors as { id: string }[]).map((c) => c.id);
    expect(ids).toEqual(['injected']);
    expect(ids).not.toContain('mock');
  });

  it('uses the mock connector in development when the flag is set', () => {
    process.env.NODE_ENV = 'development';
    process.env.NEXT_PUBLIC_MOCK_WALLET = 'true';

    const config = loadConfig();
    const ids = (config.connectors as { id: string }[]).map((c) => c.id);
    expect(ids).toEqual(['mock']);
  });

  it('never uses the mock connector in production, even with the flag set', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_MOCK_WALLET = 'true';

    const config = loadConfig();
    const ids = (config.connectors as { id: string }[]).map((c) => c.id);
    expect(ids).toEqual(['injected']);
    expect(ids).not.toContain('mock');
  });
});
