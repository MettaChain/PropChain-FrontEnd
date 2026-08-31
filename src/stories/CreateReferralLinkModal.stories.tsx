import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import CreateReferralLinkModal from '@/components/referral/CreateReferralLinkModal';

/**
 * CreateReferralLinkModal — Modal dialog for creating a new referral link.
 *
 * ## Usage
 * ```tsx
 * import CreateReferralLinkModal from '@/components/referral/CreateReferralLinkModal';
 *
 * function MyComponent() {
 *   const [open, setOpen] = useState(false);
 *   return (
 *     <>
 *       <button onClick={() => setOpen(true)}>Create Link</button>
 *       {open && <CreateReferralLinkModal onClose={() => setOpen(false)} />}
 *     </>
 *   );
 * }
 * ```
 *
 * ## Props
 * | Prop      | Type         | Required | Description                        |
 * |-----------|--------------|----------|------------------------------------|
 * | `onClose` | `() => void` | Yes      | Callback fired when modal closes.  |
 *
 * ## Accessibility
 * - Modal overlay traps focus while open.
 * - Cancel and submit buttons are keyboard reachable via Tab.
 * - Error messages are rendered inline and should be read by screen readers.
 */
const meta = {
  title: 'Components/Referral/CreateReferralLinkModal',
  component: CreateReferralLinkModal,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Modal dialog that lets a connected wallet holder create a named referral link. Integrates with `referralService` and the Zustand referral store.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onClose: { action: 'closed' },
  },
} satisfies Meta<typeof CreateReferralLinkModal>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state — the modal is open, no name entered yet.
 */
export const Default: Story = {
  args: {
    onClose: () => {},
  },
};

/**
 * Controlled wrapper: demonstrates open/close behaviour triggered by a button.
 */
export const WithToggle: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <div className="p-8">
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          Open Modal
        </button>
        {open && <CreateReferralLinkModal onClose={() => setOpen(false)} />}
      </div>
    );
  },
};
