import { test, expect } from '@playwright/test';

test.describe('WalletConnect-Only Flow (No Injected Provider)', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Delete window.ethereum and set WalletConnect mock before page nav
    await page.addInitScript(() => {
      delete (window as any).ethereum;
      (window as any).__MOCK_WALLETCONNECT__ = {
        address: '0x9999999999999999999999999999999999999999',
        chainId: 1,
      };
    });
    await page.goto('/');
  });

  test('should offer WalletConnect as primary option and successfully connect', async ({ page }) => {
    // 2. Open the wallet modal
    const connectButton = page.getByRole('button', { name: 'Connect Wallet' }).first();
    await expect(connectButton).toBeVisible();
    await connectButton.click();

    // Verify modal is open
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // MetaMask should not be clickable (rendered as a div without button role/tag)
    const metamaskOption = page.locator('button:has-text("MetaMask")');
    await expect(metamaskOption).not.toBeVisible();

    // Verify MetaMask is visible and has an install option
    await expect(page.getByText('MetaMask')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Install' }).first()).toBeVisible();

    // WalletConnect should be clickable and show "Installed" / "Available" badge (or no install link)
    const walletConnectOption = page.locator('button:has-text("WalletConnect")');
    await expect(walletConnectOption).toBeVisible();
    await expect(walletConnectOption).toBeEnabled();

    // Click WalletConnect option
    await walletConnectOption.click();

    // Assert a successful mock connection
    await expect(page.getByText('0x9999...9999')).toBeVisible();
  });
});
