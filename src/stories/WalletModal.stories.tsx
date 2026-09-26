import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { WalletModal } from "../components/WalletModal";

/**
 * WalletModal story coverage (#1096).
 *
 * The wallet chooser is the app's main conversion entry point and the only
 * place a first-time visitor is asked to connect. It is also a dialog, so its
 * open state has to be reviewable in Storybook rather than only by clicking
 * through the app.
 */
const meta = {
  title: "Components/WalletModal",
  component: WalletModal,
  parameters: { layout: "centered" },
  args: {
    isOpen: true,
    onClose: () => {},
  },
  argTypes: {
    isOpen: { control: "boolean" },
    onClose: { action: "closed" },
  },
} satisfies Meta<typeof WalletModal>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Dialog open, listing the available wallet connectors. */
export const Open: Story = {};

/** Dialog dismissed — renders nothing, so the closed path is still reviewable. */
export const Closed: Story = {
  args: { isOpen: false },
};

/** RTL mirror, via the `direction` parameter in .storybook/preview.ts. */
export const OpenRTL: Story = {
  parameters: { direction: "rtl" },
};
