# Ephemeral PR Preview Environments

## Overview

PropChain uses ephemeral preview environments for every pull request. Each PR gets:

- **Frontend Preview**: Deployed to Vercel with a unique preview URL
- **Backend Fork**: A Hardhat fork node for isolated blockchain state

This enables full-stack integration testing without affecting shared testnets.

## How It Works

1. **PR Opened / Updated**: GitHub Actions triggers the preview workflow
2. **Hardhat Fork**: Spawns an isolated Hardhat node at `http://preview-fork:8545`
3. **Vercel Preview**: Deploys the frontend with `NEXT_PUBLIC_PREVIEW_FORK_URL` pointing to the fork
4. **Comment**: A GitHub bot posts the preview URL in the PR
5. **PR Closed**: Both the Vercel deployment and Hardhat fork are destroyed

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  GitHub PR   │────▶│ GitHub Actions   │────▶│  Vercel Preview │
│  (Webhook)   │     │  (preview.yml)   │     │  (Frontend)     │
└──────────────┘     └────────┬─────────┘     └────────┬────────┘
                              │                        │
                              ▼                        ▼
                     ┌──────────────────┐    ┌─────────────────┐
                     │  Hardhat Fork    │◀───│  wagmi config   │
                     │  (preview-fork)  │    │  transports     │
                     └──────────────────┘    └─────────────────┘
```

## Wagmi Configuration

The `src/config/wagmi.ts` file adds a `hardhatPreview` chain (chain ID `31338`) when `NEXT_PUBLIC_PREVIEW_FORK_URL` is set:

```typescript
const hardhatPreview = defineChain({
  id: 31338,
  name: "Hardhat Preview Fork",
  rpcUrls: {
    default: { http: ["http://preview-fork:8545"] },
  },
});
```

## Required Secrets

- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID
- `VERCEL_TOKEN`: Vercel personal access token

## Workflow File

`.github/workflows/preview.yml`

| Trigger | Action |
|---------|--------|
| PR opened/synced/reopened | Deploy preview + comment URL |
| PR closed | Destroy preview + comment teardown |
