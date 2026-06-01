import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import React from 'react';

/**
 * PriceAlertBell — a notification bell button that opens a slide-over panel
 * listing all price-alert notifications for the current user.
 *
 * ## Usage
 * Drop `<PriceAlertBell />` anywhere in the header/nav bar. It reads from the
 * global `notificationStore` (Zustand) and renders:
 * - A ghost button with a bell icon
 * - A red badge showing the unread count (hidden when zero)
 * - A Sheet panel listing each notification with mark-as-read / dismiss actions
 *
 * ## Accessibility
 * - The trigger button has a dynamic `aria-label` that includes the unread count
 *   (e.g. "Price alerts, 3 unread") so screen-reader users know at a glance.
 * - Mark-as-read and dismiss buttons each carry descriptive `aria-label` values.
 *
 * ## Props
 * `PriceAlertBell` takes no props — all state is managed via the notification store.
 */

import { PriceAlertBell } from '@/components/PriceAlertBell';
import { useNotificationStore } from '@/store/notificationStore';
import type { PriceAlertNotification } from '@/types/property';

// ---------------------------------------------------------------------------
// Shared sample notifications
// ---------------------------------------------------------------------------
const sampleNotifications: PriceAlertNotification[] = [
  {
    id: 'notif-1',
    alertId: 'alert-1',
    propertyId: 'prop-abc',
    propertyName: 'Sunset Villa',
    alertType: 'above',
    targetPrice: 500,
    triggeredPrice: 512,
    message: 'Sunset Villa token price rose above $500 — now at $512.',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min ago
    isRead: false,
    userId: 'user-1',
  },
  {
    id: 'notif-2',
    alertId: 'alert-2',
    propertyId: 'prop-def',
    propertyName: 'Harbor Loft',
    alertType: 'below',
    targetPrice: 300,
    triggeredPrice: 295,
    message: 'Harbor Loft token price dropped below $300 — now at $295.',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    isRead: false,
    userId: 'user-1',
  },
  {
    id: 'notif-3',
    alertId: 'alert-3',
    propertyId: 'prop-ghi',
    propertyName: 'Mountain Retreat',
    alertType: 'change',
    targetPrice: 400,
    triggeredPrice: 420,
    message: 'Mountain Retreat token price changed by more than 5%.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hrs ago
    isRead: true,
    userId: 'user-1',
  },
];

// ---------------------------------------------------------------------------
// Decorator: seed the Zustand store before each story renders
// ---------------------------------------------------------------------------
const withNotifications =
  (notifications: PriceAlertNotification[]) =>
  (Story: React.ComponentType) => {
    // Reset then seed the store
    useNotificationStore.setState({ priceAlertNotifications: notifications });
    return <Story />;
  };

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------
const meta = {
  title: 'Components/PriceAlertBell',
  component: PriceAlertBell,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Bell icon button that opens a notification panel for price alerts. ' +
          'Unread count is shown as a red badge. All state is managed via the global notification store.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PriceAlertBell>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * No notifications in the store — the bell renders without a badge.
 */
export const Empty: Story = {
  decorators: [withNotifications([])],
};

/**
 * Three notifications, two of which are unread.
 * The badge shows "2" and the bell icon switches to BellRing.
 */
export const WithUnreadNotifications: Story = {
  decorators: [withNotifications(sampleNotifications)],
};

/**
 * All notifications have already been read — badge is hidden.
 */
export const AllRead: Story = {
  decorators: [
    withNotifications(
      sampleNotifications.map((n) => ({ ...n, isRead: true }))
    ),
  ],
};

/**
 * More than 99 unread notifications — badge shows "99+".
 */
export const OverflowBadge: Story = {
  decorators: [
    withNotifications(
      Array.from({ length: 105 }, (_, i) => ({
        ...sampleNotifications[0],
        id: `notif-overflow-${i}`,
        isRead: false,
      }))
    ),
  ],
};
