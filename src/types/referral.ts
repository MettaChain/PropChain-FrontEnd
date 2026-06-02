/**
 * Referral System Types and Interfaces
 * Handles all types related to the referral program including links,
 * rewards, and leaderboard data
 */

/**
 * Wallet address type for referrer identification
 */
export type WalletAddress = string & { readonly __brand: 'WalletAddress' };

/**
 * Unique referral code/ID for tracking
 */
export type ReferralCode = string & { readonly __brand: 'ReferralCode' };

/**
 * Referral reward status
 */
export enum ReferralRewardStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CLAIMED = 'claimed',
}

/**
 * Referral tier for different reward levels
 */
export enum ReferralTier {
  BRONZE = 'bronze',    // 0-10 referrals
  SILVER = 'silver',    // 11-50 referrals
  GOLD = 'gold',        // 51-100 referrals
  PLATINUM = 'platinum', // 100+ referrals
}

/**
 * Individual referral reward record
 */
export interface ReferralReward {
  id: string;
  referrerId: WalletAddress;
  refereeId: WalletAddress;
  referralCode: ReferralCode;
  rewardAmount: string; // In wei for on-chain consistency
  rewardToken: string; // Token address or symbol
  status: ReferralRewardStatus;
  transactionHash?: string;
  blockNumber?: number;
  chainId: number;
  createdAt: number; // Unix timestamp
  claimedAt?: number; // Unix timestamp
  expiresAt?: number; // Unix timestamp for reward expiration
}

/**
 * Referral link data
 */
export interface ReferralLink {
  code: ReferralCode;
  referrerId: WalletAddress;
  url: string; // Full referral URL
  shortUrl?: string; // Optional shortened URL
  createdAt: number;
  expiresAt?: number;
  isActive: boolean;
  customName?: string;
}

/**
 * User referral statistics
 */
export interface ReferralStats {
  referrerId: WalletAddress;
  totalClicks: number;
  totalSignups: number;
  totalRewardsEarned: string; // In wei
  totalRewardsClaimed: string; // In wei
  pendingRewards: string; // In wei
  conversionRate: number; // Percentage of clicks that converted to signups
  tier: ReferralTier;
  referralsSinceReset: number;
  lastActivityAt: number;
  joinedAt: number;
}

/**
 * Referral campaign data
 */
export interface ReferralCampaign {
  id: string;
  referrerId: WalletAddress;
  campaignName: string;
  campaignDescription?: string;
  rewardPerReferral: string; // In wei
  rewardPerSignup?: string; // Additional bonus for signup conversion
  maxReward?: string; // Cap on total rewards
  rewardToken: string;
  chainId: number;
  status: 'active' | 'paused' | 'completed';
  startDate: number;
  endDate?: number;
  referralLinks: ReferralLink[];
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  rank: number;
  referrerId: WalletAddress;
  displayName?: string;
  profileImage?: string;
  totalRewardsEarned: string; // In wei
  totalSignups: number;
  tier: ReferralTier;
  recentActivityScore: number; // For activity-based ranking
}

/**
 * Referral invitation metadata
 */
export interface ReferralInvitation {
  invitationId: string;
  referrerAddress: WalletAddress;
  referralCode: ReferralCode;
  inviteEmail?: string;
  invitedAt: number;
  acceptedAt?: number;
  acceptedBy?: WalletAddress;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: number;
}

/**
 * Dashboard data for referral page
 */
export interface ReferralDashboardData {
  referrerId: WalletAddress;
  stats: ReferralStats;
  currentCampaign?: ReferralCampaign;
  referralLinks: ReferralLink[];
  recentRewards: ReferralReward[];
  leaderboardPosition?: LeaderboardEntry;
  nextTierThreshold?: {
    tier: ReferralTier;
    requiredSignups: number;
    progress: number;
  };
}

/**
 * On-chain reward distribution data
 */
export interface OnChainRewardDistribution {
  distributionId: string;
  referrerId: WalletAddress;
  amount: string; // In wei
  token: string; // Token contract address
  chainId: number;
  transactionHash: string;
  blockNumber: number;
  blockTimestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
}

/**
 * Referral program settings
 */
export interface ReferralProgramSettings {
  isEnabled: boolean;
  rewardPerReferral: string; // In wei
  rewardPerSignup?: string;
  minSignupsForReward: number;
  maxRewardCap?: string; // In wei
  tierThresholds: Record<ReferralTier, number>; // Number of signups required
  rewardToken: string;
  rewardChains: number[]; // Supported chains for rewards
  termsAndConditionsUrl: string;
  privacyPolicyUrl: string;
  maxReferralLinksPerUser: number;
  referralLinkExpiration?: number; // In seconds
  rewardClaimDeadline?: number; // In seconds after reward earned
}

/**
 * Terms and conditions acceptance
 */
export interface ReferralTermsAcceptance {
  userId: WalletAddress;
  acceptedAt: number;
  termsVersion: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * API request/response types
 */

/**
 * Request to create a referral link
 */
export interface CreateReferralLinkRequest {
  referrerId: WalletAddress;
  customName?: string;
  expiresAt?: number;
}

/**
 * Response from referral link creation
 */
export interface CreateReferralLinkResponse {
  code: ReferralCode;
  url: string;
  shortUrl?: string;
  expiresAt?: number;
}

/**
 * Request to track referral click
 */
export interface TrackReferralClickRequest {
  referralCode: ReferralCode;
  referrerAddress: WalletAddress;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Request to record referral signup
 */
export interface RecordReferralSignupRequest {
  referralCode: ReferralCode;
  referrerAddress: WalletAddress;
  refereeAddress: WalletAddress;
  chainId: number;
}

/**
 * Response from recording signup
 */
export interface RecordReferralSignupResponse {
  success: boolean;
  rewardAmount?: string;
  rewardId?: string;
  message?: string;
}

/**
 * Request to claim rewards
 */
export interface ClaimRewardsRequest {
  referrerId: WalletAddress;
  rewardIds: string[];
  chainId: number;
  signature?: string; // Optional signature for verification
}

/**
 * Response from claiming rewards
 */
export interface ClaimRewardsResponse {
  transactionHash: string;
  blockNumber?: number;
  claimedAmount: string;
  claimStatus: 'pending' | 'confirmed' | 'failed';
}

/**
 * Request to get leaderboard
 */
export interface GetLeaderboardRequest {
  limit?: number;
  offset?: number;
  sortBy?: 'totalRewards' | 'totalSignups' | 'recentActivity';
  chainId?: number;
}

/**
 * Response from leaderboard request
 */
export interface GetLeaderboardResponse {
  entries: LeaderboardEntry[];
  totalCount: number;
  userRank?: number;
  userEntry?: LeaderboardEntry;
}

/**
 * Type guard functions
 */
export function isWalletAddress(value: string): value is WalletAddress {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function isReferralCode(value: string): value is ReferralCode {
  return value.length > 0 && value.length <= 50;
}

export function createWalletAddress(address: string): WalletAddress {
  if (!isWalletAddress(address)) {
    throw new Error(`Invalid wallet address: ${address}`);
  }
  return address as WalletAddress;
}

export function createReferralCode(code: string): ReferralCode {
  if (!isReferralCode(code)) {
    throw new Error(`Invalid referral code: ${code}`);
  }
  return code as ReferralCode;
}
