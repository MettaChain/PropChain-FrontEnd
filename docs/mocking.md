# Mocking and Local Overrides

This document outlines environment variables and other mechanisms available to override default application behavior for local development, testing, and design review.

## Wallet Mocking

To facilitate development and testing without requiring a live wallet connection (e.g., MetaMask), you can enable a mock wallet provider.

### `NEXT_PUBLIC_MOCK_WALLET`

- **Values**: `true` | `false` (default)
- **Description**: When set to `true`, the application will use a mock wallet provider that simulates a connected wallet. This is useful for developers, designers, or QA who need to interact with the application without connecting their own wallet.
- **Dev-only**: This flag is **ignored in production builds**. The mock connector is only activated when `NODE_ENV !== "production"`, so `NEXT_PUBLIC_MOCK_WALLET=true` can never enable the mock in a `next build` production bundle.
- **No committed key**: The mock signs with a randomly generated, per-session private key (created fresh on each page load) instead of a hardcoded key, so there is no long-lived secret that could sign real-looking transactions if the mock ever leaked into a non-dev environment.

**Example `env.local`:**

```
NEXT_PUBLIC_MOCK_WALLET=true
```

**Example `env.production` (must be false/unset):**

```
NEXT_PUBLIC_MOCK_WALLET=false
```
