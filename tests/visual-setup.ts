import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('Setting up visual regression tests...');
  
  // Create screenshots directory if it doesn't exist
  const fs = require('fs');
  const path = require('path');
  
  const screenshotsDir = path.join(config.projectDir, 'test-results', 'visual-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  // Launch browser to ensure consistent environment
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });
  
  // Navigate to the app to warm it up
  const page = await context.newPage();
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  await context.close();
  await browser.close();
  
  console.log('Visual regression test setup completed');
}

export default globalSetup;
