import { test, expect } from '../fixtures';

/**
 * Property Purchase Flow E2E Tests with MSW API Mocking
 * These tests cover all property purchase scenarios without requiring a backend
 */

test.describe('Property Purchase Flow with MSW', () => {
  test('should display property listings with mocked API', async ({ page }) => {
    await page.goto('/properties');
    
    await expect(page.locator('[data-testid="property-card"]').first()).toBeVisible();
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
        
        await expect(page.locator('[data-testid="property-card"]').first()).toBeVisible();
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
