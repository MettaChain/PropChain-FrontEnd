import { test, expect } from '@playwright/test';
import { setupWalletMock } from './wallet-fixture';

// Covers referral share + leaderboard ranking described in issue #1052.
// Note: no claim-rewards route exists in this codebase yet, so that leg of
// the original request is intentionally not covered here.
test.describe('Referral leaderboard', () => {
  test('share link on the dashboard includes the referral code', async ({ page }) => {
    await setupWalletMock(page);
    await page.goto('/referral');

    const shareLink = page.getByRole('link', { name: /copy|share/i }).first();
    await expect(shareLink).toBeVisible();

    const href = await page.locator('[href*="ref="]').first().getAttribute('href');
    expect(href).toMatch(/ref=/);
  });

  test('leaderboard renders ranked rows', async ({ page }) => {
    await page.goto('/referral/leaderboard');

    const rows = page.locator('text=/^#\\d+$/');
    await expect(rows.first()).toBeVisible();

    const firstRankText = await rows.first().textContent();
    expect(firstRankText).toBe('#1');
  });
});
