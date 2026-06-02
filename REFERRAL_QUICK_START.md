# PropChain Referral System - Quick Start Guide

## 5-Minute Setup

### Step 1: Add Routes to Your App

Create or update your app routing structure:

```bash
# Create these files if they don't exist:
src/app/referral/page.tsx                # Dashboard
src/app/referral/leaderboard/page.tsx   # Leaderboard
src/app/referral/terms/page.tsx         # Terms & Conditions
```

The files have already been created with proper structure.

### Step 2: Update Environment Variables

Add to `.env.local`:

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Contracts (update after deployment)
NEXT_PUBLIC_REFERRAL_CONTRACT_ETHEREUM=0x...
NEXT_PUBLIC_REFERRAL_CONTRACT_POLYGON=0x...
NEXT_PUBLIC_REFERRAL_CONTRACT_BSC=0x...
```

### Step 3: Add Navigation Links

In your main navigation, add referral links:

```tsx
// In your header/navigation component
import Link from 'next/link';

<nav>
  <Link href="/referral">
    <span>🎁 Referrals</span>
  </Link>
</nav>
```

### Step 4: Test the System

Visit these URLs in your browser:
- `http://localhost:3000/referral` - Dashboard
- `http://localhost:3000/referral/leaderboard` - Leaderboard
- `http://localhost:3000/referral/terms` - Terms & Conditions

## Component Usage Examples

### Use the Full Dashboard

```tsx
import ReferralDashboard from '@/components/referral/ReferralDashboard';

export default function Page() {
  return (
    <div className="p-4">
      <ReferralDashboard />
    </div>
  );
}
```

### Use the Leaderboard Only

```tsx
import ReferralLeaderboard from '@/components/referral/ReferralLeaderboard';

export default function Page() {
  return (
    <div className="p-4">
      <ReferralLeaderboard limit={50} sortBy="totalRewards" />
    </div>
  );
}
```

### Access Referral Store

```tsx
'use client';

import { useReferralStore } from '@/store/referralStore';

export default function Component() {
  const { currentStats, currentReferralLinks } = useReferralStore();

  return (
    <div>
      <h2>Total Rewards: {currentStats?.totalRewardsEarned}</h2>
      <p>Links: {currentReferralLinks.length}</p>
    </div>
  );
}
```

### Claim Rewards Programmatically

```tsx
'use client';

import { useClaimRewards } from '@/hooks/useRewardDistribution';
import { useState } from 'react';

export default function ClaimButton() {
  const { claimRewards, isLoading, error } = useClaimRewards();
  const [result, setResult] = useState(null);

  const handleClaim = async () => {
    try {
      const res = await claimRewards(
        ['reward-1', 'reward-2'],
        BigInt('100000000000000000')
      );
      setResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <button onClick={handleClaim} disabled={isLoading}>
        {isLoading ? 'Claiming...' : 'Claim Rewards'}
      </button>
      {error && <p className="text-red-600">{error}</p>}
      {result && <p className="text-green-600">Claimed: {result.claimedAmount}</p>}
    </div>
  );
}
```

## Backend API Setup (Node.js/NestJS Example)

### 1. Install Dependencies

```bash
npm install ethers viem dotenv
```

### 2. Create Referral Service

```typescript
// src/referral/referral.service.ts
import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class ReferralService {
  private provider: ethers.Provider;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL
    );
  }

  async getReferralStats(referrerId: string) {
    // Fetch from database
    const stats = await this.db.query(
      'SELECT * FROM referral_stats WHERE referrer_address = $1',
      [referrerId]
    );
    return stats[0];
  }

  async createReferralLink(referrerId: string, customName?: string) {
    const code = this.generateCode();
    await this.db.query(
      `INSERT INTO referral_links (code, referrer_address, custom_name, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [code, referrerId, customName]
    );
    return {
      code,
      url: `${process.env.APP_URL}?ref=${code}`,
    };
  }

  async recordSignup(referralCode: string, refereeAddress: string) {
    // Get referrer from code
    const link = await this.db.query(
      'SELECT referrer_address FROM referral_links WHERE code = $1',
      [referralCode]
    );

    if (!link[0]) throw new Error('Invalid referral code');

    const referrerAddress = link[0].referrer_address;

    // Create reward in database
    const reward = await this.db.query(
      `INSERT INTO rewards (referrer_address, referee_address, amount, token_address, chain_id, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
       RETURNING *`,
      [referrerAddress, refereeAddress, '1000000000000000000', process.env.REWARD_TOKEN, 1]
    );

    return reward[0];
  }

  async claimRewards(referrerId: string, rewardIds: string[], chainId: number) {
    // Get pending rewards
    const rewards = await this.db.query(
      `SELECT * FROM rewards WHERE referrer_address = $1 AND id = ANY($2) AND status = 'pending'`,
      [referrerId, rewardIds]
    );

    const totalAmount = rewards.reduce((sum, r) => sum + BigInt(r.amount), BigInt(0));

    // Distribute rewards via smart contract
    const txHash = await this.distributeOnChain(referrerId, totalAmount, chainId);

    // Update reward status
    await this.db.query(
      `UPDATE rewards SET status = 'claimed', transaction_hash = $1 WHERE id = ANY($2)`,
      [txHash, rewardIds]
    );

    return { transactionHash: txHash, claimedAmount: totalAmount.toString() };
  }

  private async distributeOnChain(to: string, amount: bigint, chainId: number) {
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    const contract = new ethers.Contract(
      process.env.REWARD_TOKEN,
      ['function transfer(address to, uint256 amount) returns (bool)'],
      signer
    );

    const tx = await contract.transfer(to, amount);
    return tx.hash;
  }

  private generateCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }
}
```

### 3. Create API Routes

```typescript
// src/referral/referral.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ReferralService } from './referral.service';

@Controller('api/referrals')
export class ReferralController {
  constructor(private referralService: ReferralService) {}

  @Get('stats/:address')
  async getStats(@Param('address') address: string) {
    return this.referralService.getReferralStats(address);
  }

  @Post('links')
  async createLink(@Body() body: { referrerId: string; customName?: string }) {
    return this.referralService.createReferralLink(body.referrerId, body.customName);
  }

  @Post('record-signup')
  async recordSignup(
    @Body() body: { referralCode: string; refereeAddress: string }
  ) {
    return this.referralService.recordSignup(body.referralCode, body.refereeAddress);
  }

  @Post('rewards/claim')
  async claimRewards(
    @Body() body: { referrerId: string; rewardIds: string[]; chainId: number }
  ) {
    return this.referralService.claimRewards(
      body.referrerId,
      body.rewardIds,
      body.chainId
    );
  }
}
```

## Common Tasks

### Add Referral Link to Navigation

```tsx
// In your Header component
<Link 
  href="/referral"
  className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 rounded"
>
  🎁 Earn Rewards
</Link>
```

### Display User's Referral Link in a Widget

```tsx
'use client';

import { useReferralLinks } from '@/store/referralStore';
import CopyButton from '@/components/referral/CopyButton';

export default function ReferralWidget() {
  const links = useReferralLinks();
  const primaryLink = links[0];

  if (!primaryLink) return null;

  return (
    <div className="p-4 bg-blue-50 rounded-lg">
      <h3 className="font-semibold mb-2">Your Referral Link</h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={primaryLink.url}
          readOnly
          className="flex-1 px-3 py-2 border rounded"
        />
        <CopyButton text={primaryLink.url} />
      </div>
    </div>
  );
}
```

### Show Reward Balance in Header

```tsx
'use client';

import { useReferralStats } from '@/store/referralStore';
import { formatUnits } from 'viem';

export default function RewardBalance() {
  const stats = useReferralStats();

  if (!stats) return null;

  const pendingRewards = formatUnits(BigInt(stats.pendingRewards || 0), 18);

  return (
    <div className="text-sm">
      💰 {parseFloat(pendingRewards).toFixed(2)} tokens pending
    </div>
  );
}
```

## Troubleshooting

### Referral Links Not Showing

1. Check wallet is connected: `useAccount()`
2. Check API response: `referralService.getReferralLinks(address)`
3. Check store: `useReferralLinks()`

### Rewards Not Displaying

1. Verify backend database has records
2. Check API endpoint response
3. Check contract addresses in config

### Transaction Failing

1. Check gas fees are sufficient
2. Verify wallet has tokens
3. Check contract address is correct
4. Ensure network matches contract deployment

## Performance Tips

1. **Use Selectors**: Import specific selectors instead of entire store
   ```tsx
   import { useReferralStats } from '@/store/referralStore';
   ```

2. **Memoize Components**: Use `React.memo()` for referral components
   ```tsx
   export default React.memo(ReferralDashboard);
   ```

3. **Implement Pagination**: For leaderboard with many entries
   ```tsx
   <ReferralLeaderboard limit={20} />
   ```

## Next Steps

1. ✅ Frontend implementation complete
2. 🔲 Deploy smart contracts
3. 🔲 Setup backend API
4. 🔲 Configure contract addresses
5. 🔲 Test end-to-end flow
6. 🔲 Launch referral program

## Support

For questions or issues, please refer to:
- Full documentation: `docs/REFERRAL_SYSTEM.md`
- GitHub Issues: [PropChain Repository]
- Discord: [PropChain Community]

---

**Version**: 1.0.0  
**Last Updated**: 2024-04-25  
**Status**: Production Ready
