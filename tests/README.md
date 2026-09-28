# PropChain Testing Guide

This directory contains the automated end-to-end (E2E), integration, and accessibility test suites for PropChain FrontEnd using Playwright.

---

## Canonical Playwright Fixtures (`tests/fixtures/index.ts`)

All Playwright specs should import `test` and `expect` from `tests/fixtures` (or relative `../fixtures` or `./fixtures`) rather than importing directly from `@playwright/test`.

### Exported Fixtures & Helpers

- **`test`**: Extended Playwright test runner providing built-in fixtures:
  - **`wallet`**: Sets up a mocked Web3 Ethereum provider (`window.ethereum`) pre-configured with default or custom addresses, chain ID, and mock signing methods (`eth_requestAccounts`, `eth_accounts`, `eth_chainId`, `personal_sign`, etc.).
  - **`api`**: Intercepts and stubs backend API requests (`/api/properties`, `/api/properties/:id`, `/api/properties/:id/purchase`, `/api/transactions`, `/api/test`) with deterministic mock responses.
  - **`walletMswFixture`**: Combined fixture combining both wallet mock and API route mocks.
- **`expect`**: Re-exported Playwright `expect` with all standard matchers.
- **`setupWalletMock(page, options?)`**: Programmatic helper to inject a mocked Ethereum provider into any page context.
  - Options: `address`, `chainId`, `balance`, `shouldReject`, `isMetaMask`, `delay`, `noWallet`.
- **`setupApiMock(page)`**: Programmatic helper to register API routes for properties and transactions.

### Usage Example

```typescript
import { test, expect } from '../fixtures';

test.describe('My Feature Flow', () => {
  test('uses wallet and api mocks', async ({ page, wallet, api }) => {
    await page.goto('/properties');
    await expect(page.getByTestId('property-card')).toBeVisible();
  });
});
```

---

## E2E Test Suites (`tests/e2e/`)

| Test File | Description | Fixtures Used |
|-----------|-------------|---------------|
| `saved-searches.spec.ts` | Covers creating, listing, running/restoring, and deleting saved searches on dashboard, persistence across reload, and fallback on corrupted storage. | `wallet`, `api` |
| `wallet-connection.spec.ts` | Verifies wallet connection modal, MetaMask, WalletConnect, network switching, and session restore across page reload. | `wallet` |
| `property-purchase-flow.spec.ts` | End-to-end investment/purchase flow from property details through token selection and confirmation. | `wallet`, `api` |
| `property-purchase.spec.ts` | Property listing search, filter by price range and location, and purchase confirmation. | `setupWalletMock`, `setupApiMock` |
| `purchase-confirmation.spec.ts` | Detailed verification of purchase confirmation modal and transaction states. | `wallet`, `api` |
| `referral-leaderboard.spec.ts` | Referral share link generation and leaderboard ranking table verification. | `setupWalletMock` |
| `property-alerts.spec.ts` | Price alert creation, threshold validation, and reload persistence. | `test`, `expect` |
| `governance-voting.spec.ts` | Governance proposal listing, voting choices, token weight changes, and accessible live regions. | `test`, `expect` |
| `transaction-history.spec.ts` | Filtering transaction rows, status filtering, and CSV export download. | `test`, `expect` |
| `onboarding-tour.spec.ts` | Onboarding dialog focus trapping, keyboard navigation, and axe-core accessibility checks. | `test`, `expect` |
| `csp.spec.ts` | Content Security Policy headers, nonces, and report-only validation. | `test`, `expect` |
| `msw-verification.spec.ts` | Verifies API mock handlers for test, property, and purchase endpoints. | `api` |
| `accessibility.spec.ts` | Automated axe-core accessibility scans across primary site routes. | `test`, `expect` |
| `visual-regression.spec.ts` | Visual baseline and screenshot regression comparisons. | `setupWalletMock` |

---

## Running Tests

### Unit & Integration Tests (Jest)
```bash
npm test
```

### E2E Tests (Playwright)
```bash
# Run all E2E specs
npx playwright test

# Run a specific spec
npx playwright test tests/e2e/saved-searches.spec.ts

# Run with UI mode
npx playwright test --ui
```
