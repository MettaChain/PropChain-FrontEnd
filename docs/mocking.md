# Mocking and Local Overrides

This document outlines environment variables and other mechanisms available to override default application behavior for local development, testing, and design review.

## Wallet Mocking

To facilitate development and testing without requiring a live wallet connection (e.g., MetaMask), you can enable a mock wallet provider.

### `NEXT_PUBLIC_MOCK_WALLET`

- **Values**: `true` | `false` (default)
- **Description**: When set to `true`, the application will use a mock wallet provider that simulates a connected wallet with a pre-defined address and balance. This is useful for developers, designers, or QA who need to interact with the application without connecting their own wallet.

**Example `env.local`:**

```
NEXT_PUBLIC_MOCK_WALLET=true
```
