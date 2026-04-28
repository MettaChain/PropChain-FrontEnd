import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PropertyAlert, NotificationSettings, PriceAlert, PriceAlertNotification } from '@/types/property';
import { withAsyncAction } from './base';

/**
 * Notification Store
 * Manages property alerts and notification settings
 */

interface NotificationState {
  alerts: PropertyAlert[];
  priceAlerts: PriceAlert[];
  priceAlertNotifications: PriceAlertNotification[];
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
  // Price Alert actions
  addPriceAlert: (alert: PriceAlert) => void;
  updatePriceAlert: (alertId: string, updates: Partial<PriceAlert>) => void;
  removePriceAlert: (alertId: string) => void;
  togglePriceAlert: (alertId: string) => void;
  triggerPriceAlert: (alertId: string, triggeredPrice: number) => void;
  // Price Alert Notification actions
  addPriceAlertNotification: (notification: PriceAlertNotification) => void;
  markPriceAlertNotificationAsRead: (notificationId: string) => void;
  clearPriceAlertNotification: (notificationId: string) => void;
  clearAllPriceAlertNotifications: () => void;
  // Settings
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
      priceAlerts: [],
      priceAlertNotifications: [],
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

      // Price Alert actions
      addPriceAlert: (alert: PriceAlert) => {
        set((state) => {
          // Check if alert already exists for this property
          const existingAlert = state.priceAlerts.find(
            a => a.propertyId === alert.propertyId && a.alertType === alert.alertType
          );
          if (existingAlert) {
            // Update existing alert
            return {
              priceAlerts: state.priceAlerts.map(a =>
                a.id === existingAlert.id ? { ...a, ...alert } : a
              ),
              lastUpdated: Date.now(),
            };
          }

          return {
            priceAlerts: [{ ...alert, id: alert.id || `alert-${Date.now()}` }, ...state.priceAlerts],
            lastUpdated: Date.now(),
          };
        });
      },

      updatePriceAlert: (alertId: string, updates: Partial<PriceAlert>) => {
        set((state) => ({
          priceAlerts: state.priceAlerts.map(alert =>
            alert.id === alertId ? { ...alert, ...updates } : alert
          ),
          lastUpdated: Date.now(),
        }));
      },

      removePriceAlert: (alertId: string) => {
        set((state) => ({
          priceAlerts: state.priceAlerts.filter(alert => alert.id !== alertId),
          lastUpdated: Date.now(),
        }));
      },

      togglePriceAlert: (alertId: string) => {
        set((state) => ({
          priceAlerts: state.priceAlerts.map(alert =>
            alert.id === alertId ? { ...alert, isActive: !alert.isActive } : alert
          ),
          lastUpdated: Date.now(),
        }));
      },

      triggerPriceAlert: (alertId: string, triggeredPrice: number) => {
        const state = get();
        const alert = state.priceAlerts.find(a => a.id === alertId);
        
        if (!alert) return;

        // Create notification
        const notification: PriceAlertNotification = {
          id: `notif-${Date.now()}`,
          alertId,
          propertyId: alert.propertyId,
          propertyName: alert.propertyName,
          propertyImage: alert.propertyImage,
          alertType: alert.alertType,
          targetPrice: alert.targetPrice,
          triggeredPrice,
          message: getAlertMessage(alert.alertType, alert.propertyName, alert.targetPrice, triggeredPrice),
          createdAt: new Date().toISOString(),
          isRead: false,
          userId: alert.userId,
        };

        set({
          priceAlerts: state.priceAlerts.map(a =>
            a.id === alertId ? { ...a, isTriggered: true, triggeredAt: new Date().toISOString() } : a
          ),
          priceAlertNotifications: [notification, ...state.priceAlertNotifications],
          lastUpdated: Date.now(),
        });
      },

      // Price Alert Notification actions
      addPriceAlertNotification: (notification: PriceAlertNotification) => {
        set((state) => ({
          priceAlertNotifications: [notification, ...state.priceAlertNotifications],
          lastUpdated: Date.now(),
        }));
      },

      markPriceAlertNotificationAsRead: (notificationId: string) => {
        set((state) => ({
          priceAlertNotifications: state.priceAlertNotifications.map(n =>
            n.id === notificationId ? { ...n, isRead: true } : n
          ),
          lastUpdated: Date.now(),
        }));
      },

      clearPriceAlertNotification: (notificationId: string) => {
        set((state) => ({
          priceAlertNotifications: state.priceAlertNotifications.filter(n => n.id !== notificationId),
          lastUpdated: Date.now(),
        }));
      },

      clearAllPriceAlertNotifications: () => {
        set({ priceAlertNotifications: [], lastUpdated: Date.now() });
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
        priceAlerts: [],
        priceAlertNotifications: [],
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
        priceAlerts: state.priceAlerts,
        priceAlertNotifications: state.priceAlertNotifications,
        settings: state.settings,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);

// Helper function to generate alert messages
function getAlertMessage(
  alertType: PriceAlert['alertType'],
  propertyName: string,
  targetPrice: number,
  triggeredPrice: number
): string {
  const formattedTarget = `$${targetPrice.toLocaleString()}`;
  const formattedTriggered = `$${triggeredPrice.toLocaleString()}`;
  
  switch (alertType) {
    case 'above':
      return `${propertyName} price has risen above ${formattedTarget}. Current price: ${formattedTriggered}`;
    case 'below':
      return `${propertyName} price has dropped below ${formattedTarget}. Current price: ${formattedTriggered}`;
    case 'change':
      const changePercent = Math.abs(((triggeredPrice - targetPrice) / targetPrice) * 100).toFixed(1);
      return `${propertyName} price has changed by ${changePercent}%. Current price: ${formattedTriggered}`;
    default:
      return `${propertyName} price alert triggered. Current price: ${formattedTriggered}`;
  }
}
