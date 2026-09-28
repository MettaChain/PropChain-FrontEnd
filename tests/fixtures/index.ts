import { Page, test as baseTest, expect } from '@playwright/test';
import { MOCK_PROPERTIES } from '../../src/lib/mockData';
import { getMockApiTransactions } from '../../src/lib/mockTransactionData';

export interface EthereumMockOptions {
  address?: string;
  chainId?: string;
  balance?: string;
  shouldReject?: boolean;
  isMetaMask?: boolean;
  delay?: number;
  noWallet?: boolean;
}

const DEFAULT_ADDRESS = '0x1234567890123456789012345678901234567890';
const DEFAULT_CHAIN_ID = '0x1';
const DEFAULT_BALANCE = '0x56BC75E2D630E8000'; // 100 ETH in wei

interface InitArg {
  addr: string;
  cId: string;
  bal: string;
  reject: boolean;
  metaMask: boolean;
  delayMs?: number;
  noWallet?: boolean;
}

/**
 * Canonical helper to inject mock window.ethereum into the browser context.
 */
export async function setupWalletMock(page: Page, options: EthereumMockOptions = {}) {
  const {
    address = DEFAULT_ADDRESS,
    chainId = DEFAULT_CHAIN_ID,
    balance = DEFAULT_BALANCE,
    shouldReject = false,
    isMetaMask = true,
    delay = 0,
    noWallet = false,
  } = options;

  await page.addInitScript((arg: InitArg) => {
    if (arg.noWallet) {
      delete (window as any).ethereum;
      return;
    }

    (window as any).ethereum = {
      isMetaMask: arg.metaMask,
      request: async ({ method }: { method: string }) => {
        if (arg.delayMs && arg.delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, arg.delayMs));
        }

        if (method === 'eth_requestAccounts') {
          if (arg.reject) {
            throw new Error('User rejected the request');
          }
          return [arg.addr];
        }
        if (method === 'eth_accounts') {
          return arg.reject ? [] : [arg.addr];
        }
        if (method === 'eth_chainId') {
          return arg.cId;
        }
        if (method === 'eth_getBalance') {
          return arg.bal;
        }
        if (method === 'eth_sendTransaction') {
          if (arg.reject) {
            throw new Error('User rejected the transaction');
          }
          const hex = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
          return '0x' + hex;
        }
        if (method === 'wallet_switchEthereumChain') {
          return null;
        }
        if (method === 'personal_sign' || method === 'eth_signTypedData_v4') {
          if (arg.reject) {
            throw new Error('User rejected the signature request');
          }
          return '0x' + crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
        }
        return null;
      },
      on: () => {},
      removeListener: () => {},
      isConnected: () => !arg.reject,
    };
  }, {
    addr: address,
    cId: chainId,
    bal: balance,
    reject: shouldReject,
    metaMask: isMetaMask,
    delayMs: delay,
    noWallet,
  });
}

/**
 * Sets up API route mocking for properties, transactions, and wallet balances.
 */
export async function setupApiMock(page: Page) {
  // Flag MSW enabled in browser context
  await page.addInitScript(() => {
    if (typeof window !== 'undefined') {
      (window as any).__MSW_ENABLED__ = true;
    }
  });

  // Intercept GET /api/test (used for verification specs)
  await page.route('**/api/test', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'MSW is working',
        data: { test: 'value' },
      }),
    });
  });

  // Intercept GET /api/properties
  await page.route(/\/api\/properties(?:\?.*)?$/, async (route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      const url = new URL(request.url());
      const pageNum = parseInt(url.searchParams.get('page') || '1', 10);
      const limit = parseInt(url.searchParams.get('limit') || '12', 10);
      const query = url.searchParams.get('query') || url.searchParams.get('q');
      const propertyType = url.searchParams.get('types');

      let filtered = [...MOCK_PROPERTIES];
      if (query) {
        const q = query.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.location.city.toLowerCase().includes(q) ||
            p.location.state.toLowerCase().includes(q)
        );
      }
      if (propertyType) {
        const types = propertyType.split(',').map((t) => t.trim().toLowerCase());
        filtered = filtered.filter((p) => types.includes(p.propertyType.toLowerCase()));
      }

      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const startIndex = (pageNum - 1) * limit;
      const paginatedResults = filtered.slice(startIndex, startIndex + limit);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          properties: paginatedResults,
          total,
          page: pageNum,
          totalPages,
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Intercept GET /api/properties/:id
  await page.route(/\/api\/properties\/([^/?#]+)$/, async (route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      const url = new URL(request.url());
      const pathParts = url.pathname.split('/');
      const id = pathParts[pathParts.length - 1];
      const property =
        MOCK_PROPERTIES.find((p) => p.id === id) || {
          ...MOCK_PROPERTIES[0],
          id,
          name: id === 'prop-conf-1' ? 'Sunset Loft Confirmation Test' : `Property ${id}`,
        };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(property),
      });
    } else {
      await route.continue();
    }
  });

  // Intercept POST /api/properties/:id/purchase
  await page.route(/\/api\/properties\/([^/?#]+)\/purchase$/, async (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      const url = new URL(request.url());
      const pathParts = url.pathname.split('/');
      const id = pathParts[pathParts.length - 2];
      const body = request.postDataJSON() || {};
      const property =
        MOCK_PROPERTIES.find((p) => p.id === id) || {
          ...MOCK_PROPERTIES[0],
          id,
          name: id === 'prop-conf-1' ? 'Sunset Loft Confirmation Test' : `Property ${id}`,
        };

      const amount = body.amount || 10;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          transactionHash:
            id === 'prop-conf-1'
              ? '0xabc123def4567890abc123def4567890abc123def4567890abc123def4567890'
              : '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          amount,
          totalCost: amount * (property.price?.perToken || 100),
          property: { id: property.id, name: property.name },
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Intercept GET /api/transactions
  await page.route('**/api/transactions', async (route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      const baseTxs = getMockApiTransactions();
      const txs = [
        {
          id: 'tx-1',
          type: 'purchase',
          propertyId: 'prop-1',
          propertyName: 'Luxury Downtown Penthouse',
          amount: 10,
          totalCost: 1000,
          transactionHash: '0xabc123def456',
          timestamp: new Date().toISOString(),
          status: 'completed',
        },
        ...baseTxs,
      ];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(txs),
      });
    } else {
      await route.continue();
    }
  });

  // Intercept GET /api/wallet/balance
  await page.route('**/api/wallet/balance', async (route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          balance: '100.0',
          currency: 'ETH',
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Intercept POST /api/properties/:id/validate
  await page.route(/\/api\/properties\/([^/?#]+)\/validate$/, async (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      const url = new URL(request.url());
      const pathParts = url.pathname.split('/');
      const id = pathParts[pathParts.length - 2];
      const body = request.postDataJSON() || {};
      const property =
        MOCK_PROPERTIES.find((p) => p.id === id) || {
          ...MOCK_PROPERTIES[0],
          id,
          name: id === 'prop-conf-1' ? 'Sunset Loft Confirmation Test' : `Property ${id}`,
        };

      if (body.amount !== undefined && body.amount <= 0) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            valid: false,
            error: 'Amount must be greater than 0',
          }),
        });
        return;
      }

      if (body.amount !== undefined && body.amount > 25000) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            valid: false,
            error: 'Insufficient tokens available',
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          valid: true,
          totalCost: (body.amount || 10) * (property.price?.perToken || 100),
        }),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Composite helper to setup both wallet mocking and API route interception.
 */
export async function setupWalletMsw(page: Page, options: EthereumMockOptions = {}) {
  await setupWalletMock(page, options);
  await setupApiMock(page);
}

export const walletFixture = setupWalletMsw;

export interface WalletFixtureControls {
  setup: (options?: EthereumMockOptions) => Promise<void>;
  setAccount: (address: string) => Promise<void>;
  rejectNext: () => Promise<void>;
  remove: () => Promise<void>;
}

export interface ApiFixtureControls {
  setup: () => Promise<void>;
}

/**
 * Canonical test fixture extending Playwright base test with wallet and api mocking.
 */
export const test = baseTest.extend<{
  wallet: WalletFixtureControls;
  api: ApiFixtureControls;
  walletMswFixture: void;
}>({
  wallet: async ({ page }, use) => {
    await use({
      setup: async (options) => {
        await setupWalletMock(page, options);
      },
      setAccount: async (address) => {
        await setupWalletMock(page, { address });
      },
      rejectNext: async () => {
        await setupWalletMock(page, { shouldReject: true });
      },
      remove: async () => {
        await setupWalletMock(page, { noWallet: true });
      },
    });
  },

  api: async ({ page }, use) => {
    await use({
      setup: async () => {
        await setupApiMock(page);
      },
    });
  },

  walletMswFixture: [async ({ page }, use) => {
    await setupWalletMsw(page);
    await use();
  }, { auto: true }],
});

export { expect };
