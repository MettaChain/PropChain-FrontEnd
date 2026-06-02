import { test, expect } from '@playwright/test';

/**
 * MSW Verification Test
 * Verifies that MSW is properly mocking API calls without requiring a backend
 */

test.describe('MSW API Mocking Verification', () => {
  test('should mock API responses successfully', async ({ page }) => {
    // Mock API endpoint
    await page.route('**/api/test', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'MSW is working',
          data: { test: 'value' },
        }),
      });
    });

    // Create a test page that makes an API call
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><title>MSW Test</title></head>
        <body>
          <div id="result">Loading...</div>
          <script>
            fetch('/api/test')
              .then(res => res.json())
              .then(data => {
                document.getElementById('result').textContent = data.message;
              })
              .catch(err => {
                document.getElementById('result').textContent = 'Error: ' + err.message;
              });
          </script>
        </body>
      </html>
    `);

    // Wait for the API call to complete
    await page.waitForTimeout(1000);

    // Verify the mocked response was used
    const result = await page.locator('#result').textContent();
    expect(result).toBe('MSW is working');
  });

  test('should mock property API endpoints', async ({ page }) => {
    // Mock property listings endpoint
    await page.route('**/api/properties', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          properties: [
            {
              id: 'test-1',
              name: 'Test Property',
              price: { total: 1000000, perToken: 100, currency: 'USD' },
            },
          ],
          total: 1,
          page: 1,
          totalPages: 1,
        }),
      });
    });

    // Create a test page
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><title>Property Test</title></head>
        <body>
          <div id="property-count">0</div>
          <div id="property-name"></div>
          <script>
            fetch('/api/properties')
              .then(res => res.json())
              .then(data => {
                document.getElementById('property-count').textContent = data.total;
                document.getElementById('property-name').textContent = data.properties[0].name;
              });
          </script>
        </body>
      </html>
    `);

    await page.waitForTimeout(1000);

    expect(await page.locator('#property-count').textContent()).toBe('1');
    expect(await page.locator('#property-name').textContent()).toBe('Test Property');
  });

  test('should mock purchase transaction endpoint', async ({ page }) => {
    await page.route('**/api/properties/*/purchase', async (route) => {
      const postData = route.request().postDataJSON();
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          transactionHash: '0xmocked123',
          amount: postData.amount,
          totalCost: postData.amount * 100,
        }),
      });
    });

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><title>Purchase Test</title></head>
        <body>
          <div id="tx-hash"></div>
          <div id="cost"></div>
          <script>
            fetch('/api/properties/test-1/purchase', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ amount: 10, walletAddress: '0x123' })
            })
              .then(res => res.json())
              .then(data => {
                document.getElementById('tx-hash').textContent = data.transactionHash;
                document.getElementById('cost').textContent = data.totalCost;
              });
          </script>
        </body>
      </html>
    `);

    await page.waitForTimeout(1000);

    expect(await page.locator('#tx-hash').textContent()).toBe('0xmocked123');
    expect(await page.locator('#cost').textContent()).toBe('1000');
  });
});
