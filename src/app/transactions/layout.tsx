import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transaction History | PropChain',
  description: 'View, search, and export your on-chain property transactions.',
};

export default function TransactionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
