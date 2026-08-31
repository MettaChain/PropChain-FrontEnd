'use client';

/**
 * referralStats — focused slice exposing aggregate stats and the recent-rewards
 * feed for the current user.
 *
 * Part of the referralStore refactor that splits the monolith into focused
 * selector hook slices.  Backwards-compatible: both hooks are still
 * re-exported from `@/store/referralStore`.
 */

import { useReferralStore } from './store';
import type { ReferralReward, ReferralStats } from '@/types/referral';

/**
 * Reactive selector for `state.currentStats`.
 */
export const useReferralStats = (): ReferralStats | null =>
  useReferralStore((state) => state.currentStats);

/**
 * Reactive selector for `state.recentRewards` (latest 10, capped by the
 * `addReward` action).
 */
export const useRecentRewards = (): ReferralReward[] =>
  useReferralStore((state) => state.recentRewards);
