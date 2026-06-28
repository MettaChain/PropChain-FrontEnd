'use client';

/**
 * @deprecated Backwards-compatibility re-export layer for the legacy
 * `@/store/referralStore` import path.
 *
 * The source-of-truth Zustand store now lives at
 * `@/store/referral/store` and the focused selector hooks live under
 * `@/store/referral/<slice>`.  This file re-exports both so existing
 * callers (`useReferralStore`, `useReferralLinks`, `useReferralStats`,
 * `useLeaderboardCache`, etc.) keep compiling unchanged.
 *
 * New code SHOULD import directly from:
 *   - `@/store/referral/store`   — for `useReferralStore` and the
 *                                   `ReferralStoreState` type.
 *   - `@/store/referral/<slice>`  — for the focused selector hooks.
 *
 * Migration plan:
 *   1. New code imports from the new barrel (`@/store/referral`) or
 *      `@/store/referral/<slice>`.
 *   2. Existing consumers keep working unchanged through this file.
 *   3. Once all consumers are migrated, this re-export layer can be
 *      deleted and the legacy `@/store/referralStore` path removed.
 *
 * See README § "Referral state".
 */

// Source of truth — re-exported so legacy imports still work.
export {
  useReferralStore,
  type ReferralStoreState,
  type ReferralProgramSettings,
} from './referral/store';

// Slice hooks — re-exported for backwards compatibility.
export { useReferralLinks } from './referral/referralLinks';
export { useReferralStats, useRecentRewards } from './referral/referralStats';
export { useLeaderboard, useLeaderboardCache } from './referral/leaderboard';
export {
  useReferralNotification,
  useReferralLoading,
  useReferralError,
} from './referral/referralNotifications';
export {
  useCurrentReferralCampaign,
  useReferralTermsAccepted,
} from './referral/misc';
