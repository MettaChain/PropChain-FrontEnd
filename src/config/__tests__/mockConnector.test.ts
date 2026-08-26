/**
 * Tests for the dev-only mock connector.
 *
 * The connector must never carry a hardcoded private key: it generates a fresh
 * key per connector instance (per page load), so there is no long-lived secret
 * that could sign real-looking transactions if the mock leaked into a
 * production-like build.
 */

// viem/accounts has no jest mock file, so the factory mocks are virtual (the
// moduleNameMapper would otherwise map them to missing __mocks__/viem/*.js).
jest.mock('viem/accounts', () => ({
  generatePrivateKey: jest.fn(() => '0xgenerated-private-key'),
  privateKeyToAccount: jest.fn((key: string) => ({
    address: `0xaccount-for-${key}`,
  })),
}));

jest.mock('viem', () => ({
  http: jest.fn(() => ({})),
  createWalletClient: jest.fn((args: unknown) => args),
}));

jest.mock('viem/chains', () => ({
  mainnet: { id: 1, name: 'Mainnet' },
}));

jest.mock('wagmi', () => ({
  createConnector: jest.fn(
    (setup: (config: { emitter: { emit: jest.Mock } }) => unknown) =>
      setup({ emitter: { emit: jest.fn() } }),
  ),
}));

import { mockConnector } from '../mockConnector';

describe('mockConnector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has id "mock" and is named Mock Wallet', () => {
    expect(mockConnector.id).toBe('mock');
    expect(mockConnector.name).toBe('Mock Wallet');
  });

  it('does not contain the committed hardcoded private key anywhere', () => {
    const source = require('fs').readFileSync(
      require('path').join(__dirname, '..', 'mockConnector.ts'),
      'utf8',
    );
    expect(source).not.toContain('4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d');
    expect(source).toContain('generatePrivateKey');
  });

  it('derives the connected account from a generated key', async () => {
    const { generatePrivateKey, privateKeyToAccount } = require('viem/accounts');
    (generatePrivateKey as jest.Mock).mockReturnValue('0xkey-abc');

    const result = await mockConnector.connect();

    expect(generatePrivateKey).toHaveBeenCalled();
    expect(privateKeyToAccount).toHaveBeenCalledWith('0xkey-abc');
    expect(result.accounts).toEqual(['0xaccount-for-0xkey-abc']);
  });

  it('reports itself as authorized (dev mock semantics)', async () => {
    await expect(mockConnector.isAuthorized()).resolves.toBe(true);
  });
});
