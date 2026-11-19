import { test, expect } from '../../tests/fixtures';

/**
 * Governance proposal viewing + voting, focused on what
 * tests/e2e/governance-voting.spec.ts does not assert: proposal details,
 * the vote-breakdown results updating after a vote, and ended proposals.
 *
 * Mock data on /governance (src/app/governance/page.tsx):
 *   prop-1 (active): yes 18500 / no 4200 / abstain 1300
 *   prop-3 (passed): yes 22000 / no 5000 / abstain 3000
 * Each vote carries a fixed 500-token weight.
 *
 * The page has no separate proposal detail route; details are shown inline
 * on each card. There are only yes/no/abstain choices (no "for/against").
 */
test.describe('Governance proposal details and results', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/governance');
  });

  test('active proposal card shows its details inline', async ({ page }) => {
    const card = page.getByRole('article', { name: /rooftop solar panel/i });
    await expect(card.getByText('Active', { exact: true })).toBeVisible();
    await expect(card.getByText('Luxury Downtown Penthouse')).toBeVisible();
    await expect(card.getByText(/payback period/i)).toBeVisible();
    await expect(card.getByText(/proposed by 0xAbCd\.\.\.1234/i)).toBeVisible();
    await expect(card.getByText('Remaining')).toBeVisible();
  });

  test('vote breakdown updates after voting yes', async ({ page }) => {
    const card = page.getByRole('article', { name: /rooftop solar panel/i });
    const bar = card.getByRole('img', { name: /vote breakdown/i });
    await expect(bar).toHaveAttribute(
      'aria-label',
      'Vote breakdown: 77.1% yes, 17.5% no, 5.4% abstain',
    );

    await card.getByRole('button', { name: /^yes$/i }).click();

    await expect(card.getByRole('status')).toContainText(/you voted yes with 500 tokens/i);
    await expect(bar).toHaveAttribute(
      'aria-label',
      'Vote breakdown: 77.6% yes, 17.1% no, 5.3% abstain',
    );
  });

  test('changing vote to no shifts the breakdown from yes to no', async ({ page }) => {
    const card = page.getByRole('article', { name: /rooftop solar panel/i });
    await card.getByRole('button', { name: /^yes$/i }).click();
    await card.getByRole('button', { name: /^no$/i }).click();

    await expect(card.getByRole('img', { name: /vote breakdown/i })).toHaveAttribute(
      'aria-label',
      'Vote breakdown: 75.5% yes, 19.2% no, 5.3% abstain',
    );
  });

  test('ended proposal shows final results and cannot be voted on', async ({ page }) => {
    const card = page.getByRole('article', { name: /short-term rental program/i });
    await expect(card.getByText('Passed', { exact: true })).toBeVisible();
    await expect(card.getByText('Ended')).toBeVisible();
    await expect(card.getByRole('img', { name: /vote breakdown/i })).toHaveAttribute(
      'aria-label',
      'Vote breakdown: 73.3% yes, 16.7% no, 10.0% abstain',
    );

    await expect(card.getByRole('button', { name: /^(yes|no|abstain)$/i })).toHaveCount(0);
    await expect(card.getByText(/cast your vote/i)).toHaveCount(0);
  });
});
