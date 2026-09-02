import { act, renderHook } from '@testing-library/react';
import { useNotificationStore } from '../notificationStore';
import type { PropertyAlert, PriceAlert, PriceAlertNotification } from '@/types/property';

const mockAlert = (overrides: Partial<PropertyAlert> = {}): PropertyAlert => ({
  id: 'alert-1',
  savedSearchId: 'ss-1',
  savedSearchName: 'My search',
  matchingProperties: [],
  newPropertiesCount: 3,
  createdAt: '2024-01-01T00:00:00Z',
  isRead: false,
  userId: '0xuser',
  ...overrides,
});

const mockPriceAlert = (overrides: Partial<PriceAlert> = {}): PriceAlert => ({
  id: 'pa-1',
  propertyId: 'prop-1',
  propertyName: 'Manhattan Apt',
  alertType: 'above',
  targetPrice: 500000,
  currentPrice: 480000,
  createdAt: '2024-01-01T00:00:00Z',
  isActive: true,
  isTriggered: false,
  userId: '0xuser',
  emailNotification: false,
  ...overrides,
});

const mockPriceAlertNotification = (
  overrides: Partial<PriceAlertNotification> = {},
): PriceAlertNotification => ({
  id: 'notif-1',
  alertId: 'pa-1',
  propertyId: 'prop-1',
  propertyName: 'Manhattan Apt',
  alertType: 'above',
  targetPrice: 500000,
  triggeredPrice: 510000,
  message: 'Manhattan Apt price has risen above $500,000. Current price: $510,000',
  createdAt: '2024-01-01T00:00:00Z',
  isRead: false,
  userId: '0xuser',
  ...overrides,
});

const unreadCount = (alerts: PropertyAlert[]) => alerts.filter((a) => !a.isRead).length;

describe('notificationStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useNotificationStore.getState().reset();
  });

  it('starts with no alerts and default settings', () => {
    const { result } = renderHook(() => useNotificationStore());
    expect(result.current.alerts).toEqual([]);
    expect(result.current.priceAlerts).toEqual([]);
    expect(result.current.settings.inAppEnabled).toBe(true);
    expect(result.current.settings.defaultFrequency).toBe('daily');
  });

  it('adds an alert and derives the unread count', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.addAlert(mockAlert());
      result.current.addAlert(mockAlert({ id: 'alert-2', isRead: true }));
    });

    expect(result.current.alerts).toHaveLength(2);
    expect(unreadCount(result.current.alerts)).toBe(1);
  });

  it('does not duplicate an alert with the same id', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.addAlert(mockAlert());
      result.current.addAlert(mockAlert());
    });

    expect(result.current.alerts).toHaveLength(1);
  });

  it('marks a single alert as read', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.addAlert(mockAlert());
      result.current.addAlert(mockAlert({ id: 'alert-2' }));
      result.current.markAsRead('alert-1');
    });

    expect(result.current.alerts.find((a) => a.id === 'alert-1')?.isRead).toBe(true);
    expect(unreadCount(result.current.alerts)).toBe(1);
  });

  it('marks all alerts as read', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.addAlert(mockAlert());
      result.current.addAlert(mockAlert({ id: 'alert-2' }));
      result.current.markAllAsRead();
    });

    expect(unreadCount(result.current.alerts)).toBe(0);
    expect(result.current.alerts.every((a) => a.isRead)).toBe(true);
  });

  it('clears a single alert and all alerts', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.addAlert(mockAlert());
      result.current.addAlert(mockAlert({ id: 'alert-2' }));
      result.current.clearAlert('alert-1');
    });

    expect(result.current.alerts).toHaveLength(1);

    act(() => {
      result.current.clearAllAlerts();
    });

    expect(result.current.alerts).toEqual([]);
  });

  it('adds a new price alert', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.addPriceAlert(mockPriceAlert());
    });

    expect(result.current.priceAlerts).toHaveLength(1);
    expect(result.current.priceAlerts[0].id).toBe('pa-1');
  });

  it('updates an existing price alert for the same property and type', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.addPriceAlert(mockPriceAlert());
      result.current.addPriceAlert(mockPriceAlert({ id: 'pa-2', targetPrice: 600000 }));
    });

    expect(result.current.priceAlerts).toHaveLength(1);
    expect(result.current.priceAlerts[0].id).toBe('pa-2');
    expect(result.current.priceAlerts[0].targetPrice).toBe(600000);
  });

  it('updates, removes and toggles price alerts', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.addPriceAlert(mockPriceAlert());
      result.current.updatePriceAlert('pa-1', { targetPrice: 550000 });
    });

    expect(result.current.priceAlerts[0].targetPrice).toBe(550000);

    act(() => {
      result.current.togglePriceAlert('pa-1');
    });
    expect(result.current.priceAlerts[0].isActive).toBe(false);

    act(() => {
      result.current.removePriceAlert('pa-1');
    });
    expect(result.current.priceAlerts).toEqual([]);
  });

  it('triggering a price alert records a notification and marks the alert triggered', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.addPriceAlert(mockPriceAlert());
      result.current.triggerPriceAlert('pa-1', 520000);
    });

    expect(result.current.priceAlerts[0].isTriggered).toBe(true);
    expect(result.current.priceAlertNotifications).toHaveLength(1);
    expect(result.current.priceAlertNotifications[0].triggeredPrice).toBe(520000);
    expect(result.current.priceAlertNotifications[0].message).toContain('risen above');
  });

  it('manages price alert notification read and clear state', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.addPriceAlertNotification(mockPriceAlertNotification());
      result.current.addPriceAlertNotification(
        mockPriceAlertNotification({ id: 'notif-2' }),
      );
      result.current.markPriceAlertNotificationAsRead('notif-1');
    });

    expect(result.current.priceAlertNotifications.find((n) => n.id === 'notif-1')?.isRead).toBe(true);

    act(() => {
      result.current.clearPriceAlertNotification('notif-1');
    });
    expect(result.current.priceAlertNotifications).toHaveLength(1);

    act(() => {
      result.current.clearAllPriceAlertNotifications();
    });
    expect(result.current.priceAlertNotifications).toEqual([]);
  });

  it('updates notification settings', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.updateSettings({ emailEnabled: true, email: 'a@b.com' });
    });

    expect(result.current.settings.emailEnabled).toBe(true);
    expect(result.current.settings.email).toBe('a@b.com');
    expect(result.current.settings.inAppEnabled).toBe(true); // untouched
  });

  it('reset restores the default state', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.addAlert(mockAlert());
      result.current.addPriceAlert(mockPriceAlert());
      result.current.updateSettings({ emailEnabled: true });
      result.current.reset();
    });

    expect(result.current.alerts).toEqual([]);
    expect(result.current.priceAlerts).toEqual([]);
    expect(result.current.settings.emailEnabled).toBe(false);
  });
});
