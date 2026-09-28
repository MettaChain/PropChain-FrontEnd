import { test, expect } from '../fixtures';

const MOCK_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
const SAVED_SEARCHES_STORAGE_KEY = `propchain:savedSearches:${MOCK_ADDRESS}`;

test.describe('Dashboard Saved Searches Flow', () => {
  test.beforeEach(async ({ page, wallet, api }) => {
    // Prime wallet persistence so user is already connected across pages
    await page.addInitScript(({ address }) => {
      window.localStorage.setItem(
        'propchain-wallet-state',
        JSON.stringify({
          state: {
            address,
            chainId: 1,
            isConnected: true,
            connectorType: 'metamask',
            lastConnected: Date.now(),
          },
          version: 1,
        })
      );
      // Clear any prior saved searches
      window.localStorage.removeItem(`propchain:savedSearches:${address}`);
    }, { address: MOCK_ADDRESS });
  });

  test('displays empty state when user has no saved searches', async ({ page }) => {
    await page.goto('/dashboard/saved-searches');

    await expect(page.getByTestId('empty-saved-searches')).toBeVisible();
    await expect(page.getByText(/no saved searches yet/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /browse properties/i })).toBeVisible();
  });

  test('complete flow: apply filters, save search, verify list, reload persistence, run search, and delete', async ({ page }) => {
    // 1. Navigate to properties with filter query
    await page.goto('/properties?query=Penthouse');

    // 2. Open Save Search dialog
    const saveSearchBtn = page.getByRole('button', { name: /save search/i }).first();
    await expect(saveSearchBtn).toBeVisible();
    await saveSearchBtn.click();

    // 3. Fill and submit save search modal
    const nameInput = page.locator('#search-name');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('My NYC Penthouse Search');

    const submitBtn = page.getByRole('button', { name: 'Save Search' }).last();
    await submitBtn.click();

    // Modal should close
    await expect(page.locator('#search-name')).toBeHidden();

    // 4. Navigate to dashboard saved-searches and verify listing
    await page.goto('/dashboard/saved-searches');

    await expect(page.getByTestId('saved-searches-grid')).toBeVisible();
    await expect(page.getByText('My NYC Penthouse Search')).toBeVisible();

    // 5. Verify persistence across page reload
    await page.reload();
    await expect(page.getByTestId('saved-searches-grid')).toBeVisible();
    await expect(page.getByText('My NYC Penthouse Search')).toBeVisible();

    // 6. Run saved search (clicking View navigates back to properties with restored filters)
    const viewBtn = page.getByRole('link', { name: /view/i }).first();
    await expect(viewBtn).toBeVisible();
    await viewBtn.click();

    await expect(page).toHaveURL(/\/properties.*query=Penthouse/);

    // 7. Delete saved search
    await page.goto('/dashboard/saved-searches');
    await expect(page.getByText('My NYC Penthouse Search')).toBeVisible();

    // Click trash button to trigger confirmation modal
    const trashBtn = page.locator('button:has(svg.lucide-trash-2)').first();
    await trashBtn.click();

    const deleteConfirmBtn = page.getByRole('button', { name: 'Delete' });
    await expect(deleteConfirmBtn).toBeVisible();
    await deleteConfirmBtn.click();

    // Confirm search was deleted and empty state appears
    await expect(page.getByText('My NYC Penthouse Search')).toBeHidden();
    await expect(page.getByTestId('empty-saved-searches')).toBeVisible();
  });

  test('gracefully handles corrupted localStorage data without crashing', async ({ page }) => {
    // Inject corrupt JSON into storage
    await page.addInitScript(({ key }) => {
      window.localStorage.setItem(key, '{ invalid json corrupt: true');
    }, { key: SAVED_SEARCHES_STORAGE_KEY });

    await page.goto('/dashboard/saved-searches');

    // Page must not crash and fallback to empty state
    await expect(page.getByTestId('empty-saved-searches')).toBeVisible();
    await expect(page.getByText(/no saved searches yet/i)).toBeVisible();
  });

  test('prompts to connect wallet if user is disconnected', async ({ page }) => {
    // Clear wallet state
    await page.addInitScript(() => {
      window.localStorage.removeItem('propchain-wallet-state');
    });

    await page.goto('/dashboard/saved-searches');

    // Disconnected state prompt
    await expect(page.getByText(/connect your wallet/i)).toBeVisible();
  });
});
