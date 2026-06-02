# Smart Contract Integration Guide

This document describes how the PropChain frontend integrates with smart contracts.

## Contract Addresses

Contract addresses are configured per network in `src/config/chains.ts`. The supported networks are:

| Network | Chain ID | Explorer |
|---------|----------|----------|
| Ethereum Mainnet | 1 | https://etherscan.io |
| Polygon | 137 | https://polygonscan.com |
| Binance Smart Chain | 56 | https://bscscan.com |

Set contract addresses via environment variables:

```env
NEXT_PUBLIC_PROPERTY_NFT_ADDRESS=0x...
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x...
NEXT_PUBLIC_STAKING_ADDRESS=0x...
```

## ABI Files

ABI files live in `src/lib/abis/`. To update an ABI after a contract upgrade:

1. Export the ABI from your Hardhat/Foundry build artifacts.
2. Place the JSON file in `src/lib/abis/<ContractName>.json`.
3. Import it where needed:

```ts
import PropertyNFT from '@/lib/abis/PropertyNFT.json';
```

## Event Listeners

The frontend subscribes to contract events using `wagmi`'s `useWatchContractEvent` hook. Key events and their handlers:

| Event | Contract | Handler location |
|-------|----------|-----------------|
| `Transfer` | PropertyNFT | `src/hooks/useTransaction.ts` |
| `PropertyListed` | Marketplace | `src/hooks/usePropertySearch.ts` |
| `PropertySold` | Marketplace | `src/store/transactionStore.ts` |
| `RewardDistributed` | Staking | `src/hooks/useRewardDistribution.ts` |

Example listener setup:

```ts
import { useWatchContractEvent } from 'wagmi';
import PropertyNFT from '@/lib/abis/PropertyNFT.json';

useWatchContractEvent({
  address: process.env.NEXT_PUBLIC_PROPERTY_NFT_ADDRESS as `0x${string}`,
  abi: PropertyNFT,
  eventName: 'Transfer',
  onLogs(logs) {
    // handle transfer event
  },
});
```

## Transaction Flow

```
User action
  → useTransaction hook (src/hooks/useTransaction.ts)
  → wagmi writeContract / sendTransaction
  → TransactionProgress component shows status
  → On confirmation: update store + emit notification
  → On failure: error boundary + retry via useTxRetry
```

### Purchase flow

1. User clicks "Buy" on a property card.
2. `useTransaction` calls `writeContract` with the Marketplace ABI.
3. `TransactionProgress` (`src/components/TransactionProgress.tsx`) polls for receipt.
4. On success, `transactionStore` is updated and a notification is dispatched.
5. On failure, `useTxRetry` (`src/hooks/useTxRetry.ts`) handles automatic retries.

## Error Codes

Common contract revert reasons and how the frontend handles them:

| Revert reason | User-facing message | Handler |
|---------------|--------------------|---------| 
| `InsufficientFunds` | "Insufficient balance for this purchase" | `src/utils/errorFactory.ts` |
| `PropertyNotAvailable` | "This property is no longer available" | `src/utils/errorFactory.ts` |
| `KYCRequired` | "KYC verification required" | Redirects to KYC flow |
| `RateLimitExceeded` | "Too many requests, please wait" | `src/utils/security/rateLimiter.ts` |
| `Unauthorized` | "You are not authorized for this action" | `src/utils/errorHandling.ts` |

## Security Considerations

- All transaction parameters are validated client-side before submission (see `src/utils/security/blockchainSecurity.ts`).
- High-value transactions trigger an additional confirmation step via `TransactionConfirmation` component.
- All contract interactions are logged via `auditLogger` (see `src/utils/security/auditLogger.ts`).
- Phishing protection checks the current domain before any wallet interaction (see `src/utils/security/phishingProtection.ts`).
