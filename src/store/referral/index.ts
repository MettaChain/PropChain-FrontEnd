'use client';

/**
 * @/store/referral — barrel re-export for the focused slice refactor of the
 * monothilic referralStore.
 *
 * Consumers MAY import directly from this barrel (`@/store/referral`) or
 * continue to import from `@/store/referralStore` (which re-exports the same
 * hooks for backwards compatibility).
 *
 * Migration plan:
 *   1. New code SHOULD import from `@/store/referral/<slice>`.
 *   2. Existing consumer imports of `@/store/referralStore` keep working
 *      unchanged.
 *   3. Once all consumers are migrated, the `@/store/referralStore`
 *      re-export layer can be removed.
 */

export { useReferralLinks } from './referralLinks';
export { useReferralStats, useRecentRewards } from './referralStats';
export { useLeaderboard, useLeaderboardCache } from './leaderboard';
export {
  useReferralNotification,
  useReferralLoading,
  useReferralError,
} from './referralNotifications';
export {
  useCurrentReferralCampaign,
  useReferralTermsAccepted,
} from './misc';
