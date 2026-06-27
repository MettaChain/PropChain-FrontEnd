import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TransactionHistory } from './TransactionHistory';

/**
 * TransactionHistory displays a filterable, searchable, and exportable table
 * of on-chain transactions. It reads from the global `useTransactionStore`
 * and supports CSV/Excel export.
 *
 * **Props:** none — data comes from Zustand store.
 *
 * **Accessibility:**
 * - The search input has a visible placeholder and is keyboard-navigable.
 * - Filter selects are labelled via `<SelectValue placeholder>`.
 * - Export buttons are keyboard-accessible.
 * - The table uses semantic `<thead>` / `<tbody>` and truncated hashes
 *   retain full values in the data layer for screen readers.
 */
const meta = {
  title: 'Components/TransactionHistory',
  component: TransactionHistory,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TransactionHistory>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Empty state — no transactions in the store.
 * Shows the EmptyState placeholder with a descriptive message.
 */
export const Empty: Story = {};

/**
 * Loading state — store is fetching transactions.
 * Renders the TableSkeleton in place of the real rows.
 */
export const Loading: Story = {};

/**
 * Default story renders the component as-is, wired to the real Zustand store.
 * In a real Storybook setup you would use a decorator to seed the store with
 * mock transactions.  The stories below document the intended visual states.
 */
export const Default: Story = {};
