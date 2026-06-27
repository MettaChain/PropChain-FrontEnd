import { test as base } from '@playwright/test';

export const test = base.extend({
  context: async ({ context }, use) => {
    // Initialize MSW in the browser context
    await context.addInitScript(() => {
      // This script runs before any page loads
      if (typeof window !== 'undefined') {
        // Flag to indicate MSW should be enabled
        (window as any).__MSW_ENABLED__ = true;
      }
    });

    await use(context);
  },

  page: async ({ page }, use) => {
    // Route all API calls through MSW
    await page.route('**/api/**', async (route) => {
      // Let MSW handle the request
      await route.continue();
    });

    await use(page);
  },
});

export { expect } from '@playwright/test';
