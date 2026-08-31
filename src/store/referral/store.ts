'use client';

/**
 * Referral store — Zustand state management source-of-truth.
 *
 * Owns the store actions (create + persist) and exposes the typed
 * `useReferralStore` hook.  Selector hooks that read from this store live
 * under `@/store/referral/<slice>` for focused subscription, and are
 * re-exported from the legacy `@/store/referralStore` path for backwards
 * compatibility.
 *
 * NOTE on module layering:
 *   - Slice files (`./referralLinks.ts`, `./referralStats.ts`, …) import
 *     `useReferralStore` from THIS file (the source-of-truth) — never from
 *     the legacy `@/store/referralStore` barrel.  This breaks a circular
 *     import path between the barrel and its slice files.
 *   - `src/store/referralStore.ts` re-exports `useReferralStore` from this
 *     file plus the slice hooks, so existing consumers of the legacy path
 *     continue to compile unchanged.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ReferralLink,
  ReferralStats,
  ReferralReward,
  ReferralDashboardData,
  WalletAddress,
  ReferralCode,
  ReferralCampaign,
  LeaderboardEntry,
} from '@/types/referral';

/**
 * Program-level settings blob returned by the referral backend.  Shape is
 * currently loose; narrow on read until it stabilises into a typed
 * `ReferralProgramSettings` interface.
 */
export type ReferralProgramSettings = Record<string, unknown> | null;

/**
 * Referral store state interface
 */
export interface ReferralStoreState {
  // State
  isLoading: boolean;
  error: string | null;
  referrerId: WalletAddress | null;

  // Referral data
  currentReferralLinks: ReferralLink[];
  currentStats: ReferralStats | null;
  currentCampaign: ReferralCampaign | null;
  recentRewards: ReferralReward[];
  leaderboardCache: LeaderboardEntry[];
  selectedReferralCode: ReferralCode | null;

  // UI state
  dashboardLoading: boolean;
  leaderboardLoading: boolean;
  isClaimingRewards: boolean;
  showClaimModal: boolean;
  notificationMessage: string | null;
  notificationType: 'success' | 'error' | 'info' | 'warning' | null;

  // Metadata
  lastUpdated: number | null;
  lastLeaderboardUpdate: number | null;
  termsAccepted: boolean;
  programSettings: ReferralProgramSettings;

  // Actions
  initialize: (address: WalletAddress) => Promise<void>;
  setReferrerId: (address: WalletAddress | null) => void;

  // Referral link actions
  addReferralLink: (link: ReferralLink) => void;
  removeReferralLink: (code: ReferralCode) => void;
  updateReferralLinks: (links: ReferralLink[]) => void;
  setSelectedReferralCode: (code: ReferralCode | null) => void;

  // Stats actions
  updateStats: (stats: ReferralStats) => void;
  updateRecentRewards: (rewards: ReferralReward[]) => void;
  addReward: (reward: ReferralReward) => void;

  // Campaign actions
  setCurrentCampaign: (campaign: ReferralCampaign | null) => void;
  updateCampaign: (campaign: ReferralCampaign) => void;

  // Leaderboard actions
  updateLeaderboard: (entries: LeaderboardEntry[]) => void;

  // UI actions
  setDashboardLoading: (loading: boolean) => void;
  setLeaderboardLoading: (loading: boolean) => void;
  setIsClaimingRewards: (claiming: boolean) => void;
  setShowClaimModal: (show: boolean) => void;
  setNotification: (message: string | null, type: 'success' | 'error' | 'info' | 'warning' | null) => void;
  clearNotification: () => void;

  // Settings actions
  updateTermsAccepted: (accepted: boolean) => void;
  setProgramSettings: (settings: ReferralProgramSettings) => void;

  // Error actions
  setError: (error: string | null) => void;
  clearError: () => void;

  // Data refresh
  setLastUpdated: (timestamp: number) => void;
  setLastLeaderboardUpdate: (timestamp: number) => void;

  // Dashboard data actions
  setDashboardData: (data: ReferralDashboardData) => void;

  // Reset
  reset: () => void;
}

/**
 * Initial state — typed explicitly so empty arrays don't widen to `never[]`.
 */
type InitialState = Pick<
  ReferralStoreState,
  | 'isLoading'
  | 'error'
  | 'referrerId'
  | 'currentReferralLinks'
  | 'currentStats'
  | 'currentCampaign'
  | 'recentRewards'
  | 'leaderboardCache'
  | 'selectedReferralCode'
  | 'dashboardLoading'
  | 'leaderboardLoading'
  | 'isClaimingRewards'
  | 'showClaimModal'
  | 'notificationMessage'
  | 'notificationType'
  | 'lastUpdated'
  | 'lastLeaderboardUpdate'
  | 'termsAccepted'
  | 'programSettings'
>;

const initialState: InitialState = {
  isLoading: false,
  error: null,
  referrerId: null,
  currentReferralLinks: [],
  currentStats: null,
  currentCampaign: null,
  recentRewards: [],
  leaderboardCache: [],
  selectedReferralCode: null,
  dashboardLoading: false,
  leaderboardLoading: false,
  isClaimingRewards: false,
  showClaimModal: false,
  notificationMessage: null,
  notificationType: null,
  lastUpdated: null,
  lastLeaderboardUpdate: null,
  termsAccepted: false,
  programSettings: null,
};

/**
 * Source-of-truth Zustand store with persistence.
 *
 * `partialize` is `(state) => ({...})` and returns a plain object whose
 * `programSettings` is typed as `ReferralProgramSettings` (= `Record<string,
 * unknown> | null`); the persist middleware passes it through JSON.stringify
 * unchanged.
 */
export const useReferralStore = create<ReferralStoreState>()(
  persist(
    (set) => ({
      ...initialState,

      initialize: async (address: WalletAddress) => {
        set({ isLoading: true, error: null });
        try {
          set({
            referrerId: address,
            isLoading: false,
            lastUpdated: Date.now(),
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to initialize referral store',
            isLoading: false,
          });
        }
      },

      setReferrerId: (address) => {
        set({ referrerId: address });
      },

      // Referral link actions
      addReferralLink: (link) => {
        set((state) => ({
          currentReferralLinks: [...state.currentReferralLinks, link],
        }));
      },

      removeReferralLink: (code) => {
        set((state) => ({
          currentReferralLinks: state.currentReferralLinks.filter(
            (link) => link.code !== code
          ),
        }));
      },

      updateReferralLinks: (links) => {
        set({ currentReferralLinks: links });
      },

      setSelectedReferralCode: (code) => {
        set({ selectedReferralCode: code });
      },

      // Stats actions
      updateStats: (stats) => {
        set({
          currentStats: stats,
          lastUpdated: Date.now(),
        });
      },

      updateRecentRewards: (rewards) => {
        set({ recentRewards: rewards });
      },

      addReward: (reward) => {
        set((state) => ({
          recentRewards: [reward, ...state.recentRewards].slice(0, 10), // Keep latest 10
        }));
      },

      // Campaign actions
      setCurrentCampaign: (campaign) => {
        set({ currentCampaign: campaign });
      },

      updateCampaign: (campaign) => {
        set({ currentCampaign: campaign });
      },

      // Leaderboard actions
      updateLeaderboard: (entries) => {
        set({
          leaderboardCache: entries,
          lastLeaderboardUpdate: Date.now(),
        });
      },

      // UI actions
      setDashboardLoading: (loading) => {
        set({ dashboardLoading: loading });
      },

      setLeaderboardLoading: (loading) => {
        set({ leaderboardLoading: loading });
      },

      setIsClaimingRewards: (claiming) => {
        set({ isClaimingRewards: claiming });
      },

      setShowClaimModal: (show) => {
        set({ showClaimModal: show });
      },

      setNotification: (message, type) => {
        set({
          notificationMessage: message,
          notificationType: type,
        });
        // Auto-clear after 5 seconds
        if (message) {
          setTimeout(() => {
            set({
              notificationMessage: null,
              notificationType: null,
            });
          }, 5000);
        }
      },

      clearNotification: () => {
        set({
          notificationMessage: null,
          notificationType: null,
        });
      },

      // Settings actions
      updateTermsAccepted: (accepted) => {
        set({ termsAccepted: accepted });
      },

      setProgramSettings: (settings) => {
        set({ programSettings: settings });
      },

      // Error actions
      setError: (error) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      // Data refresh
      setLastUpdated: (timestamp) => {
        set({ lastUpdated: timestamp });
      },

      setLastLeaderboardUpdate: (timestamp) => {
        set({ lastLeaderboardUpdate: timestamp });
      },

      // Dashboard data actions
      setDashboardData: (data) => {
        set({
          currentStats: data.stats,
          currentCampaign: data.currentCampaign || null,
          currentReferralLinks: data.referralLinks,
          recentRewards: data.recentRewards,
          leaderboardCache: data.leaderboardPosition
            ? [data.leaderboardPosition]
            : [],
          lastUpdated: Date.now(),
        });
      },

      // Reset
      reset: () => {
        set({ ...initialState });
      },
    }),
    {
      name: 'propchain-referral', // Name of the storage
      version: 1,
      // Only persist specific fields to avoid storage bloat
      partialize: (state) => ({
        termsAccepted: state.termsAccepted,
        lastUpdated: state.lastUpdated,
        lastLeaderboardUpdate: state.lastLeaderboardUpdate,
        programSettings: state.programSettings,
        leaderboardCache: state.leaderboardCache,
      }),
    }
  )
);
