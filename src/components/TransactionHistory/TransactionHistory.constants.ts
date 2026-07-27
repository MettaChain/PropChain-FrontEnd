import type {
  TransactionStatus,
  TransactionType,
} from "@/store/transactionStore";

export const TRANSACTION_TYPES: TransactionType[] = [
  "purchase",
  "transfer",
  "management",
  "other",
];

export const TRANSACTION_STATUSES: TransactionStatus[] = [
  "pending",
  "processing",
  "confirmed",
  "failed",
  "cancelled",
];

export const isTransactionType = (
  value: string
): value is TransactionType =>
  TRANSACTION_TYPES.includes(value as TransactionType);

export const isTransactionStatus = (
  value: string
): value is TransactionStatus =>
  TRANSACTION_STATUSES.includes(value as TransactionStatus);