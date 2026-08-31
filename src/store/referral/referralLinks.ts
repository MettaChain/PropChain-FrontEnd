'use client';

/**
 * referralLinks — focused slice exposing the user's referral-link collection.
 *
 * Part of the referralStore refactor that splits the monolith into focused
 * selector hook slices.  Backwards-compatible: `useReferralLinks` is still
 * re-exported from `@/store/referralStore` for callers that prefer the
 * single-file import path.
 */

import { useReferralStore } from './store';
import type { ReferralLink } from '@/types/referral';

/**
 * Reactive selector for `state.currentReferralLinks`.
 */
export const useReferralLinks = (): ReferralLink[] =>
  useReferralStore((state) => state.currentReferralLinks);
