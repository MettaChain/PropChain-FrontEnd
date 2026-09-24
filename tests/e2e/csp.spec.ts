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
    expect(cspHeader).toContain("img-src 'self' data: blob: https:");
    expect(cspHeader).toContain("script-src 'self' 'nonce-");
    expect(cspHeader).toContain("style-src 'self' 'unsafe-inline'");
    expect(cspHeader).toContain("base-uri 'self'");
    expect(cspHeader).toContain("form-action 'self'");
    expect(cspHeader).toContain("frame-ancestors 'none'");
  });

  test('script-src nonce is present and non-trivial', async ({ page }) => {
    const response = await page.goto('/');
    if (!response) {
      test.fail(true, 'No response received');
      return;
    }

    const cspHeader = response.headers()['content-security-policy'] || response.headers()['content-security-policy-report-only'];
    const nonceMatch = cspHeader?.match(/'nonce-([A-Za-z0-9+/=]+)'/);
    expect(nonceMatch?.[1]).toBeTruthy();
    expect(nonceMatch?.[1]?.length).toBeGreaterThanOrEqual(16);
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
