import { Page, test as baseTest } from '@playwright/test';
import { setupWalletMock, EthereumMockOptions } from '../e2e/wallet-fixture';

// Set up both MSW (via Playwright route intercepting) and wallet mock
export async function setupWalletMsw(page: Page, options: EthereumMockOptions = {}) {
  // 1. Setup wallet mock (window.ethereum stubbing)
  await setupWalletMock(page, options);

  // 2. Setup MSW handlers via Playwright's page.route
  // Intercept GET /api/properties
  await page.route('**/api/properties', async (route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      const url = new URL(request.url());
      const pageNum = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '12');
      
      const { MOCK_PROPERTIES } = await import('../../src/lib/mockData');
      const filtered = [...MOCK_PROPERTIES];
      const total = filtered.length;
      const totalPages = Math.ceil(total / limit);
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
  await page.route(/\/api\/properties\/([^\/]+)$/, async (route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      const url = new URL(request.url());
      const pathParts = url.pathname.split('/');
      const id = pathParts[pathParts.length - 1];
      const { MOCK_PROPERTIES } = await import('../../src/lib/mockData');
      const property = MOCK_PROPERTIES.find(p => p.id === id);

      if (!property) {
        await route.fulfill({ status: 404 });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(property),
        });
      }
    } else {
      await route.continue();
    }
  });

  // Intercept POST /api/properties/:id/purchase
  await page.route(/\/api\/properties\/([^\/]+)\/purchase$/, async (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      const url = new URL(request.url());
      const pathParts = url.pathname.split('/');
      const id = pathParts[pathParts.length - 2];
      const body = request.postDataJSON() || {};
      const { MOCK_PROPERTIES } = await import('../../src/lib/mockData');
      const property = MOCK_PROPERTIES.find(p => p.id === id);

      if (!property) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Property not found' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            amount: body.amount || 10,
            totalCost: (body.amount || 10) * property.price.perToken,
            property: { id: property.id, name: property.name },
          }),
        });
      }
    } else {
      await route.continue();
    }
  });

  // Intercept GET /api/transactions
  await page.route('**/api/transactions', async (route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      const { getMockApiTransactions } = await import('../../src/lib/mockTransactionData');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(getMockApiTransactions()),
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
  await page.route(/\/api\/properties\/([^\/]+)\/validate$/, async (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      const url = new URL(request.url());
      const pathParts = url.pathname.split('/');
      const id = pathParts[pathParts.length - 2];
      const body = request.postDataJSON() || {};
      const { MOCK_PROPERTIES } = await import('../../src/lib/mockData');
      const property = MOCK_PROPERTIES.find(p => p.id === id);

      if (!property) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ valid: false, error: 'Property not found' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            valid: true,
            totalCost: (body.amount || 10) * property.price.perToken,
          }),
        });
      }
    } else {
      await route.continue();
    }
  });
}

// Export the walletFixture helper as requested
export const walletFixture = setupWalletMsw;

// Custom fixture exporting test & expect
export const test = baseTest.extend<{
  walletMswFixture: void;
}>({
  walletMswFixture: [async ({ page }, use) => {
    await setupWalletMsw(page);
    await use();
  }, { auto: true }],
});

export { expect } from '@playwright/test';
