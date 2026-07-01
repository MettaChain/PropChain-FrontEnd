'use client';

/**
 * referralNotifications — focused slice exposing the surfacing layer for the
 * referral feature: notifications, transient loading flags, and the latest
 * top-level error string.
 *
 * Part of the referralStore refactor that splits the monolith into focused
 * selector hook slices.  Backwards-compatible: all hooks are still
 * re-exported from `@/store/referralStore`.
 */

import { useReferralStore } from './store';

type NotificationType = 'success' | 'error' | 'info' | 'warning' | null;

/**
 * Reactive selector for the transient toast-style notification (message + type).
 */
export const useReferralNotification = (): {
  message: string | null;
  type: NotificationType;
} =>
  useReferralStore((state) => ({
    message: state.notificationMessage,
    type: state.notificationType,
  }));

/**
 * Reactive selector bundling the loading flags for dashboard, leaderboard,
 * and reward-claim flows.
 */
export const useReferralLoading = (): {
  dashboardLoading: boolean;
  leaderboardLoading: boolean;
  isClaimingRewards: boolean;
} =>
  useReferralStore((state) => ({
    dashboardLoading: state.dashboardLoading,
    leaderboardLoading: state.leaderboardLoading,
    isClaimingRewards: state.isClaimingRewards,
  }));

/**
 * Reactive selector for the top-level referral error string.
 */
export const useReferralError = (): string | null =>
  useReferralStore((state) => state.error);
