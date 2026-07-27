import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import ReferralLinksCard from '@/components/referral/ReferralLinksCard';
import { useReferralStore } from '@/store/referralStore';

/**
 * ReferralLinksCard — Displays the authenticated user's referral links with
 * copy and social-share actions. Also surfaces a button to create new links.
 *
 * ## Usage
 * ```tsx
 * import ReferralLinksCard from '@/components/referral/ReferralLinksCard';
 *
 * <ReferralLinksCard maxLinksToShow={3} />
 * ```
 *
 * ## Props
 * | Prop             | Type     | Default | Description                           |
 * |------------------|----------|---------|---------------------------------------|
 * | `maxLinksToShow` | `number` | `3`     | Max links rendered before the "View all" footer appears. |
 *
 * ## Accessibility
 * - Copy and Share buttons each carry an `aria-label` describing their action.
 * - "Create your first link" / "+ Create Link" button is keyboard reachable.
 * - Link URLs are displayed as readable text (not hidden behind icons).
 */
const meta = {
  title: 'Components/Referral/ReferralLinksCard',
  component: ReferralLinksCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Card that lists a user\'s referral links with copy/share controls and a modal trigger to create new ones.',
      },
    },
    chromatic: { viewports: [375, 768, 1280] },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ReferralLinksCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const seedLinks = (links: Parameters<typeof useReferralStore.getState>['0'] extends undefined ? never : ReturnType<typeof useReferralStore.getState>['referralLinks']) =>
  (Story: React.ComponentType) => {
    useReferralStore.setState({ referralLinks: links });
    return <Story />;
  };

const sampleLinks = [
  {
    code: 'REF-ALPHA',
    referrerId: '0xABCD000000000000000000000000000000000001' as `0x${string}`,
    url: 'https://propchain.io/ref/REF-ALPHA',
    shortUrl: 'https://pchn.io/r/ALPHA',
    createdAt: Date.now() - 86400000 * 7,
    isActive: true,
    customName: 'Social Media Campaign',
  },
  {
    code: 'REF-BETA',
    referrerId: '0xABCD000000000000000000000000000000000001' as `0x${string}`,
    url: 'https://propchain.io/ref/REF-BETA',
    shortUrl: 'https://pchn.io/r/BETA',
    createdAt: Date.now() - 86400000 * 2,
    isActive: true,
    customName: 'Discord Community',
  },
  {
    code: 'REF-GAMMA',
    referrerId: '0xABCD000000000000000000000000000000000001' as `0x${string}`,
    url: 'https://propchain.io/ref/REF-GAMMA',
    shortUrl: 'https://pchn.io/r/GAMMA',
    createdAt: Date.now() - 3600000,
    isActive: true,
    customName: undefined,
  },
];

/**
 * Empty state — no links created yet.
 */
export const Empty: Story = {
  decorators: [seedLinks([])],
  args: {},
};

/**
 * WithLinks — three active referral links.
 */
export const WithLinks: Story = {
  decorators: [seedLinks(sampleLinks)],
  args: {},
};

/**
 * OverflowLinks — more links than `maxLinksToShow`, shows "View all N links" footer.
 */
export const OverflowLinks: Story = {
  decorators: [
    seedLinks([
      ...sampleLinks,
      {
        code: 'REF-DELTA',
        referrerId: '0xABCD000000000000000000000000000000000001' as `0x${string}`,
        url: 'https://propchain.io/ref/REF-DELTA',
        shortUrl: 'https://pchn.io/r/DELTA',
        createdAt: Date.now(),
        isActive: true,
        customName: 'Email Newsletter',
      },
    ]),
  ],
  args: { maxLinksToShow: 3 },
};
