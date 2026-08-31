import type {
  Transaction,
  TransactionStatus,
  TransactionType,
} from "@/store/transactionStore";

export type SortBy = "timestamp" | "value" | "gasUsed";

export type SortOrder = "asc" | "desc";

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface FilterTransactionsParams {
  transactions: Transaction[];
  typeFilter: TransactionType | "all";
  statusFilter: TransactionStatus | "all";
  propertyFilter: string;
  searchTerm: string;
  amountRange: [number, number];
  gasPriceRange: [number, number];
  dateRange: DateRange;
  sortBy: SortBy;
  sortOrder: SortOrder;
  getTransactionsByType: (
    type: TransactionType
  ) => Transaction[];
}