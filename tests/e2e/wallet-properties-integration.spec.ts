import { test, expect } from '../fixtures/wallet-msw';

test.describe('Wallet + Properties Integration', () => {
  test('should display properties and show connected wallet status', async ({ page }) => {
    // 1. Visit the home page (the walletMswFixture runs automatically to stub window.ethereum and mock API routes)
    await page.goto('/');

    // 2. Click the Connect Wallet button
    const connectButton = page.getByRole('button', { name: 'Connect Wallet' }).first();
    await expect(connectButton).toBeVisible();
    await connectButton.click();

    // 3. Click MetaMask option to connect
    await page.getByText('MetaMask').click();

    // 4. Verify wallet displays connected address
    await expect(page.getByText('0x1234...7890')).toBeVisible();

    // 5. Navigate to/check properties listing to ensure it loaded correctly from our mocked route
    // Note: The properties list should fetch and show luxury penthouse (which is in our mock list)
    await expect(page.getByText('Luxury Downtown Penthouse').first()).toBeVisible();
  });
});
