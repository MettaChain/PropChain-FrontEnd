import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { NotificationCenter } from "../components/NotificationCenter";
import type { Property, PropertyAlert } from "../types/property";

/**
 * NotificationCenter story coverage (#1096).
 *
 * The center renders a sheet, an unread badge and an empty state, all driven
 * by the `alerts` prop. The empty state in particular was previously only
 * reachable by dismissing every alert in a live session.
 */
const property: Property = {
  id: "prop-alert-1",
  name: "Sunset Villa",
  description: "Bright residential property with a pool and city views",
  location: {
    address: "123 Main St",
    city: "Los Angeles",
    state: "California",
    country: "USA",
    zipCode: "90001",
    coordinates: { lat: 34.05, lng: -118.25 },
  },
  price: { total: 500, perToken: 50, currency: "USD" },
  propertyType: "residential",
  blockchain: "ethereum",
  tokenInfo: {
    totalSupply: 1000,
    available: 500,
    sold: 500,
    contractAddress: "0x1234567890123456789012345678901234567890",
    tokenSymbol: "PROP",
  },
  metrics: {
    roi: 8.5,
    annualReturn: 42500,
    transactionVolume: 1000000,
    appreciationRate: 5.2,
  },
  details: {
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 2500,
    yearBuilt: 2020,
    amenities: ["pool"],
  },
  images: [],
  listedDate: "2024-01-01",
  status: "active",
  featured: false,
  verified: true,
};

const makeAlert = (
  id: string,
  newPropertiesCount: number,
  isRead: boolean,
): PropertyAlert => ({
  id,
  savedSearchId: "search-1",
  savedSearchName: "LA villas under 750k",
  matchingProperties: [property],
  newPropertiesCount,
  createdAt: new Date().toISOString(),
  isRead,
  userId: "user-1",
});

const meta = {
  title: "Components/NotificationCenter",
  component: NotificationCenter,
  parameters: { layout: "centered" },
  args: {
    alerts: [],
    onMarkAsRead: () => {},
    onMarkAllAsRead: () => {},
    onClearAlert: () => {},
  },
  argTypes: {
    onMarkAsRead: { action: "mark-as-read" },
    onMarkAllAsRead: { action: "mark-all-as-read" },
    onClearAlert: { action: "clear-alert" },
  },
  // The center is controlled and the sheet is internal state, so the story owns
  // the alert list: marking read and clearing actually change the render, which
  // is what makes the states reviewable.
  render: function Controlled(args) {
    const [alerts, setAlerts] = useState<PropertyAlert[]>(args.alerts);

    return (
      <NotificationCenter
        alerts={alerts}
        onMarkAsRead={(id) =>
          setAlerts((current) =>
            current.map((alert) =>
              alert.id === id ? { ...alert, isRead: true } : alert,
            ),
          )
        }
        onMarkAllAsRead={() =>
          setAlerts((current) => current.map((alert) => ({ ...alert, isRead: true })))
        }
        onClearAlert={(id) =>
          setAlerts((current) => current.filter((alert) => alert.id !== id))
        }
      />
    );
  },
} satisfies Meta<typeof NotificationCenter>;

export default meta;
type Story = StoryObj<typeof meta>;

/** No alerts at all: renders the bell without an unread badge. */
export const Empty: Story = { args: { alerts: [] } };

/** Two unread alerts spanning the single / many / trending icon thresholds. */
export const Unread: Story = {
  args: {
    alerts: [
      makeAlert("alert-1", 1, false),
      makeAlert("alert-2", 3, false),
    ],
  },
};

/** Everything already read: the badge is gone but alerts are still listed. */
export const Read: Story = {
  args: {
    alerts: [makeAlert("alert-1", 1, true), makeAlert("alert-2", 7, true)],
  },
};

/**
 * A high-volume alert. `newPropertiesCount > 5` switches the row to the
 * trending icon and a distinct colour, so the threshold is reviewable.
 */
export const ManyNewMatches: Story = {
  args: { alerts: [makeAlert("alert-many", 12, false)] },
};

/** RTL mirror, via the `direction` parameter in .storybook/preview.ts. */
export const UnreadRTL: Story = {
  args: { alerts: [makeAlert("alert-1", 1, false), makeAlert("alert-2", 3, false)] },
  parameters: { direction: "rtl" },
};
