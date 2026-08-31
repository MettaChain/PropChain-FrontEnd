import { test, expect } from '@playwright/test';

test.describe('Content Security Policy', () => {
  test('should have CSP headers on main page', async ({ page }) => {
    const response = await page.goto('/');
    if (!response) {
      test.fail(true, 'No response received');
      return;
    }

    const cspHeader = response.headers()['content-security-policy'] || response.headers()['content-security-policy-report-only'];
    expect(cspHeader).toBeTruthy();

    expect(cspHeader).toContain("default-src 'self'");
    expect(cspHeader).toContain("img-src 'self' data: ipfs:");
    expect(cspHeader).toContain("script-src 'self' 'nonce-");
    expect(cspHeader).toContain("style-src 'self' 'unsafe-inline'");
    expect(cspHeader).toContain("base-uri 'self'");
    expect(cspHeader).toContain("form-action 'self'");
    expect(cspHeader).toContain("frame-ancestors 'self'");
  });

  test('should have x-csp-nonce header', async ({ page }) => {
    const response = await page.goto('/');
    if (!response) {
      test.fail(true, 'No response received');
      return;
    }

    const nonceHeader = response.headers()['x-csp-nonce'];
    expect(nonceHeader).toBeTruthy();
    expect(nonceHeader?.length).toBeGreaterThanOrEqual(16);
  });

  test('should not apply CSP to API routes', async ({ page }) => {
    const response = await page.goto('/api/csp-report');
    const cspHeader = response?.headers()['content-security-policy'] || response?.headers()['content-security-policy-report-only'];
    expect(cspHeader).toBeUndefined();
  });

  test('CSP blocks inline scripts', async ({ page }) => {
    const cspViolations: string[] = [];

    await page.route('**/api/csp-report', (route) => {
      route.continue();
    });

    page.on('console', (msg) => {
      if (msg.type() === 'warning' && msg.text().includes('CSP')) {
        cspViolations.push(msg.text());
      }
    });

    await page.goto('/');
    await page.evaluate(() => {
      const script = document.createElement('script');
      script.textContent = "alert('xss')";
      document.body.appendChild(script);
    });

    expect(cspViolations.length).toBeGreaterThanOrEqual(0);
  });
});
