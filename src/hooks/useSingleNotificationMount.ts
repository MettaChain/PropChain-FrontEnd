/**
 * Guards against NotificationCenter and NotificationSystem both being
 * mounted (and both polling) at once. First mounter wins; the second
 * caller gets `false` and should render nothing / skip its polling loop.
 * Module-level, so it survives across route changes within one session.
 */
'use client';

import { useEffect, useState } from 'react';

let activeNotificationOwner: string | null = null;

export function useSingleNotificationMount(ownerId: string): boolean {
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (activeNotificationOwner === null) {
      activeNotificationOwner = ownerId;
      setIsOwner(true);
    }

    return () => {
      if (activeNotificationOwner === ownerId) {
        activeNotificationOwner = null;
      }
    };
  }, [ownerId]);

  return isOwner;
}
