import { test, expect, setupWalletMock } from '../../tests/fixtures';

/**
 * Visual regression snapshots for the UI that exists today, in light, dark and
 * mobile variants. Mirrors tests/e2e/visual-regression.spec.ts.
 *
 * Covered: governance proposal card, staking panel, property card.
 * Not covered: PropertyComparisonTable, InvestmentPortfolioChart and
 * TransactionStatusTimeline do not exist in the repo yet.
 *
 * Run with the visual config, pointing at this file, e.g.
 *   npx playwright test --config=playwright.visual.config.ts \
 *     --test-match '**\/ui-extensions/tests/ui-visual-regression.spec.ts'
 * (the config's testDir/testMatch only pick up tests/e2e/visual-regression.spec.ts)
 * Baselines are generated on first run with --update-snapshots.
 */
const viewports = {
  desktop: { width: 1280, height: 720 },
  mobile: { width: 375, height: 812 },
};
const schemes = ['light', 'dark'] as const;

for (const [vpName, viewport] of Object.entries(viewports)) {
  for (const scheme of schemes) {
    test.describe(`${vpName} / ${scheme}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
        await setupWalletMock(page);
      });

      test('governance proposal card', async ({ page }) => {
        await page.goto('/governance');
        const card = page.getByRole('article', { name: /short-term rental program/i });
        await expect(card).toBeVisible();
        // Passed proposal: static data, no countdown, so the snapshot is stable.
        await expect(card).toHaveScreenshot(`governance-card-${vpName}-${scheme}.png`, {
          animations: 'disabled',
        });
      });

      test('staking panel', async ({ page }) => {
        await page.goto('/dashboard');
        await page.getByRole('tab', { name: /staking & yield/i }).click();
        const heading = page.getByRole('heading', { name: /your active stakes/i });
        await expect(heading).toBeVisible();
        await expect(page.getByRole('tabpanel')).toHaveScreenshot(
          `staking-panel-${vpName}-${scheme}.png`,
          { animations: 'disabled' },
        );
      });

      test('property card', async ({ page }) => {
        await page.goto('/properties');
        const card = page.locator('[data-testid="property-card"]').first();
        await expect(card).toBeVisible();
        await expect(card).toHaveScreenshot(`property-card-${vpName}-${scheme}.png`, {
          animations: 'disabled',
        });
      });
    });
  }
}
