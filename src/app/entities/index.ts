/**
 * Entities Layer - Business entities
 *
 * This layer contains types, interfaces, and utilities for
 * core business entities.
 */

// Property entity
export interface Property {
  id: string;
  name: string;
  description: string;
  price: string;
  location: string;
  imageUrl: string;
  owner: string;
  chainId: number;
}

// Transaction entity
export interface Transaction {
  id: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  chainId: number;
}

// User/Wallet entity
export interface User {
  address: string;
  chainId: number;
  balance?: string;
}

// Governance entity
export interface Proposal {
  id: string;
  title: string;
  description: string;
  votesFor: number;
  votesAgainst: number;
  status: 'active' | 'passed' | 'rejected';
  deadline: number;
}

// Re-export stores as entity state
export { usePropertyStore } from '@/store/domains/property';
export { useTransactionStore } from '@/store/domains/transaction';
export { useWalletStore } from '@/store/walletStore';
