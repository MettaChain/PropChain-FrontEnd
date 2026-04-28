'use client';

import { useEffect, useRef } from 'react';
import { useSavedSearchStore } from '@/store/savedSearchStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useWalletStore } from '@/store/walletStore';
import { notificationService } from '@/lib/notificationService';

/**
 * Hook to periodically check for new property matches
 * and generate notifications
 */
export const useNotificationChecker = () => {
  const { searches } = useSavedSearchStore();
  const { addAlert, settings } = useNotificationStore();
  const { address } = useWalletStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!address || !settings.inAppEnabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const checkNotifications = async () => {
      try {
        const alerts = await notificationService.checkForNewMatches(searches);
        
        // Add alerts to the notification store
        alerts.forEach(alert => {
          addAlert(alert);
        });

        // Send email notifications if enabled
        if (settings.emailEnabled && settings.email) {
          for (const alert of alerts) {
            const savedSearch = searches.find(s => s.id === alert.savedSearchId);
            if (savedSearch && savedSearch.emailNotifications) {
              await notificationService.sendEmailNotification(
                settings.email,
                alert,
                savedSearch
              );
            }
          }
        }
      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    };

    // Check immediately on mount
    checkNotifications();

    // Set up periodic checking (every 5 minutes for demo, in production this would be longer)
    intervalRef.current = setInterval(checkNotifications, 5 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [address, searches, settings, addAlert]);

  return {
    isChecking: !!intervalRef.current,
  };
};
