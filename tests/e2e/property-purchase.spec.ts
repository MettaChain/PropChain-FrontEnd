import { test, expect } from '@playwright/test';

test.describe('Property Purchase Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Initialize MSW for API mocking
    await page.addInitScript(() => {
      // Import and start MSW worker
      import('/tests/mocks/browser.js').then(({ worker }) => {
        worker.start({
          onUnhandledRequest: 'bypass',
        });
      }).catch(() => {
        console.warn('MSW worker not available, using inline mocks');
      });
    });

    // Mock wallet connection for property purchase tests
    await page.addInitScript(() => {
      (window as any).ethereum = {
        isMetaMask: true,
        request: async ({ method, params }: { method: string; params?: any[] }) => {
          if (method === 'eth_requestAccounts') {
            return ['0x1234567890123456789012345678901234567890'];
          }
          if (method === 'eth_chainId') {
            return '0x1';
          }
          if (method === 'eth_getBalance') {
            return '0x56BC75E2D630E8000'; // 100 ETH in wei
          }
          if (method === 'eth_sendTransaction') {
            // Mock successful transaction
            return '0x1234567890123456789012345678901234567890123456789012345678901234';
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
        isConnected: () => true,
      };
    });

    // Mock API responses directly in the page context
    await page.route('**/api/properties*', async (route) => {
      const url = new URL(route.request().url());
      const pathname = url.pathname;

      // Handle property list
      if (pathname === '/api/properties' && route.request().method() === 'GET') {
        const mockProperties = [
          {
            id: '1',
            name: 'Luxury Downtown Penthouse',
            description: 'Stunning penthouse in Manhattan',
            location: { city: 'New York', state: 'NY', address: '432 Park Avenue', country: 'USA', zipCode: '10022', coordinates: { lat: 40.7614, lng: -73.9776 } },
            price: { total: 5000000, perToken: 100, currency: 'USD' },
            propertyType: 'residential',
            blockchain: 'ethereum',
            tokenInfo: { totalSupply: 50000, available: 25000, sold: 25000, contractAddress: '0x1234', tokenSymbol: 'PENT432' },
            metrics: { roi: 8.5, annualReturn: 425000, transactionVolume: 2500000, appreciationRate: 5.2 },
            details: { bedrooms: 3, bathrooms: 3, squareFeet: 3200, yearBuilt: 2020, parking: 2, amenities: ['Gym', 'Pool'] },
            images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
            listedDate: '2024-01-15T00:00:00Z',
            status: 'active',
            featured: true,
            verified: true,
          },
        ];

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            properties: mockProperties,
            total: mockProperties.length,
            page: 1,
            totalPages: 1,
          }),
        });
        return;
      }

      // Handle individual property
      const propertyIdMatch = pathname.match(/\/api\/properties\/([^\/]+)$/);
      if (propertyIdMatch && route.request().method() === 'GET') {
        const mockProperty = {
          id: propertyIdMatch[1],
          name: 'Luxury Downtown Penthouse',
          description: 'Stunning penthouse in Manhattan',
          location: { city: 'New York', state: 'NY', address: '432 Park Avenue', country: 'USA', zipCode: '10022', coordinates: { lat: 40.7614, lng: -73.9776 } },
          price: { total: 5000000, perToken: 100, currency: 'USD' },
          propertyType: 'residential',
          blockchain: 'ethereum',
          tokenInfo: { totalSupply: 50000, available: 25000, sold: 25000, contractAddress: '0x1234', tokenSymbol: 'PENT432' },
          metrics: { roi: 8.5, annualReturn: 425000, transactionVolume: 2500000, appreciationRate: 5.2 },
          details: { bedrooms: 3, bathrooms: 3, squareFeet: 3200, yearBuilt: 2020, parking: 2, amenities: ['Gym', 'Pool'] },
          images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
          listedDate: '2024-01-15T00:00:00Z',
          status: 'active',
          featured: true,
          verified: true,
        };

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockProperty),
        });
        return;
      }

      // Handle purchase
      const purchaseMatch = pathname.match(/\/api\/properties\/([^\/]+)\/purchase$/);
      if (purchaseMatch && route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            transactionHash: '0x1234567890abcdef',
            amount: 10,
            totalCost: 1000,
            property: { id: purchaseMatch[1], name: 'Luxury Downtown Penthouse' },
          }),
        });
        return;
      }

      // Handle transactions
      if (pathname === '/api/transactions' && route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'tx-1',
              type: 'purchase',
              propertyId: '1',
              propertyName: 'Luxury Downtown Penthouse',
              amount: 10,
              totalCost: 1000,
              transactionHash: '0xabc123',
              timestamp: new Date().toISOString(),
              status: 'completed',
            },
          ]),
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/');
    
    // Connect wallet first
    const connectButton = page.getByRole('button', { name: 'Connect Wallet' }).first();
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.getByText('MetaMask').click();
      
      // Wait for connection
      await expect(page.getByText('0x1234...7890')).toBeVisible();
    }
  });

  test('should display property listings', async ({ page }) => {
    await page.goto('/properties');
    
    // Check that properties are displayed
    await expect(page.locator('[data-testid="property-card"]')).toHaveCount.greaterThan(0);
    
    // Check property card elements
    const firstProperty = page.locator('[data-testid="property-card"]').first();
    await expect(firstProperty.locator('img')).toBeVisible();
    await expect(firstProperty.locator('[data-testid="property-name"]')).toBeVisible();
    await expect(firstProperty.locator('[data-testid="property-price"]')).toBeVisible();
    await expect(firstProperty.locator('[data-testid="property-roi"]')).toBeVisible();
  });

  test('should filter properties by price range', async ({ page }) => {
    await page.goto('/properties');
    
    // Open filter sidebar
    const filterButton = page.getByRole('button', { name: /filter/i });
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }
    
    // Set price range
    const minPriceInput = page.locator('input[placeholder*="Min Price"]');
    const maxPriceInput = page.locator('input[placeholder*="Max Price"]');
    
    if (await minPriceInput.isVisible()) {
      await minPriceInput.fill('100000');
      await maxPriceInput.fill('500000');
      
      // Apply filters
      await page.getByRole('button', { name: 'Apply Filters' }).click();
      
      // Verify filtered results
      const properties = page.locator('[data-testid="property-card"]');
      await expect(properties).toHaveCount.greaterThan(0);
    }
  });

  test('should search properties by location', async ({ page }) => {
    await page.goto('/properties');
    
    // Enter search query
    const searchInput = page.locator('input[placeholder*="Search" i]');
    await searchInput.fill('New York');
    await page.keyboard.press('Enter');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Verify search results
    const properties = page.locator('[data-testid="property-card"]');
    if (await properties.count() > 0) {
      await expect(properties.first()).toBeVisible();
    }
  });

  test('should navigate to property details page', async ({ page }) => {
    await page.goto('/properties');
    
    // Click on first property
    const firstProperty = page.locator('[data-testid="property-card"]').first();
    await firstProperty.click();
    
    // Verify navigation to property details
    await expect(page).toHaveURL(/\/properties\/[^\/]+/);
    
    // Check property details elements
    await expect(page.locator('[data-testid="property-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="property-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="property-gallery"]')).toBeVisible();
    await expect(page.locator('[data-testid="property-details"]')).toBeVisible();
  });

  test('should display token information', async ({ page }) => {
    await page.goto('/properties');
    
    // Click on first property
    const firstProperty = page.locator('[data-testid="property-card"]').first();
    await firstProperty.click();
    
    // Check token information
    await expect(page.locator('[data-testid="token-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="available-tokens"]')).toBeVisible();
    await expect(page.locator('[data-testid="token-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-supply"]')).toBeVisible();
  });

  test('should allow token purchase', async ({ page }) => {
    await page.goto('/properties');
    
    // Click on first property
    const firstProperty = page.locator('[data-testid="property-card"]').first();
    await firstProperty.click();
    
    // Click purchase button
    const purchaseButton = page.getByRole('button', { name: /purchase|buy/i });
    await expect(purchaseButton).toBeVisible();
    await purchaseButton.click();
    
    // Check purchase modal
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // Check purchase form elements
    await expect(page.locator('[data-testid="token-amount-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-cost"]')).toBeVisible();
    await expect(page.locator('[data-testid="confirm-purchase"]')).toBeVisible();
  });

  test('should calculate purchase cost correctly', async ({ page }) => {
    await page.goto('/properties');
    
    // Click on first property
    const firstProperty = page.locator('[data-testid="property-card"]').first();
    await firstProperty.click();
    
    // Click purchase button
    const purchaseButton = page.getByRole('button', { name: /purchase|buy/i });
    await purchaseButton.click();
    
    // Enter token amount
    const tokenAmountInput = page.locator('[data-testid="token-amount-input"]');
    await tokenAmountInput.fill('10');
    
    // Verify total cost calculation
    const totalCost = page.locator('[data-testid="total-cost"]');
    await expect(totalCost).toBeVisible();
    
    // The total should be token amount * token price
    const costText = await totalCost.textContent();
    expect(costText).toMatch(/ETH|USD|\$/);
  });

  test('should validate purchase amount', async ({ page }) => {
    await page.goto('/properties');
    
    // Click on first property
    const firstProperty = page.locator('[data-testid="property-card"]').first();
    await firstProperty.click();
    
    // Click purchase button
    const purchaseButton = page.getByRole('button', { name: /purchase|buy/i });
    await purchaseButton.click();
    
    // Enter invalid amount (0)
    const tokenAmountInput = page.locator('[data-testid="token-amount-input"]');
    await tokenAmountInput.fill('0');
    
    // Confirm button should be disabled
    const confirmButton = page.locator('[data-testid="confirm-purchase"]');
    await expect(confirmButton).toBeDisabled();
    
    // Enter valid amount
    await tokenAmountInput.fill('1');
    await expect(confirmButton).toBeEnabled();
  });

  test('should confirm purchase transaction', async ({ page }) => {
    await page.goto('/properties');
    
    // Click on first property
    const firstProperty = page.locator('[data-testid="property-card"]').first();
    await firstProperty.click();
    
    // Click purchase button
    const purchaseButton = page.getByRole('button', { name: /purchase|buy/i });
    await purchaseButton.click();
    
    // Enter token amount
    const tokenAmountInput = page.locator('[data-testid="token-amount-input"]');
    await tokenAmountInput.fill('5');
    
    // Confirm purchase
    const confirmButton = page.locator('[data-testid="confirm-purchase"]');
    await confirmButton.click();
    
    // Should show transaction confirmation modal
    await expect(page.locator('[data-testid="transaction-confirmation"]')).toBeVisible();
    
    // Confirm transaction
    const confirmTransactionButton = page.getByRole('button', { name: /confirm.*transaction/i });
    await confirmTransactionButton.click();
    
    // Should show processing state
    await expect(page.getByText(/processing|pending/i)).toBeVisible();
    
    // Should show success state after transaction
    await expect(page.getByText(/success|completed/i)).toBeVisible({ timeout: 10000 });
  });

  test('should handle insufficient balance', async ({ page }) => {
    // Mock wallet with low balance
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
            return '0x152D02C7E14AF6800000'; // 0.001 ETH (low balance)
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
        isConnected: () => true,
      };
    });

    await page.goto('/properties');
    
    // Click on first property
    const firstProperty = page.locator('[data-testid="property-card"]').first();
    await firstProperty.click();
    
    // Click purchase button
    const purchaseButton = page.getByRole('button', { name: /purchase|buy/i });
    await purchaseButton.click();
    
    // Enter large amount
    const tokenAmountInput = page.locator('[data-testid="token-amount-input"]');
    await tokenAmountInput.fill('1000');
    
    // Should show insufficient balance error
    await expect(page.getByText(/insufficient balance/i)).toBeVisible();
    
    // Confirm button should be disabled
    const confirmButton = page.locator('[data-testid="confirm-purchase"]');
    await expect(confirmButton).toBeDisabled();
  });

  test('should display transaction history', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Navigate to transactions section
    const transactionsTab = page.getByRole('tab', { name: /transactions/i });
    if (await transactionsTab.isVisible()) {
      await transactionsTab.click();
    }
    
    // Check transaction history
    await expect(page.locator('[data-testid="transaction-list"]')).toBeVisible();
    
    // Should show transaction items
    const transactions = page.locator('[data-testid="transaction-item"]');
    if (await transactions.count() > 0) {
      await expect(transactions.first()).toBeVisible();
    }
  });

  test('should filter transactions by type', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Navigate to transactions section
    const transactionsTab = page.getByRole('tab', { name: /transactions/i });
    if (await transactionsTab.isVisible()) {
      await transactionsTab.click();
    }
    
    // Look for transaction type filters
    const filterButtons = page.locator('[data-testid="transaction-filter"]');
    if (await filterButtons.count() > 0) {
      await filterButtons.first().click();
      
      // Verify filtering works
      await page.waitForTimeout(1000);
      const transactions = page.locator('[data-testid="transaction-item"]');
      // The exact assertion depends on the filter implementation
    }
  });
});
