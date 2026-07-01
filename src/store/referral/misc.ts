'use client';

/**
 * misc — remaining ReferralStore selectors that don't naturally fit into
 * the four primary slices (referralLinks, referralStats, leaderboard,
 * referralNotifications).  Currently exposes the active campaign and the
 * terms-accepted flag.
 *
 * Backwards-compatible: both hooks are still re-exported from
 * `@/store/referralStore`.
 */

import { useReferralStore } from './store';
import type { ReferralCampaign } from '@/types/referral';

/**
 * Reactive selector for `state.currentCampaign`.
 */
export const useCurrentReferralCampaign = (): ReferralCampaign | null =>
  useReferralStore((state) => state.currentCampaign);

/**
 * Reactive selector for `state.termsAccepted` (persisted across reloads).
 */
export const useReferralTermsAccepted = (): boolean =>
  useReferralStore((state) => state.termsAccepted);
