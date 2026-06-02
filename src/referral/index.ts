/**
 * Referral System Exports
 * Centralized exports for all referral-related modules
 */

// Types
export * from '@/types/referral';

// Store
export {
  useReferralStore,
  useReferralStats,
  useReferralLinks,
  useRecentRewards,
  useReferralLoading,
  useReferralNotification,
  useReferralError,
  useCurrentReferralCampaign,
  useLeaderboardCache,
  useReferralTermsAccepted,
  type ReferralStoreState,
} from '@/store/referralStore';

// Service
export { referralService, ReferralService } from '@/lib/referralService';

// Hooks
export {
  useRewardDistribution,
  useClaimRewards,
  useRewardDistributionStatus,
  useRewardDistributionValidator,
  type UseRewardDistributionResult,
} from '@/hooks/useRewardDistribution';

// Components
export { default as ReferralDashboard } from '@/components/referral/ReferralDashboard';
export { default as ReferralLeaderboard } from '@/components/referral/ReferralLeaderboard';
export { default as ReferralLinksCard } from '@/components/referral/ReferralLinksCard';
export { default as ReferralStatsCard } from '@/components/referral/ReferralStatsCard';
export { default as RewardsDisplay } from '@/components/referral/RewardsDisplay';
export { default as QuickStats } from '@/components/referral/QuickStats';
export { default as CopyButton } from '@/components/referral/CopyButton';
export { default as ShareButton } from '@/components/referral/ShareButton';
export { default as CreateReferralLinkModal } from '@/components/referral/CreateReferralLinkModal';
export { default as ClaimRewardsModal } from '@/components/referral/ClaimRewardsModal';
export { default as ReferralTermsPage } from '@/components/referral/ReferralTermsPage';

// Config
export {
  REFERRAL_REWARDS_ABI,
  ERC20_ABI,
  REFERRAL_REGISTRY_ABI,
  REFERRAL_CONTRACT_ADDRESSES,
  REWARD_TOKEN_ADDRESSES,
  getReferralContractAddress,
  getRewardTokenAddress,
  isRewardNetworkSupported,
} from '@/config/referralContracts';
