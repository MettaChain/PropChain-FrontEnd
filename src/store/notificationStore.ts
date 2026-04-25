import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PropertyAlert, NotificationSettings } from '@/types/property';
import { withAsyncAction } from './base';

/**
 * Notification Store
 * Manages property alerts and notification settings
 */

interface NotificationState {
  alerts: PropertyAlert[];
  settings: NotificationSettings;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

interface NotificationActions {
  addAlert: (alert: PropertyAlert) => void;
  markAsRead: (alertId: string) => void;
  markAllAsRead: () => void;
  clearAlert: (alertId: string) => void;
  clearAllAlerts: () => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastUpdated: (timestamp: number) => void;
  reset: () => void;
}

export type NotificationStore = NotificationState & NotificationActions;

const DEFAULT_SETTINGS: NotificationSettings = {
  email: '',
  inAppEnabled: true,
  emailEnabled: false,
  defaultFrequency: 'daily',
};

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set: (partial: NotificationStore | Partial<NotificationStore> | ((state: NotificationStore) => Partial<NotificationStore>)) => void, get: () => NotificationStore) => ({
      alerts: [],
      settings: DEFAULT_SETTINGS,
      isLoading: false,
      error: null,
      lastUpdated: null,

      addAlert: (alert: PropertyAlert) => {
        set((state) => {
          // Check if alert already exists
          const existingAlert = state.alerts.find(a => a.id === alert.id);
          if (existingAlert) {
            return state;
          }

          return {
            alerts: [alert, ...state.alerts],
            lastUpdated: Date.now(),
          };
        });
      },

      markAsRead: (alertId: string) => {
        set((state) => ({
          alerts: state.alerts.map(alert =>
            alert.id === alertId ? { ...alert, isRead: true } : alert
          ),
          lastUpdated: Date.now(),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          alerts: state.alerts.map(alert => ({ ...alert, isRead: true })),
          lastUpdated: Date.now(),
        }));
      },

      clearAlert: (alertId: string) => {
        set((state) => ({
          alerts: state.alerts.filter(alert => alert.id !== alertId),
          lastUpdated: Date.now(),
        }));
      },

      clearAllAlerts: () => {
        set({ alerts: [], lastUpdated: Date.now() });
      },

      updateSettings: (newSettings: Partial<NotificationSettings>) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
          lastUpdated: Date.now(),
        }));
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      setLastUpdated: (timestamp: number) => set({ lastUpdated: timestamp }),
      reset: () => set({
        alerts: [],
        settings: DEFAULT_SETTINGS,
        isLoading: false,
        error: null,
        lastUpdated: Date.now(),
      }),
    }),
    {
      name: 'propchain-notifications',
      partialize: (state: NotificationStore) => ({
        alerts: state.alerts,
        settings: state.settings,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);
