/**
 * Features Layer - User-facing features
 *
 * This layer contains feature-specific components and hooks that
 * implement user-facing functionality.
 */

// Search & Filters
export { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
export { useDebounce } from '@/hooks/useDebounce';

// Wallet
export { WalletConnector } from '@/components/WalletConnector';
export { ChainAware, ChainSpecific, MultiChainBadge, GasEstimation, TransactionButton } from '@/components/ChainAwareProps';

// Language
export { LanguageSwitcher } from '@/components/LanguageSwitcher';

// Properties
export { PropertySearch } from '@/components/PropertySearch';
export { PropertyFilters } from '@/components/PropertyFilters';

// Transactions
export { TransactionList } from '@/components/TransactionList';
export { TransactionDetail } from '@/components/TransactionDetail';

// Governance
export { GovernanceDashboard } from '@/components/GovernanceDashboard';
export { ProposalCard } from '@/components/ProposalCard';

// Tax
export { TaxReportGenerator } from '@/components/TaxReportGenerator';

// Notifications
export { NotificationList } from '@/components/NotificationList';

// Compare
export { ComparisonView } from '@/components/ComparisonView';
