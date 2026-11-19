import { test, expect, setupWalletMock } from '../../tests/fixtures';

/**
 * Staking flow E2E tests.
 *
 * The app has no standalone "staking rewards calculator". The closest real
 * behaviour is the StakingModal opened from the "Staking & Yield" tab of
 * /dashboard: amount input, lock-period slider, a live estimated-APY /
 * bonus-APY projection and a confirmation step. These tests cover that flow.
 *
 * Expected values come from the modal's formula:
 *   projectedApy = baseApy * (1 + (lockMonths / 12) * 0.5), shown to 1 decimal
 * with the default token "Manhattan Tower Suite" (MTS, 12.5% APY, 1200 balance).
 */
test.describe('Staking modal reward projection', () => {
  test.beforeEach(async ({ page }) => {
    await setupWalletMock(page);
    await page.goto('/dashboard');
    await page.getByRole('tab', { name: /staking & yield/i }).click();
    await page.getByRole('button', { name: /new stake/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('shows default lock period and projected APY', async ({ page }) => {
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Lock Period: 3 Months')).toBeVisible();
    await expect(dialog.getByText('14.1%')).toBeVisible();
    await expect(dialog.getByText('+1.6% Bonus APY')).toBeVisible();
  });

  test('entering an amount and using MAX fills the stake amount', async ({ page }) => {
    const dialog = page.getByRole('dialog');
    const amount = dialog.getByLabel(/amount to stake/i);

    await amount.fill('250');
    await expect(amount).toHaveValue('250');

    await dialog.getByRole('button', { name: 'MAX' }).click();
    await expect(amount).toHaveValue('1200');
  });

  test('changing the lock period updates the projected APY', async ({ page }) => {
    const dialog = page.getByRole('dialog');
    const thumb = dialog.getByRole('slider');

    await thumb.focus();
    await page.keyboard.press('End'); // 24 months -> 12.5 * 2 = 25.0%
    await expect(dialog.getByText('Lock Period: 24 Months')).toBeVisible();
    await expect(dialog.getByText('25.0%')).toBeVisible();
    await expect(dialog.getByText('+12.5% Bonus APY')).toBeVisible();

    await page.keyboard.press('Home'); // 1 month -> 13.0%
    await expect(dialog.getByText('Lock Period: 1 Months')).toBeVisible();
    await expect(dialog.getByText('13.0%')).toBeVisible();
  });

  test('selecting a different token updates the max balance', async ({ page }) => {
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /sunset beach villa/i }).click();
    await expect(dialog.getByText('Max: 540 SBV')).toBeVisible();
  });

  test('review step formats the amount and value, and Back keeps input step', async ({ page }) => {
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'MAX' }).click();
    await dialog.getByRole('button', { name: /review staking/i }).click();

    await expect(dialog.getByText('1200 MTS')).toBeVisible();
    await expect(dialog.getByText('Value: ~$300,000')).toBeVisible();
    await expect(dialog.getByText('3 Months')).toBeVisible();

    await dialog.getByRole('button', { name: /^back$/i }).click();
    await expect(dialog.getByLabel(/amount to stake/i)).toHaveValue('1200');
  });

  test('cancel and reopen resets the calculator state', async ({ page }) => {
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/amount to stake/i).fill('100');
    await dialog.getByRole('slider').focus();
    await page.keyboard.press('End');

    await dialog.getByRole('button', { name: /^cancel$/i }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    await page.getByRole('button', { name: /new stake/i }).click();
    const reopened = page.getByRole('dialog');
    await expect(reopened.getByLabel(/amount to stake/i)).toHaveValue('');
    await expect(reopened.getByText('Lock Period: 3 Months')).toBeVisible();
  });
});
