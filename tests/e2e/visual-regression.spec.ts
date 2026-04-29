import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport for visual tests
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Mock wallet connection for consistent state
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
            return '0x56BC75E2D630E8000'; // 100 ETH in wei
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
        isConnected: () => true,
      };
    });
  });

  test('homepage visual baseline', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Take hero section screenshot
    const heroSection = page.locator('[data-testid="hero-section"]').first();
    if (await heroSection.isVisible()) {
      await expect(heroSection).toHaveScreenshot('hero-section.png', {
        animations: 'disabled'
      });
    }
    
    // Take features section screenshot
    const featuresSection = page.locator('[data-testid="features-section"]').first();
    if (await featuresSection.isVisible()) {
      await expect(featuresSection).toHaveScreenshot('features-section.png', {
        animations: 'disabled'
      });
    }
  });

  test('properties listing page visual baseline', async ({ page }) => {
    await page.goto('/properties');
    
    // Wait for properties to load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="property-card"]', { timeout: 5000 });
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('properties-full.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Take property cards screenshot
    const propertyCards = page.locator('[data-testid="property-card"]').first();
    if (await propertyCards.isVisible()) {
      await expect(propertyCards).toHaveScreenshot('property-card.png', {
        animations: 'disabled'
      });
    }
    
    // Take filter section screenshot
    const filterSection = page.locator('[data-testid="filter-section"]').first();
    if (await filterSection.isVisible()) {
      await expect(filterSection).toHaveScreenshot('filter-section.png', {
        animations: 'disabled'
      });
    }
  });

  test('property detail page visual baseline', async ({ page }) => {
    await page.goto('/properties/1');
    
    // Wait for property details to load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="property-title"]', { timeout: 5000 });
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('property-detail-full.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Take property gallery screenshot
    const gallery = page.locator('[data-testid="property-gallery"]').first();
    if (await gallery.isVisible()) {
      await expect(gallery).toHaveScreenshot('property-gallery.png', {
        animations: 'disabled'
      });
    }
    
    // Take property information screenshot
    const propertyInfo = page.locator('[data-testid="property-information"]').first();
    if (await propertyInfo.isVisible()) {
      await expect(propertyInfo).toHaveScreenshot('property-information.png', {
        animations: 'disabled'
      });
    }
    
    // Take investment summary screenshot
    const investmentSummary = page.locator('[data-testid="investment-summary"]').first();
    if (await investmentSummary.isVisible()) {
      await expect(investmentSummary).toHaveScreenshot('investment-summary.png', {
        animations: 'disabled'
      });
    }
  });

  test('wallet connection modal visual baseline', async ({ page }) => {
    await page.goto('/');
    
    // Click connect wallet button
    const connectButton = page.getByRole('button', { name: 'Connect Wallet' });
    await connectButton.click();
    
    // Wait for modal to appear
    await page.waitForSelector('[data-testid="wallet-modal"]', { timeout: 3000 });
    
    // Take wallet modal screenshot
    const walletModal = page.locator('[data-testid="wallet-modal"]');
    await expect(walletModal).toHaveScreenshot('wallet-modal.png', {
      animations: 'disabled'
    });
  });

  test('connected wallet state visual baseline', async ({ page }) => {
    await page.goto('/');
    
    // Connect wallet first
    const connectButton = page.getByRole('button', { name: 'Connect Wallet' });
    await connectButton.click();
    await page.getByText('MetaMask').click();
    
    // Wait for connection
    await page.waitForSelector('text=0x1234...7890', { timeout: 5000 });
    
    // Take header screenshot with connected wallet
    const header = page.locator('header').first();
    await expect(header).toHaveScreenshot('header-connected-wallet.png', {
      animations: 'disabled'
    });
  });

  test('dashboard page visual baseline', async ({ page }) => {
    // Connect wallet first
    await page.goto('/');
    const connectButton = page.getByRole('button', { name: 'Connect Wallet' });
    await connectButton.click();
    await page.getByText('MetaMask').click();
    await page.waitForSelector('text=0x1234...7890', { timeout: 5000 });
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 5000 });
    
    // Take full dashboard screenshot
    await expect(page).toHaveScreenshot('dashboard-full.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Take portfolio summary screenshot
    const portfolioSummary = page.locator('[data-testid="portfolio-summary"]').first();
    if (await portfolioSummary.isVisible()) {
      await expect(portfolioSummary).toHaveScreenshot('portfolio-summary.png', {
        animations: 'disabled'
      });
    }
  });

  test('mobile responsive visual baseline', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take mobile homepage screenshot
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Test mobile properties page
    await page.goto('/properties');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="property-card"]', { timeout: 5000 });
    
    await expect(page).toHaveScreenshot('properties-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Test mobile property detail
    await page.goto('/properties/1');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="property-title"]', { timeout: 5000 });
    
    await expect(page).toHaveScreenshot('property-detail-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('tablet responsive visual baseline', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take tablet homepage screenshot
    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Test tablet properties page
    await page.goto('/properties');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="property-card"]', { timeout: 5000 });
    
    await expect(page).toHaveScreenshot('properties-tablet.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('dark mode visual baseline', async ({ page }) => {
    // Enable dark mode
    await page.goto('/');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    
    // Wait for theme to apply
    await page.waitForTimeout(1000);
    
    // Take dark mode homepage screenshot
    await expect(page).toHaveScreenshot('homepage-dark.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Test dark mode properties page
    await page.goto('/properties');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="property-card"]', { timeout: 5000 });
    
    await expect(page).toHaveScreenshot('properties-dark.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Test dark mode property detail
    await page.goto('/properties/1');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="property-title"]', { timeout: 5000 });
    
    await expect(page).toHaveScreenshot('property-detail-dark.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('loading states visual baseline', async ({ page }) => {
    // Test homepage loading state
    await page.route('**/*', (route) => {
      // Delay network requests to simulate loading
      setTimeout(() => route.continue(), 1000);
    });
    
    await page.goto('/');
    
    // Take screenshot of loading state
    await expect(page).toHaveScreenshot('homepage-loading.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Remove route handler and wait for full load
    await page.unroute('**/*');
    await page.waitForLoadState('networkidle');
  });

  test('error states visual baseline', async ({ page }) => {
    // Test 404 page
    await page.goto('/non-existent-page');
    
    // Take 404 page screenshot
    await expect(page).toHaveScreenshot('404-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Test property not found
    await page.goto('/properties/999');
    
    // Take property not found screenshot
    await expect(page).toHaveScreenshot('property-not-found.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('form interactions visual baseline', async ({ page }) => {
    await page.goto('/properties');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="property-card"]', { timeout: 5000 });
    
    // Focus on search input
    const searchInput = page.locator('input[placeholder*="Search" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.focus();
      await expect(page).toHaveScreenshot('search-focused.png', {
        animations: 'disabled'
      });
    }
    
    // Hover over property card
    const firstProperty = page.locator('[data-testid="property-card"]').first();
    if (await firstProperty.isVisible()) {
      await firstProperty.hover();
      await expect(page).toHaveScreenshot('property-card-hover.png', {
        animations: 'disabled'
      });
    }
  });

  test('scroll behavior visual baseline', async ({ page }) => {
    await page.goto('/properties');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="property-card"]', { timeout: 5000 });
    
    // Scroll to bottom of page
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Wait for scroll to complete
    await page.waitForTimeout(1000);
    
    // Take screenshot of scrolled state
    await expect(page).toHaveScreenshot('properties-scrolled.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});

test.describe('Component Visual Regression Tests', () => {
  test('button components visual baseline', async ({ page }) => {
    await page.goto('/components-test');
    
    // Wait for components to load
    await page.waitForLoadState('networkidle');
    
    // Take button variations screenshot
    const buttonsSection = page.locator('[data-testid="buttons-section"]').first();
    if (await buttonsSection.isVisible()) {
      await expect(buttonsSection).toHaveScreenshot('button-variations.png', {
        animations: 'disabled'
      });
    }
  });

  test('card components visual baseline', async ({ page }) => {
    await page.goto('/components-test');
    
    // Wait for components to load
    await page.waitForLoadState('networkidle');
    
    // Take card variations screenshot
    const cardsSection = page.locator('[data-testid="cards-section"]').first();
    if (await cardsSection.isVisible()) {
      await expect(cardsSection).toHaveScreenshot('card-variations.png', {
        animations: 'disabled'
      });
    }
  });

  test('form components visual baseline', async ({ page }) => {
    await page.goto('/components-test');
    
    // Wait for components to load
    await page.waitForLoadState('networkidle');
    
    // Take form components screenshot
    const formsSection = page.locator('[data-testid="forms-section"]').first();
    if (await formsSection.isVisible()) {
      await expect(formsSection).toHaveScreenshot('form-components.png', {
        animations: 'disabled'
      });
    }
  });
});
