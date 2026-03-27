import { test, expect } from '@playwright/test';

test.describe('Wallet Connection Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display connect wallet button when not connected', async ({ page }) => {
    const connectButton = page.getByRole('button', { name: 'Connect Wallet' });
    await expect(connectButton).toBeVisible();
    await expect(connectButton).toBeEnabled();
  });

  test('should open wallet modal when connect button is clicked', async ({ page }) => {
    const connectButton = page.getByRole('button', { name: 'Connect Wallet' });
    await connectButton.click();

    // Check that wallet modal opens
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Check that wallet options are displayed
    await expect(page.getByText('MetaMask')).toBeVisible();
    await expect(page.getByText('WalletConnect')).toBeVisible();
    await expect(page.getByText('Coinbase Wallet')).toBeVisible();
  });

  test('should close wallet modal when close button is clicked', async ({ page }) => {
    const connectButton = page.getByRole('button', { name: 'Connect Wallet' });
    await connectButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Click close button or overlay
    const closeButton = page.locator('[aria-label="Close"]').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      // Click outside modal
      await page.click('body', { position: { x: 0, y: 0 } });
    }

    await expect(modal).not.toBeVisible();
  });

  test('should show connecting state when wallet connection is initiated', async ({ page }) => {
    // Mock MetaMask connection
    await page.addInitScript(() => {
      (window as any).ethereum = {
        isMetaMask: true,
        request: async ({ method }: { method: string }) => {
          if (method === 'eth_requestAccounts') {
            // Simulate user approval delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            return ['0x1234567890123456789012345678901234567890'];
          }
          if (method === 'eth_chainId') {
            return '0x1'; // Ethereum mainnet
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
        isConnected: () => true,
      };
    });

    const connectButton = page.getByRole('button', { name: 'Connect Wallet' });
    await connectButton.click();

    // Click MetaMask option
    await page.getByText('MetaMask').click();

    // Check connecting state
    await expect(page.getByText('Connecting...')).toBeVisible();
    await expect(connectButton).toBeDisabled();
  });

  test('should display wallet info when successfully connected', async ({ page }) => {
    // Mock successful MetaMask connection
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
            return '0x152D02C7E14AF6800000'; // 100 ETH in wei
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
        isConnected: () => true,
      };
    });

    const connectButton = page.getByRole('button', { name: 'Connect Wallet' });
    await connectButton.click();

    await page.getByText('MetaMask').click();

    // Wait for connection to complete
    await expect(page.getByText('0x1234...7890')).toBeVisible();
    await expect(page.getByText('ETH')).toBeVisible();
    await expect(page.getByText('100.000')).toBeVisible(); // Balance

    // Disconnect button should be visible
    await expect(page.getByRole('button', { name: 'Disconnect' })).toBeVisible();
  });

  test('should handle connection errors gracefully', async ({ page }) => {
    // Mock MetaMask rejection
    await page.addInitScript(() => {
      (window as any).ethereum = {
        isMetaMask: true,
        request: async ({ method }: { method: string }) => {
          if (method === 'eth_requestAccounts') {
            throw new Error('User rejected the request');
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
        isConnected: () => false,
      };
    });

    const connectButton = page.getByRole('button', { name: 'Connect Wallet' });
    await connectButton.click();

    await page.getByText('MetaMask').click();

    // Should show error message
    await expect(page.getByText(/User rejected the request/)).toBeVisible();
    await expect(connectButton).toBeEnabled();
  });

  test('should disconnect wallet when disconnect button is clicked', async ({ page }) => {
    // Mock connected wallet
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
            return '0x152D02C7E14AF6800000';
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
        isConnected: () => true,
      };
    });

    // Connect first
    const connectButton = page.getByRole('button', { name: 'Connect Wallet' });
    await connectButton.click();
    await page.getByText('MetaMask').click();

    // Wait for connection
    await expect(page.getByText('0x1234...7890')).toBeVisible();

    // Disconnect
    const disconnectButton = page.getByRole('button', { name: 'Disconnect' });
    await disconnectButton.click();

    // Should show connect button again
    await expect(page.getByRole('button', { name: 'Connect Wallet' })).toBeVisible();
    await expect(page.getByText('0x1234...7890')).not.toBeVisible();
  });

  test('should handle network switching', async ({ page }) => {
    // Mock wallet with network switching
    await page.addInitScript(() => {
      (window as any).ethereum = {
        isMetaMask: true,
        request: async ({ method }: { method: string }) => {
          if (method === 'eth_requestAccounts') {
            return ['0x1234567890123456789012345678901234567890'];
          }
          if (method === 'eth_chainId') {
            return '0x1'; // Start with Ethereum
          }
          if (method === 'wallet_switchEthereumChain') {
            return null; // Success
          }
          if (method === 'eth_getBalance') {
            return '0x152D02C7E14AF6800000';
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
        isConnected: () => true,
      };
    });

    // Connect wallet
    const connectButton = page.getByRole('button', { name: 'Connect Wallet' });
    await connectButton.click();
    await page.getByText('MetaMask').click();

    await expect(page.getByText('0x1234...7890')).toBeVisible();

    // Look for network switcher
    const networkSwitcher = page.locator('[data-testid="network-switcher"]');
    if (await networkSwitcher.isVisible()) {
      await networkSwitcher.click();
      
      // Should show network options
      await expect(page.getByText('Ethereum')).toBeVisible();
      await expect(page.getByText('Polygon')).toBeVisible();
      await expect(page.getByText('Binance Smart Chain')).toBeVisible();

      // Switch to Polygon
      await page.getByText('Polygon').click();

      // Should update network display
      await expect(page.getByText('MATIC')).toBeVisible();
    }
  });

  test('should handle wallet not installed', async ({ page }) => {
    // Mock no wallet installed
    await page.addInitScript(() => {
      delete (window as any).ethereum;
    });

    const connectButton = page.getByRole('button', { name: 'Connect Wallet' });
    await connectButton.click();

    // Should still show wallet options
    await expect(page.getByText('MetaMask')).toBeVisible();
    
    // When MetaMask is clicked, should show install prompt
    await page.getByText('MetaMask').click();
    
    // Check for install message or redirect
    const installMessage = page.getByText(/install/i).or(page.getByText(/download/i));
    await expect(installMessage).toBeVisible({ timeout: 5000 });
  });
});
