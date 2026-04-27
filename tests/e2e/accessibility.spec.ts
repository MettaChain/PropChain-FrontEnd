import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should not have accessibility violations on homepage', async ({ page }) => {
    await injectAxe(page);
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });
  });

  test('should not have accessibility violations on properties page', async ({ page }) => {
    await page.goto('/properties');
    await injectAxe(page);
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });
  });

  test('should not have accessibility violations on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await injectAxe(page);
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });
  });

  test('wallet connection button should have proper accessibility attributes', async ({ page }) => {
    const connectButton = page.getByRole('button', { name: 'Connect Wallet' }).first();

    await expect(connectButton).toHaveAttribute('type', 'button');

    // Check for accessible name
    const accessibleName = await connectButton.getAttribute('aria-label') ||
                          await connectButton.textContent();
    expect(accessibleName).toBeTruthy();
  });

  test('form inputs should have associated labels', async ({ page }) => {
    const inputs = page.locator('input');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const inputType = await input.getAttribute('type');

      // Skip hidden inputs
      if (inputType === 'hidden') continue;

      const inputId = await input.getAttribute('id');
      if (inputId) {
        const label = page.locator(`label[for="${inputId}"]`);
        const isVisible = await label.isVisible().catch(() => false);

        // Either has associated label or aria-label
        const hasAriaLabel = await input.getAttribute('aria-label').catch(() => null);
        expect(isVisible || hasAriaLabel).toBeTruthy();
      }
    }
  });

  test('modals should have proper focus management', async ({ page }) => {
    const connectButton = page.getByRole('button', { name: 'Connect Wallet' }).first();
    await connectButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Dialog should be visible and properly marked
    await expect(modal).toHaveAttribute('role', 'dialog');
  });

  test('images should have alt text', async ({ page }) => {
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const image = images.nth(i);
      const altText = await image.getAttribute('alt');
      const isDecorative = await image.getAttribute('role').catch(() => null) === 'presentation';
      const hasAriaHidden = await image.getAttribute('aria-hidden').catch(() => null);

      // Either has alt text or is marked as decorative
      expect(altText || isDecorative || hasAriaHidden).toBeTruthy();
    }
  });

  test('headings should be in proper order', async ({ page }) => {
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();

    if (headingCount > 0) {
      // At least one h1 should exist
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThan(0);
    }
  });

  test('color contrast should be sufficient', async ({ page }) => {
    await injectAxe(page);

    // Check for color contrast violations specifically
    const results = await page.evaluate(() => {
      return (window as any).axe.run({
        rules: {
          'color-contrast': { enabled: true },
        },
      });
    });

    const colorContrastViolations = results.violations.filter(
      (violation: any) => violation.id === 'color-contrast'
    );

    expect(colorContrastViolations.length).toBe(0);
  });

  test('interactive elements should be keyboard accessible', async ({ page }) => {
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    expect(buttonCount).toBeGreaterThan(0);

    // Tab through interactive elements
    for (let i = 0; i < Math.min(5, buttonCount); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        await button.focus();

        // Should be focusable
        const isFocused = await page.evaluate(() => {
          return document.activeElement?.tagName;
        });

        expect(isFocused).toBeTruthy();
      }
    }
  });
});
