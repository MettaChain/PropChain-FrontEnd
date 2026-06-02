# Referral System Implementation Guide

## Overview

The PropChain Referral System is a comprehensive on-chain reward distribution platform that enables users to earn tokens by referring new investors to the platform. This guide provides detailed instructions for integrating and using the system.

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Usage](#usage)
6. [Backend Integration](#backend-integration)
7. [Smart Contract Integration](#smart-contract-integration)
8. [API Endpoints](#api-endpoints)
9. [Frontend Components](#frontend-components)
10. [Testing](#testing)

## Features

### Core Features

- **Unique Referral Links**: Each wallet address gets a unique referral link for tracking
- **Click Tracking**: Track clicks on referral links
- **Conversion Tracking**: Track signup conversions from clicks
- **Reward Distribution**: Automatic token rewards for successful referrals
- **On-Chain Rewards**: Direct smart contract-based reward distribution
- **Leaderboard**: Real-time ranking of top referrers
- **Multi-Tier System**: Reward multipliers based on referral volume

### Reward Tiers

| Tier | Signups | Multiplier | Badge |
|------|---------|-----------|-------|
| Bronze | 0-10 | 1x | 🥉 |
| Silver | 11-50 | 1.1x | 🥈 |
| Gold | 51-100 | 1.25x | 🥇 |
| Platinum | 100+ | 1.5x | 👑 |

## Architecture

### File Structure

```
src/
├── types/
│   └── referral.ts                    # Type definitions
├── store/
│   └── referralStore.ts              # Zustand state management
├── lib/
│   └── referralService.ts            # API integration layer
├── hooks/
│   └── useRewardDistribution.ts       # Reward distribution hooks
├── components/referral/
│   ├── ReferralDashboard.tsx          # Main dashboard
│   ├── ReferralLeaderboard.tsx        # Leaderboard component
│   ├── ReferralLinksCard.tsx          # Referral links management
│   ├── ReferralStatsCard.tsx          # Statistics display
│   ├── RewardsDisplay.tsx             # Rewards listing
│   ├── QuickStats.tsx                 # Quick stats overview
│   ├── ReferralTermsPage.tsx          # Terms & conditions
│   ├── CopyButton.tsx                 # Utility component
│   ├── ShareButton.tsx                # Utility component
│   ├── CreateReferralLinkModal.tsx    # Modal for link creation
│   └── ClaimRewardsModal.tsx          # Modal for claiming
├── config/
│   └── referralContracts.ts           # Contract ABIs & addresses
└── app/referral/
    ├── page.tsx                       # Dashboard page
    ├── leaderboard/page.tsx           # Leaderboard page
    └── terms/page.tsx                 # Terms page
```

### Data Flow

```
User Dashboard
    ↓
useReferralStore (Zustand)
    ↓
referralService (API calls)
    ↓
Backend API
    ↓
Database + Smart Contracts
```

## Installation

### Prerequisites

- Node.js 18+
- Next.js 15+
- Wagmi 2+
- Zustand 4+

### Setup Steps

1. **No additional installation required** - All necessary files have been created

2. **Verify imports** in your main layout:

```typescript
// src/app/layout.tsx
import { useReferralStore } from '@/store/referralStore';
import { referralService } from '@/lib/referralService';
```

3. **Add environment variables** to `.env.local`:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Smart Contracts (update with actual addresses)
NEXT_PUBLIC_REFERRAL_CONTRACT_ADDRESS_ETHEREUM=0x...
NEXT_PUBLIC_REFERRAL_CONTRACT_ADDRESS_POLYGON=0x...
NEXT_PUBLIC_REFERRAL_CONTRACT_ADDRESS_BSC=0x...

# Reward Token
NEXT_PUBLIC_REWARD_TOKEN_ADDRESS_ETHEREUM=0x...
```

## Configuration

### Update Contract Addresses

Edit `src/config/referralContracts.ts`:

```typescript
export const REFERRAL_CONTRACT_ADDRESSES: Record<number, string> = {
  1: '0x...', // Ethereum
  137: '0x...', // Polygon
  56: '0x...', // BSC
};

export const REWARD_TOKEN_ADDRESSES: Record<number, string> = {
  1: '0x...', // Ethereum
  137: '0x...', // Polygon
  56: '0x...', // BSC
};
```

### API Endpoints Configuration

Update `src/lib/referralService.ts`:

```typescript
const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};
```

## Usage

### 1. Display Referral Dashboard

```tsx
import ReferralDashboard from '@/components/referral/ReferralDashboard';

export default function Page() {
  return <ReferralDashboard showLeaderboard={true} />;
}
```

### 2. Display Leaderboard

```tsx
import ReferralLeaderboard from '@/components/referral/ReferralLeaderboard';

export default function Page() {
  return (
    <ReferralLeaderboard 
      limit={50} 
      sortBy="totalRewards" 
    />
  );
}
```

### 3. Access Referral Store

```tsx
import { useReferralStore } from '@/store/referralStore';

export default function Component() {
  const { currentStats, recentRewards } = useReferralStore();
  
  return (
    <div>
      <p>Total Rewards: {currentStats?.totalRewardsEarned}</p>
    </div>
  );
}
```

### 4. Use Reward Distribution Hook

```tsx
import { useRewardDistribution } from '@/hooks/useRewardDistribution';

export default function ClaimButton() {
  const { distributeRewards, isDistributing } = useRewardDistribution();
  
  const handleClaim = async () => {
    await distributeRewards('10.5', tokenAddress, chainId);
  };
  
  return (
    <button onClick={handleClaim} disabled={isDistributing}>
      {isDistributing ? 'Claiming...' : 'Claim Rewards'}
    </button>
  );
}
```

## Backend Integration

### Required Database Schema

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  created_at TIMESTAMP NOT NULL
);

-- Referral Links
CREATE TABLE referral_links (
  code VARCHAR(50) PRIMARY KEY,
  referrer_address VARCHAR(42) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  custom_name VARCHAR(100),
  FOREIGN KEY (referrer_address) REFERENCES users(wallet_address)
);

-- Referral Clicks
CREATE TABLE referral_clicks (
  id UUID PRIMARY KEY,
  referral_code VARCHAR(50) NOT NULL,
  clicked_at TIMESTAMP NOT NULL,
  user_agent TEXT,
  ip_address VARCHAR(45),
  FOREIGN KEY (referral_code) REFERENCES referral_links(code)
);

-- Referral Signups
CREATE TABLE referral_signups (
  id UUID PRIMARY KEY,
  referral_code VARCHAR(50) NOT NULL,
  referrer_address VARCHAR(42) NOT NULL,
  referee_address VARCHAR(42) NOT NULL,
  signup_date TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  FOREIGN KEY (referral_code) REFERENCES referral_links(code)
);

-- Rewards
CREATE TABLE rewards (
  id UUID PRIMARY KEY,
  referrer_address VARCHAR(42) NOT NULL,
  referee_address VARCHAR(42) NOT NULL,
  amount NUMERIC(38, 0) NOT NULL,
  token_address VARCHAR(42) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  chain_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  claimed_at TIMESTAMP,
  transaction_hash VARCHAR(66),
  FOREIGN KEY (referrer_address) REFERENCES users(wallet_address)
);

-- Leaderboard (materialized view for performance)
CREATE MATERIALIZED VIEW leaderboard AS
SELECT 
  referrer_address,
  COUNT(DISTINCT id) as total_signups,
  SUM(amount) as total_rewards_earned,
  MAX(created_at) as last_activity,
  ROW_NUMBER() OVER (ORDER BY SUM(amount) DESC) as rank
FROM rewards
WHERE status = 'completed'
GROUP BY referrer_address;
```

### Required API Endpoints

```
GET    /api/referrals/settings              # Get program settings
GET    /api/referrals/dashboard/:address    # Get complete dashboard
GET    /api/referrals/links/:address        # Get user's referral links
GET    /api/referrals/stats/:address        # Get user statistics
GET    /api/referrals/rewards/:address      # Get rewards
GET    /api/referrals/leaderboard          # Get leaderboard
GET    /api/referrals/verify/:code         # Verify referral code
POST   /api/referrals/links                # Create referral link
POST   /api/referrals/track-click          # Track click
POST   /api/referrals/record-signup        # Record signup
POST   /api/referrals/rewards/claim        # Claim rewards
POST   /api/referrals/terms/accept         # Accept terms
```

## Smart Contract Integration

### Solidity Contract Example

```solidity
pragma solidity ^0.8.0;

interface IReferralRewards {
    function claimRewards(uint256[] calldata rewardIds) external returns (uint256);
    function addReward(
        address referrer,
        uint256 amount,
        address token,
        address referee
    ) external returns (uint256);
}
```

### Contract Addresses

Update contract addresses in `src/config/referralContracts.ts` after deployment.

## API Endpoints

### Create Referral Link

```bash
POST /api/referrals/links
Content-Type: application/json

{
  "referrerId": "0x123...",
  "customName": "Twitter Campaign"
}

Response:
{
  "code": "abc123",
  "url": "https://propchain.io?ref=abc123",
  "shortUrl": "https://pch.io/abc123"
}
```

### Track Referral Click

```bash
POST /api/referrals/track-click
Content-Type: application/json

{
  "referralCode": "abc123",
  "referrerAddress": "0x123..."
}
```

### Record Signup

```bash
POST /api/referrals/record-signup
Content-Type: application/json

{
  "referralCode": "abc123",
  "referrerAddress": "0x123...",
  "refereeAddress": "0x456...",
  "chainId": 1
}

Response:
{
  "success": true,
  "rewardAmount": "100000000000000000",
  "rewardId": "reward-123"
}
```

### Claim Rewards

```bash
POST /api/referrals/rewards/claim
Content-Type: application/json

{
  "referrerId": "0x123...",
  "rewardIds": ["reward-1", "reward-2"],
  "chainId": 1
}

Response:
{
  "transactionHash": "0x456...",
  "claimedAmount": "200000000000000000",
  "claimStatus": "pending"
}
```

## Frontend Components

### ReferralDashboard

Main dashboard component showing all referral information.

```tsx
<ReferralDashboard 
  showLeaderboard={true}  // Show leaderboard section
  compact={false}         // Full or compact mode
/>
```

### ReferralLeaderboard

Leaderboard component with sorting and pagination.

```tsx
<ReferralLeaderboard 
  limit={50}
  compact={false}
  sortBy="totalRewards"  // 'totalRewards' | 'totalSignups' | 'recentActivity'
/>
```

## Testing

### Unit Tests

```bash
npm run test
```

### End-to-End Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:coverage
```

### Manual Testing Checklist

- [ ] Create referral link
- [ ] Copy referral link
- [ ] Share referral link
- [ ] Track referral click
- [ ] Record referral signup
- [ ] View dashboard stats
- [ ] View leaderboard
- [ ] Accept terms & conditions
- [ ] Claim rewards
- [ ] Verify on-chain transaction

## Monitoring & Logging

### Key Metrics to Track

- Total referrals created
- Total clicks tracked
- Total signups converted
- Total rewards distributed
- Average conversion rate
- Tier distribution

### Error Handling

All components include error boundaries and error states. Errors are logged to:
- Browser console
- Sentry (if configured)
- Application logs

## Security Considerations

1. **Wallet Verification**: Always verify wallet ownership
2. **Fraud Detection**: Implement bot detection and rate limiting
3. **Signature Verification**: Use signed messages for sensitive operations
4. **Rate Limiting**: Limit API requests per wallet
5. **Contract Audits**: Have smart contracts audited before deployment

## Performance Optimization

- **Caching Strategy**: Using stale-while-revalidate for leaderboard
- **Pagination**: Implemented on leaderboard to handle large datasets
- **Lazy Loading**: Components are code-split
- **Memoization**: React memo used for performance-critical components

## Troubleshooting

### Common Issues

**Issue**: Rewards not showing
- Check API connectivity
- Verify wallet is connected
- Check if rewards exist in database

**Issue**: Transaction fails
- Check gas fees
- Verify contract address
- Check network connectivity

**Issue**: Leaderboard not loading
- Check API endpoint
- Verify database connection
- Check for large dataset issues

## Support

For support or questions:
- Email: referrals@propchain.io
- Discord: https://discord.gg/propchain
- Docs: https://docs.propchain.io

## License

The referral system is part of the PropChain platform and follows the same license.
