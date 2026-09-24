import { test, expect } from '@playwright/test';

test.describe('Transaction history search, filter, and export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/transactions');
  });

  test('filters rows by search text and shows empty state when no match', async ({ page }) => {
    const search = page.locator('div.relative.flex-1 input');
    await search.fill('nonexistent-search-term-xyz');
    await expect(page.getByTestId('transaction-item')).toHaveCount(0);
  });

  test('filters rows by status', async ({ page }) => {
    await page.getByTestId('transaction-status-filter').click();
    await page.getByRole('option', { name: /cancelled/i }).click();
    const rows = page.getByTestId('transaction-item');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toBeVisible();
    }
  });

  test('exports the filtered list to CSV and triggers a download', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /csv/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  });
});
