import type { SignedTransaction } from '@/utils/eip712/eip712Types';

export interface AuditTrailEntry {
  id: string;
  transactionHash?: string;
  signer: string;
  to: string;
  value: string;
  data: string;
  signature: string;
  timestamp: number;
  verified: boolean;
  chainId: number;
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  warnings: string[];
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled';
  gasUsed?: string;
  gasPrice?: string;
  blockNumber?: number;
  blockTimestamp?: number;
}

export interface AuditTrailStats {
  totalTransactions: number;
  verifiedTransactions: number;
  failedVerifications: number;
  highRiskTransactions: number;
  totalValueTransferred: string;
  averageTransactionValue: string;
  mostActiveSigner: string;
  uniqueRecipients: number;
}

class TransactionAuditTrail {
  private entries: AuditTrailEntry[] = [];
  private readonly STORAGE_KEY = 'propchain-transaction-audit';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Adds a new entry to the audit trail
   */
  addEntry(signedTransaction: SignedTransaction, warnings: string[] = []): AuditTrailEntry {
    const riskLevel = this.calculateRiskLevel(signedTransaction, warnings);
    
    const entry: AuditTrailEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      signer: signedTransaction.signer,
      to: signedTransaction.transaction.to,
      value: signedTransaction.transaction.value || '0',
      data: signedTransaction.transaction.data || '0x',
      signature: signedTransaction.signature,
      timestamp: signedTransaction.timestamp,
      verified: signedTransaction.verified,
      chainId: signedTransaction.domain.chainId || 1,
      domain: {
        name: signedTransaction.domain.name || 'PropChain',
        version: signedTransaction.domain.version || '1',
        chainId: signedTransaction.domain.chainId || 1,
        verifyingContract: signedTransaction.domain.verifyingContract || '',
      },
      riskLevel,
      warnings,
      status: 'pending',
    };

    this.entries.unshift(entry);
    this.saveToStorage();
    
    return entry;
  }

  /**
   * Updates an existing audit entry
   */
  updateEntry(
    id: string, 
    updates: Partial<Pick<AuditTrailEntry, 'status' | 'transactionHash' | 'gasUsed' | 'gasPrice' | 'blockNumber' | 'blockTimestamp'>>
  ): void {
    const entryIndex = this.entries.findIndex(entry => entry.id === id);
    if (entryIndex !== -1) {
      this.entries[entryIndex] = { ...this.entries[entryIndex], ...updates };
      this.saveToStorage();
    }
  }

  /**
   * Retrieves all audit entries
   */
  getAllEntries(): AuditTrailEntry[] {
    return [...this.entries];
  }

  /**
   * Retrieves entries filtered by criteria
   */
  getFilteredEntries(filters: {
    signer?: string;
    to?: string;
    riskLevel?: AuditTrailEntry['riskLevel'];
    status?: AuditTrailEntry['status'];
    chainId?: number;
    startDate?: number;
    endDate?: number;
  }): AuditTrailEntry[] {
    return this.entries.filter(entry => {
      if (filters.signer && entry.signer !== filters.signer) return false;
      if (filters.to && entry.to !== filters.to) return false;
      if (filters.riskLevel && entry.riskLevel !== filters.riskLevel) return false;
      if (filters.status && entry.status !== filters.status) return false;
      if (filters.chainId && entry.chainId !== filters.chainId) return false;
      if (filters.startDate && entry.timestamp < filters.startDate) return false;
      if (filters.endDate && entry.timestamp > filters.endDate) return false;
      return true;
    });
  }

  /**
   * Calculates audit trail statistics
   */
  getStatistics(): AuditTrailStats {
    const totalTransactions = this.entries.length;
    const verifiedTransactions = this.entries.filter(entry => entry.verified).length;
    const failedVerifications = this.entries.filter(entry => !entry.verified).length;
    const highRiskTransactions = this.entries.filter(entry => 
      entry.riskLevel === 'high' || entry.riskLevel === 'critical'
    ).length;

    const totalValueTransferred = this.entries.reduce((sum, entry) => {
      return sum + BigInt(entry.value || '0');
    }, 0n);

    const averageTransactionValue = totalTransactions > 0 
      ? (totalValueTransferred / BigInt(totalTransactions)).toString()
      : '0';

    const signerCounts = this.entries.reduce((counts, entry) => {
      counts[entry.signer] = (counts[entry.signer] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const mostActiveSigner = Object.entries(signerCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '';

    const uniqueRecipients = new Set(this.entries.map(entry => entry.to)).size;

    return {
      totalTransactions,
      verifiedTransactions,
      failedVerifications,
      highRiskTransactions,
      totalValueTransferred: totalValueTransferred.toString(),
      averageTransactionValue,
      mostActiveSigner,
      uniqueRecipients,
    };
  }

  /**
   * Exports audit trail to JSON
   */
  exportToJSON(): string {
    const exportData = {
      exportedAt: new Date().toISOString(),
      entries: this.entries,
      statistics: this.getStatistics(),
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Clears the audit trail
   */
  clearTrail(): void {
    this.entries = [];
    this.saveToStorage();
  }

  /**
   * Calculates risk level for a transaction
   */
  private calculateRiskLevel(signedTransaction: SignedTransaction, warnings: string[]): AuditTrailEntry['riskLevel'] {
    const value = BigInt(signedTransaction.transaction.value || '0');
    const valueEth = Number(value) / 1e18;

    // Critical risk indicators
    if (!signedTransaction.verified) return 'critical';
    if (warnings.some(w => w.includes('zero address'))) return 'critical';
    if (valueEth > 100) return 'critical';

    // High risk indicators
    if (warnings.length > 2) return 'high';
    if (valueEth > 10) return 'high';
    if (signedTransaction.transaction.data && signedTransaction.transaction.data.length > 10000) return 'high';

    // Medium risk indicators
    if (warnings.length > 0) return 'medium';
    if (valueEth > 1) return 'medium';
    if (signedTransaction.transaction.data && signedTransaction.transaction.data !== '0x') return 'medium';

    return 'low';
  }

  /**
   * Saves audit trail to local storage
   */
  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.entries));
      } catch (error) {
        console.warn('Failed to save audit trail to storage:', error);
      }
    }
  }

  /**
   * Loads audit trail from local storage
   */
  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          this.entries = JSON.parse(stored);
        }
      } catch (error) {
        console.warn('Failed to load audit trail from storage:', error);
        this.entries = [];
      }
    }
  }
}

// Singleton instance
export const transactionAudit = new TransactionAuditTrail();
