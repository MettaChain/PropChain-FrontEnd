import { test, expect } from '@playwright/test';

/**
 * Governance Voting E2E Tests
 * Covers: proposal listing, voting flow, and vote confirmation feedback.
 */

test.describe('Governance voting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/governance');
  });

  // ── Proposal listing ──────────────────────────────────────────────────────

  test('displays the governance page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /governance/i })).toBeVisible();
  });

  test('lists multiple proposals', async ({ page }) => {
    const proposals = page.locator('article');
    await expect(proposals).toHaveCount(3);
  });

  test('shows proposal title and description', async ({ page }) => {
    await expect(
      page.getByText('Approve Rooftop Solar Panel Installation'),
    ).toBeVisible();
    await expect(
      page.getByText(/reduce energy costs/i),
    ).toBeVisible();
  });

  test('shows proposal status badges', async ({ page }) => {
    // At least one "Active" badge should be visible
    const activeBadge = page.getByText('Active').first();
    await expect(activeBadge).toBeVisible();
  });

  test('shows vote participation stats for each proposal', async ({ page }) => {
    // Each card displays "Votes Cast" and "Participation"
    const votesCastLabels = page.getByText('Votes Cast');
    await expect(votesCastLabels.first()).toBeVisible();

    const participationLabels = page.getByText('Participation');
    await expect(participationLabels.first()).toBeVisible();
  });

  test('shows vote percentage bar for proposals', async ({ page }) => {
    const voteBars = page.getByRole('img', { name: /vote breakdown/i });
    await expect(voteBars.first()).toBeVisible();
  });

  // ── Status filter ─────────────────────────────────────────────────────────

  test('can filter proposals by "active" status', async ({ page }) => {
    const activeFilterBtn = page.getByRole('button', { name: /^active$/i });
    await activeFilterBtn.click();

    // After filtering, only active proposals should render
    const proposals = page.locator('article');
    const count = await proposals.count();
    expect(count).toBeGreaterThan(0);

    // Every visible status badge should be "Active"
    const statusBadges = page.locator('article span').filter({ hasText: /^Active$/ });
    await expect(statusBadges).toHaveCount(count);
  });

  test('can filter proposals by "passed" status', async ({ page }) => {
    const passedFilterBtn = page.getByRole('button', { name: /^passed$/i });
    await passedFilterBtn.click();

    const proposals = page.locator('article');
    await expect(proposals).toHaveCount(1);
    await expect(page.getByText('Approve Short-Term Rental Program')).toBeVisible();
  });

  test('"all" filter shows all proposals', async ({ page }) => {
    // First switch to a narrow filter
    await page.getByRole('button', { name: /^passed$/i }).click();
    // Then back to "All"
    await page.getByRole('button', { name: /^all$/i }).click();

    const proposals = page.locator('article');
    await expect(proposals).toHaveCount(3);
  });

  // ── Voting flow ───────────────────────────────────────────────────────────

  test('voting buttons are present on active proposals', async ({ page }) => {
    const firstActiveCard = page.locator('article').first();
    const yesBtn = firstActiveCard.getByRole('button', { name: /^yes$/i });
    await expect(yesBtn).toBeVisible();
    await expect(firstActiveCard.getByRole('button', { name: /^no$/i })).toBeVisible();
    await expect(firstActiveCard.getByRole('button', { name: /^abstain$/i })).toBeVisible();
  });

  test('casting a "yes" vote shows confirmation text', async ({ page }) => {
    const firstActiveCard = page.locator('article').first();
    await firstActiveCard.getByRole('button', { name: /^yes$/i }).click();

    await expect(firstActiveCard.getByRole('status')).toContainText(/you voted/i);
    await expect(firstActiveCard.getByRole('status')).toContainText(/yes/i);
  });

  test('casting a "no" vote shows confirmation text', async ({ page }) => {
    const firstActiveCard = page.locator('article').first();
    await firstActiveCard.getByRole('button', { name: /^no$/i }).click();

    await expect(firstActiveCard.getByRole('status')).toContainText(/you voted/i);
    await expect(firstActiveCard.getByRole('status')).toContainText(/no/i);
  });

  test('casting an "abstain" vote shows confirmation text', async ({ page }) => {
    const firstActiveCard = page.locator('article').first();
    await firstActiveCard.getByRole('button', { name: /^abstain$/i }).click();

    await expect(firstActiveCard.getByRole('status')).toContainText(/abstain/i);
  });

  test('vote button is marked as pressed after voting', async ({ page }) => {
    const firstActiveCard = page.locator('article').first();
    const yesBtn = firstActiveCard.getByRole('button', { name: /^yes$/i });
    await yesBtn.click();

    await expect(yesBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('vote counts update after casting a vote', async ({ page }) => {
    const firstActiveCard = page.locator('article').first();

    // Read initial "Votes Cast" value
    const statBox = firstActiveCard.locator('text=Votes Cast').locator('..');
    const initialText = await statBox.locator('p.font-semibold').textContent();
    const initialCount = Number(initialText?.replace(/,/g, '') ?? '0');

    await firstActiveCard.getByRole('button', { name: /^yes$/i }).click();

    const updatedText = await statBox.locator('p.font-semibold').textContent();
    const updatedCount = Number(updatedText?.replace(/,/g, '') ?? '0');

    expect(updatedCount).toBe(initialCount + 500);
  });

  test('changing vote moves token weight from old choice to new choice', async ({ page }) => {
    const firstActiveCard = page.locator('article').first();

    // Vote yes first
    await firstActiveCard.getByRole('button', { name: /^yes$/i }).click();
    // Then change to no
    await firstActiveCard.getByRole('button', { name: /^no$/i }).click();

    // Confirmation should reflect latest vote
    await expect(firstActiveCard.getByRole('status')).toContainText(/no/i);
    const yesBtn = firstActiveCard.getByRole('button', { name: /^yes$/i });
    await expect(yesBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(firstActiveCard.getByRole('button', { name: /^no$/i })).toHaveAttribute('aria-pressed', 'true');
  });

  // ── Passed proposals ──────────────────────────────────────────────────────

  test('passed proposals do not show voting buttons', async ({ page }) => {
    await page.getByRole('button', { name: /^passed$/i }).click();

    const passedCard = page.locator('article').first();
    await expect(passedCard.getByRole('button', { name: /^yes$/i })).not.toBeVisible();
  });

  // ── Accessibility ─────────────────────────────────────────────────────────

  test('vote confirmation has aria-live region', async ({ page }) => {
    const firstActiveCard = page.locator('article').first();
    await firstActiveCard.getByRole('button', { name: /^yes$/i }).click();

    const liveRegion = firstActiveCard.getByRole('status');
    await expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });

  test('proposal cards have accessible article labels', async ({ page }) => {
    const articles = page.locator('article[aria-labelledby]');
    const count = await articles.count();
    expect(count).toBe(3);
  });
});
