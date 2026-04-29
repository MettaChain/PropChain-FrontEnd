import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration specifically for visual regression testing
 * This configuration ensures consistent screenshots across different environments
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/visual-regression.spec.ts',
  
  /* Run tests in files in parallel */
  fullyParallel: false, // Disable parallel for visual tests to ensure consistency
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 1, // Single worker for visual tests
  
  /* Reporter to use */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/visual-results.json' }],
    ['junit', { outputFile: 'test-results/visual-results.xml' }],
  ],
  
  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Ignore HTTPS errors for local testing */
    ignoreHTTPSErrors: true,
    
    /* Set locale for consistent rendering */
    locale: 'en-US',
    
    /* Set timezone for consistent date/time rendering */
    timezoneId: 'America/New_York',
    
    /* Set color scheme preference */
    colorScheme: 'light',
    
    /* Set reduced motion for consistent animations */
    reducedMotion: 'reduce',
  },

  /* Configure projects for major browsers with specific visual testing settings */
  projects: [
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
        hasTouch: false,
      },
    },
    {
      name: 'firefox-desktop',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
        hasTouch: false,
      },
    },
    {
      name: 'webkit-desktop',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 2, // Retina display
        hasTouch: false,
      },
    },
    {
      name: 'chromium-mobile',
      use: { 
        ...devices['Pixel 5'],
        viewport: { width: 393, height: 851 },
        deviceScaleFactor: 2.625,
        hasTouch: true,
      },
    },
    {
      name: 'webkit-mobile',
      use: { 
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        hasTouch: true,
      },
    },
    {
      name: 'chromium-tablet',
      use: { 
        ...devices['iPad Pro'],
        viewport: { width: 1024, height: 1366 },
        deviceScaleFactor: 2,
        hasTouch: true,
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  /* Global setup and teardown */
  globalSetup: './tests/visual-setup.ts',
  globalTeardown: './tests/visual-teardown.ts',

  /* Output directory for test artifacts */
  outputDir: 'test-results/visual',
});
