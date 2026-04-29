import { test, expect } from '@playwright/test';

/**
 * Property Purchase Flow E2E Tests with MSW API Mocking
 * These tests cover all property purchase scenarios without requiring a backend
 */

test.describe('Property Purchase Flow with MSW', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses for property purchase flow
    await page.route('**/api/**', async (route) => {
      const url = new URL(route.request().url());
      const pathname = url.pathname;
      const method = route.request().method();

      // Mock property listings
      if (pathname === '/api/properties' && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            properties: [
              {
                id: 'prop-1',
                name: 'Luxury Downtown Penthouse',
                description: 'Stunning penthouse in Manhattan',
                location: {
                  city: 'New York',
                  state: 'NY',
                  address: '432 Park Avenue',
                  country: 'USA',
                  zipCode: '10022',
                  coordinates: { lat: 40.7614, lng: -73.9776 },
                },
                price: { total: 5000000, perToken: 100, currency: 'USD' },
                propertyType: 'residential',
                blockchain: 'ethereum',
                tokenInfo: {
                  totalSupply: 50000,
                  available: 25000,
                  sold: 25000,
                  contractAddress: '0x1234',
                  tokenSymbol: 'PENT432',
                },
                metrics: {
                  roi: 8.5,
                  annualReturn: 425000,
                  transactionVolume: 2500000,
                  appreciationRate: 5.2,
                },
                details: {
                  bedrooms: 3,
                  bathrooms: 3,
                  squareFeet: 3200,
                  yearBuilt: 2020,
                  parking: 2,
                  amenities: ['Gym', 'Pool'],
                },
                images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
                listedDate: '2024-01-15T00:00:00Z',
                status: 'active',
                featured: true,
                verified: true,
              },
            ],
            total: 1,
            page: 1,
            totalPages: 1,
          }),
        });
        return;
      }

      // Mock individual property details
      const propertyMatch = pathname.match(/^\/api\/properties\/([^\/]+)$/);
      if (propertyMatch && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: propertyMatch[1],
            name: 'Luxury Downtown Penthouse',
            description: 'Stunning penthouse in Manhattan with panoramic city views',
            location: {
              city: 'New York',
              state: 'NY',
              address: '432 Park Avenue',
              country: 'USA',
              zipCode: '10022',
              coordinates: { lat: 40.7614, lng: -73.9776 },
            },
            price: { total: 5000000, perToken: 100, currency: 'USD' },
            propertyType: 'residential',
            blockchain: 'ethereum',
            tokenInfo: {
              totalSupply: 50000,
              available: 25000,
              sold: 25000,
              contractAddress: '0x1234567890abcdef',
              tokenSymbol: 'PENT432',
            },
            metrics: {
              roi: 8.5,
              annualReturn: 425000,
              transactionVolume: 2500000,
              appreciationRate: 5.2,
            },
            details: {
              bedrooms: 3,
              bathrooms: 3,
              squareFeet: 3200,
              yearBuilt: 2020,
              parking: 2,
              amenities: ['Gym', 'Pool', 'Concierge', 'Rooftop Terrace'],
            },
            images: [
              'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
              'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
            ],
            listedDate: '2024-01-15T00:00:00Z',
            status: 'active',
            featured: true,
            verified: true,
          }),
        });
        return;
      }

      // Mock purchase validation
      const validateMatch = pathname.match(/^\/api\/properties\/([^\/]+)\/validate$/);
      if (validateMatch && method === 'POST') {
        const body = await route.request().postDataJSON();
        
        if (body.amount <= 0) {
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

        if (body.amount > 25000) {
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
            totalCost: body.amount * 100,
          }),
        });
        return;
      }

      // Mock purchase transaction
      const purchaseMatch = pathname.match(/^\/api\/properties\/([^\/]+)\/purchase$/);
      if (purchaseMatch && method === 'POST') {
        const body = await route.request().postDataJSON();
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            transactionHash: '0x' + Math.random().toString(16).substring(2, 66),
            amount: body.amount,
            totalCost: body.amount * 100,
            property: {
              id: purchaseMatch[1],
              name: 'Luxury Downtown Penthouse',
            },
          }),
        });
        return;
      }

      // Mock transaction history
      if (pathname === '/api/transactions' && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
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
            {
              id: 'tx-2',
              type: 'purchase',
              propertyId: 'prop-1',
              propertyName: 'Luxury Downtown Penthouse',
              amount: 5,
              totalCost: 500,
              transactionHash: '0x789ghi012jkl',
              timestamp: new Date(Date.now() - 86400000).toISOString(),
              status: 'completed',
            },
          ]),
        });
        return;
      }

      // Mock wallet balance
      if (pathname === '/api/wallet/balance' && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            balance: '100.0',
            currency: 'ETH',
          }),
        });
        return;
      }

      await route.continue();
    });

    // Mock wallet connection
    await page.addInitScript(() => {
      (window as any).ethereum = {
        isMetaMask: true,
        request: async ({ method }: { method: string }) => {
          if (method === 'eth_requestAccounts') {
            return ['0x1234567890123456789012345678901234567890'];
          }
          if (method === 'eth_chainId') {
            return '0x1';
          }
          if (method === 'eth_getBalance') {
            return '0x56BC75E2D630E8000'; // 100 ETH
          }
          if (method === 'eth_sendTransaction') {
            return '0x' + Math.random().toString(16).substring(2, 66);
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
        isConnected: () => true,
      };
    });
  });

  test('should display property listings with mocked API', async ({ page }) => {
    await page.goto('/properties');
    
    await expect(page.locator('[data-testid="property-card"]')).toHaveCount(1);
    await expect(page.getByText('Luxury Downtown Penthouse')).toBeVisible();
  });

  test('should navigate to property details with mocked data', async ({ page }) => {
    await page.goto('/properties');
    
    const propertyCard = page.locator('[data-testid="property-card"]').first();
    await propertyCard.click();
    
    await expect(page).toHaveURL(/\/properties\/prop-1/);
    await expect(page.getByText('Luxury Downtown Penthouse')).toBeVisible();
  });

  test('should display token information from mocked API', async ({ page }) => {
    await page.goto('/properties/prop-1');
    
    await expect(page.getByText(/25000.*available/i)).toBeVisible();
    await expect(page.getByText(/\$100.*per token/i)).toBeVisible();
  });

  test('should validate purchase amount with mocked API', async ({ page }) => {
    await page.goto('/properties/prop-1');
    
    const purchaseButton = page.getByRole('button', { name: /purchase|buy/i });
    await purchaseButton.click();
    
    const amountInput = page.locator('[data-testid="token-amount-input"]');
    await amountInput.fill('0');
    
    const confirmButton = page.locator('[data-testid="confirm-purchase"]');
    await expect(confirmButton).toBeDisabled();
  });

  test('should calculate total cost correctly with mocked prices', async ({ page }) => {
    await page.goto('/properties/prop-1');
    
    const purchaseButton = page.getByRole('button', { name: /purchase|buy/i });
    await purchaseButton.click();
    
    const amountInput = page.locator('[data-testid="token-amount-input"]');
    await amountInput.fill('10');
    
    await expect(page.getByText(/1000/)).toBeVisible();
  });

  test('should handle insufficient tokens with mocked validation', async ({ page }) => {
    await page.goto('/properties/prop-1');
    
    const purchaseButton = page.getByRole('button', { name: /purchase|buy/i });
    await purchaseButton.click();
    
    const amountInput = page.locator('[data-testid="token-amount-input"]');
    await amountInput.fill('30000');
    
    await expect(page.getByText(/insufficient.*tokens/i)).toBeVisible();
  });

  test('should complete purchase flow with mocked transaction', async ({ page }) => {
    await page.goto('/properties/prop-1');
    
    const purchaseButton = page.getByRole('button', { name: /purchase|buy/i });
    await purchaseButton.click();
    
    const amountInput = page.locator('[data-testid="token-amount-input"]');
    await amountInput.fill('5');
    
    const confirmButton = page.locator('[data-testid="confirm-purchase"]');
    await confirmButton.click();
    
    await expect(page.getByText(/success|completed/i)).toBeVisible({ timeout: 10000 });
  });

  test('should display transaction history from mocked API', async ({ page }) => {
    await page.goto('/dashboard');
    
    const transactionsTab = page.getByRole('tab', { name: /transactions/i });
    if (await transactionsTab.isVisible()) {
      await transactionsTab.click();
    }
    
    await expect(page.getByText('Luxury Downtown Penthouse')).toBeVisible();
    await expect(page.getByText(/0xabc123/)).toBeVisible();
  });

  test('should filter properties by price with mocked API', async ({ page }) => {
    await page.goto('/properties');
    
    const filterButton = page.getByRole('button', { name: /filter/i });
    if (await filterButton.isVisible()) {
      await filterButton.click();
      
      const minPrice = page.locator('input[placeholder*="Min Price"]');
      const maxPrice = page.locator('input[placeholder*="Max Price"]');
      
      if (await minPrice.isVisible()) {
        await minPrice.fill('1000000');
        await maxPrice.fill('10000000');
        
        await page.getByRole('button', { name: 'Apply Filters' }).click();
        
        await expect(page.locator('[data-testid="property-card"]')).toHaveCount(1);
      }
    }
  });

  test('should search properties with mocked API', async ({ page }) => {
    await page.goto('/properties');
    
    const searchInput = page.locator('input[placeholder*="Search" i]');
    await searchInput.fill('Penthouse');
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(500);
    
    await expect(page.getByText('Luxury Downtown Penthouse')).toBeVisible();
  });
});
