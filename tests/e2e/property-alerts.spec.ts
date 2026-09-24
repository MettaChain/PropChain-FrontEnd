import { test, expect } from '@playwright/test';

// Covers the create/validate/persist flow described in tests/test-property-alerts.md (#1051)
test.describe('Property Price Alerts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/alerts');
  });

  test('rejects an invalid threshold input', async ({ page }) => {
    const emailInput = page.getByPlaceholder('your@email.com');
    await emailInput.fill('investor@example.com');

    const thresholdInput = page.getByLabel(/threshold/i);
    await thresholdInput.fill('-100');
    await page.getByRole('button', { name: /create alert|save alert/i }).click();

    await expect(page.getByText(/must be greater than/i)).toBeVisible();
  });

  test('creates an alert and persists it across reload', async ({ page }) => {
    await page.getByPlaceholder('your@email.com').fill('investor@example.com');
    await page.getByLabel(/threshold/i).fill('500000');
    await page.getByRole('button', { name: /create alert|save alert/i }).click();

    await expect(page.getByText('investor@example.com')).toBeVisible();

    await page.reload();
    await expect(page.getByText('investor@example.com')).toBeVisible();
  });
});
