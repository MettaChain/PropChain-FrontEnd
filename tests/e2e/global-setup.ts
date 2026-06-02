import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Start a browser to generate MSW service worker
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navigate to the app to ensure service worker is registered
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
  
  try {
    await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for service worker to be ready
    await page.waitForTimeout(2000);
  } catch (error) {
    console.warn('Could not initialize MSW service worker:', error);
  } finally {
    await browser.close();
  }
}

export default globalSetup;
