import { test, expect } from '../fixtures';

/**
 * MSW Verification Test
 * Verifies that the canonical API mocking fixture is properly mocking API calls without requiring a backend
 */

test.describe('MSW API Mocking Verification', () => {
  test('should mock API responses successfully', async ({ page, api }) => {
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

    // Verify the mocked response was used
    await expect(page.locator('#result')).toHaveText('MSW is working');
  });

  test('should mock property API endpoints', async ({ page, api }) => {
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

    await expect(page.locator('#property-count')).not.toHaveText('0');
    await expect(page.locator('#property-name')).not.toBeEmpty();
  });

  test('should mock purchase transaction endpoint', async ({ page, api }) => {
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

    await expect(page.locator('#tx-hash')).toContainText('0x');
    await expect(page.locator('#cost')).toHaveText('1000');
  });
});
