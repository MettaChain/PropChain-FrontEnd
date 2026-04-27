/**
 * Referral Rewards Smart Contract ABI
 * Defines the interface for on-chain reward distribution
 */

/**
 * Main Referral Rewards Contract ABI
 * This contract handles distribution of referral rewards to users
 */
export const REFERRAL_REWARDS_ABI = [
  // Read Functions
  {
    type: 'function' as const,
    name: 'getPendingRewards',
    inputs: [{ name: 'referrer', type: 'address' }],
    outputs: [{ name: 'amount', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function' as const,
    name: 'getClaimedRewards',
    inputs: [{ name: 'referrer', type: 'address' }],
    outputs: [{ name: 'amount', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function' as const,
    name: 'getRewardByIndex',
    inputs: [
      { name: 'referrer', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    outputs: [
      {
        name: 'reward',
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'amount', type: 'uint256' },
          { name: 'token', type: 'address' },
          { name: 'status', type: 'uint8' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'claimedAt', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function' as const,
    name: 'getRewardCount',
    inputs: [{ name: 'referrer', type: 'address' }],
    outputs: [{ name: 'count', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function' as const,
    name: 'isRewardClaimed',
    inputs: [
      { name: 'referrer', type: 'address' },
      { name: 'rewardId', type: 'uint256' },
    ],
    outputs: [{ name: 'claimed', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function' as const,
    name: 'getRewardToken',
    inputs: [],
    outputs: [{ name: 'token', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function' as const,
    name: 'totalRewardsDistributed',
    inputs: [],
    outputs: [{ name: 'amount', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function' as const,
    name: 'totalRewardsClaimed',
    inputs: [],
    outputs: [{ name: 'amount', type: 'uint256' }],
    stateMutability: 'view',
  },

  // Write Functions
  {
    type: 'function' as const,
    name: 'claimRewards',
    inputs: [
      { name: 'rewardIds', type: 'uint256[]' },
    ],
    outputs: [{ name: 'totalClaimed', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function' as const,
    name: 'claimAllRewards',
    inputs: [],
    outputs: [{ name: 'totalClaimed', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function' as const,
    name: 'addReward',
    inputs: [
      { name: 'referrer', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'token', type: 'address' },
      { name: 'refereeAddress', type: 'address' },
    ],
    outputs: [{ name: 'rewardId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function' as const,
    name: 'addBulkRewards',
    inputs: [
      {
        name: 'rewards',
        type: 'tuple[]',
        components: [
          { name: 'referrer', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'referee', type: 'address' },
        ],
      },
      { name: 'token', type: 'address' },
    ],
    outputs: [{ name: 'rewardCount', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function' as const,
    name: 'withdrawToken',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
    stateMutability: 'nonpayable',
  },

  // Events
  {
    type: 'event' as const,
    name: 'RewardAdded',
    inputs: [
      { name: 'rewardId', type: 'uint256', indexed: true },
      { name: 'referrer', type: 'address', indexed: true },
      { name: 'referee', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'token', type: 'address', indexed: false },
    ],
  },
  {
    type: 'event' as const,
    name: 'RewardClaimed',
    inputs: [
      { name: 'rewardId', type: 'uint256', indexed: true },
      { name: 'referrer', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'token', type: 'address', indexed: false },
      { name: 'claimedAt', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event' as const,
    name: 'BulkRewardsClaimed',
    inputs: [
      { name: 'referrer', type: 'address', indexed: true },
      { name: 'totalAmount', type: 'uint256', indexed: false },
      { name: 'rewardCount', type: 'uint256', indexed: false },
      { name: 'token', type: 'address', indexed: false },
    ],
  },
  {
    type: 'event' as const,
    name: 'RewardExpired',
    inputs: [
      { name: 'rewardId', type: 'uint256', indexed: true },
      { name: 'referrer', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const;

/**
 * ERC20 Token ABI (standard interface)
 * Used for token interactions
 */
export const ERC20_ABI = [
  {
    type: 'function' as const,
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function' as const,
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: 'amount', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function' as const,
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function' as const,
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function' as const,
    name: 'transferFrom',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function' as const,
    name: 'decimals',
    inputs: [],
    outputs: [{ name: 'decimals', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function' as const,
    name: 'symbol',
    inputs: [],
    outputs: [{ name: 'symbol', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'event' as const,
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event' as const,
    name: 'Approval',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'spender', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
] as const;

/**
 * Referral Registry Contract ABI
 * Manages referral codes and tracking
 */
export const REFERRAL_REGISTRY_ABI = [
  {
    type: 'function' as const,
    name: 'getReferralCode',
    inputs: [{ name: 'referrer', type: 'address' }],
    outputs: [{ name: 'code', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function' as const,
    name: 'getReferrerByCode',
    inputs: [{ name: 'code', type: 'string' }],
    outputs: [{ name: 'referrer', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function' as const,
    name: 'registerReferral',
    inputs: [
      { name: 'referee', type: 'address' },
      { name: 'referralCode', type: 'string' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function' as const,
    name: 'getReferralCount',
    inputs: [{ name: 'referrer', type: 'address' }],
    outputs: [{ name: 'count', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event' as const,
    name: 'ReferralRegistered',
    inputs: [
      { name: 'referrer', type: 'address', indexed: true },
      { name: 'referee', type: 'address', indexed: true },
      { name: 'code', type: 'string', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
] as const;

/**
 * Contract addresses by network (to be updated with actual deployment addresses)
 */
export const REFERRAL_CONTRACT_ADDRESSES: Record<number, string> = {
  1: '', // Ethereum Mainnet
  11155111: '', // Sepolia Testnet
  137: '', // Polygon Mainnet
  80001: '', // Mumbai Testnet
  56: '', // BSC Mainnet
  97: '', // BSC Testnet
};

/**
 * Token addresses by network (to be updated with actual token addresses)
 */
export const REWARD_TOKEN_ADDRESSES: Record<number, string> = {
  1: '', // Ethereum Mainnet
  11155111: '', // Sepolia Testnet
  137: '', // Polygon Mainnet
  80001: '', // Mumbai Testnet
  56: '', // BSC Mainnet
  97: '', // BSC Testnet
};

/**
 * Get contract address for a network
 */
export function getReferralContractAddress(chainId: number): string | null {
  return REFERRAL_CONTRACT_ADDRESSES[chainId] || null;
}

/**
 * Get reward token address for a network
 */
export function getRewardTokenAddress(chainId: number): string | null {
  return REWARD_TOKEN_ADDRESSES[chainId] || null;
}

/**
 * Check if a network supports referral rewards
 */
export function isRewardNetworkSupported(chainId: number): boolean {
  return !!(
    getReferralContractAddress(chainId) && getRewardTokenAddress(chainId)
  );
}
