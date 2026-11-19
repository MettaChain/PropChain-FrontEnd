import { test, expect } from '@playwright/test';

/**
 * Property comparison flow. The selection is seeded into the persisted compare
 * store (localStorage key `propchain-compare`, version 2) so the test does not
 * depend on API data, then exercises the real /compare page.
 */
const makeProperty = (id: string, name: string, roi: number) => ({
  id,
  name,
  description: `${name} description`,
  location: { city: 'Austin', state: 'TX' },
  price: { total: 500000, perToken: 100 },
  propertyType: 'residential',
  blockchain: 'ethereum',
  tokenInfo: { available: 1000 },
  metrics: { roi, annualReturn: 40000 },
  details: { bedrooms: 3, bathrooms: 2, squareFeet: 1800 },
  images: ['/placeholder.png'],
  listedDate: '2024-01-01',
  status: 'active',
});

const properties = [
  makeProperty('cmp-1', 'Compare Alpha', 8),
  makeProperty('cmp-2', 'Compare Beta', 10),
];

test.describe('Property comparison flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate((props) => {
      localStorage.setItem(
        'propchain-compare',
        JSON.stringify({
          state: {
            selectedIds: props.map((p) => p.id),
            propertyCache: Object.fromEntries(props.map((p) => [p.id, p])),
            history: [],
          },
          version: 2,
        }),
      );
    }, properties);
  });

  test('renders the comparison table for the selected properties', async ({ page }) => {
    await page.goto('/compare');

    await expect(page.getByRole('heading', { name: 'Property Comparison' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Compare Alpha' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Compare Beta' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'ROI' })).toBeVisible();
    // The higher ROI is flagged as best.
    await expect(page.getByText('Best').first()).toBeVisible();
  });

  test('keeps the comparison after a page reload', async ({ page }) => {
    await page.goto('/compare');
    await expect(page.getByRole('heading', { name: 'Compare Alpha' })).toBeVisible();

    await page.reload();

    await expect(page.getByRole('heading', { name: 'Compare Alpha' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Compare Beta' })).toBeVisible();
  });

  test('clears the comparison', async ({ page }) => {
    await page.goto('/compare');

    await page.getByRole('button', { name: 'Clear Comparison' }).click();

    await expect(page.getByRole('heading', { name: 'No Properties to Compare' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'No Properties to Compare' })).toBeVisible();
  });
});
