'use client';

/**
 * leaderboard — focused slice exposing the cached referral leaderboard.
 *
 * Part of the referralStore refactor that splits the monolith into focused
 * selector hook slices.  The exported name `useLeaderboard` is the new
 * canonical hook; `useLeaderboardCache` is kept as an alias for backwards
 * compatibility with existing call sites and the public re-export from
 * `@/store/referralStore`.
 */

import { useReferralStore } from './store';
import type { LeaderboardEntry } from '@/types/referral';

/**
 * Reactive selector for `state.leaderboardCache`.
 * Canonical name introduced by the store-slice refactor.
 */
export const useLeaderboard = (): LeaderboardEntry[] =>
  useReferralStore((state) => state.leaderboardCache);

/**
 * Alias kept for backwards compatibility — existing call sites and tests
 * import `useLeaderboardCache` from `@/store/referralStore`.
 */
export const useLeaderboardCache = useLeaderboard;
